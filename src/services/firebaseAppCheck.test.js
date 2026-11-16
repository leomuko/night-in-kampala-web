import { afterEach, expect, test, vi } from 'vitest';
import { getFirebaseApp, getFirebaseRuntime } from './firebaseApp.js';
import { initializeFirebaseAppCheck } from './firebaseAppCheck.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

vi.mock('./firebaseApp.js', () => ({ getFirebaseApp: vi.fn(), getFirebaseRuntime: vi.fn() }));
vi.mock('firebase/app-check', () => ({
  initializeAppCheck: vi.fn(() => ({ fixture: true })),
  ReCaptchaEnterpriseProvider: vi.fn(class { constructor(key) { this.key = key; } }),
}));
afterEach(() => vi.unstubAllEnvs());

test('cloud App Check stays uninitialized without a real site key and in emulator mode', async () => {
  getFirebaseRuntime.mockReturnValue({ mode: 'cloud' });
  vi.stubEnv('VITE_APP_CHECK_SITE_KEY', '');
  expect(await initializeFirebaseAppCheck()).toBeNull();
  vi.stubEnv('VITE_APP_CHECK_SITE_KEY', 'REPLACE');
  expect(await initializeFirebaseAppCheck()).toBeNull();
  getFirebaseRuntime.mockReturnValue({ mode: 'emulator' });
  vi.stubEnv('VITE_APP_CHECK_SITE_KEY', 'fixture-site-key');
  expect(await initializeFirebaseAppCheck()).toBeNull();
  expect(initializeAppCheck).not.toHaveBeenCalled();
});

test('cloud App Check initializes the Enterprise provider once with automatic token refresh', async () => {
  getFirebaseRuntime.mockReturnValue({ mode: 'cloud' });
  const app = { fixture: true };
  getFirebaseApp.mockReturnValue(app);
  vi.stubEnv('VITE_APP_CHECK_SITE_KEY', 'fixture-site-key');
  const first = await initializeFirebaseAppCheck();
  expect(await initializeFirebaseAppCheck()).toBe(first);
  expect(ReCaptchaEnterpriseProvider).toHaveBeenCalledExactlyOnceWith('fixture-site-key');
  expect(initializeAppCheck).toHaveBeenCalledExactlyOnceWith(app, {
    provider: expect.any(ReCaptchaEnterpriseProvider), isTokenAutoRefreshEnabled: true,
  });
  expect(window.FIREBASE_APPCHECK_DEBUG_TOKEN).toBeUndefined();
});
