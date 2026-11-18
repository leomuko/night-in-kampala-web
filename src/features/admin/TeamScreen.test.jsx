import { beforeEach, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import TeamScreen from './TeamScreen.jsx';

const f = vi.hoisted(() => ({ call: vi.fn(), resetEmail: vi.fn(), rows: [] }));
vi.mock('./catalogueAdmin.js', () => ({ callStaff: f.call, staffError: error => error.message }));
vi.mock('../../services/firebase.js', () => ({ getFirebaseServices: async () => ({ auth: 'auth-fixture' }) }));
vi.mock('firebase/auth', () => ({ sendPasswordResetEmail: f.resetEmail }));
beforeEach(() => {
  f.rows = [
    { uid: 'owner', name: 'Owner fixture', email: 'owner@example.test', role: 'owner', status: 'active' },
    { uid: 'staff', name: 'Staff fixture', email: 'staff@example.test', role: 'staff', status: 'active', lastSignInAt: '2026-11-18T06:00:00Z' },
  ];
  f.resetEmail.mockReset(); f.resetEmail.mockResolvedValue(undefined);
  f.call.mockReset(); f.call.mockImplementation(async name => name === 'staffList' ? { rows: f.rows, activeOwnerCount: 1, cursor: null } : {});
});
const mount = () => render(<main><h1>Store administration</h1><TeamScreen user={{ uid: 'owner' }} /></main>);
async function audit() {
  const result = await axe.run(document.body, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }, rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map(x => x.id)).toEqual([]);
}

test('owner Team list protects self, has labelled actions, and accessible add/confirm dialogs return focus', async () => {
  const user = userEvent.setup(); mount();
  await screen.findByRole('heading', { name: 'Staff fixture' });
  expect(screen.getByRole('button', { name: 'Suspend Owner fixture' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Change role for Owner fixture' })).toBeDisabled();
  await audit();
  const add = screen.getByRole('button', { name: 'Add member' });
  add.focus(); await user.keyboard('{Enter}');
  const dialog = screen.getByRole('dialog', { name: 'Add team member' });
  expect(within(dialog).getByLabelText('Name')).toBeRequired();
  expect(within(dialog).getByLabelText('Email')).toHaveAttribute('type', 'email');
  await audit();
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(add).toHaveFocus();
  const suspend = screen.getByRole('button', { name: 'Suspend Staff fixture' });
  await user.click(suspend);
  const confirm = screen.getByRole('dialog', { name: 'Suspend Staff fixture?' });
  expect(within(confirm).getByText(/signed out at once/)).toBeVisible();
  await audit();
  await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));
  expect(suspend).toHaveFocus();
});

test('inviting an existing account requires the explicit grant choice, requests setup email, and clears the private link after closing', async () => {
  const user = userEvent.setup(); mount();
  await screen.findByRole('heading', { name: 'Staff fixture' });
  let count = 0;
  f.call.mockImplementation(async name => name === 'staffList' ? { rows: f.rows, activeOwnerCount: 1 } : ++count === 1 ? { needsGrant: true } : {
    uid: 'new-member', email: 'existing@example.test', setupLink: 'https://example.test/private-setup',
  });
  await user.click(screen.getByRole('button', { name: 'Add member' }));
  let dialog = screen.getByRole('dialog');
  await user.type(within(dialog).getByLabelText('Name'), 'New fixture');
  await user.type(within(dialog).getByLabelText('Email'), 'existing@example.test');
  await user.selectOptions(within(dialog).getByLabelText('Role'), 'owner');
  await user.click(within(dialog).getByRole('button', { name: 'Add member' }));
  dialog = await screen.findByRole('dialog', { name: 'Grant access to existing account' });
  expect(f.resetEmail).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Grant access to existing account' }));
  dialog = await screen.findByRole('dialog', { name: 'Set up New fixture' });
  await screen.findByText(/Setup email requested/);
  expect(f.call).toHaveBeenCalledWith('staffInvite', { name: 'New fixture', email: 'existing@example.test', role: 'owner', grantExisting: true });
  expect(f.resetEmail).toHaveBeenCalledWith('auth-fixture', 'existing@example.test', { url: new URL('/admin', window.location.origin).href });
  await user.click(within(dialog).getByRole('button', { name: 'Share privately; it expires' }));
  expect(await navigator.clipboard.readText()).toBe('https://example.test/private-setup');
  expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
  await user.click(within(dialog).getByRole('button', { name: 'Done' }));
  expect(screen.queryByLabelText('One-time setup link')).toBeNull();
});

test('role, named suspension and reactivation use only the chosen target; server errors are focused', async () => {
  const user = userEvent.setup(); mount();
  await screen.findByRole('heading', { name: 'Staff fixture' });
  await user.click(screen.getByRole('button', { name: 'Change role for Staff fixture' }));
  let dialog = screen.getByRole('dialog');
  await user.selectOptions(within(dialog).getByLabelText('New role'), 'owner');
  await user.click(within(dialog).getByRole('button', { name: 'Save role' }));
  expect(f.call).toHaveBeenCalledWith('staffSetRole', { uid: 'staff', role: 'owner' });
  await user.click(screen.getByRole('button', { name: 'Suspend Staff fixture' }));
  dialog = screen.getByRole('dialog');
  f.call.mockImplementation(async name => {
    if (name === 'staffSuspend') { f.rows = f.rows.map(row => row.uid === 'staff' ? { ...row, status: 'suspended' } : row); return {}; }
    if (name === 'staffReactivate') throw new Error('Provider unavailable. Try again.');
    return { rows: f.rows, activeOwnerCount: 1 };
  });
  await user.click(within(dialog).getByRole('button', { name: 'Suspend Staff fixture' }));
  const reactivate = await screen.findByRole('button', { name: 'Reactivate Staff fixture' });
  expect(f.call).toHaveBeenCalledWith('staffSuspend', { uid: 'staff' });
  await user.click(reactivate);
  expect(f.call).toHaveBeenCalledWith('staffReactivate', { uid: 'staff' });
  expect(await screen.findByRole('alert')).toHaveFocus();
});

test('failed email request preserves the private setup link instead of pretending delivery succeeded', async () => {
  const user = userEvent.setup(); mount();
  await screen.findByRole('heading', { name: 'Staff fixture' });
  f.resetEmail.mockRejectedValueOnce(new Error('mail unavailable'));
  f.call.mockImplementation(async name => name === 'staffList' ? { rows: f.rows, activeOwnerCount: 1 } : { email: 'new@example.test', setupLink: 'https://example.test/private-setup' });
  await user.click(screen.getByRole('button', { name: 'Add member' }));
  const dialog = screen.getByRole('dialog');
  await user.type(within(dialog).getByLabelText('Name'), 'Email fixture');
  await user.type(within(dialog).getByLabelText('Email'), 'new@example.test');
  await user.click(within(dialog).getByRole('button', { name: 'Add member' }));
  await screen.findByText(/setup email could not be requested/);
  expect(screen.getByLabelText('One-time setup link')).toHaveValue('https://example.test/private-setup');
});
