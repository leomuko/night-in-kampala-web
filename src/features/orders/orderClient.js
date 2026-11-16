import { emulatorOrderCheck } from '../../../functions/order-model.js';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { initializeFirebaseAppCheck } from '../../services/firebaseAppCheck.js';
import { getFirebaseFunctions } from '../../services/firebase.js';
import { isOrderingOpen } from './orderAvailability.js';

export async function createOrder(data) {
  if (!isOrderingOpen()) throw new Error('Ordering opens soon.');
  const { mode } = getFirebaseRuntime();
  if (mode === 'cloud') {
    await initializeFirebaseAppCheck();
  }
  const [{ httpsCallable }, functions] = await Promise.all([import('firebase/functions'), getFirebaseFunctions()]);
  const request = mode === 'emulator' ? { ...data, emulatorCheck: emulatorOrderCheck } : data;
  return (await httpsCallable(functions, 'orderCreate')(request)).data;
}
