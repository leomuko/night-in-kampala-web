import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export function catalogueId(value) {
  if (typeof value !== 'string' || value.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new HttpsError('invalid-argument', 'Use a lowercase ID with words separated by hyphens.');
  }
  return value;
}

export function boundedText(value, max, label) {
  if (typeof value !== 'string' || value.length > max) throw new HttpsError('invalid-argument', `${label} must be text up to ${max} characters.`);
  return value.trim();
}

function boundedList(value, max, label) {
  if (!Array.isArray(value) || value.length > max) throw new HttpsError('invalid-argument', `Use up to ${max} ${label}.`);
  return value;
}

function draftFields(input) {
  if (!input || !['one-of-one', 'repeatable'].includes(input.stockType)) {
    throw new HttpsError('invalid-argument', 'Choose a stock type.');
  }
  if (input.priceUGX !== null && (!Number.isSafeInteger(input.priceUGX) || input.priceUGX <= 0)) {
    throw new HttpsError('invalid-argument', 'Enter a positive whole UGX price.');
  }
  const measurements = boundedList(input.measurements, 20, 'measurements').map(row => {
    const label = boundedText(row?.label, 60, 'Measurement label');
    if (!label || !Number.isFinite(row.cm) || row.cm <= 0) throw new HttpsError('invalid-argument', 'Enter a measurement label and positive centimetres.');
    return { label, cm: row.cm };
  });
  const variants = input.stockType === 'repeatable' ? boundedList(input.variants, 30, 'variants').map(row => {
    const id = catalogueId(row?.id);
    const sizeLabel = boundedText(row.sizeLabel, 80, 'Variant size');
    if (!sizeLabel || !Number.isSafeInteger(row.quantity) || row.quantity < 0 || row.quantity > 10000) {
      throw new HttpsError('invalid-argument', 'Enter a variant size and whole quantity between 0 and 10,000.');
    }
    return { id, sizeLabel, quantity: row.quantity };
  }) : [];
  if (new Set(variants.map(row => row.id)).size !== variants.length) throw new HttpsError('invalid-argument', 'Variant IDs must be unique.');
  return {
    name: boundedText(input.name, 160, 'Name'),
    itemCode: boundedText(input.itemCode, 60, 'Item code'),
    categoryId: input.categoryId === '' ? '' : catalogueId(input.categoryId),
    priceUGX: input.priceUGX,
    stockType: input.stockType,
    sizeLabel: boundedText(input.sizeLabel, 80, 'Size label'),
    measurements, variants,
    condition: boundedText(input.condition, 1000, 'Condition'),
    reworkNotes: boundedText(input.reworkNotes, 2000, 'Rework notes'),
    care: boundedText(input.care, 1000, 'Care'),
    shareDescription: boundedText(input.shareDescription, 320, 'Share description'),
    isRealCatalogueStock: false,
  };
}

export function assertDraftRevision(snapshot, revision) {
  const current = snapshot.data()?.revision ?? 0;
  if (!Number.isInteger(revision) || revision !== current) {
    throw new HttpsError('aborted', 'This draft changed. Reopen it before saving again.');
  }
}

export async function saveProductDraft(db, data, actor) {
  const slug = catalogueId(data?.slug);
  const fields = draftFields(data?.draft);
  const path = db.doc(`productDrafts/${slug}`);
  return db.runTransaction(async tx => {
    const previous = await tx.get(path);
    assertDraftRevision(previous, data.revision);
    const revision = data.revision + 1;
    tx.set(path, { ...fields, revision, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }, { merge: true });
    return { slug, revision };
  });
}

export async function saveCategory(db, data) {
  const id = catalogueId(data?.id);
  const label = boundedText(data?.label, 60, 'Category label');
  if (!label || typeof data.active !== 'boolean') throw new HttpsError('invalid-argument', 'Give the category a label and a valid visibility.');
  const path = db.doc('catalogueSettings/categories');
  return db.runTransaction(async tx => {
    const current = (await tx.get(path)).data();
    const items = [...(current?.items ?? [])];
    const index = items.findIndex(item => item.id === id);
    if (data.create === true && index >= 0) throw new HttpsError('already-exists', 'This category ID already exists.');
    if (data.create !== true && index < 0) throw new HttpsError('not-found', 'This category no longer exists.');
    const item = { id, label, active: data.active };
    if (index < 0) {
      if (items.length >= 100) throw new HttpsError('resource-exhausted', 'The category list has reached its limit.');
      items.push(item);
    } else {
      items[index] = item;
    }
    tx.set(path, { items, illustrative: current?.illustrative === true });
    return { items };
  });
}
