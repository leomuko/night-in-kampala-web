import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { selectDeployment } from './deployment-config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = process.argv[2];
if (!['staging', 'production'].includes(target)) throw new Error('Default Firebase config is emulator-only. Prepare an approved staging/production profile and use its generated config.');
const profiles = JSON.parse(await readFile(new URL('../deployments.local.json', import.meta.url), 'utf8'));
const config = selectDeployment(profiles, target, process.env.GCLOUD_PROJECT);
const env = {
  ...process.env, VITE_USE_EMULATORS: 'false', VITE_FIREBASE_TARGET: target,
  VITE_FIREBASE_CONFIG: JSON.stringify(config.webConfig), VITE_FIREBASE_FUNCTIONS_REGION: config.region,
  VITE_PUBLIC_INDEXING: config.indexPublicPages === true ? 'true' : 'false',
};
const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', target], { cwd: root, env, stdio: 'inherit' });
if (build.error || build.status !== 0) throw new Error('Cloud build failed; deployment preparation stopped.');
await import('./prepare-preview-template.mjs');
const { webConfig: _webConfig, ...runtime } = config;
await mkdir(new URL('../functions/generated/', import.meta.url), { recursive: true });
await writeFile(new URL('../functions/generated/deployment.json', import.meta.url), JSON.stringify(runtime, null, 2) + '\n');
const firebase = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'));
delete firebase.emulators;
const predeploy = ['node "$PROJECT_DIR/scripts/prepare-deployment.mjs" ' + target];
firebase.functions.forEach(item => { item.predeploy = predeploy; });
firebase.hosting.predeploy = predeploy;
if (config.indexPublicPages) firebase.hosting.headers = firebase.hosting.headers.filter(item => item.source !== '**');
firebase.hosting.rewrites.forEach(item => { if (item.function) item.function = { ...item.function, region: config.region, pinTag: true }; });
await writeFile(new URL(`../firebase.${target}.generated.json`, import.meta.url), JSON.stringify(firebase, null, 2) + '\n');
console.log(`Prepared ${target} build, Function template and matching Hosting configuration. No deployment performed.`);
