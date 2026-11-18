import { onRequest, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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
import { orderSource, privateOrderKey, submitOrder } from './order-submit.js';
import { recordManualSale } from './manual-sale.js';
import { markCatalogueSold, settleOrder } from './order-settlement.js';
import { changeOrderStock } from './order-stock.js';
import { updateOrderDesk } from './order-desk.js';
import { saveOrderSettings } from './order-settings.js';
import { authorizeStaff, staffCallable } from './staff-access.js';
import { catalogueUsesTestData, resolveFunctionRuntime } from './runtime-config.js';
import { inviteStaff, changeStaff, listStaff, staffSetupLink as createStaffSetupLink } from './team.js';
import { isLaunchContent } from './public-content.js';

// Cloud startup requires a prepared, approved artifact and a matching project.
// No default cloud origin, region or project is inferred from request headers.
const deployment = process.env.FUNCTIONS_EMULATOR === 'true' ? undefined : JSON.parse(readFileSync(new URL('./generated/deployment.json', import.meta.url), 'utf8'));
const runtime = resolveFunctionRuntime(process.env, deployment);
const previewData = runtime.emulator || runtime.target === 'preview';
const catalogueTestData = catalogueUsesTestData(runtime);
const app = initializeApp({ projectId: runtime.projectId });
const db = getFirestore(app);
const auth = getAuth(app);
const staff = (handler, options) => staffCallable(runtime, db, auth, handler, options);
let handler;
async function loadHandler() {
  return createSharedLinkHandler({
    origin: runtime.origin,
    emulator: runtime.emulator,
    launchCatalogueOnly: !runtime.emulator,
    indexPublicPages: runtime.indexPublicPages === true,
    template: await readFile(new URL('./generated/index.html', import.meta.url), 'utf8'),
    readDocument: async (collection, slug) => {
      const document = (await db.collection(collection).doc(slug).get()).data();
      if (document?.status !== 'published' || !document.coverProductId) return document;
      const cover = (await db.collection('products').doc(document.coverProductId).get()).data();
      if (cover?.status !== 'published' || (!runtime.emulator && !isLaunchContent('products', cover))) return document;
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
export const localHealth = runtime.emulator ? onRequest({ region: runtime.region }, (_request, response) => {
  response.set('Cache-Control', 'no-store').json({ local: true, project: 'demo-night-in-kampala' });
}) : undefined;

export const staffAccess = staff((_data, actor) => ({ role: actor.role }));
export const catalogueDraftSave = staff((data, actor) => saveProductDraft(db, data, actor, catalogueTestData));
export const catalogueCategorySave = staff(data => saveCategory(db, data));
export const cataloguePhotoAdd = staff((data, actor) => addDraftPhoto(db, catalogueBucket(app, runtime), data, actor));
export const cataloguePhotosSave = staff((data, actor) => updateDraftPhotos(db, data, actor));
export const cataloguePublish = staff((data, actor) => publishCatalogueProduct(db, catalogueBucket(app, runtime), data, actor, catalogueTestData));
export const catalogueWithdraw = staff((data, actor) => withdrawCatalogueProduct(db, data, actor));
export const catalogueAvailability = staff((data, actor) => changeCatalogueAvailability(db, data, actor));
export const catalogueMedia = onRequest({ region: runtime.region, maxInstances: 3 }, catalogueMediaHandler(db, () => catalogueBucket(app, runtime)));
export const editorialDraftSave = staff((data, actor) => saveEditorialDraft(db, data, actor, catalogueTestData));
export const editorialPublish = staff((data, actor) => publishEditorial(db, data, actor, catalogueTestData));
export const publicationApproval = staff((data, actor) => approvePublication(db, data, actor));
export const orderSettingsSave = staff((data, actor) => saveOrderSettings(db, data, actor));

const orderIdentityKey = defineSecret('ORDER_IDENTITY_KEY');
export const orderCreate = onCall({
  region: runtime.region, maxInstances: 3, enforceAppCheck: !runtime.emulator,
  ...(runtime.emulator ? {} : { secrets: [orderIdentityKey] }),
}, async request => {
  const previewCheck = runtime.target === 'preview' && request.data?.previewCheck === true;
  if (previewCheck) await authorizeStaff(db, auth, request, true);
  if (previewCheck && !request.data.items) return { previewAttestationVerified: Boolean(request.app) };
  const source = orderSource(request, runtime, runtime.order?.trustedProxyHops);
  const key = runtime.emulator ? runtime.projectId : orderIdentityKey.value();
  const result = await submitOrder(db, request.data, source, key, { previewData, testStockOnly: previewCheck });
  if (!previewCheck) return result;
  const sourceKey = privateOrderKey(key, 'source', source);
  const counters = (await db.doc(`orderSources/${sourceKey}`).get()).data();
  return { ...result, previewSource: { fingerprint: sourceKey.slice(0, 16), count: counters.timestamps.length } };
});
export const orderDesk = staff((data, actor) => {
  if (['confirm', 'decline', 'release', 'cancel', 'sell', 'spam'].includes(data?.action)) return changeOrderStock(db, data, actor);
  if (['payment', 'fulfil', 'complete'].includes(data?.action)) return settleOrder(db, data, actor);
  return updateOrderDesk(db, data, actor);
});
export const catalogueMarkSold = staff((data, actor) => markCatalogueSold(db, data, actor));
export const manualSaleRecord = staff((data, actor) => recordManualSale(db, data, actor));

// Team setup links exist only in this callable response, never in a document or log.
export const staffList = staff((data, actor) => listStaff(db, auth, data, actor), { ownerOnly: true });
export const staffInvite = staff((data, actor) => inviteStaff(db, auth, runtime.origin, data, actor), { ownerOnly: true });
export const staffSetRole = staff((data, actor) => changeStaff(db, auth, data, actor, 'role'), { ownerOnly: true });
export const staffSuspend = staff((data, actor) => changeStaff(db, auth, data, actor, 'suspend'), { ownerOnly: true });
export const staffReactivate = staff((data, actor) => changeStaff(db, auth, data, actor, 'reactivate'), { ownerOnly: true });

export const staffSetupLink = staff((data, actor) => createStaffSetupLink(db, auth, runtime.origin, data, actor), { ownerOnly: true });
