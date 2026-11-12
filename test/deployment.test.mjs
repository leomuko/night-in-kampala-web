import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectDeployment } from '../scripts/deployment-config.mjs';
import { resolveFunctionRuntime } from '../functions/runtime-config.js';

function profile(role) {
  const projectId = `nik-fixture-${role}`;
  return { approved: true, projectId, region: 'europe-west1', origin: `https://${role}.example.test`, webConfig: { projectId, apiKey: 'fixture-key', appId: 'fixture-app-id', messagingSenderId: 'fixture-sender', authDomain: `${projectId}.firebaseapp.com`, storageBucket: `${projectId}.firebasestorage.app` } };
}
const profiles = () => ({ staging: profile('staging'), production: profile('production') });
test('deployment profile supplies matching explicit browser/server config', () => {
  const config = selectDeployment(profiles(), 'staging', 'nik-fixture-staging');
  assert.equal(config.region, 'europe-west1');
  assert.equal(config.webConfig.projectId, config.projectId);
  assert.equal(resolveFunctionRuntime({ GCLOUD_PROJECT: config.projectId }, config).origin, 'https://staging.example.test');
});
test('missing target, approval and mismatched CLI projects stop before building', () => {
  assert.throws(() => selectDeployment(profiles()), /explicitly/);
  const data = profiles(); data.staging.approved = false;
  assert.throws(() => selectDeployment(data, 'staging'), /approved/);
  assert.throws(() => selectDeployment(profiles(), 'staging', 'nik-fixture-production'), /CLI project/);
});
test('shared projects, origins and cross-project browser settings are rejected', () => {
  const sharedProject = profiles(); sharedProject.staging.projectId = sharedProject.production.projectId;
  assert.throws(() => selectDeployment(sharedProject, 'staging'), /distinct/);
  const sharedOrigin = profiles(); sharedOrigin.staging.origin = sharedOrigin.production.origin;
  assert.throws(() => selectDeployment(sharedOrigin, 'staging'), /origins/);
  const crossed = profiles(); crossed.staging.webConfig = crossed.production.webConfig;
  assert.throws(() => selectDeployment(crossed, 'staging'), /must match/);
});
test('cloud Functions reject missing artifact, wrong runtime project and local endpoints', () => {
  const config = selectDeployment(profiles(), 'production');
  assert.throws(() => resolveFunctionRuntime({}), /approved/);
  assert.throws(() => resolveFunctionRuntime({ GCLOUD_PROJECT: 'nik-fixture-staging' }, config), /Runtime project/);
  assert.throws(() => resolveFunctionRuntime({ GCLOUD_PROJECT: config.projectId, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' }, config), /endpoints/);
  assert.equal(resolveFunctionRuntime({ FIREBASE_CONFIG: JSON.stringify({ projectId: config.projectId }) }, config).projectId, config.projectId);
  assert.throws(() => resolveFunctionRuntime({ GCLOUD_PROJECT: config.projectId, FIREBASE_CONFIG: JSON.stringify({ projectId: 'nik-fixture-staging' }) }, config), /Runtime project/);
});
test('local Functions keep their explicit demo-only boundary independently of cloud profiles', () => {
  const env = { FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'demo-night-in-kampala', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' };
  assert.equal(resolveFunctionRuntime(env).region, 'us-central1');
  assert.throws(() => resolveFunctionRuntime({ ...env, GCLOUD_PROJECT: 'night-in-kampala' }), /demo project/);
});
