import { getFirebaseServices } from '../../services/firebase.js';
import { defaultOrderSettings } from '../../../functions/order-model.js';

export async function staffFirestore() {
  const [{ db }, sdk] = await Promise.all([getFirebaseServices(), import('firebase/firestore')]);
  return { db, sdk };
}

export const queuePageSize = 100;
export function queueQuery(db, sdk, cursor) {
  const constraints = [sdk.orderBy('createdAt', 'desc'), sdk.limit(queuePageSize)];
  if (cursor) constraints.push(sdk.startAfter(cursor));
  return sdk.query(sdk.collection(db, 'orderQueue'), ...constraints);
}

export function queueRows(snapshot) {
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
}

export async function watchOrder(id, update, fail) {
  const { db, sdk } = await staffFirestore();
  return sdk.onSnapshot(sdk.doc(db, 'orders', id), { includeMetadataChanges: true }, snapshot => {
    if (!snapshot.metadata.fromCache) update(snapshot.data() ?? null);
  }, fail);
}

export function isOverdue(order, hours = defaultOrderSettings.overdueHours, now = Date.now()) {
  return ['new', 'contacted'].includes(order.state) && now - order.createdAt.toMillis() >= hours * 3600000;
}

export function groupOrders(rows, visible) {
  const groups = new Map();
  for (const order of [...rows].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis() || a.id.localeCompare(b.id))) {
    for (const { slug, name, state } of order.items) {
      if (state !== 'requested') continue;
      if (!groups.has(slug)) groups.set(slug, { slug, name, orders: [] });
      groups.get(slug).orders.push(order);
    }
  }
  const shown = new Set(visible.map(row => row.id));
  const grouped = new Set();
  const competing = [...groups.values()].filter(group => group.orders.length > 1 && group.orders.some(order => shown.has(order.id)));
  for (const group of competing) for (const order of group.orders) grouped.add(order.id);
  return { competing, remaining: visible.filter(row => !grouped.has(row.id)) };
}
