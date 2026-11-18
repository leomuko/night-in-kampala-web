export const resetEmailThrottleKey = 'nk-admin-reset-next-at-v1';
const interval = 60_000;
let memoryUntil = 0;

// Best-effort browser cooldown, not a substitute for Firebase's own limits.
// Only a timestamp is retained: never an email, setup link or password.
export function takeResetEmailTurn(now = Date.now()) {
  let stored = 0;
  try { stored = Number(localStorage.getItem(resetEmailThrottleKey)); } catch { /* Use memory when storage is unavailable. */ }
  const candidates = [stored, memoryUntil].filter(value => Number.isFinite(value) && value <= now + interval);
  if (candidates.some(value => value > now)) return false;
  memoryUntil = now + interval;
  try { localStorage.setItem(resetEmailThrottleKey, String(memoryUntil)); } catch { /* The current page still throttles. */ }
  return true;
}
