import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { configuredOrigin, createSharedLinkHandler, DEFAULT_SHARE_IMAGE, HEAD_START, HEAD_END, parseDetailPath } from '../shared-links.js';

const template = `<!doctype html><html><head>${HEAD_START}<title>Default</title><meta name="description" content="Default" />${HEAD_END}<script type="module" src="/assets/app-hash.js"></script></head><body><div id="root"></div></body></html>`;
const share = { description: 'An illustrative reworked piece. AI-generated placeholder.', imageUrl: '/assets/placeholder.webp', imageAlt: 'Illustrative garment' };
const document = { name: 'Illustrative denim', title: 'Illustrative story', status: 'published', share, privateNote: 'NEVER_RENDER_THIS' };
function handler(data = document, options = {}) {
  return createSharedLinkHandler({ origin: 'https://example.test', template, readDocument: async () => data, reportError: () => {}, ...options });
}
function head(result) { return new JSDOM(result.body).window.document; }

for (const collection of ['products', 'collections', 'events', 'lookbooks']) {
  test(`${collection}: raw HTML contains item metadata and the unchanged app bootstrap`, async () => {
    let lookup;
    const result = await handler(document, { readDocument: async (...args) => { lookup = args; return document; } })({ url: `/${collection}/fixture-published/?utm_source=share`, headers: { host: 'evil.test' } });
    const html = head(result);
    assert.equal(result.status, 200);
    assert.deepEqual(lookup, [collection, 'fixture-published']);
    assert.equal(html.title, `${collection === 'products' ? document.name : document.title} — Night in Kampala`);
    assert.equal(html.querySelector('meta[name="description"]').content, share.description);
    assert.equal(html.querySelector('link[rel="canonical"]').href, `https://example.test/${collection}/fixture-published`);
    assert.equal(html.querySelector('meta[property="og:image"]').content, 'https://example.test/assets/placeholder.webp');
    assert.equal(html.querySelector('meta[property="og:title"]').content, html.title);
    assert.equal(html.querySelector('meta[property="og:url"]').content, `https://example.test/${collection}/fixture-published`);
    assert.equal(html.querySelectorAll('title').length, 1);
    assert.equal(html.querySelectorAll('meta[name="description"]').length, 1);
    assert.equal(html.querySelector('script').getAttribute('src'), '/assets/app-hash.js');
    assert.ok(html.querySelector('#root'));
    assert.ok(!result.body.includes(document.privateNote));
    assert.match(result.headers['Cache-Control'], /s-maxage=60/);
  });
}
test('all metadata is escaped and cannot inject HTML or script', async () => {
  const hostile = `</title><script>alert('x')</script> & " onload="oops"`;
  const result = await handler({ ...document, name: hostile, share: { ...share, description: hostile, imageAlt: hostile, imageUrl: 'https://images.example.test/p.webp?a=1&b="x"' } })({ url: '/products/fixture' });
  const html = head(result);
  assert.equal(html.title, `${hostile} — Night in Kampala`);
  assert.equal(html.querySelector('meta[name="description"]').content, hostile);
  assert.equal(html.querySelector('meta[property="og:image:alt"]').content, hostile);
  assert.equal(html.querySelectorAll('script').length, 1);
  assert.equal(html.querySelectorAll('[onload]').length, 0);
  assert.match(result.body, /&lt;script&gt;/);
});
test('sold published pieces retain their share pages', async () => {
  assert.equal((await handler({ ...document, availability: 'sold' })({ url: '/products/sold-piece' })).status, 200);
});
test('missing, draft and archived records are indistinguishable 404s without leaked fields', async () => {
  const bodies = [];
  for (const data of [null, { ...document, status: 'draft' }, { ...document, status: 'archived' }]) {
    const result = await handler(data)({ url: '/events/fixture' });
    assert.equal(result.status, 404);
    assert.equal(result.headers['Cache-Control'], 'no-store');
    assert.ok(!result.body.includes(document.title));
    assert.ok(!head(result).querySelector('[property="og:image"]'));
    bodies.push(result.body);
  }
  assert.equal(new Set(bodies).size, 1);
});
test('invalid paths never read Firestore; queries and optional trailing slash canonicalize', async () => {
  const render = handler(document, { readDocument: async () => assert.fail('Unexpected read') });
  for (const path of ['/orders/private', '/products/a/b', '/products/%2Fsecret', '/products/../private', '/products/%ZZ', '/products/UPPER', `/products/${'a'.repeat(121)}`, '/products/a%00']) {
    assert.equal(parseDetailPath(path), null);
    const result = await render({ url: path });
    assert.equal(result.status, 404);
    assert.equal(head(result).querySelector('meta[name="nik:route"]').content, path);
  }
  assert.equal(parseDetailPath('/products/fixture/?q=anything').path, '/products/fixture');
});
test('origin is explicit and rejects untrusted origin forms', () => {
  for (const value of ['http://example.test', 'https://name:password@example.test', 'https://example.test/subpath', 'https://example.test?x=1', 'https://example.test#hash']) assert.throws(() => configuredOrigin(value));
  assert.throws(() => configuredOrigin('http://127.0.0.1:5500'));
  assert.equal(configuredOrigin('http://127.0.0.1:5500', { emulator: true }), 'http://127.0.0.1:5500');
});
test('unsafe and missing share images fall back safely without breaking published pages', async () => {
  for (const imageUrl of ['javascript:alert(1)', '//evil.test/image', '/\\evil.test/image', 'http://example.test/p.jpg', 'https://name:password@example.test/p.jpg', 'https://example.test/p.jpg#fragment', undefined]) {
    const result = await handler({ ...document, share: { ...share, imageUrl } })({ url: '/products/fixture' });
    assert.equal(result.status, 200);
    assert.equal(head(result).querySelector('meta[property="og:image"]').content, `https://example.test${DEFAULT_SHARE_IMAGE}`);
    assert.equal(head(result).title, `${document.name} — Night in Kampala`);
  }
});
test('missing or invalid optional share text falls back to the public name', async () => {
  for (const share of [undefined, {}, { description: '', imageAlt: null }, { description: 'x'.repeat(501) }]) {
    const result = await handler({ ...document, share })({ url: '/products/fixture' });
    const html = head(result);
    assert.equal(result.status, 200);
    assert.equal(html.title, `${document.name} — Night in Kampala`);
    assert.match(html.querySelector('meta[name="description"]').content, /Illustrative denim/);
    assert.ok(html.querySelector('#root'));
  }
});
test('Firestore failures are a safe 503, not a cached 404', async () => {
  const result = await handler(null, { readDocument: async () => { throw new Error('PRIVATE_DETAIL'); } })({ url: '/products/fixture' });
  assert.equal(result.status, 503);
  assert.ok(!result.body.includes('PRIVATE_DETAIL'));
});
test('GET and HEAD share metadata; writes are rejected without a read', async () => {
  const render = handler();
  assert.deepEqual(await render({ url: '/products/fixture', method: 'HEAD' }), await render({ url: '/products/fixture', method: 'GET' }));
  assert.equal((await handler(null, { readDocument: () => assert.fail('Unexpected read') })({ url: '/products/fixture', method: 'POST' })).status, 405);
});
test('template integration fails visibly if the required head markers are absent', async () => {
  await assert.rejects(handler(document, { template: '<html></html>' })({ url: '/products/fixture' }), /markers/);
});
