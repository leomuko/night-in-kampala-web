import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { boundedText, catalogueId } from './catalogue-drafts.js';
import { sizeKey } from './catalogue-sizes.js';
import { writeStockBatch } from './catalogue-stock.js';
import { orderDocument } from './order-desk.js';
import { openOrderStates } from './order-model.js';
import { queueFields, requestCollection, sizeUnits } from './order-submit.js';

export const activeLine = line => ['requested', 'reserved'].includes(line.state);
export const releasableOrder = order => ['unfulfilled', 'ready_for_collection'].includes(order.fulfilment);

export function stockAvailability(inventory) {
  if (inventory.availableUnits > 0) return inventory.activeRequests > 0 ? 'requested' : 'available';
  return inventory.reservedUnits > 0 ? 'reserved' : 'sold';
}

export function evolveLineStock(product, original, line, target, orderId) {
  const stock = { ...original };
  const allocations = { ...(stock.allocations ?? {}) };
  const reserved = stock.reservedUnits ?? 0;
  if (line.state === 'requested') {
    stock.activeRequests = Math.max(0, (stock.activeRequests ?? 0) - 1);
  }
  if (target === 'reserved') {
    if (product.status !== 'published' || product.isRealCatalogueStock !== true
      || stock.availableUnits < line.quantity || sizeUnits(product, stock, line.size) < line.quantity) {
      throw new HttpsError('failed-precondition', 'This piece or size is no longer available to reserve.');
    }
    let remaining = line.quantity;
    const picks = [];
    stock.variants = (stock.variants ?? []).map(variant => {
      if (sizeKey(variant.sizeLabel) !== line.size || remaining < 1 || variant.quantity < 1) return variant;
      const quantity = Math.min(remaining, variant.quantity);
      remaining -= quantity;
      picks.push({ id: variant.id, quantity });
      return { ...variant, quantity: variant.quantity - quantity };
    });
    stock.availableUnits -= line.quantity;
    stock.reservedUnits = reserved + line.quantity;
    allocations[orderId] = { quantity: line.quantity, picks };
  } else if (line.state === 'reserved') {
    const allocation = allocations[orderId];
    if (!allocation || allocation.quantity !== line.quantity || reserved < line.quantity) {
      throw new HttpsError('failed-precondition', 'This reservation must be reconciled before changing the line.');
    }
    stock.reservedUnits = reserved - line.quantity;
    if (target === 'sold') {
      stock.soldUnits = (stock.soldUnits ?? 0) + line.quantity;
    } else {
      stock.availableUnits += line.quantity;
      const picks = new Map(allocation.picks.map(pick => [pick.id, pick.quantity]));
      stock.variants = (stock.variants ?? []).map(variant => ({ ...variant, quantity: variant.quantity + (picks.get(variant.id) ?? 0) }));
    }
    delete allocations[orderId];
  }
  return { ...stock, allocations };
}

export function updatePhoneAccounting(tx, snapshot, before, after) {
  const phone = snapshot.data();
  if (!phone) throw new HttpsError('failed-precondition', 'Order accounting is unavailable.');
  const pieces = new Map(Object.entries(phone.pieces));
  for (const [index, line] of before.items.entries()) {
    if (activeLine(line) && !activeLine(after.items[index])) {
      const count = (pieces.get(line.slug) ?? 0) - 1;
      if (count > 0) pieces.set(line.slug, count);
      else pieces.delete(line.slug);
    }
  }
  const closed = openOrderStates.includes(before.state) && !openOrderStates.includes(after.state);
  tx.set(snapshot.ref, { open: Math.max(0, phone.open - Number(closed)), pieces: Object.fromEntries(pieces) });
}

export function writeOrderUpdate(tx, db, reference, order) {
  tx.update(reference, { ...order, updatedAt: FieldValue.serverTimestamp() });
  tx.update(db.doc(`orderQueue/${reference.id}`), queueFields(order));
}

function nextOrderState(order, items, action) {
  if (items.some(item => ['reserved', 'sold'].includes(item.state))) return 'confirmed';
  if (items.some(item => item.state === 'requested')) return order.state === 'new' ? 'new' : 'contacted';
  return action === 'spam' ? 'spam' : action === 'decline' ? 'declined' : 'cancelled';
}

const operations = {
  confirm: { from: 'requested', to: 'reserved' },
  decline: { from: 'requested', to: 'declined' },
  release: { from: 'reserved', to: 'cancelled' },
  sell: { from: 'reserved', to: 'sold' },
};

export async function changeOrderStock(db, data, actor) {
  const reference = orderDocument(db, data?.id);
  const action = data?.action;
  const entireOrder = action === 'cancel' || action === 'spam';
  if (!entireOrder && !Object.hasOwn(operations, action)) throw new HttpsError('invalid-argument', 'Choose a stock action.');
  const slug = entireOrder ? '' : catalogueId(data.slug);
  const exception = boundedText(data?.reason ?? '', 300, 'Reason');
  return db.runTransaction(async tx => {
    const order = (await tx.get(reference)).data();
    if (!order) throw new HttpsError('not-found', 'This order could not be found.');
    const operation = operations[action];
    const selected = order.items.find(item => item.slug === slug);
    if ((action === 'cancel' && order.state === 'cancelled') || (action === 'spam' && order.state === 'spam')) return { state: order.state };
    if (action === 'spam' && !['new', 'contacted'].includes(order.state)) {
      throw new HttpsError('failed-precondition', 'Only an unconfirmed order can be marked as spam.');
    }
    if (selected && selected.state === operation?.to) return { state: order.state };
    if (!openOrderStates.includes(order.state) || (action === 'sell' ? order.state !== 'confirmed' : !releasableOrder(order))) {
      throw new HttpsError('failed-precondition', 'This order can no longer change its allocation.');
    }
    if (action === 'cancel' && order.items.some(item => item.state === 'sold')) {
      throw new HttpsError('failed-precondition', 'This order contains Sold stock. Release any remaining reservations individually.');
    }
    const lines = entireOrder ? order.items.filter(activeLine) : selected?.state === operation.from ? [selected] : [];
    if (!lines.length) throw new HttpsError('failed-precondition', 'Choose a line eligible for this action.');
    const target = operation?.to ?? (action === 'spam' ? 'spam' : 'cancelled');
    const phone = await tx.get(db.doc(`orderPhones/${order.phoneKey}`));
    const snapshots = await tx.getAll(...lines.flatMap(line => [db.doc(`products/${line.slug}`), db.doc(`inventory/${line.slug}`)]));
    let competing = false;
    if (action === 'confirm') {
      const oldest = await tx.get(requestCollection(db, slug).orderBy('createdAt').limit(2));
      competing = oldest.docs.some(row => row.id !== reference.id);
      if (oldest.docs[0] && oldest.docs[0].id !== reference.id && !exception) {
        throw new HttpsError('failed-precondition', 'Handle the oldest competing request first, or record why you are confirming this one.');
      }
    }
    const records = lines.map((line, index) => {
      const [productDoc, stockDoc] = snapshots.slice(index * 2, index * 2 + 2);
      const product = productDoc.data(), original = stockDoc.data();
      if (!product || !original) throw new HttpsError('failed-precondition', 'Stock could not be located.');
      const inventory = evolveLineStock(product, original, line, target, reference.id);
      return { inventory, product, inventoryPath: stockDoc.ref, productPath: productDoc.ref,
        from: product.availability, to: stockAvailability(inventory), actor, action: `order-stock-${action}`,
        orderId: reference.id, auditPath: db.collection('auditLogs').doc() };
    });
    const changed = new Set(lines.map(line => line.slug));
    const items = order.items.map(item => changed.has(item.slug) ? { ...item, state: target } : item);
    const state = nextOrderState(order, items, action);
    const fulfilment = state !== 'confirmed' && order.fulfilment === 'ready_for_collection' ? 'unfulfilled' : order.fulfilment;
    const next = { ...order, items, state, fulfilment };
    await writeStockBatch(tx, db, records);
    for (const line of lines) if (line.state === 'requested') tx.delete(requestCollection(db, line.slug).doc(reference.id));
    updatePhoneAccounting(tx, phone, order, next);
    if (action === 'spam') tx.set(db.doc(`orderPhoneBlocks/${order.phoneKey}`), {
      orderId: reference.id, actorUid: actor.uid, at: FieldValue.serverTimestamp(),
    });
    writeOrderUpdate(tx, db, reference, next);
    tx.create(db.collection('auditLogs').doc(), { action: `order-${action}`, orderId: reference.id, actorUid: actor.uid,
      pieces: [...changed], ...(exception ? { reason: exception } : {}), at: FieldValue.serverTimestamp() });
    return { state, competing };
  });
}
