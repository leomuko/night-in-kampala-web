import { beforeEach, expect, test, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
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
  expect(within(dialog).getByRole('button', { name: /^Close/ })).toHaveFocus();
  expect(f.resetEmail).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Grant access to existing account' }));
  dialog = await screen.findByRole('dialog', { name: 'Set up New fixture' });
  expect(within(dialog).getByRole('button', { name: /^Close/ })).toHaveFocus();
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


test('finishing an earlier setup email cannot clear the busy state of a later invitation', async () => {
  const user = userEvent.setup(); mount();
  await screen.findByRole('heading', { name: 'Staff fixture' });
  let finishEmail, finishInvite;
  f.resetEmail.mockImplementationOnce(() => new Promise(resolve => { finishEmail = resolve; }));
  let invites = 0;
  f.call.mockImplementation(async name => {
    if (name === 'staffList') return { rows: f.rows, activeOwnerCount: 1 };
    if (++invites === 1) return { email: 'first@example.test', setupLink: 'https://example.test/first-private-setup' };
    return new Promise(resolve => { finishInvite = resolve; });
  });
  async function add(name, email) {
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Name'), name);
    await user.type(within(dialog).getByLabelText('Email'), email);
    await user.click(within(dialog).getByRole('button', { name: 'Add member' }));
  }
  await add('First fixture', 'first@example.test');
  await user.click(await screen.findByRole('button', { name: 'Done' }));
  await add('Second fixture', 'second@example.test');
  const pending = within(screen.getByRole('dialog')).getByRole('button', { name: 'Add member' });
  expect(pending).toBeDisabled();
  await act(async () => { finishEmail(); });
  expect(pending).toBeDisabled();
  await act(async () => { finishInvite({ email: 'second@example.test', setupLink: 'https://example.test/second-private-setup' }); });
  expect(await screen.findByRole('dialog', { name: 'Set up Second fixture' })).toBeVisible();
  expect(screen.getByLabelText('One-time setup link')).toHaveValue('https://example.test/second-private-setup');
});

test('active pending members can receive a new private setup link; suspended rows say Reactivate first', async () => {
  const user = userEvent.setup();
  f.rows[1] = { ...f.rows[1], accessPending: true };
  f.rows.push({ uid: 'suspended', name: 'Suspended fixture', email: 'suspended@example.test', role: 'staff', status: 'suspended' });
  f.call.mockImplementation(async name => name === 'staffList' ? { rows: f.rows, activeOwnerCount: 1 } : { uid: 'staff', name: 'Staff fixture', email: 'staff@example.test', setupLink: 'https://example.test/replacement-setup' });
  mount(); await screen.findByRole('heading', { name: 'Staff fixture' });
  const disabled = screen.getByRole('button', { name: 'Send new setup link for Suspended fixture' });
  expect(disabled).toBeDisabled(); expect(disabled).toHaveAccessibleDescription('Reactivate first');
  await user.click(screen.getByRole('button', { name: 'Send new setup link for Staff fixture' }));
  const dialog = await screen.findByRole('dialog', { name: 'Set up Staff fixture' });
  expect(f.call).toHaveBeenCalledWith('staffSetupLink', { uid: 'staff' });
  await screen.findByText(/Setup email requested/);
  expect(f.resetEmail).toHaveBeenCalledWith('auth-fixture', 'staff@example.test', { url: new URL('/admin', window.location.origin).href });
  expect(within(dialog).getByText(/Works once and expires after about an hour\. Older links stop working once this one is used\./)).toBeVisible();
  await audit();
  await user.click(within(dialog).getByRole('button', { name: 'Done' }));
  expect(screen.queryByLabelText('One-time setup link')).toBeNull();
  expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
});

test('reinviting an existing member offers setup recovery instead of changing the role or duplicating them', async () => {
  const user = userEvent.setup(); mount();
  await screen.findByRole('heading', { name: 'Staff fixture' });
  f.call.mockImplementation(async name => name === 'staffList' ? { rows: f.rows, activeOwnerCount: 1 }
    : name === 'staffInvite' ? { existingMember: true, uid: 'staff', name: 'Staff fixture', email: 'staff@example.test', status: 'active' }
      : { uid: 'staff', email: 'staff@example.test', setupLink: 'https://example.test/replacement-setup' });
  await user.click(screen.getByRole('button', { name: 'Add member' }));
  let dialog = screen.getByRole('dialog');
  await user.type(within(dialog).getByLabelText('Name'), 'Staff fixture');
  await user.type(within(dialog).getByLabelText('Email'), 'staff@example.test');
  await user.click(within(dialog).getByRole('button', { name: 'Add member' }));
  dialog = await screen.findByRole('dialog', { name: 'Already a team member' });
  expect(within(dialog).getByRole('button', { name: /^Close/ })).toHaveFocus();
  expect(f.resetEmail).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Send new setup link' }));
  await screen.findByRole('dialog', { name: 'Set up Staff fixture' });
  expect(f.call).toHaveBeenCalledWith('staffSetupLink', { uid: 'staff' });
});

test('setup-link quota errors are clear and focused, with no link or email request', async () => {
  const user = userEvent.setup(); mount();
  await screen.findByRole('heading', { name: 'Staff fixture' });
  f.call.mockRejectedValueOnce(new Error('The limit of 5 setup-link requests per member per UTC day has been reached. Try tomorrow.'));
  await user.click(screen.getByRole('button', { name: 'Send new setup link for Staff fixture' }));
  expect(await screen.findByRole('alert')).toHaveFocus();
  expect(screen.getByRole('alert')).toHaveTextContent(/5 setup-link requests/);
  expect(screen.queryByLabelText('One-time setup link')).toBeNull(); expect(f.resetEmail).not.toHaveBeenCalled();
});
