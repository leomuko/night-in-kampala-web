import { demoFirebaseConfig } from './firebaseConfig.js';
import { getFirebaseApp } from './firebaseApp.js';

export function localFirebaseSettings({ enabled, development, hostname }) {
  if (!enabled || !development || !['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    throw new Error('Firebase connections are currently restricted to local development emulators.');
  }
  return demoFirebaseConfig;
}

let localServices;
export async function connectLocalFirebase() {
  localFirebaseSettings({ enabled: import.meta.env.VITE_USE_EMULATORS !== 'false', development: import.meta.env.DEV, hostname: window.location.hostname });
  if (!localServices) {
    localServices = (async () => {
      const [auth, firestore, storage, functions] = await Promise.all([
        import('firebase/auth'), import('firebase/firestore'), import('firebase/storage'), import('firebase/functions'),
      ]);
      const app = getFirebaseApp();
      const services = { app, auth: auth.getAuth(app), db: firestore.getFirestore(app), storage: storage.getStorage(app), functions: functions.getFunctions(app) };
      auth.connectAuthEmulator(services.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      firestore.connectFirestoreEmulator(services.db, '127.0.0.1', 8080);
      storage.connectStorageEmulator(services.storage, '127.0.0.1', 9199);
      functions.connectFunctionsEmulator(services.functions, '127.0.0.1', 5001);
      return services;
    })().catch(error => { localServices = undefined; throw error; });
  }
  return localServices;
}
