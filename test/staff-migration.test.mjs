import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-night-in-kampala-cleanup';
const run = args => spawnSync(process.execPath, ['scripts/migrate-staff-members.mjs', ...args], { encoding: 'utf8', timeout: 20000 });
test('migration is explicit, dry-run first, idempotent and preserves real account identity and credentials', async () => {
  assert.equal(process.env.GCLOUD_PROJECT, project);
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  assert.notEqual(run([]).status, 0);
  const app = initializeApp({ projectId: project }, 'migration');
  const auth = getAuth(app), db = getFirestore(app), created = [];
  try {
    const all = (await auth.listUsers()).users;
    // Other isolated cleanup fixtures can contain a claim holder without email.
    for (const user of all.filter(u => !u.email && (u.customClaims?.owner || u.customClaims?.staff))) {
      await auth.updateUser(user.uid, { email: `${user.uid}@example.test` });
    }
    for (const [email, role] of [['superadmin@nightinkampala.com', 'owner'], ['fahkerahmed@nightinkampala.com', 'staff'], ['extra-claim@example.test', 'owner']]) {
      let user;
      try { user = await auth.getUserByEmail(email); }
      catch (e) { if (e.code !== 'auth/user-not-found') throw e; user = await auth.createUser({ email }); created.push(user.uid); }
      await auth.setCustomUserClaims(user.uid, { ...user.customClaims, [role]: true, retained: true });
    }
    const before = await auth.getUserByEmail('fahkerahmed@nightinkampala.com');
    const args = ['--project', project];
    const dry = run(args); assert.equal(dry.status, 0, dry.stderr);
    const report = JSON.parse(dry.stdout);
    assert.equal(report.mode, 'dry-run'); assert.deepEqual(report.blockers, []);
    assert.equal((await db.doc(`staffMembers/${before.uid}`).get()).exists, false);
    assert.equal((await auth.getUser(before.uid)).customClaims.staffVersion, undefined);
    assert.notEqual(run([...args, '--execute', '--confirm', 'yes']).status, 0);
    const execute = () => run([...args, '--execute', '--confirm', `MIGRATE TEAM IN ${project}`]);
    const done = execute(); assert.equal(done.status, 0, done.stderr);
    for (const row of report.members) {
      const member = (await db.doc(`staffMembers/${row.uid}`).get()).data();
      const user = await auth.getUser(row.uid);
      assert.equal(member.role, row.role); assert.equal(member.status, row.status);
      assert.equal(member.accessPending, false); assert.equal(user.customClaims.staffVersion, member.accessVersion);
    }
    const after = await auth.getUser(before.uid);
    assert.equal(after.uid, before.uid); assert.equal(after.passwordHash, before.passwordHash);
    assert.equal(after.customClaims.retained, true); assert.notEqual(after.customClaims.testAccount, true);
    const revision = (await db.doc(`staffMembers/${before.uid}`).get()).data().accessVersion;
    assert.equal(execute().status, 0);
    assert.equal((await db.doc(`staffMembers/${before.uid}`).get()).data().accessVersion, revision);
    const owner = await auth.getUserByEmail('superadmin@nightinkampala.com');
    assert.equal(owner.customClaims.owner, true); assert.notEqual(owner.customClaims.testAccount, true);
  } finally { for (const uid of created) await auth.deleteUser(uid); await deleteApp(app); }
});
