import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { JSDOM } from 'jsdom';
import { PREVIEW_CACHE_SECONDS } from '../functions/shared-links.js';

if (process.env.GCLOUD_PROJECT !== 'demo-night-in-kampala' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('HTTP tests require the explicit demo project and loopback Firestore.');
const origin = 'http://127.0.0.1:5500';
const fixture = JSON.parse(await readFile('fixtures/emulator-data.json', 'utf8'));
assert.equal(fixture.projectId, 'demo-night-in-kampala');
const kinds = ['products', 'collections', 'events', 'lookbooks'];
const app = initializeApp({ projectId: fixture.projectId }, 'shared-link-http-tests');
const db = getFirestore(app);
const created = [];
const publicData = kind => kind === 'products' ? fixture.products['fixture-published'] : { ...fixture.content[kind], status: 'published' };
async function write(kind, slug, data) {
  const reference = db.doc(`${kind}/${slug}`);
  if (!created.some(item => item.path === reference.path)) created.push(reference);
  await reference.set(data);
}
async function request(path, options) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(20_000), ...options });
  const body = await response.text();
  return { response, body, html: new JSDOM(body).window.document };
}
before(async () => {
  for (const kind of kinds) {
    await write(kind, 'http-fixture-published', publicData(kind));
    await write(kind, 'http-fixture-draft', { ...publicData(kind), status: 'draft', name: 'PRIVATE_DRAFT', title: 'PRIVATE_DRAFT' });
  }
});
after(async () => {
  await Promise.all(created.map(reference => reference.delete()));
  await deleteApp(app);
});

for (const kind of kinds) {
  test(`Hosting rewrites ${kind} details to raw per-item HTML with a reachable image`, async () => {
    const data = publicData(kind);
    const { response, html } = await request(`/${kind}/http-fixture-published?utm_source=test`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(response.headers.get('cache-control'), /s-maxage=60/);
    assert.equal(html.title, `${data.name || data.title} — Night in Kampala`);
    assert.equal(html.querySelector('meta[name="description"]').content, data.share.description);
    assert.equal(html.querySelector('link[rel="canonical"]').href, `${origin}/${kind}/http-fixture-published`);
    const image = html.querySelector('meta[property="og:image"]').content;
    assert.equal(image, `${origin}${data.share.imageUrl}`);
    const photo = await fetch(image);
    assert.equal(photo.status, 200);
    assert.match(photo.headers.get('content-type'), /image\/webp/);
    const bytes = Buffer.from(await photo.arrayBuffer());
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  });
}
test('all four unpublished and missing detail URLs return safe uncached HTTP 404s', async () => {
  for (const kind of kinds) for (const slug of ['http-fixture-draft', 'http-fixture-missing']) {
    const { response, body, html } = await request(`/${kind}/${slug}`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(html.querySelector('meta[name="nik:status"]').content, '404');
    assert.ok(!body.includes('PRIVATE_DRAFT'));
    assert.equal(html.querySelector('meta[property="og:image"]'), null);
  }
});
test('sold published product remains shareable', async () => {
  await write('products', 'http-fixture-sold', fixture.products['fixture-sold']);
  const { response, html } = await request('/products/http-fixture-sold');
  assert.equal(response.status, 200);
  assert.equal(html.title, 'Sold illustrative piece — Night in Kampala');
});
test('HTTP metadata is escaped and cannot inject an executable script', async () => {
  const attack = `</title><script>alert("fixture")</script> & 'quoted'`;
  await write('products', 'http-fixture-escaped', { ...publicData('products'), name: attack, share: { ...publicData('products').share, description: attack } });
  const { html } = await request('/products/http-fixture-escaped');
  assert.equal(html.title, `${attack} — Night in Kampala`);
  assert.equal(html.querySelector('meta[name="description"]').content, attack);
  assert.equal(html.querySelectorAll('script').length, 1);
  assert.ok(html.querySelector('script[src^="/assets/"]'));
});
test('built scripts, styles and fonts remain reachable from a nested detail URL', async () => {
  const { html } = await request('/products/http-fixture-published');
  const built = await readFile('dist/index.html', 'utf8');
  const packaged = await readFile('functions/generated/index.html', 'utf8');
  assert.equal(packaged, built);
  const files = [...html.querySelectorAll('script[src],link[rel="stylesheet"],link[rel="preload"]')];
  assert.ok(files.length >= 4);
  for (const element of files) {
    const path = element.getAttribute('src') || element.getAttribute('href');
    assert.ok(path.startsWith('/'));
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200);
    assert.ok(!response.headers.get('content-type').includes('text/html'));
    if (path.startsWith('/assets/')) assert.match(response.headers.get('cache-control'), /max-age=31536000, immutable/);
  }
});
test('listing and ordinary SPA routes stay static; malformed detail paths do not bypass the function', async () => {
  for (const path of ['/shop', '/collections', '/events', '/lookbooks', '/about', '/help/shipping']) {
    const { response, html } = await request(path);
    assert.equal(response.status, 200);
    assert.equal(html.querySelector('meta[name="nik:route"]'), null);
    assert.ok(html.querySelector('#root'));
    assert.match(response.headers.get('cache-control'), /no-cache/);
  }
  assert.equal((await request('/products/http-fixture-published/extra')).response.status, 404);
});
test('HEAD returns headers with no body, and POST cannot mutate through a preview route', async () => {
  const head = await request('/products/http-fixture-published', { method: 'HEAD' });
  assert.equal(head.response.status, 200);
  assert.equal(head.body, '');
  const post = await request('/products/http-fixture-published', { method: 'POST' });
  assert.equal(post.response.status, 405);
  assert.equal(post.response.headers.get('allow'), 'GET, HEAD');
});
test('origin reflects metadata edits, unpublish and republish without process restart', async () => {
  const path = '/products/http-fixture-refresh';
  const original = publicData('products');
  await write('products', 'http-fixture-refresh', original);
  assert.equal((await request(path)).html.title, `${original.name} — Night in Kampala`);
  await write('products', 'http-fixture-refresh', { ...original, name: 'Updated illustrative denim' });
  const updated = await request(path);
  assert.equal(updated.html.title, 'Updated illustrative denim — Night in Kampala');
  assert.match(updated.response.headers.get('cache-control'), new RegExp(`s-maxage=${PREVIEW_CACHE_SECONDS}`));
  await write('products', 'http-fixture-refresh', { ...original, status: 'draft' });
  const unpublished = await request(path);
  assert.equal(unpublished.response.status, 404);
  assert.equal(unpublished.response.headers.get('cache-control'), 'no-store');
  await write('products', 'http-fixture-refresh', original);
  assert.equal((await request(path)).response.status, 200);
  // The local emulator has no production CDN. A live edge expiry check belongs
  // to P1.14; these assertions verify origin freshness and the TTL it declares.
});
