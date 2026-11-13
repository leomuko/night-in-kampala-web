// Synthetic browser identification for tests that never contact Firebase.
export const fixtureFirebaseConfig = Object.freeze({
  apiKey: 'test-only-api-key',
  projectId: 'nik-example-production',
  authDomain: 'nik-example-production.firebaseapp.com',
  storageBucket: 'nik-example-production.firebasestorage.app',
  messagingSenderId: '000000000000',
  appId: 'test-only-app-id',
  measurementId: 'G-TESTONLY',
});
