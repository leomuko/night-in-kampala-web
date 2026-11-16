import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { catalogueId } from './catalogue-drafts.js';
import { writeStock } from './catalogue-stock.js';
import { maxLineQuantity } from './order-model.js';
import { evolveLineStock, stockAvailability } from './order-stock.js';

export async function recordManualSale(db, data, actor) {
  const slug = catalogueId(data?.slug);
  const size = catalogueId(data?.size);
  const { channel, quantity, saleId } = data;
  if (!['in_person', 'whatsapp'].includes(channel) || !Number.isInteger(quantity) || quantity < 1 || quantity > maxLineQuantity
    || typeof saleId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(saleId)) {
    throw new HttpsError('invalid-argument', 'Choose a sale channel, size and quantity.');
  }
  const saleRef = db.doc(`manualSales/${saleId}`);
  const productPath = db.doc(`products/${slug}`);
  const inventoryPath = db.doc(`inventory/${slug}`);
  return db.runTransaction(async tx => {
    const [prior, productDoc, stockDoc] = await tx.getAll(saleRef, productPath, inventoryPath);
    const product = productDoc.data();
    const stock = stockDoc.data();
    if (!product || !stock) throw new HttpsError('not-found', 'This piece could not be found.');
    if (prior.exists) {
      const saved = prior.data();
      if (saved.actorUid !== actor.uid || saved.slug !== slug || saved.size !== size || saved.quantity !== quantity || saved.channel !== channel) {
        throw new HttpsError('already-exists', 'This sale was recorded with different details.');
      }
      return { status: product.status, availability: product.availability, availableUnits: stock.availableUnits };
    }
    const line = { slug, size, quantity, state: 'available' };
    // Consume only currently available units. The intermediate allocation is in memory.
    const allocated = evolveLineStock(product, stock, line, 'reserved', saleId);
    const inventory = evolveLineStock(product, allocated, { ...line, state: 'reserved' }, 'sold', saleId);
    const availability = stockAvailability(inventory);
    await writeStock(tx, { inventoryPath, productPath, product, inventory, from: product.availability, to: availability,
      actor, action: 'manual-sale-stock', auditPath: db.collection('auditLogs').doc() });
    tx.create(saleRef, { slug, size, quantity, channel, name: product.name, unitPriceUGX: product.priceUGX,
      actorUid: actor.uid, at: FieldValue.serverTimestamp() });
    tx.create(db.collection('auditLogs').doc(), { action: 'manual-sale', saleId, productId: slug, channel, quantity,
      actorUid: actor.uid, at: FieldValue.serverTimestamp() });
    return { status: product.status, availability, availableUnits: inventory.availableUnits };
  });
}
