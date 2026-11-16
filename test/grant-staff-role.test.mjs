import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const project = 'demo-night-in-kampala-cleanup';
const run = (args, env = process.env) => spawnSync(process.execPath, ['scripts/grant-staff-role.mjs', ...args], {
  encoding: 'utf8', env, timeout: 15000,
});

test('role tooling rejects implicit or mismatched projects before contacting Auth', () => {
  assert.match(run(['--role', 'owner', '--email', 'fixture@example.test']).stderr, /Supply --project/);
  assert.match(run(['--project', 'night-in-kampala', '--role', 'owner', '--email', 'fixture@example.test']).stderr, /explicit cloud project/);
  const env = { ...process.env, FIREBASE_AUTH_EMULATOR_HOST: 'remote.example.test:9099' };
  assert.equal(run(['--project', project, '--role', 'staff', '--email', 'fixture@example.test'], env).status, 1);
});

test('role tooling only updates an existing account after confirmation and preserves other claims', async () => {
  assert.equal(process.env.GCLOUD_PROJECT, project);
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
  const app = initializeApp({ projectId: project }, 'roles');
  const auth = getAuth(app);
  const email = 'role-script@example.test';
  const account = await auth.createUser({ email });
  const args = ['--project', project, '--email', email, '--role', 'owner'];
  const phrase = `GRANT OWNER ${account.uid} IN ${project}`;
  try {
    await auth.setCustomUserClaims(account.uid, { retained: true });
    const dry = run(args);
    assert.equal(dry.status, 0, dry.stderr);
    assert.equal(JSON.parse(dry.stdout).mode, 'dry-run');
    assert.deepEqual((await auth.getUser(account.uid)).customClaims, { retained: true });
    assert.equal(run([...args, '--execute', '--confirm', 'yes']).status, 1);
    assert.deepEqual((await auth.getUser(account.uid)).customClaims, { retained: true });
    const grant = run([...args, '--execute', '--confirm', phrase]);
    assert.equal(grant.status, 0, grant.stderr);
    assert.deepEqual((await auth.getUser(account.uid)).customClaims, { retained: true, owner: true });
    const staffArgs = ['--project', project, '--email', email, '--role', 'staff', '--test-account', '--execute',
      '--confirm', `GRANT STAFF ${account.uid} IN ${project}`];
    assert.equal(run(staffArgs).status, 0);
    assert.deepEqual((await auth.getUser(account.uid)).customClaims, { retained: true, staff: true, testAccount: true });
    assert.equal(run([...args, '--execute', '--confirm', phrase]).status, 0);
    assert.deepEqual((await auth.getUser(account.uid)).customClaims, { retained: true, owner: true, testAccount: true });
    const missing = run(['--project', project, '--email', 'absent@example.test', '--role', 'staff', '--execute', '--confirm', 'yes']);
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /No existing user/);
    await assert.rejects(auth.getUserByEmail('absent@example.test'), { code: 'auth/user-not-found' });
  } finally {
    await auth.deleteUser(account.uid);
    await deleteApp(app);
  }
});
