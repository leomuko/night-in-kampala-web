import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defaultOrderSettings, emulatorOrderCheck } from '../functions/order-model.js';
import { privateOrderKey } from '../functions/order-submit.js';

const project = 'demo-night-in-kampala';
if (process.env.GCLOUD_PROJECT !== project || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') {
  throw new Error('Order tests require the demo project and loopback Firestore.');
}
const base = `http://127.0.0.1:5001/${project}/us-central1`;
const phones = ['0772 123 456', '0772 123 457', '0772 123 458', '0772 123 459'];

async function callable(name, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}/${name}`, {
    method: 'POST', headers, body: JSON.stringify({ data }), signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, body: await response.json() };
}

async function orderFixture(run) {
  const app = initializeApp({ projectId: project }, `orders-${randomUUID()}`);
  const db = getFirestore(app);
  const fixtures = [];
  const pieceSlugs = [];
  const sizeRef = db.doc('catalogueSizes/waist-33');
  const sizeCount = db.doc('catalogueSizeCounts/waist-33');
  const savedFacets = await db.getAll(sizeRef, sizeCount);
  const staffUsers = [];
  const identifiers = new Set();
  const phoneKeys = new Set();
  const prefix = `order-test-${randomUUID().slice(0, 8)}`;
  const sourceRef = db.doc(`orderSources/${privateOrderKey(project, 'source', 'loopback')}`);
  const previousSource = await sourceRef.get();
  const settingsRef = db.doc('orderSettings/config');

  async function piece(index) {
    const slug = `${prefix}-${index}`;
    const product = db.doc(`products/${slug}`);
    const inventory = db.doc(`inventory/${slug}`);
    const draft = db.doc(`productDrafts/${slug}`);
    fixtures.push(product, inventory, draft);
    pieceSlugs.push(slug);
    await Promise.all([
      product.set({
        status: 'published', isRealCatalogueStock: true, availability: 'available',
        stockType: 'one-of-one', sizeLabel: 'Waist 33', name: 'Illustrative test denim', priceUGX: 85000,
        requestableSizes: [{ id: 'waist-33', label: 'Waist 33' }],
      }),
      sizeRef.set({ label: 'Waist 33' }),
      sizeCount.set({ count: FieldValue.increment(1) }, { merge: true }),
      inventory.set({ availableUnits: 1, relistUnits: 1, stockType: 'one-of-one', variants: [] }),
    ]);
    return { slug, size: 'waist-33', priceUGX: 85000, quantity: 1 };
  }
  function identity(data) { return privateOrderKey(project, 'submission', data.submissionId); }
  function payload(items, phone = phones[0]) {
    const data = { submissionId: randomUUID(), emulatorCheck: emulatorOrderCheck, items,
      details: { website: '', name: 'Demo shopper', email: '', phone, country: 'UG', method: 'collection' } };
    identifiers.add(identity(data));
    phoneKeys.add(privateOrderKey(project, 'phone', '+256' + phone.replaceAll(' ', '').slice(1)));
    return data;
  }
  async function staff(role = 'staff') {
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw new Error('Auth emulator required.');
    const email = `test-${randomUUID()}@example.test`;
    const password = randomUUID();
    const auth = getAuth(app);
    const account = await auth.createUser({ email, password });
    staffUsers.push(account.uid);
    if (role) await auth.setCustomUserClaims(account.uid, { [role]: true });
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', {
      method: 'POST', body: JSON.stringify({ email, password, returnSecureToken: true }), headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(response.status, 200);
    return (await response.json()).idToken;
  }
  try {
    await sourceRef.delete();
    await run({ db, piece, payload, identity, settingsRef, staff });
  } finally {
    await Promise.all([
      ...fixtures.map(doc => doc.delete()),
      ...savedFacets.map(doc => doc.exists ? doc.ref.set(doc.data()) : doc.ref.delete()),
      ...pieceSlugs.flatMap(slug => [...identifiers].map(id => db.doc(`orderRequests/${slug}/requests/${id}`).delete())),
      ...[...identifiers].flatMap(id => [db.doc(`orders/${id}`).delete(), db.doc(`orderQueue/${id}`).delete()]),
      ...[...phoneKeys].flatMap(id => [db.doc(`orderPhones/${id}`).delete(), db.doc(`orderPhoneBlocks/${id}`).delete()]),
      previousSource.exists ? sourceRef.set(previousSource.data()) : sourceRef.delete(),
    ]);
    for (const uid of staffUsers) {
      const audit = await db.collection('auditLogs').where('actorUid', '==', uid).get();
      await Promise.all(audit.docs.map(row => row.ref.delete()));
      await getAuth(app).deleteUser(uid);
    }
    await deleteApp(app);
  }
}

test('order creation validates form proof, stock, trusted prices and concurrent retry, then applies both limits', async () => {
  await orderFixture(async ({ db, piece, payload, identity, settingsRef }) => {
    const settings = (await settingsRef.get()).data() ?? defaultOrderSettings;
    assert.equal(settings.openPerPhone, 3);
    assert.equal(settings.submissionsPerHour, 5);
    const items = await Promise.all(Array.from({ length: 5 }, (_, index) => piece(index)));
    const first = payload([items[0]]);
    const submit = data => callable('orderCreate', data);
    assert.equal((await submit({ ...first, emulatorCheck: '' })).status, 401);
    assert.equal((await submit({ ...first, details: { ...first.details, website: 'bot' } })).status, 400);
    assert.equal((await submit({ ...first, items: [{ ...items[0], priceUGX: 1 }] })).body.error.status, 'FAILED_PRECONDITION');
    const attempts = await Promise.all([submit(first), submit(first)]);
    assert.equal(attempts[0].status, 200, JSON.stringify(attempts[0].body.error));
    assert.deepEqual(attempts[0].body.result, attempts[1].body.result);
    assert.equal(attempts[0].body.result.subtotalUGX, 85000);
    assert.equal(attempts[0].body.result.contact, undefined);
    assert.equal(attempts[0].body.result.whatsappNumber, '');
    const id = identity(first);
    assert.equal((await db.doc(`orders/${id}`).get()).data().contact.phone, '+256772123456');
    assert.equal((await db.doc(`orderQueue/${id}`).get()).data().unread, true);
    assert.equal((await db.doc(`products/${items[0].slug}`).get()).data().availability, 'requested');
    assert.equal((await db.doc(`inventory/${items[0].slug}`).get()).data().availableUnits, 1);
    assert.equal((await submit({ ...first, details: { ...first.details, name: 'Different demo shopper' } })).status, 409);
    const duplicate = payload([items[0]]);
    duplicate.details.phone = '+256 772 123 456';
    assert.equal((await submit(duplicate)).status, 409);
    assert.equal((await submit(payload([items[0]], phones[1]))).status, 200);
    assert.equal((await submit(payload([items[1]]))).status, 200);
    assert.equal((await submit(payload([items[2]]))).status, 200);
    const phoneLimited = await submit(payload([items[3]]));
    assert.equal(phoneLimited.body.error.status, 'RESOURCE_EXHAUSTED');
    assert.match(phoneLimited.body.error.message, /phone number/);
    assert.equal((await submit(payload([items[3]], phones[2]))).status, 200);
    const overSource = await submit(payload([items[4]], phones[3]));
    assert.match(overSource.body.error.message, /connection/);
    assert.equal((await db.doc(`products/${items[4].slug}`).get()).data().availability, 'available');
  });
});

test('staff can mark orders seen and contacted independently, only once per action', async () => {
  await orderFixture(async ({ db, piece, payload, identity, staff }) => {
    const first = payload([await piece(0)]);
    assert.equal((await callable('orderCreate', first)).status, 200);
    const id = identity(first);
    const queue = db.doc(`orderQueue/${id}`);
    const guest = await staff(null);
    const worker = await staff();
    assert.equal((await callable('orderDesk', { id, action: 'seen' })).status, 401);
    assert.equal((await callable('orderDesk', { id, action: 'seen' }, guest)).status, 403);
    assert.equal((await callable('orderDesk', { id, action: 'seen' }, worker)).status, 200);
    const seen = (await queue.get()).data();
    assert.deepEqual([seen.unread, seen.state, seen.contact], [false, 'new', undefined]);
    for (let attempt = 0; attempt < 2; attempt++) {
      assert.equal((await callable('orderDesk', { id, action: 'contact' }, worker)).status, 200);
    }
    assert.equal((await queue.get()).data().state, 'contacted');
    assert.equal((await db.doc(`orders/${id}`).get()).data().unread, false);
    assert.equal((await db.collection('auditLogs').where('orderId', '==', id).get()).size, 1);
  });
});

test('competing confirmation allocates once and multi-item cancellation releases only owned stock', async () => {
  await orderFixture(async ({ db, piece, payload, identity, staff }) => {
    const products = await Promise.all([piece(0), piece(1)]);
    const older = payload(products);
    const newer = payload([products[0]], phones[1]);
    assert.equal((await callable('orderCreate', older)).status, 200);
    assert.equal((await callable('orderCreate', newer)).status, 200);
    const worker = await staff();
    const desk = (data, action, slug) => callable('orderDesk', { id: identity(data), action, slug }, worker);
    const [success, blocked] = await Promise.all([desk(older, 'confirm', products[0].slug), desk(newer, 'confirm', products[0].slug)]);
    assert.equal(success.status, 200, JSON.stringify(success.body.error));
    assert.equal(success.body.result.competing, true);
    assert.equal(blocked.body.error.status, 'FAILED_PRECONDITION');
    const order = db.doc(`orders/${identity(older)}`);
    assert.deepEqual((await order.get()).data().items.map(line => line.state), ['reserved', 'requested']);
    assert.equal((await order.get()).data().subtotalUGX, 170000);
    const stock = db.doc(`inventory/${products[0].slug}`);
    assert.equal((await stock.get()).data().reservedUnits, 1);
    assert.equal((await desk(older, 'cancel')).status, 200);
    assert.equal((await desk(older, 'cancel')).status, 200);
    assert.equal((await stock.get()).data().availableUnits, 1);
    assert.equal((await db.doc(`products/${products[0].slug}`).get()).data().availability, 'requested');
    assert.equal((await db.doc(`products/${products[1].slug}`).get()).data().availability, 'available');
    assert.equal((await desk(newer, 'decline', products[0].slug)).status, 200);
    assert.equal((await db.doc(`products/${products[0].slug}`).get()).data().availability, 'available');
    assert.equal((await db.doc('catalogueSizeCounts/waist-33').get()).data().count, 2);
  });
});
