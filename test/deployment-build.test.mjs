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
      const projectId = 'night-in-kampala';
      const preview = target === 'preview';
      return { approved: true, projectId, previousEntryScripts: ['/assets/index-previous.js'],
        order: { identitySecret: 'ORDER_IDENTITY_KEY', trustedProxyHops: 2, appCheckSiteKey: 'fixture-site-key' },
        region: 'europe-west1', origin: preview ? 'https://night-in-kampala--review-fixture.web.app' : 'https://production.example.test', ...(preview ? { channel: 'review' } : {}), webConfig: { projectId, apiKey: 'fixture-key', appId: 'fixture-app-id', messagingSenderId: 'fixture-sender', authDomain: `${projectId}.firebaseapp.com`, storageBucket: `${projectId}.firebasestorage.app` } };
    };
    await writeFile(path.join(root, 'deployments.local.json'), JSON.stringify({ preview: profile('preview'), production: profile('production') }));
    const env = { ...process.env, GCLOUD_PROJECT: 'night-in-kampala', METADATA_SERVER_DETECTION: 'none' };
    for (const key of ['FUNCTIONS_EMULATOR', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) delete env[key];
    const build = spawnSync(process.execPath, ['scripts/prepare-deployment.mjs', 'preview'], { cwd: root, env, encoding: 'utf8' });
    assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
    const provenance = JSON.parse(await readFile(path.join(root, 'dist/asset-provenance.json'), 'utf8'));
    assert.ok(provenance.assets.every(asset => asset.kind !== 'ai_generated_placeholder'));
    await assert.rejects(readFile(path.join(root, 'dist/assets/campaign-960.webp')), { code: 'ENOENT' });
    assert.ok((await readFile(path.join(root, 'dist/share/brand.jpg'))).length > 0);
    const manifest = JSON.parse(await readFile(path.join(root, 'firebase.preview.generated.json'), 'utf8'));
    assert.ok(manifest.functions[0].predeploy[0].endsWith(' preview --hook backend'));
    assert.ok(manifest.hosting.predeploy[0].endsWith(' preview --hook hosting'));
    assert.ok(!manifest.hosting.redirects.some(row => row.source === '/assets/index-previous.js'));
    assert.deepEqual(manifest.hosting.headers.at(-1), {
      source: '/assets/index-previous.js', headers: [{ key: 'Cache-Control', value: 'no-store' }],
    });
    const builtIndex = await readFile(path.join(root, 'dist/index.html'), 'utf8');
    const entry = builtIndex.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/)[1];
    const compatibilityModule = await readFile(path.join(root, 'dist/assets/index-previous.js'), 'utf8');
    assert.equal(compatibilityModule, `import ${JSON.stringify(entry)};\n`);
    const redirectedModule = await readFile(path.join(root, 'dist', entry), 'utf8');
    assert.ok(redirectedModule.includes('fixture-key'));
    const media = manifest.hosting.rewrites.find(item => item.source === '/media/products/**');
    assert.equal(media.function.functionId, 'catalogueMedia');
    for (const rewrite of manifest.hosting.rewrites.filter(item => item.function)) {
      assert.equal(rewrite.function.region, 'europe-west1');
      assert.equal(rewrite.function.pinTag, undefined);
    }
    assert.equal(await readFile(path.join(root, 'dist/index.html'), 'utf8'), await readFile(path.join(root, 'functions/generated/index.html'), 'utf8'));
    const runtime = JSON.parse(await readFile(path.join(root, 'functions/generated/deployment.json'), 'utf8'));
    assert.equal(runtime.projectId, 'night-in-kampala');
    assert.equal(runtime.origin, 'https://night-in-kampala--review-fixture.web.app');
    assert.equal(runtime.order.trustedProxyHops, 2);
    assert.equal(runtime.order.identitySecret, 'ORDER_IDENTITY_KEY');
    const regionProbe = 'const m = await import("./functions/index.js"); console.log(JSON.stringify(Object.fromEntries(Object.entries(m).filter(([, value]) => value?.__endpoint).map(([name, value]) => [name, value.__endpoint.region]))));';
    const endpoints = childEnv => {
      const imported = spawnSync(process.execPath, ['--input-type=module', '-e', regionProbe], { cwd: root, env: childEnv, encoding: 'utf8' });
      assert.equal(imported.status, 0, imported.stderr);
      return JSON.parse(imported.stdout.trim());
    };
    const cloud = endpoints(env);
    const local = endpoints({ ...env, FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'demo-night-in-kampala', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' });
    assert.ok(Object.keys(cloud).length > 10);
    assert.deepEqual(Object.keys(local).sort(), [...Object.keys(cloud), 'localHealth'].sort());
    for (const region of [...Object.values(cloud), ...Object.values(local)]) assert.deepEqual(region, ['europe-west1']);
    const emulatorManifest = JSON.parse(await readFile(path.join(root, 'firebase.json'), 'utf8'));
    for (const { function: rewrite } of emulatorManifest.hosting.rewrites.filter(item => item.function)) {
      assert.deepEqual(local[rewrite.functionId], [rewrite.region]);
      assert.equal(rewrite.region, 'europe-west1');
    }
    assert.match(await readFile(path.join(root, 'dist/robots.txt'), 'utf8'), /Disallow: \//);
    const profiles = { preview: profile('preview'), production: { ...profile('production'), indexPublicPages: true } };
    await writeFile(path.join(root, 'deployments.local.json'), JSON.stringify(profiles));
    const production = spawnSync(process.execPath, ['scripts/prepare-deployment.mjs', 'production', '--confirm', 'DEPLOY LIVE night-in-kampala'], { cwd: root, env: { ...env, GCLOUD_PROJECT: 'night-in-kampala' }, encoding: 'utf8' });
    assert.equal(production.status, 0, `${production.stdout}\n${production.stderr}`);
    assert.match(await readFile(path.join(root, 'dist/index.html'), 'utf8'), /name="robots" content="index, follow"/);
    assert.match(await readFile(path.join(root, 'dist/robots.txt'), 'utf8'), /Allow: \//);
    const live = JSON.parse(await readFile(path.join(root, 'firebase.production.generated.json'), 'utf8'));
    assert.ok(live.hosting.rewrites.filter(item => item.function).every(item => item.function.pinTag === true));
    assert.ok(!live.hosting.headers.some(item => item.source === '**'));
    assert.ok(live.hosting.headers.some(item => item.source.includes('admin') && item.headers.some(header => header.key === 'X-Robots-Tag')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
