import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, startAfter, Timestamp, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getBytes, listAll, ref, updateMetadata, uploadBytes } from 'firebase/storage';
import { buildPublicProduct } from '../functions/catalogue-projection.js';

const projectId = 'demo-night-in-kampala-rules';
if (process.env.GCLOUD_PROJECT !== projectId || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9199') {
  throw new Error('Rules tests require the isolated demo rules project and loopback endpoints.');
}

const publishedDraft = {
  name: 'Illustrative denim',
  itemCode: 'NK-DEMO-01',
  categoryId: 'denim',
  priceUGX: 160000,
  stockType: 'one-of-one',
  sizeLabel: 'Waist 32',
  sizeKeys: ['waist-32'],
  measurements: [{ label: 'Waist', cm: 81, internalNote: 'private' }],
  condition: 'Illustrative condition',
  reworkNotes: 'Illustrative rework',
  care: 'Illustrative care',
  shareDescription: 'Illustrative description',
  supplierPhone: 'private',
  costUGX: 10000,
  isRealCatalogueStock: false,
  purchasable: true,
};

const published = buildPublicProduct(publishedDraft, {
  slug: 'published',
  availability: 'available',
  mediaRevision: 'first',
  photos: [{ id: 'front', alt: 'AI-generated placeholder', sourcePath: 'private/source.webp' }],
  publishedAt: Timestamp.fromMillis(1000),
});

const jpeg = new Uint8Array([255, 216, 255, 217]);
const jpegMetadata = { contentType: 'image/jpeg' };
const activeImage = 'product-media/published/first/share.jpg';
const inactiveImage = 'product-media/published/next/share.jpg';
const unlistedFile = 'product-media/published/first/original.jpg';
const privateImage = 'product-drafts/published/staff/front.jpg';
const unpublishedImage = 'product-media/draft/first/share.jpg';
const missingProductImage = 'product-media/missing/first/share.jpg';
const legacyProductImage = 'product-media/legacy/first/share.jpg';
let environment;
let roles;

before(async () => {
  const categories = JSON.parse(await readFile('fixtures/catalogue-categories.json', 'utf8'));
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9199, rules: await readFile('storage.rules', 'utf8') },
  });
  roles = {
    guest: environment.unauthenticatedContext(),
    customer: environment.authenticatedContext('customer'),
    staff: environment.authenticatedContext('staff', { staff: true }),
    owner: environment.authenticatedContext('owner-account', { owner: true }),
    malformedClaim: environment.authenticatedContext('wrong-claim', { staff: 'true' }),
  };

  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'products/published'), published),
      setDoc(doc(db, 'products/sold'), { ...published, name: 'Illustrative sold piece', availability: 'sold' }),
      setDoc(doc(db, 'products/requested'), { ...published, name: 'Illustrative requested piece', availability: 'requested', publishedAt: Timestamp.fromMillis(2000) }),
      setDoc(doc(db, 'products/draft'), { ...published, status: 'draft' }),
      setDoc(doc(db, 'products/archived'), { ...published, status: 'archived' }),
      setDoc(doc(db, 'products/legacy'), { status: 'published', name: 'Older illustrative fixture' }),
      setDoc(doc(db, 'productDrafts/published'), publishedDraft),
      setDoc(doc(db, 'contentDrafts/collections--published'), { collection: 'collections', title: 'Private draft' }),
      setDoc(doc(db, 'orders/private'), { orderStatus: 'new', paymentStatus: 'unpaid', fulfilmentStatus: 'unfulfilled' }),
      setDoc(doc(db, 'inventory/published'), { availableUnits: 1 }),
      setDoc(doc(db, 'auditLogs/first'), { operation: 'publish', actorUid: 'staff' }),
      setDoc(doc(db, 'users/customer'), { staff: true, owner: true }),
      setDoc(doc(db, 'catalogueSettings/categories'), categories),
      setDoc(doc(db, 'catalogueSizes/waist-32'), { label: 'Waist 32' }),
      setDoc(doc(db, 'catalogueSizeCounts/waist-32'), { count: 1 }),
      setDoc(doc(db, 'catalogueSettings/internal'), { private: true }),
      ...['collections', 'events', 'lookbooks', 'pages'].flatMap(kind => [
        setDoc(doc(db, kind, 'published'), { status: 'published' }),
        setDoc(doc(db, kind, 'draft'), { status: 'draft' }),
      ]),
    ]);
    for (const path of [activeImage, inactiveImage, unlistedFile, privateImage, unpublishedImage, missingProductImage, legacyProductImage]) {
      await uploadBytes(ref(context.storage(), path), jpeg, jpegMetadata);
    }
  });
});
after(async () => { await environment?.cleanup(); });

test('public product data excludes private fields at each level and remains unpurchasable', () => {
  assert.equal(published.supplierPhone, undefined);
  assert.equal(published.costUGX, undefined);
  assert.deepEqual(published.measurements, [{ label: 'Waist', cm: 81 }]);
  assert.equal(published.photos[0].sourcePath, undefined);
  assert.equal(published.photos[0].mediumUrl, '/media/products/published/first/front-640.webp');
  assert.equal(published.share.imageUrl, '/media/products/published/first/share.jpg');
  assert.equal(published.isRealCatalogueStock, false);
  assert.equal(published.purchasable, false);
});

test('public reads allow published and sold pieces and deny draft and archived projections for every role', async () => {
  for (const context of Object.values(roles)) {
    const db = context.firestore();
    assert.equal((await assertSucceeds(getDoc(doc(db, 'products/sold')))).data().availability, 'sold');
    await assertSucceeds(getDoc(doc(db, 'products/published')));
    await assertFails(getDoc(doc(db, 'products/draft')));
    await assertFails(getDoc(doc(db, 'products/archived')));
  }
});

test('shop queries require published status and a bounded page; filtered cursors work', async () => {
  const products = collection(roles.guest.firestore(), 'products');
  const publishedOnly = where('status', '==', 'published');
  await assertFails(getDocs(query(products, limit(12))));
  await assertFails(getDocs(query(products, publishedOnly)));
  await assertFails(getDocs(query(products, publishedOnly, limit(25))));

  const filters = [
    publishedOnly, where('categoryId', '==', 'denim'),
    where('sizeKeys', 'array-contains', 'waist-32'), orderBy('publishedAt', 'desc'),
  ];
  const first = await assertSucceeds(getDocs(query(products, ...filters, limit(1))));
  assert.equal(first.docs[0].id, 'requested');
  const second = await assertSucceeds(getDocs(query(products, ...filters, startAfter(first.docs[0]), limit(1))));
  assert.equal(second.docs[0].id, 'sold');
  const archive = await assertSucceeds(getDocs(query(products, publishedOnly, where('availability', '==', 'sold'), orderBy('priceUGX', 'asc'), limit(12))));
  assert.deepEqual(archive.docs.map(row => row.id), ['sold']);
});

test('only catalogue claims read drafts and stock, and only the owner reads audit records', async () => {
  for (const [role, context] of Object.entries(roles)) {
    const db = context.firestore();
    const catalogue = ['staff', 'owner'].includes(role) ? assertSucceeds : assertFails;
    await catalogue(getDoc(doc(db, 'productDrafts/published')));
    await catalogue(getDocs(collection(db, 'productDrafts')));
    await catalogue(getDoc(doc(db, 'inventory/published')));
    await assertFails(getDocs(collection(db, 'inventory')));
    await (role === 'owner' ? assertSucceeds : assertFails)(getDoc(doc(db, 'auditLogs/first')));
    await assertFails(getDoc(doc(db, 'orders/private')));
  }
});

test('no client role can publish, mutate drafts/stock/audit/settings or elevate itself', async () => {
  for (const context of Object.values(roles)) {
    const db = context.firestore();
    await assertFails(setDoc(doc(db, 'products/new-piece'), published));
    await assertFails(updateDoc(doc(db, 'products/published'), { priceUGX: 1 }));
    await assertFails(deleteDoc(doc(db, 'products/published')));
    await assertFails(updateDoc(doc(db, 'productDrafts/published'), { priceUGX: 1 }));
    await assertFails(updateDoc(doc(db, 'inventory/published'), { availableUnits: 99 }));
    await assertFails(setDoc(doc(db, 'auditLogs/forged'), { operation: 'publish' }));
    await assertFails(updateDoc(doc(db, 'catalogueSettings/categories'), { items: [] }));
    await assertFails(updateDoc(doc(db, 'orders/private'), { paymentStatus: 'paid' }));
    await assertFails(setDoc(doc(db, 'users/customer'), { owner: true }));
  }
});

test('categories and existing published content are public, with other settings private', async () => {
  const db = roles.guest.firestore();
  const result = await assertSucceeds(getDoc(doc(db, 'catalogueSettings/categories')));
  assert.ok(result.data().illustrative);
  assert.ok(result.data().items.every(item => item.active && item.id && item.label));
  await assertFails(getDocs(collection(db, 'catalogueSettings')));
  const sizes = collection(db, 'catalogueSizes');
  await assertFails(getDocs(sizes));
  await assertFails(getDocs(query(sizes, limit(25))));
  assert.deepEqual((await assertSucceeds(getDocs(query(sizes, limit(24))))).docs.map(row => row.data()), [{ label: 'Waist 32' }]);
  await assertFails(getDoc(doc(db, 'catalogueSizeCounts/waist-32')));
  await assertFails(updateDoc(doc(roles.staff.firestore(), 'catalogueSizes/waist-32'), { label: 'Forged size' }));
  await assertFails(getDoc(doc(db, 'catalogueSettings/internal')));
  await assertFails(getDoc(doc(db, 'contentDrafts/collections--published')));
  await assertSucceeds(getDoc(doc(roles.staff.firestore(), 'contentDrafts/collections--published')));
  await assertFails(updateDoc(doc(roles.staff.firestore(), 'contentDrafts/collections--published'), { title: 'Untrusted draft update' }));
  for (const kind of ['collections', 'events', 'lookbooks', 'pages']) {
    await assertSucceeds(getDoc(doc(db, kind, 'published')));
    await assertFails(getDoc(doc(db, kind, 'draft')));
    const rows = collection(db, kind);
    const published = where('status', '==', 'published');
    await assertFails(getDocs(query(rows, published)));
    await assertFails(getDocs(query(rows, published, limit(25))));
    await assertFails(getDocs(query(rows, limit(12))));
    assert.deepEqual((await assertSucceeds(getDocs(query(rows, published, limit(12))))).docs.map(row => row.id), ['published']);
    await assertFails(updateDoc(doc(roles.staff.firestore(), kind, 'published'), { title: 'Untrusted update' }));
  }
});

test('staff and owners can create bounded JPEG/WebP uploads only within their own existing draft paths', async () => {
  const staff = roles.staff.storage();
  const owner = roles.owner.storage();
  await assertSucceeds(uploadBytes(ref(staff, 'product-drafts/published/staff/back.webp'), jpeg, { contentType: 'image/webp' }));
  await assertSucceeds(uploadBytes(ref(owner, 'product-drafts/published/owner-account/edge.jpg'), new Uint8Array(2 * 1024 * 1024), jpegMetadata));
  await assertFails(uploadBytes(ref(staff, 'product-drafts/published/owner-account/wrong.jpg'), jpeg, jpegMetadata));
  await assertFails(uploadBytes(ref(staff, 'product-drafts/nonexistent/staff/wrong.jpg'), jpeg, jpegMetadata));
  await assertFails(uploadBytes(ref(staff, 'product-drafts/published/staff/oversize.jpg'), new Uint8Array(2 * 1024 * 1024 + 1), jpegMetadata));
  await assertFails(uploadBytes(ref(staff, 'product-drafts/published/staff/empty.jpg'), new Uint8Array(), jpegMetadata));
  await assertFails(uploadBytes(ref(staff, 'product-drafts/published/staff/mismatch.webp'), jpeg, jpegMetadata));
  await assertFails(uploadBytes(ref(staff, 'product-drafts/published/staff/vector.svg'), jpeg, { contentType: 'image/svg+xml' }));
  await assertFails(uploadBytes(ref(staff, 'product-drafts/published/staff/custom.jpg'), jpeg, { ...jpegMetadata, customMetadata: { marker: 'untrusted' } }));
});

test('draft media stays private and clients cannot overwrite, delete or publish objects', async () => {
  for (const [role, context] of Object.entries(roles)) {
    const storage = context.storage();
    const staff = ['staff', 'owner'].includes(role);
    await (staff ? assertSucceeds : assertFails)(getBytes(ref(storage, privateImage)));
    if (!staff) {
      const uid = role === 'malformedClaim' ? 'wrong-claim' : role;
      await assertFails(uploadBytes(ref(storage, `product-drafts/published/${uid}/new.jpg`), jpeg, jpegMetadata));
    }
    await assertFails(uploadBytes(ref(storage, privateImage), jpeg, jpegMetadata));
    await assertFails(deleteObject(ref(storage, privateImage)));
    await assertFails(updateMetadata(ref(storage, privateImage), { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(storage, 'product-media/published/first/client.jpg'), jpeg, jpegMetadata));
    await assertFails(listAll(ref(storage, 'product-drafts/published')));
  }
});

test('public object reads follow the published revision and stop on unpublish', async () => {
  const storage = roles.guest.storage();
  const image = async path => getBytes(ref(storage, path));
  await assertSucceeds(image(activeImage));
  await assertFails(image(inactiveImage));
  await assertFails(image(unlistedFile));
  await assertFails(image(unpublishedImage));
  await assertFails(image(missingProductImage));
  await assertFails(image(legacyProductImage));
  await assertFails(listAll(ref(storage, 'product-media/published')));

  const update = changes => environment.withSecurityRulesDisabled(context =>
    updateDoc(doc(context.firestore(), 'products/published'), changes));
  await update({ mediaRevision: 'next' });
  await assertFails(image(activeImage));
  await assertSucceeds(image(inactiveImage));
  await update({ status: 'draft' });
  await assertFails(image(inactiveImage));
});
