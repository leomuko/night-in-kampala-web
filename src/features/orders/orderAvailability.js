import { getFirebaseRuntime } from '../../services/firebaseApp.js';

export function isOrderingOpen() {
  const { mode } = getFirebaseRuntime();
  if (mode === 'emulator') return true;
  const key = import.meta.env.VITE_APP_CHECK_SITE_KEY?.trim();
  return mode === 'cloud' && Boolean(key && key !== 'REPLACE');
}
