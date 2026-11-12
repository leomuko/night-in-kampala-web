import { getFirebaseApp, getFirebaseRuntime } from './firebaseApp.js';

const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
const analyticsOnly = { ...denied, analytics_storage: 'granted' };
let analyticsState;

// Call from a future consent control, never unconditionally at page startup.
export async function enableFirebaseAnalytics({ consentGranted = false } = {}) {
  if (!consentGranted || import.meta.env.VITE_ENABLE_ANALYTICS !== 'true' || import.meta.env.DEV || typeof window === 'undefined' || getFirebaseRuntime().mode !== 'cloud') return null;
  if (!analyticsState) {
    analyticsState = (async () => {
      const sdk = await import('firebase/analytics');
      if (!await sdk.isSupported()) return null;
      sdk.setConsent(analyticsOnly);
      return { sdk, instance: sdk.getAnalytics(getFirebaseApp()) };
    })().catch(() => { analyticsState = undefined; return null; });
  }
  const state = await analyticsState;
  if (!state) return null;
  state.sdk.setConsent(analyticsOnly);
  state.sdk.setAnalyticsCollectionEnabled(state.instance, true);
  return state.instance;
}

export async function disableFirebaseAnalytics() {
  // Do not load Analytics merely to disable it.
  const state = await analyticsState;
  if (!state) return;
  state.sdk.setConsent(denied);
  state.sdk.setAnalyticsCollectionEnabled(state.instance, false);
}
