// Firebase web configuration is public client identification, not an Admin credential.
export const firebaseConfig = Object.freeze({
  apiKey: 'AIzaSyDsFCZSfWppfS3DSMYcrVh1WeTYyHw1T6M',
  authDomain: 'night-in-kampala.firebaseapp.com',
  projectId: 'night-in-kampala',
  storageBucket: 'night-in-kampala.firebasestorage.app',
  messagingSenderId: '1097680313454',
  appId: '1:1097680313454:web:d17294460797935ec8da7f',
  measurementId: 'G-FVHHV82J6F',
});

export const demoFirebaseConfig = Object.freeze({
  apiKey: 'demo-key',
  projectId: 'demo-night-in-kampala',
  storageBucket: 'demo-night-in-kampala.appspot.com',
  authDomain: 'localhost',
});

export function resolveFirebaseRuntime({ development, useEmulators, hostname }) {
  if (useEmulators !== undefined && !['true', 'false'].includes(useEmulators)) {
    throw new Error('VITE_USE_EMULATORS must be true, false, or unset.');
  }
  const emulator = useEmulators === 'true' || (development && useEmulators !== 'false');
  if (emulator && (!development || !['localhost', '127.0.0.1', '[::1]'].includes(hostname))) {
    throw new Error('Firebase emulators require a development build on loopback.');
  }
  return emulator
    ? { mode: 'emulator', name: 'local-foundations', config: demoFirebaseConfig }
    : { mode: 'cloud', name: 'night-in-kampala-web', config: firebaseConfig };
}
