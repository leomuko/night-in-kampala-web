import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9199') {
  throw new Error('Rules tests require explicit local emulator endpoints.');
}
let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-night-in-kampala-rules',
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9199, rules: await readFile('storage.rules', 'utf8') },
  });
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'products/published'), { status: 'published', availability: 'available', isRealCatalogueStock: false }),
      setDoc(doc(db, 'products/sold'), { status: 'published', availability: 'sold', isRealCatalogueStock: false }),
      setDoc(doc(db, 'products/draft'), { status: 'draft' }),
      setDoc(doc(db, 'orders/private'), { orderStatus: 'new', paymentStatus: 'unpaid', fulfilmentStatus: 'unfulfilled' }),
      setDoc(doc(db, 'inventory/private'), { quantity: 1 }),
      uploadBytes(ref(context.storage(), 'private/photo.webp'), new Uint8Array([1, 2, 3])),
    ]);
  });
});
after(async () => { await environment?.cleanup(); });

test('published and sold pieces can be read but drafts cannot', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'products/published')));
  await assertSucceeds(getDoc(doc(db, 'products/sold')));
  await assertFails(getDoc(doc(db, 'products/draft')));
});
test('a query must constrain visibility to published products', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDocs(query(collection(db, 'products'), where('status', '==', 'published'))));
  await assertFails(getDocs(collection(db, 'products')));
});
test('customers cannot publish, adjust stock, mark payment or give themselves roles', async () => {
  const db = environment.authenticatedContext('fixture-customer').firestore();
  await assertFails(setDoc(doc(db, 'products/published'), { status: 'published', priceUGX: 1 }));
  await assertFails(setDoc(doc(db, 'inventory/private'), { quantity: 999 }));
  await assertFails(setDoc(doc(db, 'orders/private'), { paymentStatus: 'paid' }));
  await assertFails(setDoc(doc(db, 'users/fixture-customer'), { owner: true }));
});
test('guests, customers and staff cannot access private order or inventory records', async () => {
  for (const context of [environment.unauthenticatedContext(), environment.authenticatedContext('fixture-customer'), environment.authenticatedContext('fixture-staff', { staff: true })]) {
    await assertFails(getDoc(doc(context.firestore(), 'orders/private')));
    await assertFails(getDoc(doc(context.firestore(), 'inventory/private')));
  }
});
test('private media and uploads remain closed even for a staff claim', async () => {
  for (const context of [environment.unauthenticatedContext(), environment.authenticatedContext('fixture-customer'), environment.authenticatedContext('fixture-staff', { staff: true })]) {
    await assertFails(getBytes(ref(context.storage(), 'private/photo.webp')));
    await assertFails(uploadBytes(ref(context.storage(), 'uploads/photo.webp'), new Uint8Array([4])));
  }
});
