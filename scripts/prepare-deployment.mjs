import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkReleaseHook, selectDeployment } from './deployment-config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { positionals: [target], values } = parseArgs({ allowPositionals: true,
  options: { confirm: { type: 'string' }, hook: { type: 'string' } } });
if (!['preview', 'production'].includes(target)) throw new Error('Default Firebase config is emulator-only. Prepare an approved preview or production profile.');
const profiles = JSON.parse(await readFile(new URL('../deployments.local.json', import.meta.url), 'utf8'));
const config = selectDeployment(profiles, target, process.env.GCLOUD_PROJECT, values.confirm ?? process.env.NIK_PRODUCTION_CONFIRM);
checkReleaseHook(config, values.hook, process.env.NIK_RELEASE_STEP, process.env.GCLOUD_PROJECT);
const env = {
  ...process.env, VITE_USE_EMULATORS: 'false', VITE_FIREBASE_TARGET: target,
  VITE_FIREBASE_CONFIG: JSON.stringify(config.webConfig), VITE_FIREBASE_FUNCTIONS_REGION: config.region,
  VITE_APP_CHECK_SITE_KEY: config.order?.appCheckSiteKey ?? '',
  VITE_ORDER_TRUSTED_PROXY_HOPS: String(config.order?.trustedProxyHops ?? ''),
  VITE_ORDER_PROXY_VERIFIED: config.order?.proxyVerified === true ? 'true' : 'false',
  VITE_SITE_ORIGIN: config.origin, VITE_PUBLIC_INDEXING: config.indexPublicPages === true ? 'true' : 'false',
};
const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', target], { cwd: root, env, stdio: 'inherit' });
if (build.error || build.status !== 0) throw new Error('Cloud build failed; deployment preparation stopped.');
const provenance = JSON.parse(await readFile(new URL('../dist/asset-provenance.json', import.meta.url), 'utf8'));
for (const asset of provenance.assets.filter(asset => asset.kind === 'ai_generated_placeholder')) {
  if (!/^(assets\/[a-z0-9-]+\.webp|share\/[a-z0-9-]+\.jpg)$/.test(asset.file)) throw new Error('Unexpected placeholder asset path.');
  await rm(new URL(`../dist/${asset.file}`, import.meta.url), { force: true });
}
await writeFile(new URL('../dist/asset-provenance.json', import.meta.url), JSON.stringify({ ...provenance,
  status: 'launch', assets: provenance.assets.filter(asset => asset.kind !== 'ai_generated_placeholder'),
}, null, 2) + '\n');
await import('./prepare-preview-template.mjs');
const { webConfig, ...runtime } = config;
await mkdir(new URL('../functions/generated/', import.meta.url), { recursive: true });
await writeFile(new URL('../functions/generated/deployment.json', import.meta.url), JSON.stringify({ ...runtime, storageBucket: webConfig.storageBucket }, null, 2) + '\n');
const firebase = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'));
delete firebase.emulators;
const hook = resource => [`node "$PROJECT_DIR/scripts/prepare-deployment.mjs" ${target} --hook ${resource}`];
firebase.functions.forEach(item => { item.predeploy = hook('backend'); });
firebase.firestore.predeploy = hook('backend');
firebase.storage.predeploy = hook('backend');
firebase.hosting.predeploy = hook('hosting');
// A Hosting-only configuration change can leave shared-link Functions referring
// to the preceding app filename. Serve a small non-cached module at that path.
// Hosting redirects can retain the old asset's immutable cache policy.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const entry = html.match(/<script\b[^>]*\bsrc="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/)?.[1];
if (!entry) throw new Error('Could not identify the built app entry script.');
const previousEntries = [...new Set(config.previousEntryScripts ?? [])].filter(path => path !== entry);
await Promise.all(previousEntries.map(source => writeFile(new URL(`../dist${source}`, import.meta.url),
  `import ${JSON.stringify(entry)};\n`)));
firebase.hosting.redirects = (firebase.hosting.redirects ?? []).filter(row => !previousEntries.includes(row.source));
// Compatibility filenames change destinations between builds. They must not
// inherit the immutable cache policy of the hashed module they replace.
firebase.hosting.headers.push(...previousEntries.map(source => ({ source,
  headers: [{ key: 'Cache-Control', value: 'no-store' }],
})));
if (config.indexPublicPages) firebase.hosting.headers = firebase.hosting.headers.filter(item => item.source !== '**');
firebase.hosting.rewrites.forEach(item => {
  if (item.function) item.function = { ...item.function, region: config.region, ...(target === 'production' ? { pinTag: true } : {}) };
});
await writeFile(new URL(`../firebase.${target}.generated.json`, import.meta.url), JSON.stringify(firebase, null, 2) + '\n');
console.log(`Prepared ${target} build, Function template and matching Hosting configuration. No deployment performed.`);
