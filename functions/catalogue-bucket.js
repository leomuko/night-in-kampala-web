import { getStorage } from 'firebase-admin/storage';

export function catalogueBucket(app, runtime) {
  if (runtime.emulator) {
    const { FIREBASE_STORAGE_EMULATOR_HOST, STORAGE_EMULATOR_HOST } = process.env;
    if (FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9199'
      || (STORAGE_EMULATOR_HOST && STORAGE_EMULATOR_HOST !== 'http://127.0.0.1:9199')) {
      throw new Error('Catalogue media requires the Storage emulator on loopback.');
    }
    return getStorage(app).bucket(`${runtime.projectId}.appspot.com`);
  }
  const allowed = [`${runtime.projectId}.firebasestorage.app`, `${runtime.projectId}.appspot.com`];
  if (!allowed.includes(runtime.storageBucket) || process.env.STORAGE_EMULATOR_HOST) {
    throw new Error('An explicit matching Storage bucket is required.');
  }
  return getStorage(app).bucket(runtime.storageBucket);
}
