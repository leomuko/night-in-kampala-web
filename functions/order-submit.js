import { createHash, createHmac, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { catalogueId } from './catalogue-drafts.js';
import { canRequestProduct } from './catalogue-eligibility.js';
import { sizeKey } from './catalogue-sizes.js';
import { validateOrderContact } from './order-contact.js';
import { defaultOrderSettings, emulatorOrderCheck, maxLineQuantity, maxOrderLines } from './order-model.js';
import { orderSettingsPath } from './order-settings.js';

const hour = 3600000;

export function privateOrderKey(secret, purpose, value) {
  return createHmac('sha256', secret).update(purpose).update('\0').update(value).digest('hex');
}

function normalizedAddress(address) {
  const normalized = address?.trim().replace(/^::ffff:(?=\d)/i, '');
  return isIP(normalized) ? normalized : null;
}

export function orderSource(request, runtime, proxyHops) {
  if (runtime.emulator) {
    const peer = normalizedAddress(request.rawRequest.socket.remoteAddress);
    // The Firebase CLI's loopback listener can forward to a worker over IPC.
    const ipc = request.rawRequest.socket.remoteAddress === undefined;
    if (runtime.projectId !== 'demo-night-in-kampala' || (!ipc && !['127.0.0.1', '::1'].includes(peer))
      || request.data?.emulatorCheck !== emulatorOrderCheck) {
      throw new HttpsError('unauthenticated', 'Local form verification failed.');
    }
    return 'loopback';
  }
  if (!runtime.order?.appCheckSiteKey || runtime.order.appCheckSiteKey === 'REPLACE'
    || proxyHops === null || proxyHops === undefined) throw new HttpsError('failed-precondition', 'Ordering opens soon.');
  if (!request.app) throw new HttpsError('unauthenticated', 'The form could not verify this app.');
  if (runtime.order.proxyVerified !== true && !(runtime.target === 'preview'
    && request.data?.previewCheck === true && request.auth?.token.owner === true)) {
    throw new HttpsError('failed-precondition', 'Ordering opens soon.');
  }
  // A cloud deployment must confirm the appended client position and restrict ingress
  // in staging. Leftmost entries can originate in the incoming request.
  if (!/^[1-5]$/.test(proxyHops ?? '')) throw new HttpsError('failed-precondition', 'Order submission is being configured.');
  const addresses = request.rawRequest.get('x-forwarded-for')?.split(',') ?? [];
  const source = normalizedAddress(addresses.at(-Number(proxyHops)));
  if (!source) throw new HttpsError('failed-precondition', 'Could not verify this connection.');
  return source;
}

function validateLines(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > maxOrderLines) {
    throw new HttpsError('invalid-argument', 'Add between one and twelve pieces.');
  }
  const entries = items.map(item => {
    const { quantity, priceUGX } = item ?? {};
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxLineQuantity
      || !Number.isSafeInteger(priceUGX) || priceUGX < 1) {
      throw new HttpsError('invalid-argument', 'Review the quantities and prices in your bag.');
    }
    return { slug: catalogueId(item.slug), size: catalogueId(item.size), quantity, priceUGX };
  }).sort((a, b) => a.slug.localeCompare(b.slug));
  if (new Set(entries.map(entry => entry.slug)).size !== entries.length) {
    throw new HttpsError('invalid-argument', 'Add each piece to the order once.');
  }
  return entries;
}

export function sizeUnits(product, stock, size) {
  if (product.stockType === 'one-of-one') return sizeKey(product.sizeLabel) === size ? Math.min(1, stock.availableUnits) : 0;
  return (stock.variants ?? []).reduce((sum, variant) => sum + (sizeKey(variant.sizeLabel) === size ? variant.quantity : 0), 0);
}

export function publicOrderSummary(order, whatsappNumber) {
  return {
    reference: order.reference,
    receivedAt: order.createdAt.toMillis(),
    subtotalUGX: order.subtotalUGX,
    items: order.items.map(({ name, sizeLabel, priceUGX, quantity }) => ({ name, sizeLabel, priceUGX, quantity })),
    whatsappNumber,
  };
}

export function requestCollection(db, slug) {
  return db.collection(`orderRequests/${slug}/requests`);
}

export function queueFields(order) {
  return {
    ...(order.isTestData === true ? { isTestData: true } : {}),
    reference: order.reference, createdAt: order.createdAt, state: order.state, unread: order.unread,
    items: order.items.map(({ slug, name, state }) => ({ slug, name, state })),
    paidReserved: order.paymentState === 'paid' && order.items.some(item => item.state === 'reserved'),
  };
}

export async function submitOrder(db, data, source, secret, { previewData = false, testStockOnly = false, now = Date.now() } = {}) {
  if (typeof secret !== 'string' || secret.length < 20) throw new HttpsError('failed-precondition', 'Order submission is being configured.');
  if (typeof data?.submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.submissionId)) {
    throw new HttpsError('invalid-argument', 'Refresh the order form and try again.');
  }
  const contact = validateOrderContact(data.details);
  const requested = validateLines(data.items);
  const identity = privateOrderKey(secret, 'submission', data.submissionId.toLowerCase());
  const phoneKey = privateOrderKey(secret, 'phone', contact.phone);
  const sourceKey = privateOrderKey(secret, 'source', source);
  const payloadHash = createHash('sha256').update(JSON.stringify({ contact, requested })).digest('hex');
  const orderRef = db.doc(`orders/${identity}`);
  const phoneRef = db.doc(`orderPhones/${phoneKey}`);
  const sourceRef = db.doc(`orderSources/${sourceKey}`);
  const blockRef = db.doc(`orderPhoneBlocks/${phoneKey}`);
  const config = db.doc(orderSettingsPath);
  const reference = `NK-${randomBytes(8).toString('hex').toUpperCase()}`;
  const createdAt = Timestamp.fromMillis(now);
  return db.runTransaction(async tx => {
    const [saved, settingsDoc, phoneDoc, sourceDoc, block] = await tx.getAll(orderRef, config, phoneRef, sourceRef, blockRef);
    const settings = settingsDoc.data() ?? defaultOrderSettings;
    if (saved.exists) {
      const order = saved.data();
      if (!previewData && order.isTestData === true) throw new HttpsError('failed-precondition', 'Start a new order for the live shop.');
      if (order.payloadHash !== payloadHash) throw new HttpsError('already-exists', 'Retry with the original details for this submission.');
      return publicOrderSummary(order, settings.whatsappNumber);
    }
    if (block.exists) throw new HttpsError('failed-precondition', 'This request could not be accepted. Contact the store for help.');
    const phone = phoneDoc.data() ?? { open: 0, pieces: {} };
    const counts = new Map(Object.entries(phone.pieces));
    if (phone.open >= settings.openPerPhone) throw new HttpsError('resource-exhausted', 'This phone number has too many open requests.');
    if (requested.some(item => (counts.get(item.slug) ?? 0) >= settings.activePerPiece)) {
      throw new HttpsError('already-exists', 'This phone number already has an open request for a piece in the bag.');
    }
    const timestamps = (sourceDoc.data()?.timestamps ?? []).filter(time => time > now - hour);
    if (timestamps.length >= settings.submissionsPerHour) throw new HttpsError('resource-exhausted', 'Too many requests from this connection. Try again later.');

    const snapshots = await tx.getAll(...requested.flatMap(({ slug }) => [db.doc(`products/${slug}`), db.doc(`inventory/${slug}`)]));
    const writes = requested.map((entry, index) => {
      const product = snapshots[index * 2].data();
      const stock = snapshots[index * 2 + 1].data();
      const size = product?.requestableSizes?.find(option => option.id === entry.size);
      if (!canRequestProduct(product) || (testStockOnly && product.isTestData !== true)
        || (!previewData && product.isTestData === true) || !stock || !size || stock.availableUnits < entry.quantity
        || sizeUnits(product, stock, entry.size) < entry.quantity) {
        throw new HttpsError('failed-precondition', 'A piece or size is no longer available. Review your bag.');
      }
      if (product.priceUGX !== entry.priceUGX) throw new HttpsError('failed-precondition', 'A price changed. Review your bag before trying again.');
      return {
        entry: { ...entry, name: product.name, sizeLabel: size.label, state: 'requested', isRealCatalogueStock: true,
          photo: product.photos?.[0]?.smallUrl ?? '' },
        stock,
        productRef: snapshots[index * 2].ref, inventoryRef: snapshots[index * 2 + 1].ref,
      };
    });
    const items = writes.map(write => write.entry);
    const subtotalUGX = items.reduce((total, item) => total + item.priceUGX * item.quantity, 0);
    if (!Number.isSafeInteger(subtotalUGX)) throw new HttpsError('failed-precondition', 'Could not calculate the item subtotal. Contact the store.');
    const order = { reference, createdAt, state: 'new', paymentState: 'unpaid', fulfilment: 'unfulfilled',
      unread: true, contact, phoneKey, payloadHash, items, subtotalUGX };
    if (previewData) order.isTestData = true;
    for (const { entry, stock, inventoryRef, productRef } of writes) {
      counts.set(entry.slug, (counts.get(entry.slug) ?? 0) + 1);
      tx.create(requestCollection(db, entry.slug).doc(identity), { createdAt });
      tx.update(inventoryRef, { activeRequests: (stock.activeRequests ?? 0) + 1 });
      tx.update(productRef, { availability: 'requested' });
      tx.set(db.doc(`productDrafts/${entry.slug}`), { publishedAvailability: 'requested' }, { merge: true });
    }
    tx.create(orderRef, order);
    tx.create(db.doc(`orderQueue/${identity}`), queueFields(order));
    tx.set(phoneRef, { open: phone.open + 1, pieces: Object.fromEntries(counts) });
    tx.set(sourceRef, { timestamps: [...timestamps, now], expiresAt: Timestamp.fromMillis(now + hour) });
    return publicOrderSummary(order, settings.whatsappNumber);
  });
}
