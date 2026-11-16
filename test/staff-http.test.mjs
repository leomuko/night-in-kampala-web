import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const project = 'demo-night-in-kampala';
if (process.env.GCLOUD_PROJECT !== project || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') {
  throw new Error('Staff tests require the Auth emulator on loopback.');
}

const authApi = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts';
const endpoint = `http://127.0.0.1:5001/${project}/us-central1/staffAccess`;
async function post(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data), signal: AbortSignal.timeout(20000) });
  return { status: response.status, body: await response.json() };
}

test('staff provisioning refuses cloud project IDs and non-loopback endpoints', () => {
  for (const args of [
    { project: 'night-in-kampala', endpoint: '127.0.0.1:9099' },
    { project, endpoint: 'invalid.example:9099' },
  ]) {
    const result = spawnSync(process.execPath, ['scripts/provision-demo-staff.mjs', args.project, 'staff'], {
      env: { ...process.env, FIREBASE_AUTH_EMULATOR_HOST: args.endpoint },
    });
    assert.equal(result.status, 1);
  }
});

test('password sign-in and refreshed claims gate callable staff access', async () => {
  const app = initializeApp({ projectId: project }, 'staff-rule-test');
  const users = [];
  try {
    assert.equal((await post(endpoint, { data: {} })).status, 401);
    for (const role of ['customer', 'staff', 'owner']) {
      const provision = spawnSync(process.execPath, ['scripts/provision-demo-staff.mjs', project, role], { encoding: 'utf8' });
      assert.equal(provision.status, 0);
      const { uid, email, password } = JSON.parse(provision.stdout);
      users.push(uid);
      const login = await post(`${authApi}:signInWithPassword?key=demo-key`, { email, password, returnSecureToken: true });
      assert.equal(login.status, 200);
      const access = await post(endpoint, { data: { role: 'owner' } }, login.body.idToken);
      assert.equal(access.status, role === 'customer' ? 403 : 200);
      if (role !== 'customer') assert.equal(access.body.result.role, role);
      if (role === 'staff') {
        await getAuth(app).setCustomUserClaims(uid, {});
        const refresh = await post('http://127.0.0.1:9099/securetoken.googleapis.com/v1/token?key=demo-key', {
          grant_type: 'refresh_token', refresh_token: login.body.refreshToken,
        });
        assert.equal(refresh.status, 200);
        assert.equal((await post(endpoint, { data: {} }, refresh.body.id_token)).status, 403);
      }
    }
  } finally {
    await Promise.all(users.map(uid => getAuth(app).deleteUser(uid)));
    await deleteApp(app);
  }
});
