import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { assertDraftRevision, boundedText, catalogueId } from './catalogue-drafts.js';

function dropFields(input) {
  if (!Array.isArray(input.productIds) || input.productIds.length > 24) {
    throw new HttpsError('invalid-argument', 'Choose up to 24 pieces.');
  }
  const productIds = input.productIds.map(catalogueId);
  if (new Set(productIds).size !== productIds.length) throw new HttpsError('invalid-argument', 'Each piece can appear once.');
  return { productIds, coverProductId: input.coverProductId ? catalogueId(input.coverProductId) : '' };
}

function editorialIdentity(data) {
  const collection = data?.collection;
  if (collection !== 'collections') throw new HttpsError('invalid-argument', 'Choose a supported content type.');
  return { collection, slug: catalogueId(data?.slug) };
}

export async function saveEditorialDraft(db, data, actor) {
  const { collection, slug } = editorialIdentity(data);
  const input = data?.draft ?? {};
  const fields = {
    title: boundedText(input.title, 160, 'Title'),
    body: boundedText(input.body, 5000, 'Description'),
    ...dropFields(input),
  };
  const path = db.doc(`contentDrafts/${collection}--${slug}`);
  return db.runTransaction(async tx => {
    const previous = await tx.get(path);
    assertDraftRevision(previous, data.revision);
    const revision = data.revision + 1;
    tx.set(path, { ...fields, collection, slug, revision, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }, { merge: true });
    return { ...fields, collection, slug, revision };
  });
}

async function validateDrop(tx, db, draft) {
  const { productIds, coverProductId } = dropFields(draft);
  if (!productIds.includes(coverProductId)) throw new HttpsError('failed-precondition', 'Choose the cover from the pieces in the drop.');
  const products = await tx.getAll(...productIds.map(id => db.doc(`products/${id}`)));
  if (products.some(product => product.data()?.status !== 'published')) {
    throw new HttpsError('failed-precondition', 'Each piece in the drop must be published.');
  }
  const cover = products.find(product => product.id === coverProductId).data();
  if (!cover.photos?.length || !cover.share?.imageUrl) {
    throw new HttpsError('failed-precondition', 'Choose a published piece with a product photo for the cover.');
  }
  return { productIds, coverProductId };
}

export async function publishEditorial(db, data, actor) {
  const { collection, slug } = editorialIdentity(data);
  const path = db.doc(`contentDrafts/${collection}--${slug}`);
  const publicPath = db.doc(`${collection}/${slug}`);
  return db.runTransaction(async tx => {
    const [snapshot, current] = await tx.getAll(path, publicPath);
    const draft = snapshot.data();
    if (!draft) throw new HttpsError('not-found', 'Save a draft first.');
    assertDraftRevision(snapshot, data.revision);
    if (!draft.title) throw new HttpsError('failed-precondition', 'Enter a title before publishing.');
    if (current.exists && !Number.isInteger(current.data().draftRevision)) {
      throw new HttpsError('already-exists', 'This slug belongs to existing content.');
    }
    if (current.data()?.draftRevision === draft.revision && current.data()?.status === 'published') return { status: 'published' };
    const fields = await validateDrop(tx, db, draft);
    const description = draft.body.slice(0, 500);
    tx.set(publicPath, {
      title: draft.title, body: draft.body, ...fields,
      status: 'published', illustrative: true, draftRevision: draft.revision,
      share: { description },
    });
    tx.update(path, { publishedRevision: draft.revision });
    tx.create(db.collection('auditLogs').doc(), { action: 'publish-content', collection, slug, actorUid: actor.uid, at: FieldValue.serverTimestamp() });
    return { status: 'published' };
  });
}
