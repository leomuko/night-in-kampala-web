import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkReleaseHook, liveConfirmation, releaseSteps, selectDeployment } from '../scripts/deployment-config.mjs';
import { catalogueUsesTestData, resolveFunctionRuntime } from '../functions/runtime-config.js';

const projectId = 'night-in-kampala';
function profile(target) {
  const preview = target === 'preview';
  return { approved: true, projectId, region: 'europe-west1',
    origin: preview ? 'https://night-in-kampala--review-fixture.web.app' : 'https://live.example.test',
    ...(preview ? { channel: 'review' } : {}),
    webConfig: { projectId, apiKey: 'fixture-key', appId: 'fixture-app-id', messagingSenderId: 'fixture-sender',
      authDomain: `${projectId}.firebaseapp.com`, storageBucket: `${projectId}.firebasestorage.app` } };
}
const profiles = () => ({ preview: profile('preview'), production: profile('production') });
test('real draft review can opt out of preview test marking without changing emulator or production rules', () => {
  assert.equal(catalogueUsesTestData({ emulator: true, catalogueTestData: false }), true);
  assert.equal(catalogueUsesTestData({ target: 'preview' }), true);
  assert.equal(catalogueUsesTestData({ target: 'preview', catalogueTestData: false }), false);
  assert.equal(catalogueUsesTestData({ target: 'production' }), false);
  assert.throws(() => selectDeployment({ preview: { ...profile('preview'), catalogueTestData: 'false' } }, 'preview'), /boolean/);
  assert.throws(() => selectDeployment({ production: { ...profile('production'), catalogueTestData: true } }, 'production', projectId, liveConfirmation), /Production catalogue/);
});
test('one project serves both an approved preview channel and the live site', () => {
  const preview = selectDeployment(profiles(), 'preview', projectId);
  const live = selectDeployment(profiles(), 'production', projectId, liveConfirmation);
  assert.equal(preview.projectId, live.projectId);
  assert.equal(preview.webConfig.projectId, preview.projectId);
  assert.equal(resolveFunctionRuntime({ GCLOUD_PROJECT: projectId }, preview).origin, preview.origin);
});
test('missing explicit profile, typed approval and mismatched CLI projects stop before building', () => {
  assert.throws(() => selectDeployment(profiles()), /explicitly/);
  const data = profiles(); data.preview.approved = false;
  assert.throws(() => selectDeployment(data, 'preview'), /approved/);
  assert.throws(() => selectDeployment(profiles(), 'preview', 'nik-fixture-other'), /CLI project/);
  assert.throws(() => selectDeployment({ preview: { ...profile('preview'), region: 'europe-west2' } }, 'preview'), /europe-west1/);
  assert.throws(() => selectDeployment(profiles(), 'production', projectId), /Type/);
  assert.throws(() => selectDeployment(profiles(), 'production', projectId, 'yes'), /Type/);
});
test('the preview plan deploys shared services and a named channel, and guarded hooks reject direct invocations', () => {
  const preview = selectDeployment(profiles(), 'preview', projectId);
  const [backend, hosting] = releaseSteps(preview);
  assert.deepEqual(backend.args.slice(-2), ['--only', 'functions,firestore,storage']);
  assert.deepEqual(hosting.args.slice(0, 2), ['hosting:channel:deploy', 'review']);
  assert.throws(() => checkReleaseHook(preview, 'hosting', backend.step, projectId), /guarded/);
  assert.throws(() => checkReleaseHook(preview, 'hosting', undefined, projectId), /guarded/);
  assert.doesNotThrow(() => checkReleaseHook(preview, 'hosting', hosting.step, projectId));
  const invalid = profiles(); invalid.preview.channel = 'live';
  assert.throws(() => selectDeployment(invalid, 'preview'), /named preview/);
  invalid.preview.channel = 'review'; invalid.preview.origin = invalid.production.origin;
  assert.throws(() => selectDeployment(invalid, 'preview'), /channel origin/);
  assert.throws(() => selectDeployment({ ...profiles(), preview: { ...profile('preview'), indexPublicPages: true } }, 'preview'), /indexing/);
  const order = { identitySecret: 'ORDER_IDENTITY_KEY', trustedProxyHops: null, appCheckSiteKey: 'fixture-site-key' };
  assert.deepEqual(selectDeployment({ preview: { ...profile('preview'), order } }, 'preview').order, order);
  assert.throws(() => selectDeployment({ preview: { ...profile('preview'), order: { ...order, trustedProxyHops: 0 } } }, 'preview'), /order release settings/);
  assert.throws(() => selectDeployment({ preview: { ...profile('preview'), previousEntryScripts: ['https://example.test/entry.js'] } }, 'preview'), /local hashed app asset paths/);
});
test('cloud Functions reject missing artifact, wrong runtime project and local endpoints', () => {
  const config = selectDeployment(profiles(), 'production', projectId, liveConfirmation);
  assert.throws(() => resolveFunctionRuntime({}), /approved/);
  assert.throws(() => resolveFunctionRuntime({ GCLOUD_PROJECT: 'nik-fixture-other' }, config), /Runtime project/);
  assert.throws(() => resolveFunctionRuntime({ GCLOUD_PROJECT: config.projectId, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' }, config), /endpoints/);
  assert.equal(resolveFunctionRuntime({ FIREBASE_CONFIG: JSON.stringify({ projectId: config.projectId }) }, config).projectId, config.projectId);
  assert.throws(() => resolveFunctionRuntime({ GCLOUD_PROJECT: config.projectId, FIREBASE_CONFIG: JSON.stringify({ projectId: 'nik-fixture-other' }) }, config), /Runtime project/);
});
test('local Functions keep their explicit demo-only boundary independently of cloud profiles', () => {
  const env = { FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'demo-night-in-kampala', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' };
  assert.equal(resolveFunctionRuntime(env).region, 'europe-west1');
  assert.throws(() => resolveFunctionRuntime({ ...env, GCLOUD_PROJECT: 'night-in-kampala' }), /demo project/);
});
