import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { activeMember } from './team-identity.js';

export async function checkTeamOwner(tx, db, actor) {
  if (actor.operator === true) return;
  const member = (await tx.get(db.doc(`staffMembers/${actor.uid}`))).data();
  if (actor.role !== 'owner' || !activeMember(member) || member.role !== 'owner' || member.accessVersion !== actor.accessVersion) {
    throw new HttpsError('permission-denied', 'Active owner access is required.');
  }
}

// Auth and Firestore cannot share a transaction. Serialize their short updates;
// a failed sync keeps the target blocked. The lease outlives the 60s callable.
export async function withTeamLock(db, actor, operation) {
  const ref = db.doc('teamControl/access'), operationId = randomUUID();
  await db.runTransaction(async tx => {
    await checkTeamOwner(tx, db, actor);
    const lock = (await tx.get(ref)).data();
    if (lock?.operationId && lock.leaseUntil?.toMillis() > Date.now()) throw new HttpsError('aborted', 'Another team change is finishing. Try again shortly.');
    tx.set(ref, { operationId, actorUid: actor.uid, startedAt: FieldValue.serverTimestamp(), leaseUntil: Timestamp.fromMillis(Date.now() + 120000) });
  });
  try { return await operation(); }
  finally {
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).data()?.operationId === operationId) tx.set(ref, { operationId: null });
    });
  }
}

export async function protectLastOwner(tx, db, previous, next) {
  if (!activeMember(previous) || previous.role !== 'owner' || (next.role === 'owner' && next.status === 'active')) return;
  const owners = await tx.get(db.collection('staffMembers').where('role', '==', 'owner'));
  if (owners.docs.filter(row => activeMember(row.data())).length <= 1) throw new HttpsError('failed-precondition', 'The last active owner cannot be suspended or demoted.');
}
