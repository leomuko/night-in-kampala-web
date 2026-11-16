import { HttpsError, onCall } from 'firebase-functions/v2/https';

export function staffRole(claims) {
  if (claims?.owner === true) return 'owner';
  if (claims?.staff === true) return 'staff';
  return null;
}

export function staffCallable(runtime, handler) {
  return onCall({ region: runtime.region, maxInstances: 3 }, request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.');
    const role = staffRole(request.auth.token);
    if (!role) throw new HttpsError('permission-denied', 'Staff access is required.');
    return handler(request.data, { uid: request.auth.uid, role });
  });
}
