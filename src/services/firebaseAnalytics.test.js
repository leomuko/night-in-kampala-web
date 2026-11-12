import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { firebaseConfig } from './firebaseConfig.js';

const sdk = vi.hoisted(() => ({ isSupported: vi.fn(), getAnalytics: vi.fn(), setConsent: vi.fn(), setAnalyticsCollectionEnabled: vi.fn() }));
vi.mock('firebase/analytics', () => sdk);
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  sdk.isSupported.mockResolvedValue(true);
  sdk.getAnalytics.mockReturnValue({ kind: 'analytics' });
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  vi.stubEnv('VITE_FIREBASE_TARGET', 'production');
  vi.stubEnv('VITE_FIREBASE_CONFIG', JSON.stringify(firebaseConfig));
  vi.stubEnv('VITE_ENABLE_ANALYTICS', 'true');
});
afterEach(() => { vi.unstubAllEnvs(); });

test.each(['no-consent', 'disabled', 'development'])('Analytics stays uninitialized: %s', async reason => {
  if (reason === 'disabled') vi.stubEnv('VITE_ENABLE_ANALYTICS', 'false');
  if (reason === 'development') vi.stubEnv('DEV', true);
  const { enableFirebaseAnalytics } = await import('./firebaseAnalytics.js');
  expect(await enableFirebaseAnalytics({ consentGranted: reason !== 'no-consent' })).toBeNull();
  expect(sdk.isSupported).not.toHaveBeenCalled();
  expect(sdk.getAnalytics).not.toHaveBeenCalled();
});

test('unsupported browsers do not initialize Analytics', async () => {
  sdk.isSupported.mockResolvedValue(false);
  const { enableFirebaseAnalytics } = await import('./firebaseAnalytics.js');
  expect(await enableFirebaseAnalytics({ consentGranted: true })).toBeNull();
  expect(sdk.getAnalytics).not.toHaveBeenCalled();
});

test('consent enables supported Analytics and withdrawal disables collection', async () => {
  const { enableFirebaseAnalytics, disableFirebaseAnalytics } = await import('./firebaseAnalytics.js');
  const analytics = await enableFirebaseAnalytics({ consentGranted: true });
  expect(analytics).toEqual({ kind: 'analytics' });
  expect(sdk.setConsent).toHaveBeenCalledWith(expect.objectContaining({ analytics_storage: 'granted', ad_storage: 'denied' }));
  await disableFirebaseAnalytics();
  expect(sdk.setConsent).toHaveBeenLastCalledWith(expect.objectContaining({ analytics_storage: 'denied' }));
  expect(sdk.setAnalyticsCollectionEnabled).toHaveBeenLastCalledWith(analytics, false);
});

test('a failed optional Analytics initialization does not break the store', async () => {
  sdk.isSupported.mockRejectedValue(new Error('IndexedDB unavailable'));
  const { enableFirebaseAnalytics } = await import('./firebaseAnalytics.js');
  expect(await enableFirebaseAnalytics({ consentGranted: true })).toBeNull();
});
