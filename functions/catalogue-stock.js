import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { catalogueId } from './catalogue-drafts.js';

export function assertStockCanChange(inventory, availability) {
  if (inventory.allocationId || inventory.reservedUnits > 0 || availability === 'reserved' || availability === 'requested') {
    throw new HttpsError('failed-precondition', 'Resolve existing stock commitments before changing this piece.');
  }
}

// Use one transaction for the private count, storefront state and audit trail.
export function writeStock(tx, { inventoryPath, productPath, auditPath, inventory, from, to, actor, action }) {
  tx.set(inventoryPath, inventory);
  tx.update(productPath, { availability: to });
  tx.create(auditPath, { action, actorUid: actor.uid, productId: productPath.id, from, to, at: FieldValue.serverTimestamp() });
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
    if (from === target) return { availability: target, status: 'published' };
    const availableUnits = target === 'sold' ? 0 : inventory.relistUnits;
    if (target === 'available' && (!Number.isInteger(availableUnits) || availableUnits < 1)) {
      throw new HttpsError('failed-precondition', 'Set a positive quantity in the draft and publish again.');
    }
    const relistUnits = target === 'sold' ? inventory.availableUnits : inventory.relistUnits;
    const relistVariants = target === 'sold' ? inventory.variants : (inventory.relistVariants ?? []);
    const variants = target === 'sold' ? inventory.variants.map(variant => ({ ...variant, quantity: 0 })) : relistVariants;
    writeStock(tx, {
      inventoryPath, productPath, auditPath, from, to: target, actor, action: 'change-availability',
      inventory: { ...inventory, availableUnits, relistUnits, variants, relistVariants },
    });
    return { availability: target, status: 'published' };
  });
}
