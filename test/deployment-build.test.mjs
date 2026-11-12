import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, symlink, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

test('predeploy builds matching browser/Function artifacts and imports the configured cloud Function without network calls', async () => {
  await mkdir('.cache', { recursive: true });
  const root = await mkdtemp(path.resolve('.cache/deployment-check-'));
  try {
    for (const file of ['src', 'public', 'scripts', 'index.html', 'vite.config.js', 'package.json']) await cp(file, path.join(root, file), { recursive: true });
    await cp('functions', path.join(root, 'functions'), { recursive: true, filter: source => !source.split(path.sep).includes('generated') });
    await symlink(path.resolve('node_modules'), path.join(root, 'node_modules'), 'dir');
    await cp('firebase.json', path.join(root, 'firebase.json'));
    const profile = target => {
      const projectId = `nik-fixture-${target}`;
      return { approved: true, projectId, region: 'europe-west1', origin: `https://${target}.example.test`, webConfig: { projectId, apiKey: 'fixture-key', appId: 'fixture-app-id', messagingSenderId: 'fixture-sender', authDomain: `${projectId}.firebaseapp.com`, storageBucket: `${projectId}.firebasestorage.app` } };
    };
    await writeFile(path.join(root, 'deployments.local.json'), JSON.stringify({ staging: profile('staging'), production: profile('production') }));
    const env = { ...process.env, GCLOUD_PROJECT: 'nik-fixture-staging', METADATA_SERVER_DETECTION: 'none' };
    for (const key of ['FUNCTIONS_EMULATOR', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) delete env[key];
    const build = spawnSync(process.execPath, ['scripts/prepare-deployment.mjs', 'staging'], { cwd: root, env, encoding: 'utf8' });
    assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
    const manifest = JSON.parse(await readFile(path.join(root, 'firebase.staging.generated.json'), 'utf8'));
    assert.ok(manifest.functions[0].predeploy[0].endsWith(' staging'));
    assert.ok(manifest.hosting.predeploy[0].endsWith(' staging'));
    for (const rewrite of manifest.hosting.rewrites.filter(item => item.function)) {
      assert.equal(rewrite.function.region, 'europe-west1');
      assert.equal(rewrite.function.pinTag, true);
    }
    assert.equal(await readFile(path.join(root, 'dist/index.html'), 'utf8'), await readFile(path.join(root, 'functions/generated/index.html'), 'utf8'));
    const runtime = JSON.parse(await readFile(path.join(root, 'functions/generated/deployment.json'), 'utf8'));
    assert.equal(runtime.projectId, 'nik-fixture-staging');
    assert.equal(runtime.origin, 'https://staging.example.test');
    const imported = spawnSync(process.execPath, ['--input-type=module', '-e', 'const m = await import("./functions/index.js"); console.log(JSON.stringify({region:m.renderSharedLink.__endpoint.region,localHealth:m.localHealth===undefined}));'], { cwd: root, env, encoding: 'utf8' });
    assert.equal(imported.status, 0, imported.stderr);
    const endpoint = JSON.parse(imported.stdout.trim());
    assert.deepEqual(endpoint.region, ['europe-west1']);
    assert.equal(endpoint.localHealth, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
