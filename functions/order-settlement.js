import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { boundedText, catalogueId } from './catalogue-drafts.js';
import { changeCatalogueAvailability } from './catalogue-stock.js';
import { orderDocument } from './order-desk.js';
import { allowedFulfilment, canCompleteOrder } from './order-model.js';
import { changeOrderStock, updatePhoneAccounting, writeOrderUpdate } from './order-stock.js';

export async function settleOrder(db, data, actor) {
  const reference = orderDocument(db, data?.id);
  const action = data.action;
  if (!['payment', 'fulfil', 'complete'].includes(action)) throw new HttpsError('invalid-argument', 'Choose an order action.');
  return db.runTransaction(async tx => {
    const order = (await tx.get(reference)).data();
    if (!order) throw new HttpsError('not-found', 'This order could not be found.');
    let next;
    let audit = {};
    if (action === 'payment') {
      const amountUGX = data.amountUGX;
      const method = boundedText(data.method, 80, 'Payment method');
      if (!Number.isSafeInteger(amountUGX) || amountUGX <= 0 || !method) {
        throw new HttpsError('invalid-argument', 'Enter a payment method and the actual whole UGX amount received.');
      }
      if (order.paymentState === 'paid') {
        if (order.payment.amountUGX === amountUGX && order.payment.method === method) return { paymentState: 'paid' };
        throw new HttpsError('already-exists', 'Payment is already recorded.');
      }
      if (order.state !== 'confirmed' || !order.items.some(item => ['reserved', 'sold'].includes(item.state))) {
        throw new HttpsError('failed-precondition', 'Confirm stock for this order before recording payment.');
      }
      const payment = { amountUGX, method, currency: 'UGX', receivedAt: FieldValue.serverTimestamp(), recordedBy: actor.uid };
      next = { ...order, paymentState: 'paid', payment };
      audit = { amountUGX, method, currency: 'UGX' };
    } else if (action === 'fulfil') {
      if (order.fulfilment === data.fulfilment) return { fulfilment: order.fulfilment };
      if (!allowedFulfilment(order).includes(data.fulfilment)) {
        throw new HttpsError('failed-precondition', 'This fulfilment action is unavailable in the current state.');
      }
      next = { ...order, fulfilment: data.fulfilment };
      audit = { from: order.fulfilment, to: data.fulfilment };
    } else {
      if (order.state === 'completed') return { state: order.state };
      if (!canCompleteOrder(order)) throw new HttpsError('failed-precondition', 'Record fulfilment, payment and Sold before completing the order.');
      const phone = await tx.get(db.doc(`orderPhones/${order.phoneKey}`));
      next = { ...order, state: 'completed' };
      updatePhoneAccounting(tx, phone, order, next);
    }
    writeOrderUpdate(tx, db, reference, next);
    tx.create(db.collection('auditLogs').doc(), {
      ...audit, action: `order-${action}`, actorUid: actor.uid, orderId: reference.id, at: FieldValue.serverTimestamp(),
    });
    return { state: next.state, paymentState: next.paymentState, fulfilment: next.fulfilment };
  });
}

export async function markCatalogueSold(db, data, actor) {
  const slug = catalogueId(data?.slug);
  const stock = (await db.doc(`inventory/${slug}`).get()).data();
  const orderIds = Object.keys(stock?.allocations ?? {});
  if (!orderIds.length) return changeCatalogueAvailability(db, { slug, availability: 'sold' }, actor);
  if (orderIds.length !== 1) throw new HttpsError('failed-precondition', 'Choose the reservation from the order detail.');
  await changeOrderStock(db, { id: orderIds[0], slug, action: 'sell' }, actor);
  const [[product], [inventory]] = await Promise.all([
    db.getAll(db.doc(`products/${slug}`)), db.getAll(db.doc(`inventory/${slug}`)),
  ]);
  return { status: product.data().status, availability: product.data().availability,
    availableUnits: inventory.data().availableUnits, reservationCount: Object.keys(inventory.data().allocations ?? {}).length };
}
