import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const projectId = 'demo-night-in-kampala';
const mode = process.argv[2];
if (!['start', 'test'].includes(mode)) throw new Error('Use start or test.');
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
if (mode === 'test') {
  let running = false;
  try {
    const services = await (await fetch('http://127.0.0.1:4400/emulators', { signal: AbortSignal.timeout(1000) })).json();
    running = Boolean(services.firestore && services.storage);
  } catch { /* Start an isolated emulator run if no hub is serving. */ }
  args = running ? ['--test', 'test/rules.test.mjs'] : [path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'emulators:exec', '--project', projectId, '--only', 'firestore,storage', 'node --test test/rules.test.mjs'];
} else {
  args = [path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'emulators:start', '--project', projectId, '--only', 'auth,firestore,storage,functions,hosting'];
}
const child = spawn(command, args, { cwd: root, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
