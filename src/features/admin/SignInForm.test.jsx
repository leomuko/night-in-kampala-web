import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import SignInForm from './SignInForm.jsx';

const f = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('firebase/auth', () => ({ sendPasswordResetEmail: f.send }));
const message = 'If this email has staff access, a reset link has been sent. Check your spam folder.';
let clock = 1_800_000_000_000;
beforeEach(() => { clock += 120_000; vi.spyOn(Date, 'now').mockReturnValue(clock); f.send.mockReset(); f.send.mockResolvedValue(undefined); });
afterEach(() => { vi.restoreAllMocks(); });
const mount = () => render(<main><h1>Staff access</h1><SignInForm auth="auth-fixture" busy={false} onSubmit={event => event.preventDefault()} /></main>);

async function open(user, email = 'person@example.test') {
  await user.type(screen.getByLabelText('Email', { exact: true }), email);
  const trigger = screen.getByRole('button', { name: 'Forgot password?' });
  trigger.focus(); await user.keyboard('{Enter}');
  return screen.getByRole('dialog', { name: 'Reset password' });
}

test.each(['sent', 'auth/user-not-found', 'auth/user-disabled', 'auth/network-request-failed'])('forgot-password response is identical for %s', async result => {
  if (result !== 'sent') f.send.mockRejectedValueOnce(Object.assign(new Error('Sensitive provider detail'), { code: result }));
  const user = userEvent.setup(); mount();
  const dialog = await open(user);
  expect(within(dialog).getByLabelText('Reset email')).toHaveValue('person@example.test');
  expect(within(dialog).getByLabelText('Reset email')).toHaveFocus();
  await user.click(within(dialog).getByRole('button', { name: 'Send reset email' }));
  const status = await within(dialog).findByRole('status');
  expect(status).toHaveTextContent(message); expect(status).toHaveFocus();
  expect(screen.queryByText(/Sensitive provider detail/)).toBeNull();
  expect(f.send).toHaveBeenCalledWith('auth-fixture', 'person@example.test', { url: new URL('/admin', window.location.origin).href });
  expect(localStorage.length).toBe(1); expect(Object.values(localStorage).join('')).not.toContain('person@example.test');
  await user.click(within(dialog).getByRole('button', { name: 'Back to sign in' }));
  expect(screen.getByRole('button', { name: 'Forgot password?' })).toHaveFocus();
});

test('browser cooldown spans dialog reopen and email changes, then permits another request at sixty seconds', async () => {
  const user = userEvent.setup(); mount();
  let dialog = await open(user);
  await user.click(within(dialog).getByRole('button', { name: 'Send reset email' }));
  await within(dialog).findByText(message);
  await user.click(within(dialog).getByRole('button', { name: 'Back to sign in' }));
  await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
  dialog = screen.getByRole('dialog');
  await user.clear(within(dialog).getByLabelText('Reset email'));
  await user.type(within(dialog).getByLabelText('Reset email'), 'another@example.test');
  await user.click(within(dialog).getByRole('button', { name: 'Send reset email' }));
  expect(await within(dialog).findByText(message)).toBeVisible(); expect(f.send).toHaveBeenCalledTimes(1);
  vi.mocked(Date.now).mockReturnValue(clock + 60_000);
  await user.click(within(dialog).getByRole('button', { name: 'Send reset email' }));
  expect(f.send).toHaveBeenCalledTimes(2);
});

test('reset dialog has accessible labels/status, disclosure state and no nested sign-in/reset forms', async () => {
  const user = userEvent.setup(); mount(); await open(user);
  expect(screen.getByRole('button', { name: 'Forgot password?' })).toHaveAttribute('aria-expanded', 'true');
  expect(document.querySelector('form form')).toBeNull();
  const results = await axe.run(document.body, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }, rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations.map(result => result.id)).toEqual([]);
});
