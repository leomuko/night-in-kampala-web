import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const [projectId, role] = process.argv.slice(2);
if (projectId !== 'demo-night-in-kampala' || !['staff', 'owner', 'customer'].includes(role)
  || (process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099')
  || (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== projectId)) {
  throw new Error('Use the demo project and a staff, owner or customer role on loopback.');
}
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Use loopback Firestore.');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.METADATA_SERVER_DETECTION = 'none';
const app = initializeApp({ projectId });
try {
  const suffix = randomBytes(6).toString('hex');
  const email = `${role}-${suffix}@example.test`;
  const password = randomBytes(18).toString('base64url');
  const auth = getAuth(app);
  const { uid } = await auth.createUser({ email, password });
  await auth.setCustomUserClaims(uid, { testAccount: true, ...(role === 'customer' ? {} : { [role]: true, staffVersion: 1 }) });
  if (role !== 'customer') await getFirestore(app).doc(`staffMembers/${uid}`).set({ name: 'Local demo', email, role, status: 'active', accessVersion: 1, accessPending: false });
  console.log(JSON.stringify({ email, password, uid }));
} finally {
  await deleteApp(app);
}
