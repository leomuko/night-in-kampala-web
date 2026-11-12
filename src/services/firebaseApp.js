import { getApps, initializeApp } from 'firebase/app';
import { resolveFirebaseRuntime } from './firebaseConfig.js';

export function getFirebaseRuntime() {
  return resolveFirebaseRuntime({
    development: import.meta.env.DEV,
    useEmulators: import.meta.env.VITE_USE_EMULATORS,
    hostname: typeof window === 'undefined' ? '' : window.location.hostname,
  });
}

export function getFirebaseApp() {
  const { name, config } = getFirebaseRuntime();
  const existing = getApps().find(app => app.name === name);
  if (existing) {
    if (Object.entries(config).some(([key, value]) => existing.options[key] !== value)) {
      throw new Error('Firebase configuration changed. Reload the page to use the new configuration.');
    }
    return existing;
  }
  return initializeApp(config, name);
}
