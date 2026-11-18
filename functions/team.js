import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { boundedText } from './catalogue-drafts.js';
import { activeMember } from './team-identity.js';
import { memberClaims, memberAudit } from './team-membership.js';
import { checkTeamOwner, protectLastOwner, withTeamLock } from './team-lock.js';

const stamp = () => FieldValue.serverTimestamp();
function roleValue(role) {
  if (!['owner', 'staff'].includes(role)) throw new HttpsError('invalid-argument', 'Choose Owner or Staff.');
  return role;
}
function targetUid(uid) {
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new HttpsError('invalid-argument', 'Choose a team member.');
  return uid;
}
function invitation(data) {
  const name = boundedText(data?.name, 100, 'Name');
  const email = boundedText(data?.email, 254, 'Email').toLowerCase();
  if (!name || [...name].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'Enter a name and a valid email address.');
  }
  if (data.grantExisting !== undefined && typeof data.grantExisting !== 'boolean') throw new HttpsError('invalid-argument', 'Confirm the existing account choice.');
  return { name, email, role: roleValue(data?.role) };
}
async function audit(db, actor, target, action, before, after, outcome = 'complete') {
  await db.collection('auditLogs').add({ actorUid: actor.uid, targetUid: target, action, before, after, outcome, at: stamp() });
}
async function quota(db) {
  const ref = db.doc(`teamInviteLimits/${new Date().toISOString().slice(0, 10)}`);
  await db.runTransaction(async tx => {
    const count = (await tx.get(ref)).data()?.count ?? 0;
    if (count >= 20) throw new HttpsError('resource-exhausted', 'The team invitation limit of 20 per day has been reached. Try tomorrow.');
    tx.set(ref, { count: count + 1, updatedAt: stamp() });
  });
}
async function sync(db, auth, actor, uid, previous, next, action) {
  const ref = db.doc(`staffMembers/${uid}`);
  await db.runTransaction(async tx => {
    await checkTeamOwner(tx, db, actor);
    await protectLastOwner(tx, db, previous, next);
    tx.set(ref, { ...next, accessPending: true });
  });
  try {
    const user = await auth.getUser(uid);
    if (next.status === 'suspended') await auth.updateUser(uid, { disabled: true });
    await auth.setCustomUserClaims(uid, memberClaims(user.customClaims, { ...next, accessPending: false }));
    if (next.status === 'active') await auth.updateUser(uid, { disabled: false });
    await auth.revokeRefreshTokens(uid);
    const batch = db.batch();
    batch.update(ref, { accessPending: false });
    batch.create(db.collection('auditLogs').doc(), { actorUid: actor.uid, targetUid: uid, action,
      before: memberAudit(previous), after: memberAudit({ ...next, accessPending: false }), outcome: 'complete', at: stamp() });
    await batch.commit();
  } catch {
    // Never roll back to granting access after a partially successful Auth edit.
    await ref.update({ status: 'suspended', accessPending: true, suspendedAt: stamp(), suspendedBy: actor.uid });
    await auth.updateUser(uid, { disabled: true }).catch(() => {});
    await audit(db, actor, uid, action, memberAudit(previous), memberAudit({ ...next, status: 'suspended', accessPending: true }), 'blocked');
    throw new HttpsError('unavailable', 'The access update did not finish. This member is blocked. Retry Reactivate to finish safely.');
  }
}

export async function inviteStaff(db, auth, origin, data, actor) {
  const fields = invitation(data);
  return withTeamLock(db, actor, async () => {
    let user;
    try { user = await auth.getUserByEmail(fields.email); }
    catch (error) { if (error.code !== 'auth/user-not-found') throw new HttpsError('unavailable', 'Could not check this email. Try again.'); }
    const existing = user ? (await db.doc(`staffMembers/${user.uid}`).get()).data() : null;
    if (existing) {
      await audit(db, actor, user.uid, 'staff-invite-existing-member', memberAudit(existing), memberAudit(existing));
      return { existingMember: true, email: fields.email, uid: user.uid };
    }
    if (user && data.grantExisting !== true) {
      await audit(db, actor, user.uid, 'staff-invite-existing-choice', null, null);
      return { needsGrant: true, email: fields.email, uid: user.uid };
    }
    await quota(db);
    if (!user) {
      try { user = await auth.createUser({ uid: randomUUID(), email: fields.email, displayName: fields.name, disabled: true }); }
      catch (error) {
        if (error.code === 'auth/email-already-exists') return { needsGrant: true, email: fields.email };
        throw new HttpsError('unavailable', 'Could not create the account. Check the email and try again.');
      }
    }
    const member = { ...fields, status: 'active', accessVersion: 1, accessPending: true,
      createdAt: stamp(), createdBy: actor.uid, updatedAt: stamp(), updatedBy: actor.uid };
    await sync(db, auth, actor, user.uid, null, member, 'staff-invite');
    let setupLink = null;
    try { setupLink = await auth.generatePasswordResetLink(fields.email, { url: `${origin}/admin` }); }
    catch { /* The client still attempts the built-in email. Never log an action link or a raw Auth error. */ }
    return { uid: user.uid, email: fields.email, setupLink,
      ...(setupLink ? {} : { linkError: 'Access was added, but a setup link could not be generated. Use the setup email or contact the owner.' }) };
  });
}

export async function changeStaff(db, auth, data, actor, action) {
  const uid = targetUid(data?.uid);
  const newRole = action === 'role' ? roleValue(data?.role) : null;
  if (actor.uid === uid && (action === 'suspend' || (action === 'role' && newRole !== 'owner'))) {
    throw new HttpsError('failed-precondition', 'You cannot suspend or demote yourself.');
  }
  return withTeamLock(db, actor, async () => {
    const previous = (await db.doc(`staffMembers/${uid}`).get()).data();
    if (!previous) throw new HttpsError('not-found', 'This team member was not found.');
    if (action === 'role' && previous.role === newRole && previous.accessPending !== true) {
      await audit(db, actor, uid, 'staff-role-unchanged', memberAudit(previous), memberAudit(previous));
      return { uid, role: previous.role, status: previous.status, unchanged: true };
    }
    const next = { ...previous, ...(newRole ? { role: newRole } : {}),
      status: action === 'suspend' ? 'suspended' : action === 'reactivate' ? 'active' : previous.status,
      accessVersion: previous.accessVersion + 1, accessPending: true, updatedAt: stamp(), updatedBy: actor.uid,
      ...(action === 'suspend' ? { suspendedAt: stamp(), suspendedBy: actor.uid } : {}),
    };
    await sync(db, auth, actor, uid, previous, next, `staff-${action}`);
    return { uid, role: next.role, status: next.status };
  });
}

export async function listStaff(db, auth, data, actor) {
  if (actor.role !== 'owner') throw new HttpsError('permission-denied', 'Owner access is required.');
  const after = data?.after;
  if (after !== undefined && (typeof after !== 'string' || after.length > 254)) throw new HttpsError('invalid-argument', 'Invalid team page.');
  let query = db.collection('staffMembers').orderBy('email').limit(50);
  if (after) query = query.startAfter(after);
  const [page, owners] = await Promise.all([query.get(), db.collection('staffMembers').where('role', '==', 'owner').get()]);
  const accounts = page.empty ? [] : (await auth.getUsers(page.docs.map(row => ({ uid: row.id })))).users;
  const byId = new Map(accounts.map(u => [u.uid, u]));
  await audit(db, actor, '*', 'staff-list', null, { count: page.size });
  return { rows: page.docs.map(row => { const m = row.data(), user = byId.get(row.id); return {
    uid: row.id, name: m.name, email: m.email, role: m.role, status: m.status,
    accessPending: m.accessPending === true, lastSignInAt: user?.metadata.lastSignInTime ?? null, authMissing: !user,
  }; }), cursor: page.size === 50 ? page.docs.at(-1).data().email : null,
  activeOwnerCount: owners.docs.filter(row => activeMember(row.data())).length };
}
