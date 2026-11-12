import { readFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { previewProducts } from '../src/data/previewProducts.js';

const fixture = JSON.parse(await readFile('fixtures/emulator-data.json', 'utf8'));
if (fixture.projectId !== 'demo-night-in-kampala') throw new Error('Refusing a non-demo project.');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.METADATA_SERVER_DETECTION = 'none';
const app = initializeApp({ projectId: fixture.projectId });
const db = getFirestore(app);
const batch = db.batch();
for (const [slug, data] of Object.entries(fixture.products)) batch.set(db.doc(`products/${slug}`), data);
// Match the existing homepage links; these remain synthetic and unpurchasable.
for (const item of previewProducts) batch.set(db.doc(`products/${item.slug}`), {
  name: item.name, priceUGX: item.price, status: 'published',
  availability: 'illustrative', isRealCatalogueStock: false, purchasable: false,
  share: {
    description: 'AI-generated development placeholder. Illustrative clothing; unavailable for purchase.',
    imageUrl: `/share/${item.image}.jpg`, imageAlt: item.alt,
  },
});
for (const [collection, data] of Object.entries(fixture.content)) {
  batch.set(db.doc(`${collection}/fixture-published`), { ...data, status: 'published', illustrative: true });
  batch.set(db.doc(`${collection}/fixture-draft`), { ...data, status: 'draft', illustrative: true });
}
batch.set(db.doc('orders/fixture-private'), { orderStatus: 'new', paymentStatus: 'unpaid', fulfilmentStatus: 'unfulfilled', fixture: true });
batch.set(db.doc('inventory/fixture-private'), { quantity: 1, fixture: true });
await batch.commit();
const auth = getAuth(app);
for (const uid of ['fixture-customer', 'fixture-staff']) {
  try { await auth.createUser({ uid }); }
  catch (error) { if (error.code !== 'auth/uid-already-exists') throw error; }
}
await auth.setCustomUserClaims('fixture-staff', { staff: true });
console.log('Seeded local published/draft/sold content and synthetic identities. No real inventory or cloud data touched.');
await deleteApp(app);
