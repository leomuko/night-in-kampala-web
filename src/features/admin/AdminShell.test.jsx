import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import AdminShell from './AdminShell.jsx';

const fixture = vi.hoisted(() => ({ session: {}, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('./useStaffSession.js', () => ({ useStaffSession: () => fixture.session }));
vi.mock('firebase/auth', () => ({ signInWithEmailAndPassword: fixture.signIn, signOut: fixture.signOut }));

test('staff access uses password sign-in and gates controls by current claims', async () => {
  const user = userEvent.setup();
  const auth = {};
  fixture.session = { status: 'ready', auth };
  const shell = () => <MemoryRouter><AdminShell /></MemoryRouter>;
  const { rerender } = render(shell());
  expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
  await user.type(screen.getByLabelText('Email'), 'staff@example.test');
  await user.type(screen.getByLabelText('Password'), 'fixture-input');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(fixture.signIn).toHaveBeenCalledWith(auth, 'staff@example.test', 'fixture-input');

  const account = { getIdToken: vi.fn() };
  fixture.session = { status: 'ready', auth, user: account, role: null };
  rerender(shell());
  expect(screen.getByText(/does not have staff access/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Refresh access' }));
  expect(account.getIdToken).toHaveBeenCalledWith(true);

  fixture.session = { ...fixture.session, role: 'staff' };
  rerender(shell());
  expect(screen.getByText('Signed in as staff.')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Team', exact: true })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Forgot password?' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'Store administration' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(fixture.signOut).toHaveBeenCalledWith(auth);
});


test('only owners receive the Team navigation entry', () => {
  fixture.session = { status: 'ready', auth: {}, user: { uid: 'owner' }, role: 'owner' };
  render(<MemoryRouter><AdminShell /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Team', exact: true })).toBeVisible();
});
