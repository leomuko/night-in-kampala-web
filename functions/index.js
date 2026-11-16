import { onRequest, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createSharedLinkHandler } from './shared-links.js';
import { saveCategory, saveProductDraft } from './catalogue-drafts.js';
import { catalogueBucket } from './catalogue-bucket.js';
import { addDraftPhoto, updateDraftPhotos } from './catalogue-media.js';
import { publishCatalogueProduct, withdrawCatalogueProduct } from './catalogue-publish.js';
import { changeCatalogueAvailability } from './catalogue-stock.js';
import { catalogueMediaHandler } from './serve-catalogue-media.js';
import { saveEditorialDraft, publishEditorial } from './editorial.js';
import { approvePublication } from './publication-approval.js';
import { orderSource, submitOrder } from './order-submit.js';
import { changeOrderStock } from './order-stock.js';
import { updateOrderDesk } from './order-desk.js';
import { saveOrderSettings } from './order-settings.js';
import { staffCallable } from './staff-access.js';
import { resolveFunctionRuntime } from './runtime-config.js';

// Cloud startup requires a prepared, approved artifact and a matching project.
// No default cloud origin, region or project is inferred from request headers.
const deployment = process.env.FUNCTIONS_EMULATOR === 'true' ? undefined : JSON.parse(readFileSync(new URL('./generated/deployment.json', import.meta.url), 'utf8'));
const runtime = resolveFunctionRuntime(process.env, deployment);
const app = initializeApp({ projectId: runtime.projectId });
const db = getFirestore(app);
let handler;
async function loadHandler() {
  return createSharedLinkHandler({
    origin: runtime.origin,
    emulator: runtime.emulator,
    indexPublicPages: runtime.indexPublicPages === true,
    template: await readFile(new URL('./generated/index.html', import.meta.url), 'utf8'),
    readDocument: async (collection, slug) => {
      const document = (await db.collection(collection).doc(slug).get()).data();
      if (document?.status !== 'published' || !document.coverProductId) return document;
      const cover = (await db.collection('products').doc(document.coverProductId).get()).data();
      if (cover?.status !== 'published') return document;
      return { ...document, share: { ...document.share, imageUrl: cover.share?.imageUrl, imageAlt: cover.share?.imageAlt } };
    },
  });
}
export const renderSharedLink = onRequest({ region: runtime.region, timeoutSeconds: 15, maxInstances: 3 }, async (request, response) => {
  try {
    handler ??= loadHandler().catch(error => { handler = undefined; throw error; });
    const result = await (await handler)({ method: request.method, url: request.originalUrl });
    response.status(result.status).set(result.headers);
    response.end(request.method === 'HEAD' ? '' : result.body);
  } catch {
    console.error('Shared-link template unavailable. Run npm run build before starting emulators.');
    response.status(503).set('Cache-Control', 'no-store').type('text').send('Page temporarily unavailable.');
  }
});
export const localHealth = runtime.emulator ? onRequest((_request, response) => {
  response.set('Cache-Control', 'no-store').json({ local: true, project: 'demo-night-in-kampala' });
}) : undefined;

export const staffAccess = staffCallable(runtime, (_data, actor) => ({ role: actor.role }));
export const catalogueDraftSave = staffCallable(runtime, (data, actor) => saveProductDraft(db, data, actor));
export const catalogueCategorySave = staffCallable(runtime, data => saveCategory(db, data));
export const cataloguePhotoAdd = staffCallable(runtime, (data, actor) => addDraftPhoto(db, catalogueBucket(app, runtime), data, actor));
export const cataloguePhotosSave = staffCallable(runtime, (data, actor) => updateDraftPhotos(db, data, actor));
export const cataloguePublish = staffCallable(runtime, (data, actor) => publishCatalogueProduct(db, catalogueBucket(app, runtime), data, actor));
export const catalogueWithdraw = staffCallable(runtime, (data, actor) => withdrawCatalogueProduct(db, data, actor));
export const catalogueAvailability = staffCallable(runtime, (data, actor) => changeCatalogueAvailability(db, data, actor));
export const catalogueMedia = onRequest({ region: runtime.region, maxInstances: 3 }, catalogueMediaHandler(db, () => catalogueBucket(app, runtime)));
export const editorialDraftSave = staffCallable(runtime, (data, actor) => saveEditorialDraft(db, data, actor));
export const editorialPublish = staffCallable(runtime, (data, actor) => publishEditorial(db, data, actor));
export const publicationApproval = staffCallable(runtime, (data, actor) => approvePublication(db, data, actor));
export const orderSettingsSave = staffCallable(runtime, (data, actor) => saveOrderSettings(db, data, actor));

const orderIdentityKey = defineSecret('ORDER_IDENTITY_KEY');
export const orderCreate = onCall({
  region: runtime.region, maxInstances: 3, enforceAppCheck: !runtime.emulator,
  ...(runtime.emulator ? {} : { secrets: [orderIdentityKey] }),
}, request => {
  const source = orderSource(request, runtime, process.env.ORDER_TRUSTED_PROXY_HOPS);
  const key = runtime.emulator ? runtime.projectId : orderIdentityKey.value();
  return submitOrder(db, request.data, source, key);
});
export const orderDesk = staffCallable(runtime, (data, actor) => ['confirm', 'decline', 'release', 'cancel'].includes(data?.action)
  ? changeOrderStock(db, data, actor) : updateOrderDesk(db, data, actor));
