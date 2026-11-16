import { formatPrice } from '../../data/previewProducts.js';

const key = 'nk-recent-order-v1';

function receiptRecord({ reference, receivedAt, subtotalUGX, items }) {
  if (typeof reference !== 'string' || !/^NK-[A-Z0-9-]{1,40}$/.test(reference)
    || !Number.isSafeInteger(receivedAt) || !Number.isSafeInteger(subtotalUGX) || subtotalUGX < 0
    || !Array.isArray(items) || items.length === 0 || items.length > 12) return null;
  const safe = items.map(({ name, sizeLabel, priceUGX, quantity }) => ({ name, sizeLabel, priceUGX, quantity }));
  if (safe.some(item => typeof item.name !== 'string' || typeof item.sizeLabel !== 'string'
    || !Number.isSafeInteger(item.priceUGX) || item.priceUGX < 1 || !Number.isInteger(item.quantity) || item.quantity < 1)) return null;
  return { reference, receivedAt, subtotalUGX, items: safe };
}

export function saveRecentOrder(receipt) {
  const summary = receiptRecord(receipt);
  if (!summary) return;
  try { localStorage.setItem(key, JSON.stringify(summary)); } catch { /* The receipt is still available on screen. */ }
}

export function readRecentOrder() {
  try { return receiptRecord(JSON.parse(localStorage.getItem(key))); } catch { return null; }
}

export function dismissRecentOrder() {
  try { localStorage.removeItem(key); } catch { /* Dismiss in the current view. */ }
}

export function whatsappOrderLink(receipt) {
  const number = receipt?.whatsappNumber;
  if (typeof number !== 'string' || !/^\+[1-9][0-9]{7,14}$/.test(number)) return null;
  const record = receiptRecord(receipt);
  if (!record) return null;
  const summary = record.items.map(item => `${item.quantity} × ${item.name} (${item.sizeLabel}) at ${formatPrice(item.priceUGX)}`).join(', ');
  const message = `Hi Night in Kampala, I just placed order ${record.reference}: ${summary}.`;
  return `https://wa.me/${number.slice(1)}?text=${encodeURIComponent(message)}`;
}
