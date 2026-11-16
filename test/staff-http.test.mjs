import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp as initializeWebApp, deleteApp as deleteWebApp } from 'firebase/app';
import { connectAuthEmulator, getAuth as getWebAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, connectFirestoreEmulator, getDoc, getDocs, getFirestore as getWebFirestore, doc as webDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { connectStorageEmulator, getStorage as getWebStorage, ref, uploadBytes } from 'firebase/storage';
import sharp from 'sharp';

const project = 'demo-night-in-kampala';
if (process.env.GCLOUD_PROJECT !== project || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') {
  throw new Error('Staff tests require the Auth emulator on loopback.');
}

const authApi = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts';
const endpoint = `http://127.0.0.1:5001/${project}/us-central1/staffAccess`;
async function post(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data), signal: AbortSignal.timeout(20000) });
  return { status: response.status, body: await response.json() };
}

test('staff provisioning refuses cloud project IDs and non-loopback endpoints', () => {
  for (const args of [
    { project: 'night-in-kampala', endpoint: '127.0.0.1:9099' },
    { project, endpoint: 'invalid.example:9099' },
  ]) {
    const result = spawnSync(process.execPath, ['scripts/provision-demo-staff.mjs', args.project, 'staff'], {
      env: { ...process.env, FIREBASE_AUTH_EMULATOR_HOST: args.endpoint },
    });
    assert.equal(result.status, 1);
  }
});

test('password sign-in and refreshed claims gate callable staff access', async () => {
  const app = initializeApp({ projectId: project }, 'staff-rule-test');
  const users = [];
  try {
    assert.equal((await post(endpoint, { data: {} })).status, 401);
    for (const role of ['customer', 'staff', 'owner']) {
      const provision = spawnSync(process.execPath, ['scripts/provision-demo-staff.mjs', project, role], { encoding: 'utf8' });
      assert.equal(provision.status, 0);
      const { uid, email, password } = JSON.parse(provision.stdout);
      users.push(uid);
      const login = await post(`${authApi}:signInWithPassword?key=demo-key`, { email, password, returnSecureToken: true });
      assert.equal(login.status, 200);
      const access = await post(endpoint, { data: { role: 'owner' } }, login.body.idToken);
      assert.equal(access.status, role === 'customer' ? 403 : 200);
      if (role !== 'customer') assert.equal(access.body.result.role, role);
      if (role === 'staff') {
        await getAuth(app).setCustomUserClaims(uid, {});
        const refresh = await post('http://127.0.0.1:9099/securetoken.googleapis.com/v1/token?key=demo-key', {
          grant_type: 'refresh_token', refresh_token: login.body.refreshToken,
        });
        assert.equal(refresh.status, 200);
        assert.equal((await post(endpoint, { data: {} }, refresh.body.id_token)).status, 403);
      }
    }
  } finally {
    await Promise.all(users.map(uid => getAuth(app).deleteUser(uid)));
    await deleteApp(app);
  }
});

test('staff reopen saved drafts, concurrent edits are rejected and category IDs survive retirement', async () => {
  const app = initializeApp({ projectId: project }, 'catalogue-draft-test');
  const db = getFirestore(app);
  const auth = getAuth(app);
  const provision = spawnSync(process.execPath, ['scripts/provision-demo-staff.mjs', project, 'staff'], { encoding: 'utf8' });
  assert.equal(provision.status, 0);
  const { uid, email, password } = JSON.parse(provision.stdout);
  const login = await post(`${authApi}:signInWithPassword?key=demo-key`, { email, password, returnSecureToken: true });
  assert.equal(login.status, 200);
  const call = (name, data) => post(endpoint.replace(/staffAccess$/, name), { data }, login.body.idToken);
  const slug = 'draft-integration-test';
  const path = db.doc(`productDrafts/${slug}`);
  const categoryPath = db.doc('catalogueSettings/categories');
  const previousCategories = await categoryPath.get();
  const draft = {
    name: 'Illustrative test piece', itemCode: 'NK-DEMO', categoryId: 'demo-test', priceUGX: 85000,
    stockType: 'one-of-one', sizeLabel: 'Waist 32', measurements: [{ label: 'Waist', cm: 81 }],
    condition: '', reworkNotes: '', care: '', shareDescription: '', isRealCatalogueStock: true,
  };
  try {
    assert.equal((await call('catalogueCategorySave', { id: 'demo-test', label: 'Illustrative category', active: true, create: true })).status, 200);
    const saved = await call('catalogueDraftSave', { slug, revision: 0, draft });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.result.revision, 1);
    const reloaded = (await path.get()).data();
    assert.equal(reloaded.name, draft.name);
    assert.deepEqual(reloaded.measurements, draft.measurements);
    assert.equal(reloaded.isRealCatalogueStock, false);
    assert.equal((await call('catalogueDraftSave', { slug, revision: 0, draft })).status, 409);
    assert.equal((await call('catalogueDraftSave', { slug, revision: 1, draft: { ...draft, priceUGX: 0.5 } })).status, 400);
    assert.equal((await call('catalogueCategorySave', { id: 'demo-test', label: 'Renamed category', active: false })).status, 200);
    assert.equal((await path.get()).data().categoryId, 'demo-test');
    assert.deepEqual((await categoryPath.get()).data().items.find(item => item.id === 'demo-test'), { id: 'demo-test', label: 'Renamed category', active: false });
    assert.equal((await db.doc(`products/${slug}`).get()).exists, false);
  } finally {
    await path.delete();
    if (previousCategories.exists) await categoryPath.set(previousCategories.data());
    else await categoryPath.delete();
    await auth.deleteUser(uid);
    await deleteApp(app);
  }
});

test('photo processing and catalogue publication work through staff, Storage and Hosting', async () => {
  const app = initializeApp({ projectId: project }, 'catalogue-photo-test');
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket(`${project}.appspot.com`);
  const webApp = initializeWebApp({ apiKey: 'demo-key', projectId: project, storageBucket: bucket.name }, 'photo-uploads');
  const guestApp = initializeWebApp({ apiKey: 'demo-key', projectId: project }, 'guest-catalogue-test');
  const guest = getWebFirestore(guestApp);
  connectFirestoreEmulator(guest, '127.0.0.1', 8080);
  const archive = query(collection(guest, 'products'), where('status', '==', 'published'),
    where('availability', '==', 'sold'), orderBy('publishedAt', 'desc'), limit(13));
  const auth = getWebAuth(webApp);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const storage = getWebStorage(webApp);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  const provision = spawnSync(process.execPath, ['scripts/provision-demo-staff.mjs', project, 'staff'], { encoding: 'utf8' });
  assert.equal(provision.status, 0);
  const { uid, email, password } = JSON.parse(provision.stdout);
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const token = await user.getIdToken();
  const call = (name, data) => post(endpoint.replace(/staffAccess$/, name), { data }, token);
  const slug = 'photo-integration-test';
  const path = db.doc(`productDrafts/${slug}`);
  const categoryPath = db.doc('catalogueSettings/categories');
  const previousCategories = await categoryPath.get();
  const jpeg = await sharp({ create: { width: 1400, height: 800, channels: 3, background: 'gray' } }).jpeg().toBuffer();
  async function upload(id, bytes) {
    await uploadBytes(ref(storage, `product-drafts/${slug}/${uid}/${id}.jpg`), bytes, { contentType: 'image/jpeg' });
  }
  try {
    await path.set({ revision: 1 });
    await db.doc('catalogueSettings/categories').set({
      items: [{ id: 'photo-test', label: 'Illustrative photo test', active: true }],
    }, { merge: true });
    await upload('invalid', new Uint8Array([1, 2, 3]));
    assert.equal((await call('cataloguePhotoAdd', { slug, id: 'invalid', revision: 1, extension: 'jpg', alt: 'Invalid' })).status, 400);
    for (const [index, id] of ['front', 'back'].entries()) {
      await upload(id, jpeg);
      const photo = await call('cataloguePhotoAdd', { slug, id, revision: index + 1, extension: 'jpg', alt: id });
      assert.equal(photo.status, 200, JSON.stringify(photo.body.error));
      assert.equal(photo.body.result.revision, index + 2);
    }
    const [share] = await bucket.file(`product-processed/${slug}/${uid}/front/share.jpg`).download();
    const meta = await sharp(share).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ['jpeg', 1200, 630]);
    const [thumbnail] = await bucket.file(`product-processed/${slug}/${uid}/front/320.webp`).download();
    assert.equal((await sharp(thumbnail).metadata()).width, 320);
    const photos = [{ id: 'back', alt: 'Back view' }, { id: 'front', alt: 'Front view' }];
    assert.equal((await call('cataloguePhotosSave', { slug, revision: 3, photos })).status, 200);
    assert.deepEqual((await path.get()).data().photos.map(({ id, alt }) => ({ id, alt })), photos);
    const item = {
      name: 'Illustrative measured piece', itemCode: 'NK-DEMO-PHOTO', categoryId: 'photo-test', stockType: 'one-of-one',
      sizeLabel: 'Waist 32', priceUGX: 85000, measurements: [{ label: 'Waist', cm: 81 }],
      condition: 'Illustrative condition', reworkNotes: 'Illustrative rework', care: 'Illustrative care', shareDescription: 'Illustrative piece',
    };
    assert.equal((await call('cataloguePublish', { slug, revision: 4 })).body.error?.status, 'FAILED_PRECONDITION');
    assert.equal((await call('catalogueDraftSave', { slug, revision: 4, draft: item })).status, 200);
    const publish = await call('cataloguePublish', { slug, revision: 5 });
    assert.equal(publish.status, 200, JSON.stringify(publish.body.error));
    const publicRef = db.doc(`products/${slug}`);
    const firstPublic = (await publicRef.get()).data();
    const newest = query(collection(guest, 'products'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(4));
    assert.equal((await getDocs(newest)).docs[0].id, slug);
    const home = 'http://127.0.0.1:5500';
    const image = await fetch(home + firstPublic.share.imageUrl);
    assert.equal(image.status, 200);
    assert.match(image.headers.get('cache-control'), /max-age=31536000, immutable/);
    assert.match(image.headers.get('content-type'), /image\/jpeg/);
    assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).width, 1200);
    assert.equal((await fetch(home + firstPublic.share.imageUrl, { method: 'HEAD' })).status, 200);
    assert.equal((await fetch(home + firstPublic.share.imageUrl, { method: 'POST' })).status, 405);
    assert.equal((await call('catalogueAvailability', { slug, availability: 'sold' })).status, 200);
    assert.equal((await publicRef.get()).data().availability, 'sold');
    assert.ok((await getDocs(archive)).docs.some(doc => doc.id === slug));
    assert.equal((await fetch(`${home}/products/${slug}`)).status, 200);
    const audit = await db.collection('auditLogs').where('productId', '==', slug).get();
    assert.ok(audit.docs.some(doc => doc.data().action === 'change-availability' && doc.data().actorUid === uid));

    const edited = { ...item, name: 'Illustrative edited piece', priceUGX: 160000 };
    assert.equal((await call('catalogueDraftSave', { slug, revision: 5, draft: edited })).status, 200);
    assert.equal((await call('cataloguePhotosSave', { slug, revision: 6, photos: photos.toReversed() })).status, 200);
    assert.equal((await call('cataloguePublish', { slug, revision: 7 })).status, 200);
    const current = (await publicRef.get()).data();
    assert.equal(current.priceUGX, 160000);
    assert.equal(current.availability, 'sold');
    assert.notEqual(current.share.imageUrl, firstPublic.share.imageUrl);
    assert.equal(current.share.imageAlt, 'Front view');
    const html = await fetch(`${home}/products/${slug}`);
    assert.match(await html.text(), /Illustrative edited piece/);
    assert.equal((await fetch(home + firstPublic.share.imageUrl)).status, 404);

    const dropSlug = 'photo-test-drop';
    const dropPath = `${home}/collections/${dropSlug}`;
    const draftDrop = (productIds, revision) => ({
      collection: 'collections', slug: dropSlug, revision,
      draft: { title: 'Illustrative test drop', body: 'A synthetic collection', productIds, coverProductId: slug, privateNote: 'Do not project' },
    });
    const publishDrop = revision => call('editorialPublish', { collection: 'collections', slug: dropSlug, revision });
    assert.equal((await post(endpoint.replace(/staffAccess$/, 'editorialDraftSave'), { data: draftDrop([slug], 0) })).status, 401);
    assert.equal((await call('editorialDraftSave', draftDrop([slug, 'missing'], 0))).status, 200);
    assert.equal((await fetch(dropPath)).status, 404);
    assert.equal((await publishDrop(1)).body.error?.status, 'FAILED_PRECONDITION');
    assert.equal((await call('editorialDraftSave', draftDrop([slug], 1))).status, 200);
    assert.equal((await publishDrop(2)).status, 200);
    const drop = (await db.doc(`collections/${dropSlug}`).get()).data();
    assert.deepEqual(drop.productIds, [slug]);
    assert.equal(drop.privateNote, undefined);
    assert.equal(drop.updatedBy, undefined);
    const dropHtml = await (await fetch(dropPath)).text();
    assert.ok(dropHtml.includes(current.share.imageUrl));
    assert.match(dropHtml, /Illustrative test drop/);

    const eventSlug = 'catalogue-event-test';
    const eventUrl = `${home}/events/${eventSlug}`;
    const eventDraft = (date, revision, season = 'upcoming') => ({
      collection: 'events', slug: eventSlug, revision,
      draft: { title: 'Illustrative fashion event', body: 'Development example', city: 'Kampala', date, venue: '', season },
    });
    assert.equal((await call('editorialDraftSave', eventDraft('2030-02-30', 0))).status, 400);
    assert.equal((await call('editorialDraftSave', eventDraft('', 0))).status, 200);
    assert.equal((await fetch(eventUrl)).status, 404);
    await assert.rejects(getDoc(webDoc(guest, 'events', eventSlug)), { code: 'permission-denied' });
    const publishEvent = revision => call('editorialPublish', { collection: 'events', slug: eventSlug, revision });
    assert.equal((await publishEvent(1)).status, 200);
    const event = (await getDoc(webDoc(guest, 'events', eventSlug))).data();
    assert.deepEqual([event.city, event.date, event.venue, event.illustrative], ['Kampala', '', '', true]);
    assert.match(await (await fetch(eventUrl)).text(), /Illustrative fashion event/);
    assert.equal((await call('editorialDraftSave', eventDraft('2030-02-03', 1, 'past'))).status, 200);
    assert.equal((await publishEvent(2)).status, 200);
    const past = query(collection(guest, 'events'), where('status', '==', 'published'), where('season', '==', 'past'), limit(13));
    assert.equal((await getDocs(past)).docs.find(doc => doc.id === eventSlug)?.data().date, '2030-02-03');

    for (const collection of ['lookbooks', 'pages']) {
      const editorialSlug = `editorial-test-${collection}`;
      const draft = { title: 'Illustrative editorial', body: 'Example copy', links: [{ label: 'Shop', href: '/shop' }], coverProductId: slug, privateNote: 'hidden' };
      const data = { collection, slug: editorialSlug, revision: 0, draft };
      const reference = webDoc(guest, collection, editorialSlug);
      assert.equal((await call('editorialDraftSave', { ...data, draft: { ...draft, links: [{ label: 'Invalid', href: '//example.test' }] } })).status, 400);
      assert.equal((await call('editorialDraftSave', data)).status, 200);
      await assert.rejects(getDoc(reference), { code: 'permission-denied' });
      assert.equal((await call('editorialPublish', { collection, slug: editorialSlug, revision: 1 })).status, 200);
      const editorial = (await getDoc(reference)).data();
      assert.deepEqual(editorial.links, draft.links);
      assert.equal(editorial.privateNote, undefined);
      if (collection === 'lookbooks') {
        const html = await (await fetch(`${home}/lookbooks/${editorialSlug}`)).text();
        assert.match(html, /Illustrative editorial/);
        assert.ok(html.includes(current.share.imageUrl));
      }
    }

    const inventory = db.doc(`inventory/${slug}`);
    await inventory.update({ reservedUnits: 1 });
    assert.equal((await call('catalogueAvailability', { slug, availability: 'available' })).body.error?.status, 'FAILED_PRECONDITION');
    await inventory.update({ reservedUnits: 0 });
    assert.equal((await call('catalogueAvailability', { slug, availability: 'available' })).status, 200);
    assert.equal((await publicRef.get()).data().availability, 'available');
    assert.ok(!(await getDocs(archive)).docs.some(doc => doc.id === slug));
    assert.equal((await call('catalogueWithdraw', { slug, status: 'draft' })).status, 200);
    const withdrawn = await fetch(home + current.share.imageUrl);
    assert.equal(withdrawn.status, 404);
    assert.match(withdrawn.headers.get('cache-control'), /no-store/);
    assert.equal((await fetch(`${home}/products/${slug}`)).status, 404);
    await assert.rejects(getDoc(webDoc(guest, 'products', slug)), { code: 'permission-denied' });
    assert.ok(!(await getDocs(newest)).docs.some(doc => doc.id === slug));
    assert.match(await (await fetch(dropPath)).text(), /\/share\/campaign\.jpg/);
  } finally {
    await bucket.deleteFiles({ prefix: `product-drafts/${slug}/` });
    await bucket.deleteFiles({ prefix: `product-processed/${slug}/` });
    await path.delete();
    await db.doc('contentDrafts/collections--photo-test-drop').delete();
    await db.doc('collections/photo-test-drop').delete();
    await db.doc('contentDrafts/events--catalogue-event-test').delete();
    await db.doc('events/catalogue-event-test').delete();
    for (const kind of ['lookbooks', 'pages']) {
      await db.doc(`contentDrafts/${kind}--editorial-test-${kind}`).delete();
      await db.doc(`${kind}/editorial-test-${kind}`).delete();
    }
    const contentAudit = await db.collection('auditLogs').where('slug', 'in', ['photo-test-drop', 'catalogue-event-test', 'editorial-test-lookbooks', 'editorial-test-pages']).get();
    await Promise.all(contentAudit.docs.map(doc => doc.ref.delete()));
    await db.doc(`products/${slug}`).delete();
    await db.doc(`inventory/${slug}`).delete();
    if (previousCategories.exists) await categoryPath.set(previousCategories.data());
    else await categoryPath.delete();
    const audit = await db.collection('auditLogs').where('productId', '==', slug).get();
    await Promise.all(audit.docs.map(doc => doc.ref.delete()));
    await bucket.deleteFiles({ prefix: `product-media/${slug}/` });
    await getAuth(app).deleteUser(uid);
    await deleteWebApp(webApp);
    await deleteWebApp(guestApp);
    await deleteApp(app);
  }
});
