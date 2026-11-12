import { getFirebaseApp, getFirebaseRuntime } from './firebaseApp.js';
import { connectLocalFirebase } from './localFirebase.js';

let cloudServices;
export async function getFirebaseServices() {
  if (getFirebaseRuntime().mode === 'emulator') {
    const { app, auth, db, storage } = await connectLocalFirebase();
    return { app, auth, db, storage };
  }
  if (!cloudServices) {
    cloudServices = (async () => {
      const app = getFirebaseApp();
      const [auth, firestore, storage] = await Promise.all([
        import('firebase/auth'), import('firebase/firestore'), import('firebase/storage'),
      ]);
      return { app, auth: auth.getAuth(app), db: firestore.getFirestore(app), storage: storage.getStorage(app) };
    })().catch(error => { cloudServices = undefined; throw error; });
  }
  return cloudServices;
}

export async function getFirebaseFunctions() {
  if (getFirebaseRuntime().mode === 'emulator') return (await connectLocalFirebase()).functions;
  const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION;
  if (!region || !/^[a-z]+-[a-z]+\d+$/.test(region)) {
    throw new Error('Configure the approved VITE_FIREBASE_FUNCTIONS_REGION before using cloud Functions.');
  }
  const { getFunctions } = await import('firebase/functions');
  return getFunctions(getFirebaseApp(), region);
}
