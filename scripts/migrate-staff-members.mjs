import { parseArgs } from 'node:util';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { claimRole, operatorMembership } from '../functions/team-membership.js';

const { values: args } = parseArgs({ options: { project: { type: 'string' }, execute: { type: 'boolean' }, confirm: { type: 'string' } } });
const local = process.env.FIREBASE_AUTH_EMULATOR_HOST !== undefined || process.env.FIRESTORE_EMULATOR_HOST !== undefined;
if (!args.project || (local ? args.project !== 'demo-night-in-kampala-cleanup'
  || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080'
  : args.project !== 'night-in-kampala')) throw new Error('Use an explicit project and both isolated loopback emulators, or the approved cloud project.');
if ((!local && ['FIREBASE_STORAGE_EMULATOR_HOST', 'STORAGE_EMULATOR_HOST'].some(key => process.env[key]))
  || [process.env.GCLOUD_PROJECT, process.env.GOOGLE_CLOUD_PROJECT].some(p => p && p !== args.project)) throw new Error('Mixed or mismatched project endpoints.');
const phrase = `MIGRATE TEAM IN ${args.project}`;
if (args.execute ? args.confirm !== phrase : args.confirm !== undefined) throw new Error(`Execution requires --execute --confirm "${phrase}".`);
if (local) process.env.METADATA_SERVER_DETECTION = 'none';
const app = initializeApp({ projectId: args.project });
try {
  const auth = getAuth(app), db = getFirestore(app), users = [];
  let pageToken;
  do { const page = await auth.listUsers(1000, pageToken); users.push(...page.users); pageToken = page.pageToken; } while (pageToken);
  const expected = new Map([['superadmin@nightinkampala.com', 'owner'], ['fahkerahmed@nightinkampala.com', 'staff']]);
  const blockers = [];
  for (const [email, role] of expected) {
    const user = users.find(u => u.email?.toLowerCase() === email);
    if (!user || claimRole(user.customClaims) !== role || user.disabled || user.customClaims?.testAccount === true) blockers.push(`Review permanent account before migration: ${email}`);
  }
  const rows = [];
  for (const user of users.filter(u => claimRole(u.customClaims))) {
    if (!user.email) { blockers.push(`Claim holder has no email: ${user.uid}`); continue; }
    const member = (await db.doc(`staffMembers/${user.uid}`).get()).data();
    rows.push({ uid: user.uid, email: user.email, role: member?.role ?? claimRole(user.customClaims),
      status: member?.status ?? (user.disabled ? 'suspended' : 'active'), existing: Boolean(member) });
  }
  console.log(JSON.stringify({ project: args.project, mode: args.execute ? 'execute' : 'dry-run', members: rows, blockers, confirmation: phrase }, null, 2));
  if (!args.execute) process.exitCode = blockers.length ? 1 : 0;
  else {
    if (blockers.length) throw new Error('Resolve every permanent-account blocker first.');
    for (const row of rows) await operatorMembership(db, auth, await auth.getUser(row.uid), { ...row, actor: 'operator:migrate-staff-members', action: 'team-migration' });
    console.log('Team membership migration complete. Existing passwords and real-account markers were not changed.');
  }
} finally { await deleteApp(app); }
