import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { changeStaff } from '../functions/team.js';

const project = 'demo-night-in-kampala';
if (process.env.GCLOUD_PROJECT !== project || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099'
  || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Team tests require both isolated local emulators.');
const base = `http://127.0.0.1:5001/${project}/europe-west1/`;
const accounts = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts';
async function post(url, body, token) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  return { status: response.status, body: await response.json() };
}
const call = (name, data, token) => post(base + name, { data }, token);
async function fixture() {
  const app = initializeApp({ projectId: project }, randomUUID());
  const auth = getAuth(app), db = getFirestore(app), users = [];
  async function user(role = null) {
    const email = `team-${randomUUID()}@example.test`, password = randomUUID();
    const account = await auth.createUser({ email, password }); users.push(account.uid);
    if (role) {
      await auth.setCustomUserClaims(account.uid, { [role]: true, staffVersion: 1, testAccount: true });
      await db.doc(`staffMembers/${account.uid}`).set({ name: 'Local team fixture', email, role, status: 'active', accessVersion: 1 });
    }
    const login = () => post(`${accounts}:signInWithPassword?key=demo-key`, { email, password, returnSecureToken: true });
    return { uid: account.uid, email, password, login, token: (await login()).body.idToken };
  }
  return { app, auth, db, users, user, close: async () => { for (const uid of users) { await auth.deleteUser(uid).catch(() => {}); await db.doc(`staffMembers/${uid}`).delete(); } await deleteApp(app); } };
}

test('Team owner invite supports setup, explicit existing-account consent, quota, role and suspension lifecycle with audits', async () => {
  const f = await fixture(), { auth, db } = f;
  const counter = db.doc(`teamInviteLimits/${new Date().toISOString().slice(0, 10)}`);
  try {
    const owner = await f.user('owner'), staff = await f.user('staff');
    for (const name of ['staffList', 'staffInvite', 'staffSetRole', 'staffSuspend', 'staffReactivate']) {
      assert.equal((await call(name, {}, staff.token)).status, 403, name);
      assert.equal((await call(name, {})).status, 401, name);
    }
    for (const data of [{ name: '', email: 'bad', role: 'staff' }, { name: 'Fixture', email: 'good@example.test', role: 'admin' }]) {
      assert.equal((await call('staffInvite', data, owner.token)).status, 400);
    }
    const email = `invited-${randomUUID()}@example.test`;
    const invite = await call('staffInvite', { name: 'Invited fixture', email, role: 'staff' }, owner.token);
    assert.equal(invite.status, 200); const added = invite.body.result; f.users.push(added.uid);
    assert.equal(typeof added.setupLink, 'string');
    const setup = new URL(added.setupLink);
    assert.equal(setup.searchParams.get('continueUrl'), 'http://127.0.0.1:5500/admin');
    const created = await auth.getUser(added.uid);
    assert.equal(created.passwordHash, undefined); assert.equal(created.disabled, false);
    assert.deepEqual(created.customClaims, { staff: true, staffVersion: 1 });
    const password = randomUUID();
    const reset = await post(`${accounts}:resetPassword?key=demo-key`, { oobCode: setup.searchParams.get('oobCode'), newPassword: password });
    assert.equal(reset.status, 200);
    const login = () => post(`${accounts}:signInWithPassword?key=demo-key`, { email, password, returnSecureToken: true });
    const firstToken = (await login()).body.idToken;
    assert.equal((await call('staffAccess', {}, firstToken)).status, 200);
    const noChange = await call('staffSetRole', { uid: owner.uid, role: 'owner' }, owner.token);
    assert.equal(noChange.status, 200); assert.equal(noChange.body.result.unchanged, true);
    assert.equal((await db.doc(`staffMembers/${owner.uid}`).get()).data().accessVersion, 1);
    assert.equal((await call('staffSetRole', { uid: owner.uid, role: 'staff' }, owner.token)).status, 400);
    assert.equal((await call('staffSuspend', { uid: owner.uid }, owner.token)).status, 400);
    assert.equal((await call('staffSetRole', { uid: added.uid, role: 'owner' }, owner.token)).status, 200);
    assert.equal((await call('staffAccess', {}, firstToken)).status === 200, false);
    assert.equal((await call('staffAccess', {}, (await login()).body.idToken)).body.result.role, 'owner');
    const promoted = (await login()).body.idToken;
    assert.equal((await call('staffSuspend', { uid: added.uid }, owner.token)).status, 200);
    assert.equal((await auth.getUser(added.uid)).disabled, true);
    assert.equal((await auth.getUser(added.uid)).customClaims.owner, undefined);
    assert.ok([401, 403].includes((await call('staffAccess', {}, promoted)).status));
    assert.equal((await call('staffReactivate', { uid: added.uid }, owner.token)).status, 200);
    assert.equal((await auth.getUser(added.uid)).disabled, false);
    assert.equal((await call('staffAccess', {}, promoted)).status === 200, false);
    assert.equal((await call('staffAccess', {}, (await login()).body.idToken)).body.result.role, 'owner');
    const member = (await db.doc(`staffMembers/${added.uid}`).get()).data();
    assert.ok(member.createdAt && member.createdBy && member.updatedAt && member.suspendedAt && member.suspendedBy);
    const list = await call('staffList', {}, owner.token);
    assert.equal(list.status, 200); assert.ok(list.body.result.rows.find(u => u.uid === added.uid).lastSignInAt);
    const existing = await f.user();
    await auth.setCustomUserClaims(existing.uid, { retained: true });
    const grantInput = { name: 'Existing fixture', email: existing.email.toUpperCase(), role: 'staff' };
    const choice = await call('staffInvite', grantInput, owner.token);
    assert.equal(choice.body.result.needsGrant, true); assert.equal(choice.body.result.uid, existing.uid);
    assert.equal((await db.doc(`staffMembers/${existing.uid}`).get()).exists, false);
    const grant = await call('staffInvite', { ...grantInput, grantExisting: true }, owner.token);
    assert.equal(grant.status, 200); assert.equal(grant.body.result.uid, existing.uid);
    assert.equal((await auth.getUser(existing.uid)).customClaims.retained, true);
    const again = await call('staffInvite', grantInput, owner.token);
    assert.equal(again.body.result.existingMember, true);
    await counter.set({ count: 19 });
    const twentieth = await call('staffInvite', { name: 'Twentieth fixture', email: `twentieth-${randomUUID()}@example.test`, role: 'staff' }, owner.token);
    assert.equal(twentieth.status, 200); f.users.push(twentieth.body.result.uid);
    assert.equal((await counter.get()).data().count, 20);
    const limitedEmail = `limited-${randomUUID()}@example.test`;
    const limited = await call('staffInvite', { name: 'Limited', email: limitedEmail, role: 'staff' }, owner.token);
    assert.equal(limited.status, 429); await assert.rejects(auth.getUserByEmail(limitedEmail), { code: 'auth/user-not-found' });
    const audits = await db.collection('auditLogs').where('targetUid', '==', added.uid).get();
    assert.deepEqual(audits.docs.map(r => r.data().action).sort(), ['staff-invite', 'staff-reactivate', 'staff-role', 'staff-suspend']);
    assert.ok(audits.docs.every(r => r.data().actorUid === owner.uid && Object.hasOwn(r.data(), 'before') && r.data().after));
    const serialised = JSON.stringify(audits.docs.map(r => r.data()));
    assert.equal(serialised.includes('oobCode'), false); assert.equal(serialised.includes(added.setupLink), false);
  } finally { await counter.delete(); await f.close(); }
});

test('concurrent owners cannot remove each other and leave no active owner; partial Auth failure fails closed and is recoverable', async () => {
  const f = await fixture(), { db, auth } = f;
  try {
    const a = await f.user('owner'), b = await f.user('owner');
    const results = await Promise.all([
      call('staffSetRole', { uid: b.uid, role: 'staff' }, a.token),
      call('staffSetRole', { uid: a.uid, role: 'staff' }, b.token),
    ]);
    assert.equal(results.filter(r => r.status === 200).length, 1);
    assert.ok(results.some(r => [403, 409].includes(r.status)));
    const survivors = [a, b].filter((_, i) => results[i].status === 200);
    const owner = survivors[0];
    const target = await f.user('staff');
    const actor = { uid: owner.uid, role: 'owner', accessVersion: 1 };
    const failingAuth = { getUser: uid => auth.getUser(uid), updateUser: (uid, fields) => auth.updateUser(uid, fields),
      setCustomUserClaims: async () => { throw new Error('Injected provider failure'); } };
    await assert.rejects(changeStaff(db, failingAuth, { uid: target.uid, role: 'owner' }, actor, 'role'), { code: 'unavailable' });
    const blocked = (await db.doc(`staffMembers/${target.uid}`).get()).data();
    assert.equal(blocked.status, 'suspended'); assert.equal(blocked.accessPending, true);
    assert.ok([401, 403].includes((await call('staffAccess', {}, target.token)).status));
    assert.equal((await call('staffReactivate', { uid: target.uid }, owner.token)).status, 200);
    assert.equal((await call('staffAccess', {}, (await target.login()).body.idToken)).status, 200);
  } finally { await f.close(); }
});
