import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { updateSizeFacetBatch } from './catalogue-sizes.js';
import { canRequestProduct } from './catalogue-eligibility.js';
import { catalogueId } from './catalogue-drafts.js';

export function assertStockCanChange(inventory, availability) {
  if (inventory.allocationId || inventory.reservedUnits > 0 || inventory.activeRequests > 0 || availability === 'reserved' || availability === 'requested') {
    throw new HttpsError('failed-precondition', 'Resolve existing stock commitments before changing this piece.');
  }
}

export function writeStock(tx, record) {
  return writeStockBatch(tx, record.productPath.firestore, [record]);
}

export async function writeStockBatch(tx, db, records) {
  const effects = records.map(({ product, to, inventory }) => ({ previous: product, product: { ...product, availability: to }, stock: inventory }));
  const sizes = await updateSizeFacetBatch(tx, db, effects);
  for (const [index, record] of records.entries()) {
    const { inventoryPath, productPath, auditPath, inventory, from, to, actor, action, orderId } = record;
    tx.set(inventoryPath, inventory);
    tx.set(db.doc(`productDrafts/${productPath.id}`), {
      publishedAvailability: to, availableUnits: inventory.availableUnits, reservationCount: Object.keys(inventory.allocations ?? {}).length,
    }, { merge: true });
    tx.update(productPath, { availability: to, requestableSizes: sizes[index], purchasable: canRequestProduct(effects[index].product) });
    tx.create(auditPath, { action, actorUid: actor.uid, productId: productPath.id, from, to,
      ...(orderId ? { orderId } : {}), at: FieldValue.serverTimestamp() });
  }
}

export async function changeCatalogueAvailability(db, data, actor) {
  const slug = catalogueId(data?.slug);
  const target = data?.availability;
  if (!['available', 'sold'].includes(target)) throw new HttpsError('invalid-argument', 'Choose Sold or Available.');
  const inventoryPath = db.doc(`inventory/${slug}`);
  const productPath = db.doc(`products/${slug}`);
  const auditPath = db.collection('auditLogs').doc();
  return db.runTransaction(async tx => {
    const [product, stock] = await tx.getAll(productPath, inventoryPath);
    const from = product.data()?.availability;
    const inventory = stock.data();
    if (product.data()?.status !== 'published' || !inventory || !['available', 'sold', 'requested', 'reserved'].includes(from)) {
      throw new HttpsError('failed-precondition', 'Publish the product before changing availability.');
    }
    assertStockCanChange(inventory, from);
    if (from === target) return { availability: target, status: 'published', availableUnits: inventory.availableUnits };
    const availableUnits = target === 'sold' ? 0 : inventory.relistUnits;
    if (target === 'available' && (!Number.isInteger(availableUnits) || availableUnits < 1)) {
      throw new HttpsError('failed-precondition', 'Set a positive quantity in the draft and publish again.');
    }
    const relistUnits = target === 'sold' ? inventory.availableUnits : inventory.relistUnits;
    const relistVariants = target === 'sold' ? inventory.variants : (inventory.relistVariants ?? []);
    const variants = target === 'sold' ? inventory.variants.map(variant => ({ ...variant, quantity: 0 })) : relistVariants;
    await writeStock(tx, {
      inventoryPath, productPath, auditPath, product: product.data(), from, to: target, actor, action: 'change-availability',
      inventory: { ...inventory, availableUnits, relistUnits, variants, relistVariants },
    });
    return { availability: target, status: 'published', availableUnits };
  });
}
