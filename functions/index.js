import { onRequest } from 'firebase-functions/v2/https';

// Emulator-only foundation. Production Functions/regions are a later decision.
if (process.env.FUNCTIONS_EMULATOR !== 'true') {
  throw new Error('Local foundations only: complete the region/deployment tasks before cloud use.');
}
export const localHealth = onRequest((_request, response) => {
  response.set('Cache-Control', 'no-store').json({ local: true, project: 'demo-night-in-kampala' });
});
