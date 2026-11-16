import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { getFirebaseServices } from '../../services/firebase.js';

export function useStaffSession() {
  const [session, setSession] = useState({ status: 'loading' });
  useEffect(() => {
    let active = true;
    let unsubscribe;
    let revision = 0;
    getFirebaseServices().then(({ auth }) => {
      if (!active) return;
      unsubscribe = onIdTokenChanged(auth, async user => {
        const current = ++revision;
        try {
          const claims = user ? (await user.getIdTokenResult()).claims : {};
          if (!active || current !== revision) return;
          const role = claims.owner === true ? 'owner' : claims.staff === true ? 'staff' : null;
          setSession({ status: 'ready', auth, user, role });
        } catch {
          if (active && current === revision) setSession({ status: 'error' });
        }
      });
    }).catch(() => { if (active) setSession({ status: 'error' }); });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  return session;
}
