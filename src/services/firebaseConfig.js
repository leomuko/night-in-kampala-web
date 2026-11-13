export const PROTECTED_PROJECT_ID = 'night-in-kampala';

export const demoFirebaseConfig = Object.freeze({
  apiKey: 'demo-key',
  projectId: 'demo-night-in-kampala',
  storageBucket: 'demo-night-in-kampala.appspot.com',
  authDomain: 'localhost',
});

export function resolveFirebaseRuntime({ development, useEmulators, hostname, target, cloudConfig }) {
  if (target !== undefined && !['preview', 'staging', 'production'].includes(target)) throw new Error('VITE_FIREBASE_TARGET must be preview, staging or production.');
  if (useEmulators !== undefined && !['true', 'false'].includes(useEmulators)) {
    throw new Error('VITE_USE_EMULATORS must be true, false, or unset.');
  }
  const emulator = useEmulators === 'true' || (development && useEmulators !== 'false');
  if (emulator && (!development || !['localhost', '127.0.0.1', '[::1]'].includes(hostname))) {
    throw new Error('Firebase emulators require a development build on loopback.');
  }
  if (emulator) return { mode: 'emulator', name: 'local-foundations', config: demoFirebaseConfig };
  if (!target || target === 'preview') return { mode: 'preview', name: 'offline-preview', config: null };
  const config = typeof cloudConfig === 'string' ? JSON.parse(cloudConfig) : cloudConfig;
  if (!config || ['apiKey', 'projectId', 'authDomain', 'storageBucket', 'appId', 'messagingSenderId'].some(key => typeof config[key] !== 'string' || !config[key])) {
    throw new Error('An explicit complete VITE_FIREBASE_CONFIG is required for each cloud target.');
  }
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(config.projectId) || config.projectId.startsWith('demo-')) throw new Error('Invalid cloud project ID.');
  if (target === 'staging' && config.projectId === PROTECTED_PROJECT_ID) throw new Error('Staging cannot use the protected registered project; configure a separate staging project.');
  if (config.authDomain !== `${config.projectId}.firebaseapp.com` || ![`${config.projectId}.appspot.com`, `${config.projectId}.firebasestorage.app`].includes(config.storageBucket)) {
    throw new Error('Auth and Storage must belong to the explicitly selected project.');
  }
  return { mode: 'cloud', target, name: `night-in-kampala-${target}`, config: Object.freeze({ ...config }) };
}
