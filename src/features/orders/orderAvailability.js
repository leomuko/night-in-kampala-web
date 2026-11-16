import { getFirebaseRuntime } from '../../services/firebaseApp.js';

export function isOrderingOpen() {
  const { mode } = getFirebaseRuntime();
  if (mode === 'emulator') return true;
  const key = import.meta.env.VITE_APP_CHECK_SITE_KEY?.trim();
  const proxyHops = import.meta.env.VITE_ORDER_TRUSTED_PROXY_HOPS;
  return mode === 'cloud' && Boolean(key && key !== 'REPLACE') && /^[1-5]$/.test(proxyHops ?? '')
    && import.meta.env.VITE_ORDER_PROXY_VERIFIED === 'true';
}
