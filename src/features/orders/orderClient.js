import { emulatorOrderCheck } from '../../../functions/order-model.js';
import { getFirebaseApp, getFirebaseRuntime } from '../../services/firebaseApp.js';
import { getFirebaseFunctions } from '../../services/firebase.js';

let appCheck;
export async function createOrder(data) {
  const { mode } = getFirebaseRuntime();
  if (mode === 'cloud') {
    const siteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY;
    if (!siteKey) throw new Error('Order submission is being configured.');
    appCheck ??= import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) =>
      initializeAppCheck(getFirebaseApp(), { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true }),
    ).catch(error => { appCheck = undefined; throw error; });
    await appCheck;
  }
  const [{ httpsCallable }, functions] = await Promise.all([import('firebase/functions'), getFirebaseFunctions()]);
  const request = mode === 'emulator' ? { ...data, emulatorCheck: emulatorOrderCheck } : data;
  return (await httpsCallable(functions, 'orderCreate')(request)).data;
}
