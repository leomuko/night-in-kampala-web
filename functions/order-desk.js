import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export function orderDocument(db, id) {
  if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) throw new HttpsError('invalid-argument', 'Choose a saved order.');
  return db.doc(`orders/${id}`);
}

export async function updateOrderDesk(db, data, actor) {
  const orderRef = orderDocument(db, data?.id);
  const action = data?.action;
  if (!['seen', 'contact'].includes(action)) throw new HttpsError('invalid-argument', 'Choose a supported order action.');
  const queueRef = db.doc(`orderQueue/${orderRef.id}`);
  return db.runTransaction(async tx => {
    const order = (await tx.get(orderRef)).data();
    if (!order) throw new HttpsError('not-found', 'This order could not be found.');
    if (action === 'seen') {
      if (order.unread) {
        tx.update(orderRef, { unread: false, seenAt: FieldValue.serverTimestamp(), seenBy: actor.uid });
        tx.update(queueRef, { unread: false });
      }
      return { unread: false };
    }
    if (order.state === 'contacted') return { state: order.state };
    if (order.state !== 'new') throw new HttpsError('failed-precondition', 'Only a new order can be marked contacted.');
    tx.update(orderRef, { state: 'contacted', contactedAt: FieldValue.serverTimestamp(), contactedBy: actor.uid });
    tx.update(queueRef, { state: 'contacted' });
    tx.create(db.collection('auditLogs').doc(), { action: 'order-contacted', orderId: orderRef.id, actorUid: actor.uid, at: FieldValue.serverTimestamp() });
    return { state: 'contacted' };
  });
}
