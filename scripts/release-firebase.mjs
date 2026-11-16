import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { releaseSteps, selectDeployment } from './deployment-config.mjs';

const { positionals: [target], values } = parseArgs({ allowPositionals: true, options: { confirm: { type: 'string' } } });
if (!['preview', 'production'].includes(target)) throw new Error('Choose preview or production explicitly.');
const root = fileURLToPath(new URL('../', import.meta.url));
const profiles = JSON.parse(await readFile(new URL('../deployments.local.json', import.meta.url), 'utf8'));
const config = selectDeployment(profiles, target, process.env.GCLOUD_PROJECT, values.confirm);
const env = { ...process.env, NIK_PRODUCTION_CONFIRM: values.confirm ?? '' };

function run(args, extra = {}) {
  const result = spawnSync(process.execPath, args, { cwd: root, env: { ...env, ...extra }, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Release stopped after a command failed.');
}

run(['scripts/prepare-deployment.mjs', target]);
for (const { step, args } of releaseSteps(config)) {
  run(['node_modules/firebase-tools/lib/bin/firebase.js', ...args], { NIK_RELEASE_STEP: step });
}
