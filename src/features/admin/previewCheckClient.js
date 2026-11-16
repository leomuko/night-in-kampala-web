import { getToken } from 'firebase/app-check';
import { initializeFirebaseAppCheck } from '../../services/firebaseAppCheck.js';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { getFirebaseServices } from '../../services/firebase.js';
import { FUNCTIONS_REGION } from '../../../functions/firebase-project.js';
import { readPublicDocument } from '../catalogue/catalogueData.js';

export const previewTestPhone = '+256772900100';

export async function runPreviewCheck({ slug, phone, spoof }) {
  const runtime = getFirebaseRuntime();
  if (runtime.mode !== 'cloud' || runtime.target !== 'preview') throw new Error('Preview checks require the Hosting preview.');
  const { auth } = await getFirebaseServices();
  const identity = await auth.currentUser?.getIdTokenResult();
  if (identity?.claims.owner !== true) throw new Error('Owner access is required.');
  const instance = await initializeFirebaseAppCheck();
  if (!instance) throw new Error('App Check is not configured.');
  const attestation = await getToken(instance, false);
  let data = { previewCheck: true };
  if (slug) {
    const product = await readPublicDocument('products', slug);
    if (product?.isTestData !== true || product.purchasable !== true || !product.requestableSizes?.length) {
      throw new Error('Choose published, requestable test stock.');
    }
    data = { ...data, submissionId: crypto.randomUUID(), details: { name: 'TEST connection check', phone,
      country: 'UG', method: 'collection', email: '', website: '' },
    items: [{ slug, size: product.requestableSizes[0].id, quantity: 1, priceUGX: product.priceUGX }] };
  }
  const response = await fetch(`https://${FUNCTIONS_REGION}-${runtime.config.projectId}.cloudfunctions.net/orderCreate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${identity.token}`,
      'X-Firebase-AppCheck': attestation.token, ...(spoof ? { 'X-Forwarded-For': '198.51.100.77' } : {}) },
    body: JSON.stringify({ data }),
  });
  const result = await response.json();
  if (result.error) return { appCheckTokenIssued: true, status: response.status, message: result.error.message };
  return { appCheckTokenIssued: true, appVerified: result.result.previewAttestationVerified, status: response.status, reference: result.result.reference,
    source: result.result.previewSource };
}
