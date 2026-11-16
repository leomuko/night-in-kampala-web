import { randomUUID } from 'node:crypto';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { assertDraftRevision, catalogueId } from './catalogue-drafts.js';
import { buildPublicProduct } from './catalogue-projection.js';
import { assertStockCanChange } from './catalogue-stock.js';
import { canRequestProduct, hasPhotographedStock } from './catalogue-eligibility.js';
import { sizeKey, updateSizeFacets } from './catalogue-sizes.js';
import { renditionWidths } from './catalogue-media.js';

function validateDraft(draft, categories, live) {
  if (!Array.isArray(draft.photos) || draft.photos.length < 1 || draft.photos.length > 8 || !draft.measurements?.length) {
    throw new HttpsError('failed-precondition', 'Save at least one photo with alt text and one measurement.');
  }
  const category = categories.find(item => item.id === draft.categoryId);
  if (!category || (!category.active && live?.categoryId !== category.id)) {
    throw new HttpsError('failed-precondition', 'Choose an active category.');
  }
  const variants = draft.stockType === 'repeatable' ? draft.variants : [];
  if (draft.stockType === 'repeatable' && !variants?.length) {
    throw new HttpsError('failed-precondition', 'Add at least one stocked variant.');
  }
  return { ...draft, sizeKeys: [draft.sizeLabel, ...variants.map(variant => variant.sizeLabel)].filter(Boolean).map(sizeKey).filter(Boolean) };
}

function sameMedia(draft, live) {
  const ids = draft.photos.map(photo => photo.id);
  return live?.mediaRevision && ids.length === live.photos?.length && ids.every((id, index) => live.photos[index].id === id)
    ? live.mediaRevision : null;
}

async function copyRenditions(bucket, draft, slug, revision) {
  const base = `product-media/${slug}/${revision}`;
  async function copy(source, destination, contentType) {
    const [buffer] = await bucket.file(source).download();
    await bucket.file(`${base}/${destination}`).save(buffer, { resumable: false, metadata: { contentType } });
  }
  try {
    for (const photo of draft.photos) {
      const expected = `product-processed/${slug}/${photo.uploadedBy}/${photo.id}`;
      if (photo.processedPath !== expected || !photo.alt) throw new Error('Invalid processed photo');
      await Promise.all(renditionWidths.map(width =>
        copy(`${expected}/${width}.webp`, `${photo.id}-${width}.webp`, 'image/webp'),
      ));
    }
    await copy(`${draft.photos[0].processedPath}/share.jpg`, 'share.jpg', 'image/jpeg');
  } catch {
    throw new HttpsError('failed-precondition', 'A processed photo is unavailable. Reopen the draft and check its photos.');
  }
}

export async function publishCatalogueProduct(db, bucket, data, actor) {
  const slug = catalogueId(data?.slug);
  const draftPath = db.doc(`productDrafts/${slug}`);
  const productPath = db.doc(`products/${slug}`);
  const inventoryPath = db.doc(`inventory/${slug}`);
  const categoriesPath = db.doc('catalogueSettings/categories');
  const [draftSnapshot, productSnapshot, categoriesSnapshot] = await db.getAll(draftPath, productPath, categoriesPath);
  if (!draftSnapshot.exists) throw new HttpsError('not-found', 'Save a draft first.');
  assertDraftRevision(draftSnapshot, data.revision);
  const live = productSnapshot.data();
  if (live && !Number.isInteger(live.draftRevision)) {
    throw new HttpsError('already-exists', 'This product slug belongs to an existing product. Choose another slug.');
  }
  if (live?.status === 'published' && live.draftRevision === data.revision) {
    return { status: live.status, availability: live.availability };
  }
  const draft = validateDraft(draftSnapshot.data(), categoriesSnapshot.data()?.items ?? [], live);
  const existingMedia = sameMedia(draft, live);
  const mediaRevision = existingMedia || randomUUID();
  const publishedAt = live?.publishedAt ?? Timestamp.now();
  let projection;
  try {
    projection = buildPublicProduct(draft, {
      slug, availability: 'available', mediaRevision, photos: draft.photos, publishedAt,
    });
  } catch (error) {
    throw new HttpsError('failed-precondition', error.message);
  }

  if (!existingMedia) await copyRenditions(bucket, draft, slug, mediaRevision);
  const auditPath = db.collection('auditLogs').doc();
  return db.runTransaction(async tx => {
    const [currentDraft, currentProduct, currentStock, categories] = await tx.getAll(draftPath, productPath, inventoryPath, categoriesPath);
    assertDraftRevision(currentDraft, data.revision);
    const previous = currentProduct.data();
    if (previous?.status === 'published' && previous.draftRevision === data.revision) {
      return { status: previous.status, availability: previous.availability };
    }
    if (previous?.mediaRevision !== live?.mediaRevision || previous?.status !== live?.status) {
      throw new HttpsError('aborted', 'Publication changed. Reopen the draft and try again.');
    }
    validateDraft(draft, categories.data()?.items ?? [], previous);
    const inventory = currentStock.data() ?? {};
    assertStockCanChange(inventory, previous?.availability);
    if (inventory.stockType && inventory.stockType !== draft.stockType) {
      throw new HttpsError('failed-precondition', 'A published piece keeps its stock type.');
    }
    const variants = draft.stockType === 'repeatable' ? draft.variants : [];
    const units = draft.stockType === 'repeatable' ? variants.reduce((sum, variant) => sum + variant.quantity, 0) : 1;
    // Preserve manually sold stock on edits. Restoring it is a separate audited action.
    const sold = previous?.availability === 'sold' || units === 0;
    const availability = sold ? 'sold' : 'available';
    const saved = currentDraft.data();
    const isRealCatalogueStock = saved.approvedRevision === data.revision && hasPhotographedStock(saved);
    const publicProduct = { ...projection, availability, draftRevision: data.revision, isRealCatalogueStock };
    const nextInventory = {
      stockType: draft.stockType, availableUnits: sold ? 0 : units, relistUnits: units,
      variants: sold ? variants.map(variant => ({ ...variant, quantity: 0 })) : variants, relistVariants: variants,
    };
    const requestableSizes = await updateSizeFacets(tx, db, previous, publicProduct, nextInventory);
    tx.set(productPath, { ...publicProduct, requestableSizes, purchasable: canRequestProduct(publicProduct) });
    tx.update(draftPath, { publicationStatus: 'published', publishedAvailability: availability, availableUnits: nextInventory.availableUnits });
    tx.set(inventoryPath, nextInventory);
    tx.create(auditPath, { action: live ? 'republish' : 'publish', actorUid: actor.uid, productId: slug, at: FieldValue.serverTimestamp() });
    return { status: 'published', availability, availableUnits: sold ? 0 : units };
  });
}

export async function withdrawCatalogueProduct(db, data, actor) {
  const slug = catalogueId(data?.slug);
  const status = data?.status;
  if (!['draft', 'archived'].includes(status)) throw new HttpsError('invalid-argument', 'Choose Unpublish or Archive.');
  const productPath = db.doc(`products/${slug}`);
  return db.runTransaction(async tx => {
    const [snapshot, stock] = await tx.getAll(productPath, db.doc(`inventory/${slug}`));
    const product = snapshot.data();
    if (!product || !Number.isInteger(product.draftRevision)) throw new HttpsError('not-found', 'Publish the product before changing visibility.');
    assertStockCanChange(stock.data() ?? {}, product.availability);
    if (product.status !== status) {
      const requestableSizes = await updateSizeFacets(tx, db, product, { ...product, status }, stock.data());
      tx.update(productPath, { status, requestableSizes, purchasable: false });
      tx.update(db.doc(`productDrafts/${slug}`), { publicationStatus: status });
      tx.create(db.collection('auditLogs').doc(), { action: status === 'archived' ? 'archive' : 'unpublish', actorUid: actor.uid, productId: slug, at: FieldValue.serverTimestamp() });
    }
    return { status, availability: product.availability };
  });
}
