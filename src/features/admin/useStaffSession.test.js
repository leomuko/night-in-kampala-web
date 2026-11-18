import { expect, test, vi } from 'vitest';
import { observeStaffSession } from './useStaffSession.js';
const f = vi.hoisted(() => ({ authCallback: null, memberCallback: null, stopAuth: vi.fn(), stopMember: vi.fn(), signOut: vi.fn() }));
vi.mock('firebase/auth', () => ({
  signOut: f.signOut,
  onIdTokenChanged: (_auth, callback) => { f.authCallback = callback; return f.stopAuth; },
}));
vi.mock('firebase/firestore', () => ({ doc: (...args) => args, onSnapshot: (_ref, callback) => { f.memberCallback = callback; return f.stopMember; } }));

test('a live suspension hides the dashboard and signs out a still-tokened user', async () => {
  const publish = vi.fn(), auth = {}, user = { uid: 'staff', getIdTokenResult: vi.fn().mockResolvedValue({ claims: { staff: true, staffVersion: 1 } }) };
  const stop = observeStaffSession({ auth, db: {} }, publish);
  await f.authCallback(user);
  await f.memberCallback({ data: () => ({ role: 'staff', status: 'active', accessVersion: 1 }) });
  expect(publish).toHaveBeenLastCalledWith({ status: 'ready', auth, user, role: 'staff' });
  await f.memberCallback({ data: () => ({ role: 'staff', status: 'suspended', accessVersion: 2 }) });
  expect(publish).toHaveBeenLastCalledWith({ status: 'ready', auth, user, role: null });
  expect(f.signOut).toHaveBeenCalledWith(auth);
  stop(); expect(f.stopMember).toHaveBeenCalled(); expect(f.stopAuth).toHaveBeenCalled();
});

test('migration refreshes missing version claims before exposing any owner controls', async () => {
  const publish = vi.fn(), auth = {}, user = { uid: 'owner', getIdTokenResult: vi.fn()
    .mockResolvedValueOnce({ claims: { owner: true } }).mockResolvedValueOnce({ claims: { owner: true, staffVersion: 1 } }) };
  const stop = observeStaffSession({ auth, db: {} }, publish);
  await f.authCallback(user);
  expect(publish).not.toHaveBeenCalledWith(expect.objectContaining({ role: 'owner' }));
  await f.memberCallback({ data: () => ({ role: 'owner', status: 'active', accessVersion: 1 }) });
  expect(user.getIdTokenResult).toHaveBeenLastCalledWith(true);
  expect(publish).toHaveBeenLastCalledWith({ status: 'ready', auth, user, role: 'owner' });
  stop();
});
