import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const projectId = 'demo-night-in-kampala-cleanup';
const project = ['--project', projectId];
const confirmation = ['--execute', '--confirm', `DELETE TEST DATA FOR ${projectId}`];
const reportFile = new URL(`../.cache/launch-cleanup-${projectId}.json`, import.meta.url);
const run = (args, env = process.env) => spawnSync(process.execPath, ['scripts/launch-cleanup.mjs', ...args], {
  encoding: 'utf8', env, timeout: 20000,
});
const report = async () => JSON.parse(await readFile(reportFile, 'utf8'));

test('cleanup rejects an implicit cloud target, mixed endpoints and an unconfirmed execution', () => {
  const cleanEnv = { PATH: process.env.PATH, GCLOUD_PROJECT: 'night-in-kampala' };
  const implicit = run([], cleanEnv);
  assert.equal(implicit.status, 1);
  assert.match(implicit.stderr, /explicit --project/);
  const mixed = run(['--project', 'night-in-kampala'], { ...cleanEnv, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' });
  assert.equal(mixed.status, 1);
  assert.match(mixed.stderr, /all three approved loopback endpoints/);
  const wrongTarget = run(['--project', 'night-in-kampala'], process.env);
  assert.equal(wrongTarget.status, 1);
  assert.match(wrongTarget.stderr, /project does not match/);
  const unconfirmed = run([...project, '--execute', '--confirm', 'DELETE']);
  assert.equal(unconfirmed.status, 1);
  assert.match(unconfirmed.stderr, /requires --confirm/);
});

test('cleanup lists test data, blocks mixed stock, deletes reviewed candidates and preserves genuine records', async () => {
  assert.equal(process.env.GCLOUD_PROJECT, projectId);
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
  assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, '127.0.0.1:9199');
  const app = initializeApp({ projectId });
  const db = getFirestore(app);
  const auth = getAuth(app);
  const bucket = getStorage(app).bucket(`${projectId}.appspot.com`);
  const disposable = {
    'products/test-denim': { isTestData: true, isRealCatalogueStock: true, requestableSizes: [{ id: 'l' }] },
    'productDrafts/test-denim': { isTestData: true },
    'productDrafts/unpublished': { revision: 1, isTestData: true },
    'productPhotoSources/unpublished/photos/source': {},
    'contentDrafts/events--unpublished-test': { isTestData: true, collection: 'events', slug: 'unpublished-test' },
    'products/old-placeholder': { isRealCatalogueStock: false },
    'inventory/test-denim': { availableUnits: 1 },
    'orders/test-order': { isTestData: true, phoneKey: 'test-phone', items: [{ slug: 'test-denim', isRealCatalogueStock: true }] },
    'orders/old-order': { items: [{ slug: 'old-placeholder' }] },
    'orderQueue/test-order': { isTestData: true },
    'orderQueue/old-order': {},
    'orderRequests/test-denim/requests/test-order': {},
    'productPhotoSources/test-denim/photos/test-source': {},
    'orderPhones/test-phone': { open: 1 },
    'orderPhoneBlocks/test-phone': { orderId: 'test-order' },
    'manualSales/test-sale': { slug: 'test-denim' },
    'auditLogs/test-audit': { productId: 'test-denim' },
    'events/test-event': { isTestData: true, illustrative: false },
    'contentDrafts/events--test-event': { collection: 'events', slug: 'test-event' },
    'catalogueSizes/l': { label: 'L' },
    'catalogueSizeCounts/l': { count: 1 },
  };
  const retained = {
    'products/real-piece': { isRealCatalogueStock: true, requestableSizes: [{ id: 'm' }] },
    'productDrafts/real-piece': { isRealCatalogueStock: false },
    'productDrafts/unpublished-real': { revision: 1, isRealCatalogueStock: false },
    'productPhotoSources/unpublished-real/photos/source': {},
    'contentDrafts/events--unpublished-real': { collection: 'events', slug: 'unpublished-real', revision: 1 },
    'inventory/real-piece': { availableUnits: 1 },
    'orders/real-order': { phoneKey: 'real-phone', items: [{ slug: 'real-piece', isRealCatalogueStock: true }] },
    'orderPhones/real-phone': { open: 1 },
    'orderSources/shared-source': { timestamps: [0] },
    'catalogueSizes/m': { label: 'M' },
    'catalogueSizeCounts/m': { count: 1 },
    'orderSettings/config': { overdueHours: 24 },
  };
  const disposableMedia = [
    'product-drafts/test-denim/staff/image.jpg', 'product-processed/test-denim/staff/image/share.jpg',
    'product-media/test-denim/revision/share.jpg', 'product-drafts/unpublished/staff/image.jpg',
    'product-processed/marked-orphan/staff/image/share.jpg',
  ];
  const retainedMedia = ['product-drafts/real-piece/staff/image.jpg', 'brand/logo.jpg',
    'product-drafts/unpublished-real/staff/image.jpg', 'product-processed/orphan/staff/image/share.jpg'];

  try {
    const batch = db.batch();
    for (const [name, value] of Object.entries({ ...disposable, ...retained })) batch.set(db.doc(name), value);
    await batch.commit();
    await auth.createUser({ uid: 'test-staff' });
    await auth.setCustomUserClaims('test-staff', { staff: true, testAccount: true });
    await auth.createUser({ uid: 'permanent-staff' });
    await auth.setCustomUserClaims('permanent-staff', { staff: true });
    await auth.createUser({ uid: 'permanent-owner', email: 'superadmin@nightinkampala.com' });
    await auth.setCustomUserClaims('permanent-owner', { owner: true });
    await Promise.all([...disposableMedia, ...retainedMedia].map(name => bucket.file(name).save('image', { resumable: false,
      metadata: name.includes('/marked-orphan/') ? { metadata: { nikTestData: 'true' } } : {} })));

    const dry = run(project);
    assert.equal(dry.status, 0, dry.stderr);
    const listed = await report();
    assert.equal(listed.mode, 'dry-run');
    assert.deepEqual(listed.firestore, Object.keys(disposable).sort());
    assert.deepEqual(listed.auth, ['test-staff']);
    assert.deepEqual(listed.storage, [...disposableMedia].sort());
    assert.deepEqual(listed.blockers, []);
    assert.deepEqual(listed.keptUnpublished.firestore, ['contentDrafts/events--unpublished-real',
      'productDrafts/unpublished-real', 'productPhotoSources/unpublished-real/photos/source']);
    assert.deepEqual(listed.keptUnpublished.storage, ['product-drafts/unpublished-real/staff/image.jpg',
      'product-processed/orphan/staff/image/share.jpg']);
    assert.equal((await db.doc('orders/test-order').get()).exists, true);
    assert.equal((await bucket.file(disposableMedia[0]).exists())[0], true);
    assert.equal((await auth.getUser('test-staff')).uid, 'test-staff');

    const mixed = db.doc('orders/mixed-order');
    await mixed.set({ isTestData: true, items: [{ slug: 'real-piece', isRealCatalogueStock: true }] });
    const blocked = run([...project, ...confirmation]);
    assert.equal(blocked.status, 1);
    assert.match(blocked.stderr, /Resolve every reported blocker/);
    assert.match((await report()).blockers.join(' '), /retained stock/);
    assert.equal((await db.doc('orders/test-order').get()).exists, true);
    assert.equal((await bucket.file(disposableMedia[0]).exists())[0], true);
    await mixed.delete();

    const execute = run([...project, ...confirmation]);
    assert.equal(execute.status, 0, execute.stderr);
    const removed = await db.getAll(...Object.keys(disposable).map(name => db.doc(name)));
    assert.ok(removed.every(row => !row.exists));
    const kept = await db.getAll(...Object.keys(retained).map(name => db.doc(name)));
    assert.ok(kept.every(row => row.exists));
    for (const name of disposableMedia) assert.equal((await bucket.file(name).exists())[0], false);
    for (const name of retainedMedia) assert.equal((await bucket.file(name).exists())[0], true);
    await assert.rejects(auth.getUser('test-staff'), { code: 'auth/user-not-found' });
    assert.equal((await auth.getUser('permanent-staff')).uid, 'permanent-staff');
    assert.deepEqual((await auth.getUserByEmail('superadmin@nightinkampala.com')).customClaims, { owner: true });

    const after = run(project);
    assert.equal(after.status, 0, after.stderr);
    assert.deepEqual((await report()).keptUnpublished, listed.keptUnpublished);
    for (const key of ['firestore', 'auth', 'storage', 'blockers']) assert.deepEqual((await report())[key], []);
  } finally {
    await deleteApp(app);
  }
});

test('cleanup retains photographed unapproved stock and blocks ambiguous historical preview markers', async () => {
  assert.equal(process.env.GCLOUD_PROJECT, projectId);
  const app = initializeApp({ projectId }, 'photographed-draft-cleanup');
  const db = getFirestore(app), bucket = getStorage(app).bucket(`${projectId}.appspot.com`);
  const rows = {
    'productDrafts/new-real-work': { revision: 1, photos: [{ kind: 'photograph' }] },
    'productDrafts/real-unapproved': { revision: 1, photos: [{ kind: 'photograph' }] },
    'products/real-unapproved': { status: 'published', isRealCatalogueStock: false },
    'inventory/real-unapproved': { availableUnits: 1 },
    'productDrafts/legacy-photo': { revision: 1, isTestData: true, photos: [{ kind: 'photograph' }] },
    'productPhotoSources/legacy-photo/photos/source': {},
  };
  const files = ['product-drafts/new-real-work/staff/photo.jpg', 'product-drafts/legacy-photo/staff/photo.jpg'];
  try {
    await Promise.all(Object.entries(rows).map(([name, value]) => db.doc(name).set(value)));
    await Promise.all(files.map(name => bucket.file(name).save('local fixture', { resumable: false })));
    const dry = run(project);
    assert.equal(dry.status, 0, dry.stderr);
    const inventory = await report();
    for (const name of Object.keys(rows)) {
      assert.ok(!inventory.firestore.includes(name), name);
      assert.ok(inventory.keptUnpublished.firestore.includes(name), name);
    }
    for (const name of files) assert.ok(inventory.keptUnpublished.storage.includes(name), name);
    assert.match(inventory.blockers.join(' '), /Photographed draft has a test marker/);
    assert.equal(run([...project, ...confirmation]).status, 1);
    assert.ok((await db.getAll(...Object.keys(rows).map(name => db.doc(name)))).every(row => row.exists));
  } finally {
    await Promise.all(Object.keys(rows).map(name => db.doc(name).delete()));
    await Promise.all(files.map(name => bucket.file(name).delete({ ignoreNotFound: true })));
    await deleteApp(app);
  }
});
