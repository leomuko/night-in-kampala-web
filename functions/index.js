import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createSharedLinkHandler } from './shared-links.js';
import { resolveFunctionRuntime } from './runtime-config.js';

// Cloud startup requires a prepared, approved artifact and a matching project.
// No default cloud origin, region or project is inferred from request headers.
const deployment = process.env.FUNCTIONS_EMULATOR === 'true' ? undefined : JSON.parse(readFileSync(new URL('./generated/deployment.json', import.meta.url), 'utf8'));
const runtime = resolveFunctionRuntime(process.env, deployment);
const db = getFirestore(initializeApp({ projectId: runtime.projectId }));
let handler;
async function loadHandler() {
  return createSharedLinkHandler({
    origin: runtime.origin,
    emulator: runtime.emulator,
    indexPublicPages: runtime.indexPublicPages === true,
    template: await readFile(new URL('./generated/index.html', import.meta.url), 'utf8'),
    readDocument: async (collection, slug) => (await db.collection(collection).doc(slug).get()).data(),
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
