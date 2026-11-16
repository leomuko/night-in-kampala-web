import { getFirebaseApp, getFirebaseRuntime } from './firebaseApp.js';

let initialized;

export async function initializeFirebaseAppCheck() {
  const siteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY?.trim();
  if (getFirebaseRuntime().mode !== 'cloud' || !siteKey || siteKey === 'REPLACE') return null;
  initialized ??= import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) =>
    initializeAppCheck(getFirebaseApp(), {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    }),
  ).catch(error => { initialized = undefined; throw error; });
  return initialized;
}
