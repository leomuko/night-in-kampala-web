import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { authorizeStaff, staffCallable } from '../staff-access.js';

const member = { role: 'owner', status: 'active', accessVersion: 2 };
const token = { uid: 'member', owner: true, staffVersion: 2 };
const request = { auth: { uid: 'member' }, rawRequest: { headers: { authorization: 'Bearer synthetic-token' } } };
const db = data => ({ doc: () => ({ get: async () => ({ data: () => data }) }) });
test('all staff adapters enforce cloud App Check and check revocation instead of trusting callable claims', async () => {
  const auth = { verifyIdToken: async (value, checkRevoked) => { assert.equal(value, 'synthetic-token'); assert.equal(checkRevoked, true); return token; } };
  const adapter = staffCallable({ region: 'europe-west1', emulator: false }, db(member), auth, () => null);
  const req = { method: 'POST', headers: { 'content-type': 'application/json' }, body: { data: {} }, header(name) { return this.headers[name.toLowerCase()]; } };
  const res = new EventEmitter();
  const headers = {};
  res.setHeader = (name, value) => { headers[name] = value; };
  res.getHeader = name => headers[name];
  res.status = code => { res.code = code; return res; };
  res.send = body => { res.body = body; res.emit('finish'); return res; };
  await adapter(req, res);
  assert.equal(res.code, 401);
  assert.equal(res.body.error.message, 'Unauthenticated'); // SDK rejects missing App Check before the app's staff guard.

  assert.equal((await authorizeStaff(db(member), auth, request, true)).role, 'owner');
  for (const next of [null, { ...member, status: 'suspended' }, { ...member, accessPending: true }, { ...member, accessVersion: 3 }, { ...member, role: 'staff' }]) {
    await assert.rejects(authorizeStaff(db(next), auth, request), { code: 'permission-denied' });
  }
  await assert.rejects(authorizeStaff(db(member), { verifyIdToken: async () => { throw new Error('revoked'); } }, request), { code: 'unauthenticated' });
});
