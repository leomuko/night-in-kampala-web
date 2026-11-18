import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { operatorMembership, permanentTeamEmails } from '../functions/team-membership.js';

async function main() {
  const { values: args } = parseArgs({ options: {
    project: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' },
    execute: { type: 'boolean' }, 'dry-run': { type: 'boolean' },
    'test-account': { type: 'boolean' }, confirm: { type: 'string' },
  } });
  if (!args.project || !['owner', 'staff'].includes(args.role) || !args.email?.trim()) {
    throw new Error('Supply --project, --email and --role owner|staff.');
  }
  const local = process.env.FIREBASE_AUTH_EMULATOR_HOST !== undefined;
  if (local ? process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099'
    || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' || args.project !== 'demo-night-in-kampala-cleanup' : args.project !== 'night-in-kampala') {
    throw new Error('Use the explicit cloud project or the isolated loopback test project.');
  }
  if (!local && ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST', 'STORAGE_EMULATOR_HOST']
    .some(name => process.env[name])) throw new Error('Cloud role assignment cannot mix emulator endpoints.');
  if ([process.env.GCLOUD_PROJECT, process.env.GOOGLE_CLOUD_PROJECT].some(value => value && value !== args.project)) {
    throw new Error('An ambient project disagrees with --project.');
  }
  if (args.execute && args['dry-run']) throw new Error('Choose --dry-run or --execute.');
  if (!args.execute && args.confirm !== undefined) throw new Error('--confirm requires --execute.');
  if (local) process.env.METADATA_SERVER_DETECTION = 'none';
  const app = initializeApp({ projectId: args.project });
  try {
    const auth = getAuth(app);
    const user = await auth.getUserByEmail(args.email.trim());
    const phrase = `GRANT ${args.role.toUpperCase()} ${user.uid} IN ${args.project}`;
    const testAccount = args['test-account'] === true || user.customClaims?.testAccount === true;
    if (testAccount && permanentTeamEmails.has(user.email.toLowerCase())) throw new Error('Real permanent accounts must never be marked as test.');
    console.log(JSON.stringify({ project: args.project, uid: user.uid, role: args.role, testAccount,
      mode: args.execute ? 'execute' : 'dry-run', confirmation: phrase }, null, 2));
    if (!args.execute) return;
    let supplied = args.confirm;
    if (supplied === undefined && stdin.isTTY) {
      const prompt = createInterface({ input: stdin, output: stdout });
      try { supplied = await prompt.question(`Type ${phrase}\n> `); }
      finally { prompt.close(); }
    }
    if (supplied !== phrase) throw new Error('Typed confirmation does not match.');
    const current = await auth.getUser(user.uid);
    await operatorMembership(getFirestore(app), auth, current, { role: args.role, actor: 'operator:grant-staff-role', action: 'team-break-glass', testAccount });
    console.log('Role saved. Sign out and sign in again to refresh the user token.');
  } finally {
    await deleteApp(app);
  }
}

main().catch(error => {
  const message = error.code === 'auth/user-not-found' ? 'No existing user has that email. Create the account in the Firebase console first.' : error.message;
  console.error(`Role assignment stopped: ${message}`);
  process.exitCode = 1;
});
