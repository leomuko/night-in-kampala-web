import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { assertDraftRevision, catalogueId } from './catalogue-drafts.js';
import { canRequestProduct, hasPhotographedStock } from './catalogue-eligibility.js';
import { updateSizeFacets } from './catalogue-sizes.js';
import { assertStockCanChange } from './catalogue-stock.js';

export async function approvePublication(db, data, actor) {
  if (actor.role !== 'owner') throw new HttpsError('permission-denied', 'Owner access is required.');
  const { collection, approved } = data ?? {};
  const product = collection === 'products';
  if (!['products', 'collections', 'events', 'lookbooks', 'pages'].includes(collection) || typeof approved !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Choose a publication and an approval state.');
  }
  const slug = catalogueId(data.slug);
  const draftRef = db.doc(product ? `productDrafts/${slug}` : `contentDrafts/${collection}--${slug}`);
  const publicRef = db.doc(`${collection}/${slug}`);
  const auditRef = db.collection('auditLogs').doc();
  return db.runTransaction(async tx => {
    const [snapshot, publicSnapshot] = await tx.getAll(draftRef, publicRef);
    const draft = snapshot.data();
    const live = publicSnapshot.data();
    if (!draft) throw new HttpsError('not-found', 'Save a draft before approving it.');
    assertDraftRevision(snapshot, data.revision);
    if (approved && product && !hasPhotographedStock(draft)) {
      throw new HttpsError('failed-precondition', 'Replace every illustrative or unclassified image with a photograph of the real piece.');
    }
    const approvedRevision = approved ? draft.revision : null;
    const liveApproved = product ? live?.isRealCatalogueStock === true : live?.illustrative === false;
    const updatesLive = live?.status === 'published' && Number.isInteger(live.draftRevision)
      && (approved ? live.draftRevision === draft.revision && !liveApproved : liveApproved);
    const result = { approvedRevision, ...(product ? { publishedRealStock: updatesLive ? approved : liveApproved } : {}) };
    if (draft.approvedRevision === approvedRevision && !updatesLive) return result;
    let projection = { illustrative: !approved };
    if (product && updatesLive) {
      const stock = (await tx.get(db.doc(`inventory/${slug}`))).data();
      assertStockCanChange(stock ?? {}, live.availability);
      const next = { ...live, isRealCatalogueStock: approved };
      const requestableSizes = await updateSizeFacets(tx, db, live, next, stock);
      projection = { isRealCatalogueStock: approved, purchasable: canRequestProduct(next), requestableSizes };
    }
    tx.update(draftRef, { approvedRevision, ...(product && updatesLive ? { publishedRealStock: approved } : {}) });
    if (updatesLive) tx.update(publicRef, projection);
    tx.create(auditRef, {
      action: approved ? 'approve-publication' : 'revoke-publication-approval',
      collection, slug, revision: draft.revision, actorUid: actor.uid, at: FieldValue.serverTimestamp(),
      ...(product ? { productId: slug } : {}),
    });
    return result;
  });
}
