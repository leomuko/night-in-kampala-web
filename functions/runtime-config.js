import { FUNCTIONS_REGION } from './firebase-project.js';
import { configuredOrigin } from './shared-links.js';

export function validateCloudDeployment(config) {
  if (!config || config.approved !== true || !['preview', 'production'].includes(config.target)) throw new Error('An approved explicit cloud deployment profile is required.');
  if (config.projectId !== 'night-in-kampala') throw new Error('Cloud releases must target night-in-kampala.');
  if (config.indexPublicPages !== undefined && typeof config.indexPublicPages !== 'boolean') throw new Error('indexPublicPages must be an explicit boolean.');
  if (config.indexPublicPages && config.target !== 'production') throw new Error('Preview cannot enable public indexing.');
  if (config.region !== FUNCTIONS_REGION) throw new Error('The approved Functions region is europe-west1.');
  return { ...config, origin: configuredOrigin(config.origin), emulator: false };
}

export function resolveFunctionRuntime(env, deployment) {
  if (env.FUNCTIONS_EMULATOR === 'true') {
    if (env.GCLOUD_PROJECT !== 'demo-night-in-kampala' || env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Emulators require the demo project and loopback Firestore.');
    return { emulator: true, projectId: 'demo-night-in-kampala', origin: 'http://127.0.0.1:5500', region: FUNCTIONS_REGION };
  }
  const config = validateCloudDeployment(deployment);
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST || env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('Cloud deployment cannot use emulator endpoints.');
  const projects = [env.GCLOUD_PROJECT, env.GOOGLE_CLOUD_PROJECT, env.FIREBASE_CONFIG ? JSON.parse(env.FIREBASE_CONFIG).projectId : undefined].filter(Boolean);
  if (!projects.length || projects.some(project => project !== config.projectId)) throw new Error('Runtime project does not match the prepared deployment.');
  return config;
}
