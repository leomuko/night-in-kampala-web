import { afterEach, expect, test, vi } from 'vitest';
import { deleteApp } from 'firebase/app';

afterEach(() => { vi.unstubAllEnvs(); });

test('real Firebase app initialization is idempotent for the registered app', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  const { getFirebaseApp } = await import('./firebaseApp.js');
  const first = getFirebaseApp();
  expect(first.options.projectId).toBe('night-in-kampala');
  expect(getFirebaseApp()).toBe(first);
  await deleteApp(first);
});

test('real Firebase initialization uses the demo project by default in development', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', undefined);
  const { getFirebaseApp } = await import('./firebaseApp.js');
  const app = getFirebaseApp();
  expect(app.options.projectId).toBe('demo-night-in-kampala');
  await deleteApp(app);
});
