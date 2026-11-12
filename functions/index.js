import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import { createSharedLinkHandler } from './shared-links.js';

// Emulator-only foundation. Production Functions/regions are a later decision.
if (process.env.FUNCTIONS_EMULATOR !== 'true' || process.env.GCLOUD_PROJECT !== 'demo-night-in-kampala' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') {
  throw new Error('Local foundations only: complete the region/deployment tasks before cloud use.');
}
const db = getFirestore(initializeApp({ projectId: 'demo-night-in-kampala' }));
let handler;
async function loadHandler() {
  return createSharedLinkHandler({
    origin: 'http://127.0.0.1:5500',
    emulator: true,
    template: await readFile(new URL('./generated/index.html', import.meta.url), 'utf8'),
    readDocument: async (collection, slug) => (await db.collection(collection).doc(slug).get()).data(),
  });
}
// us-central1 is an explicit emulator convention, not a cloud region choice.
export const renderSharedLink = onRequest({ region: 'us-central1', timeoutSeconds: 15 }, async (request, response) => {
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
export const localHealth = onRequest((_request, response) => {
  response.set('Cache-Control', 'no-store').json({ local: true, project: 'demo-night-in-kampala' });
});
