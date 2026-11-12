import { afterEach, expect, test, vi } from 'vitest';
import { deleteApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig.js';

afterEach(() => { vi.unstubAllEnvs(); });

test('real Firebase app initialization is idempotent for the registered app', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  vi.stubEnv('VITE_FIREBASE_TARGET', 'production');
  vi.stubEnv('VITE_FIREBASE_CONFIG', JSON.stringify(firebaseConfig));
  const { getFirebaseApp } = await import('./firebaseApp.js');
  const first = getFirebaseApp();
  expect(first.options.projectId).toBe('night-in-kampala');
  expect(getFirebaseApp()).toBe(first);
  await deleteApp(first);
});

test('an offline preview does not initialise any Firebase app', async () => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_FIREBASE_TARGET', undefined);
  const { getFirebaseApp } = await import('./firebaseApp.js');
  expect(getFirebaseApp()).toBeNull();
});

test('real Firebase initialization uses the demo project by default in development', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', undefined);
  const { getFirebaseApp } = await import('./firebaseApp.js');
  const app = getFirebaseApp();
  expect(app.options.projectId).toBe('demo-night-in-kampala');
  await deleteApp(app);
});
