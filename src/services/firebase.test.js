import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  getAuth: vi.fn(), getFirestore: vi.fn(), getStorage: vi.fn(), getFunctions: vi.fn(),
  connectAuthEmulator: vi.fn(), connectFirestoreEmulator: vi.fn(), connectStorageEmulator: vi.fn(), connectFunctionsEmulator: vi.fn(),
}));
vi.mock('firebase/auth', () => ({ getAuth: sdk.getAuth, connectAuthEmulator: sdk.connectAuthEmulator }));
vi.mock('firebase/firestore', () => ({ getFirestore: sdk.getFirestore, connectFirestoreEmulator: sdk.connectFirestoreEmulator }));
vi.mock('firebase/storage', () => ({ getStorage: sdk.getStorage, connectStorageEmulator: sdk.connectStorageEmulator }));
vi.mock('firebase/functions', () => ({ getFunctions: sdk.getFunctions, connectFunctionsEmulator: sdk.connectFunctionsEmulator }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sdk.getAuth.mockImplementation(app => ({ kind: 'auth', app }));
  sdk.getFirestore.mockImplementation(app => ({ kind: 'db', app }));
  sdk.getStorage.mockImplementation(app => ({ kind: 'storage', app }));
  sdk.getFunctions.mockImplementation((app, region) => ({ kind: 'functions', app, region }));
});
afterEach(() => { vi.unstubAllEnvs(); });

test('cloud clients use the supplied app and never attach emulator endpoints', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  const { getFirebaseServices } = await import('./firebase.js');
  const [first, concurrent] = await Promise.all([getFirebaseServices(), getFirebaseServices()]);
  expect(first).toBe(concurrent);
  expect(first.app.options.projectId).toBe('night-in-kampala');
  expect(first.auth.app).toBe(first.app);
  expect(first.db.app).toBe(first.app);
  expect(first.storage.app).toBe(first.app);
  expect(sdk.connectAuthEmulator).not.toHaveBeenCalled();
  expect(sdk.getFunctions).not.toHaveBeenCalled();
});

test('development clients use all local endpoints exactly once on concurrent calls', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', undefined);
  const { getFirebaseServices } = await import('./firebase.js');
  const [first, second] = await Promise.all([getFirebaseServices(), getFirebaseServices()]);
  expect(first.app).toBe(second.app);
  expect(first.app.options.projectId).toBe('demo-night-in-kampala');
  expect(sdk.connectAuthEmulator).toHaveBeenCalledExactlyOnceWith(first.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  expect(sdk.connectFirestoreEmulator).toHaveBeenCalledExactlyOnceWith(first.db, '127.0.0.1', 8080);
  expect(sdk.connectStorageEmulator).toHaveBeenCalledExactlyOnceWith(first.storage, '127.0.0.1', 9199);
  expect(sdk.connectFunctionsEmulator).toHaveBeenCalledTimes(1);
});

test('cloud Functions refuses to silently choose a region', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  vi.stubEnv('VITE_FIREBASE_FUNCTIONS_REGION', undefined);
  const { getFirebaseFunctions } = await import('./firebase.js');
  await expect(getFirebaseFunctions()).rejects.toThrow(/approved VITE_FIREBASE_FUNCTIONS_REGION/);
  expect(sdk.getFunctions).not.toHaveBeenCalled();
});

test('cloud Functions receives only the explicitly configured region', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  vi.stubEnv('VITE_FIREBASE_FUNCTIONS_REGION', 'europe-west1'); // Test input, not the deployment decision.
  const { getFirebaseFunctions } = await import('./firebase.js');
  expect((await getFirebaseFunctions()).region).toBe('europe-west1');
});
