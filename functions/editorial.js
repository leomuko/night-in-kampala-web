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

function eventFields(input) {
  const date = boundedText(input.date, 10, 'Date');
  if (date && (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
    throw new HttpsError('invalid-argument', 'Enter a valid calendar date or leave it blank.');
  }
  if (!['upcoming', 'past'].includes(input.season)) throw new HttpsError('invalid-argument', 'Choose Upcoming or Past.');
  return {
    city: boundedText(input.city, 120, 'City'), venue: boundedText(input.venue, 160, 'Venue'),
    date, season: input.season,
  };
}

function pageFields(input) {
  if (!Array.isArray(input.links) || input.links.length > 6) {
    throw new HttpsError('invalid-argument', 'Use up to six related links.');
  }
  const links = input.links.map(link => {
    const label = boundedText(link?.label, 80, 'Link label');
    const href = boundedText(link?.href, 240, 'Link path');
    if (!label || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/.test(href)) {
      throw new HttpsError('invalid-argument', 'Give each link a label and a site path, such as /shop.');
    }
    return { label, href };
  });
  return { links, coverProductId: input.coverProductId ? catalogueId(input.coverProductId) : '' };
}

const contentFields = { collections: dropFields, events: eventFields, lookbooks: pageFields, pages: pageFields };

function editorialIdentity(data) {
  const collection = data?.collection;
  if (!Object.hasOwn(contentFields, collection)) throw new HttpsError('invalid-argument', 'Choose a supported content type.');
  return { collection, slug: catalogueId(data?.slug) };
}

export async function saveEditorialDraft(db, data, actor) {
  const { collection, slug } = editorialIdentity(data);
  const input = data?.draft ?? {};
  const fields = {
    title: boundedText(input.title, 160, 'Title'),
    body: boundedText(input.body, 5000, 'Description'),
    ...contentFields[collection](input),
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
    const fields = collection === 'collections' ? await validateDrop(tx, db, draft) : contentFields[collection](draft);
    if (collection !== 'collections' && fields.coverProductId) {
      const cover = (await tx.get(db.doc(`products/${fields.coverProductId}`))).data();
      if (cover?.status !== 'published' || !cover.photos?.length) {
        throw new HttpsError('failed-precondition', 'Choose a published piece with photos, or leave the cover blank.');
      }
    }
    if (collection === 'events' && !fields.city) throw new HttpsError('failed-precondition', 'Enter a city before publishing the event.');
    const description = draft.body.slice(0, 500);
    tx.set(publicPath, {
      title: draft.title, body: draft.body, ...fields,
      status: 'published', illustrative: draft.approvedRevision !== draft.revision, draftRevision: draft.revision,
      share: { description },
    });
    tx.update(path, { publishedRevision: draft.revision });
    tx.create(db.collection('auditLogs').doc(), { action: 'publish-content', collection, slug, actorUid: actor.uid, at: FieldValue.serverTimestamp() });
    return { status: 'published' };
  });
}
