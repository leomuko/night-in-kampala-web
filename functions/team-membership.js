import { FieldValue } from 'firebase-admin/firestore';
import { activeMember, claimRole, matchesMember } from './team-identity.js';
export { claimRole, activeMember, matchesMember } from './team-identity.js';

export const permanentTeamEmails = new Set(['superadmin@nightinkampala.com', 'fahkerahmed@nightinkampala.com']);
export function memberClaims(existing, member) {
  const claims = { ...existing };
  delete claims.owner; delete claims.staff; delete claims.staffVersion;
  if (activeMember(member)) { claims[member.role] = true; claims.staffVersion = member.accessVersion; }
  return claims;
}
export function memberAudit(member) {
  if (!member) return null;
  return Object.fromEntries(['name', 'email', 'role', 'status', 'accessVersion', 'accessPending'].map(key => [key, member[key] ?? null]));
}

// Explicitly confirmed, authenticated operator tooling only. Callable mutations
// use their separately serialized owner path. Keep historical fields/claims.
export async function operatorMembership(db, auth, user, { role, status = 'active', actor, action, testAccount = false }) {
  if (permanentTeamEmails.has(user.email?.toLowerCase()) && (testAccount || user.customClaims?.testAccount === true)) {
    throw new Error('Real permanent accounts must never be marked as test.');
  }
  const ref = db.doc(`staffMembers/${user.uid}`), previous = (await ref.get()).data();
  const same = previous?.role === role && previous?.status === status && previous?.accessPending !== true
    && (status === 'active' ? matchesMember(user.customClaims, previous) : !claimRole(user.customClaims));
  if (same && (!testAccount || user.customClaims?.testAccount === true)) return { changed: false };
  const member = { ...previous, name: previous?.name || user.displayName || user.email.split('@')[0],
    email: user.email.toLowerCase(), role, status, accessVersion: (previous?.accessVersion ?? 0) + 1, accessPending: true,
    ...(previous ? {} : { createdAt: FieldValue.serverTimestamp(), createdBy: actor }),
    updatedAt: FieldValue.serverTimestamp(), updatedBy: actor,
    ...(status === 'suspended' ? { suspendedAt: FieldValue.serverTimestamp(), suspendedBy: actor } : {}),
  };
  await ref.set(member);
  const next = { ...member, accessPending: false };
  const claims = memberClaims(user.customClaims, next);
  if (testAccount) claims.testAccount = true;
  try {
    await auth.setCustomUserClaims(user.uid, claims);
    if (user.disabled !== (status === 'suspended')) await auth.updateUser(user.uid, { disabled: status === 'suspended' });
    if (previous || status === 'suspended') await auth.revokeRefreshTokens(user.uid);
    const batch = db.batch();
    batch.update(ref, { accessPending: false });
    batch.create(db.collection('auditLogs').doc(), { action, actorUid: actor, targetUid: user.uid,
      before: memberAudit(previous), after: memberAudit(next), at: FieldValue.serverTimestamp() });
    await batch.commit();
    return { changed: true };
  } catch {
    await ref.update({ status: 'suspended', accessPending: true });
    throw new Error('Membership sync did not finish. Access remains blocked; retry the operator command.');
  }
}
