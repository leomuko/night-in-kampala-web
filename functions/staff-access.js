import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { claimRole, matchesMember } from './team-membership.js';

export const staffRole = claimRole;

export async function authorizeStaff(db, auth, request, ownerOnly = false) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.');
  const bearer = request.rawRequest?.headers?.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) throw new HttpsError('unauthenticated', 'Sign in again to continue.');
  let token;
  try { token = await auth.verifyIdToken(bearer, true); }
  catch { throw new HttpsError('unauthenticated', 'Your session ended. Sign in again.'); }
  if (token.uid !== request.auth.uid) throw new HttpsError('unauthenticated', 'Sign in again.');
  const member = (await db.doc(`staffMembers/${token.uid}`).get()).data();
  if (!matchesMember(token, member) || (ownerOnly && member.role !== 'owner')) {
    throw new HttpsError('permission-denied', ownerOnly ? 'Active owner access is required.' : 'Active staff access is required.');
  }
  return { uid: token.uid, role: member.role, accessVersion: member.accessVersion };
}

export function staffCallable(runtime, db, auth, handler, { ownerOnly = false } = {}) {
  return onCall({ region: runtime.region, maxInstances: 3, timeoutSeconds: 60, enforceAppCheck: !runtime.emulator }, async request => {
    const actor = await authorizeStaff(db, auth, request, ownerOnly);
    return handler(request.data, actor);
  });
}
