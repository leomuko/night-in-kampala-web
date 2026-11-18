import { afterEach, beforeEach, expect, test, vi } from 'vitest';
beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.restoreAllMocks(); });
test('one request is reserved per minute and survives a page/module reload without storing identity', async () => {
  let helper = await import('./resetEmailThrottle.js');
  expect(helper.takeResetEmailTurn(100_000)).toBe(true);
  expect(localStorage.getItem(helper.resetEmailThrottleKey)).toBe('160000');
  vi.resetModules(); helper = await import('./resetEmailThrottle.js');
  expect(helper.takeResetEmailTurn(159_999)).toBe(false);
  expect(helper.takeResetEmailTurn(160_000)).toBe(true);
});
test('storage failures retain an in-memory cooldown', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  const { takeResetEmailTurn } = await import('./resetEmailThrottle.js');
  expect(takeResetEmailTurn(100_000)).toBe(true); expect(takeResetEmailTurn(100_001)).toBe(false);
  expect(takeResetEmailTurn(160_000)).toBe(true);
});
test('corrupted or far-future cooldown data does not trap a browser indefinitely', async () => {
  const { takeResetEmailTurn, resetEmailThrottleKey } = await import('./resetEmailThrottle.js');
  localStorage.setItem(resetEmailThrottleKey, 'not-a-timestamp'); expect(takeResetEmailTurn(100_000)).toBe(true);
  vi.resetModules(); const fresh = await import('./resetEmailThrottle.js');
  localStorage.setItem(resetEmailThrottleKey, '999999999999999'); expect(fresh.takeResetEmailTurn(200_000)).toBe(true);
});
