import { useEffect, useState } from 'react';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseServices } from '../../services/firebase.js';
import { matchesMember } from '../../../functions/team-identity.js';

// Observe the caller's own membership even while suspended. Rules deliberately
// permit that single read so access can disappear without waiting for token expiry.
export function observeStaffSession({ auth, db }, publish) {
  let active = true, stopMember, generation = 0;
  const stopAuth = onIdTokenChanged(auth, async user => {
    stopMember?.();
    const current = ++generation;
    if (!user) { publish({ status: 'ready', auth, user: null, role: null }); return; }
    publish({ status: 'loading' });
    let token;
    try { token = await user.getIdTokenResult(); }
    catch { if (active && current === generation) publish({ status: 'error' }); return; }
    if (!active || current !== generation) return;
    let refreshing = false;
    async function deny() {
      if (!active || current !== generation) return;
      publish({ status: 'ready', auth, user, role: null });
      try { await signOut(auth); } catch { /* Access is already hidden and server-denied. */ }
    }
    stopMember = onSnapshot(doc(db, 'staffMembers', user.uid), { includeMetadataChanges: true }, async snapshot => {
      if (!active || current !== generation) return;
      if (snapshot.metadata?.fromCache) { publish({ status: 'loading' }); return; }
      const member = snapshot.data();
      if (!member || member.status !== 'active' || member.accessPending === true) { await deny(); return; }
      if (!matchesMember(token.claims, member)) {
        if (refreshing) return;
        refreshing = true;
        try {
          // Initial migration / changed roles need new claims; never expose the
          // dashboard based on stale claims while the refresh is in progress.
          token = await user.getIdTokenResult(true);
          if (!active || current !== generation) return;
          if (!matchesMember(token.claims, member)) { await deny(); return; }
        } catch { await deny(); return; }
        finally { refreshing = false; }
      }
      if (active && current === generation) publish({ status: 'ready', auth, user, role: member.role });
    }, deny);
  });
  return () => { active = false; generation++; stopMember?.(); stopAuth(); };
}

export function useStaffSession() {
  const [session, setSession] = useState({ status: 'loading' });
  useEffect(() => {
    let active = true, stop;
    getFirebaseServices().then(services => {
      if (active) stop = observeStaffSession(services, setSession);
    }).catch(() => { if (active) setSession({ status: 'error' }); });
    return () => { active = false; stop?.(); };
  }, []);
  return session;
}
