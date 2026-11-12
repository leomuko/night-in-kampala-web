import { configuredOrigin } from './shared-links.js';

export function validateCloudDeployment(config) {
  if (!config || config.approved !== true || !['staging', 'production'].includes(config.target)) throw new Error('An approved explicit cloud deployment profile is required.');
  if (![config.projectId, config.peerProjectId].every(id => typeof id === 'string' && /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(id) && !id.startsWith('demo-')) || config.projectId === config.peerProjectId) throw new Error('Staging and production require distinct real project IDs.');
  if (config.target === 'staging' && config.projectId === 'night-in-kampala') throw new Error('The registered project is protected from staging.');
  if (config.indexPublicPages !== undefined && typeof config.indexPublicPages !== 'boolean') throw new Error('indexPublicPages must be an explicit boolean.');
  if (config.indexPublicPages && config.target !== 'production') throw new Error('Staging cannot enable public indexing.');
  if (typeof config.region !== 'string' || !/^[a-z]+-[a-z]+\d+$/.test(config.region)) throw new Error('An approved Functions region is required.');
  return { ...config, origin: configuredOrigin(config.origin), emulator: false };
}

export function resolveFunctionRuntime(env, deployment) {
  if (env.FUNCTIONS_EMULATOR === 'true') {
    if (env.GCLOUD_PROJECT !== 'demo-night-in-kampala' || env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Emulators require the demo project and loopback Firestore.');
    return { emulator: true, projectId: 'demo-night-in-kampala', origin: 'http://127.0.0.1:5500', region: 'us-central1' };
  }
  const config = validateCloudDeployment(deployment);
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST || env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('Cloud deployment cannot use emulator endpoints.');
  if (env.GCLOUD_PROJECT !== config.projectId) throw new Error('Runtime project does not match the prepared deployment.');
  return config;
}
