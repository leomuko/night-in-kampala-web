import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = process.argv[2];
if (!['start', 'test', 'metadata', 'cleanup'].includes(mode)) throw new Error('Use start, test, metadata or cleanup.');
const projectId = { test: 'demo-night-in-kampala-rules', cleanup: 'demo-night-in-kampala-cleanup' }[mode] ?? 'demo-night-in-kampala';
const cache = path.join(root, '.cache/firebase');
mkdirSync(cache, { recursive: true });
const env = {
  ...process.env,
  GCLOUD_PROJECT: projectId,
  METADATA_SERVER_DETECTION: 'none',
  FIREBASE_EMULATORS_PATH: path.join(cache, 'emulators'),
  XDG_CONFIG_HOME: path.join(cache, 'config'),
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
};
if (process.platform === 'darwin') {
  env.JAVA_HOME = execFileSync('/usr/libexec/java_home', ['-v', '21+'], { encoding: 'utf8' }).trim();
  env.PATH = `${env.JAVA_HOME}/bin:${env.PATH}`;
}
const java = spawnSync('java', ['-version'], { env, encoding: 'utf8' });
const javaMajor = Number(`${java.stdout}${java.stderr}`.match(/version "(\d+)/)?.[1]);
if (java.status !== 0 || !javaMajor || javaMajor < 21) throw new Error('Java 21 or newer is required for the pinned Firebase emulators.');
let command = process.execPath;
let args;
if (mode !== 'start') {
  let services;
  try {
    services = await (await fetch('http://127.0.0.1:4400/emulators', { signal: AbortSignal.timeout(1000) })).json();
  } catch { /* Start an isolated emulator run if no hub is serving. */ }
  const suites = {
    metadata: { files: ['test/shared-links-http.test.mjs', 'test/staff-http.test.mjs', 'test/order-http.test.mjs', 'test/team-http.test.mjs'], emulators: ['auth', 'firestore', 'storage', 'functions', 'hosting'] },
    test: { files: ['test/rules.test.mjs'], emulators: ['firestore', 'storage'] },
    cleanup: { files: ['test/launch-cleanup.test.mjs', 'test/grant-staff-role.test.mjs', 'test/staff-migration.test.mjs'], emulators: ['auth', 'firestore', 'storage'] },
  };
  if (services && mode !== 'metadata') throw new Error('Stop the running emulators before this test. It needs an isolated demo project.');
  const { files, emulators } = suites[mode];
  const running = services && emulators.every(service => services[service]);
  const only = emulators.join(',');
  const testArgs = ['--test', ...(mode === 'cleanup' ? ['--test-concurrency=1'] : []), ...files];
  args = running ? testArgs : [path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'emulators:exec', '--project', projectId, '--only', only, `node ${testArgs.join(' ')}`];
} else {
  args = [path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'emulators:start', '--project', projectId, '--only', 'auth,firestore,storage,functions,hosting'];
}
const child = spawn(command, args, { cwd: root, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
