import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Button, ErrorState, Field, LoadingState } from '../../components/UI.jsx';
import { useStaffSession } from './useStaffSession.js';

export default function AdminShell() {
  const { status, auth, user, role } = useStaffSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action, message) {
    setBusy(true);
    setError('');
    try { await action(); } catch { setError(message); } finally { setBusy(false); }
  }
  function signIn(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(() => signInWithEmailAndPassword(auth, fields.get('email').trim(), fields.get('password')), 'Sign-in failed. Check your email and password and try again.');
  }

  return <section className="container placeholder-page">
    <h1>Staff access</h1>
    {status === 'loading' && <LoadingState />}
    {status === 'error' && <ErrorState>Staff sign-in is unavailable. Refresh the page to retry.</ErrorState>}
    {error && <ErrorState>{error}</ErrorState>}
    {status === 'ready' && !user && <form className="stack" onSubmit={signIn}>
      <Field label="Email" name="email" type="email" autoComplete="username" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={busy}>Sign in</Button>
    </form>}
    {status === 'ready' && user && <>
      {role ? <p>Signed in as {role}.</p> : <p>This account does not have staff access.</p>}
      <div className="staff-actions">
        <Button variant="secondary" disabled={busy} onClick={() => run(() => user.getIdToken(true), 'Could not refresh access.')}>Refresh access</Button>
        <Button variant="secondary" disabled={busy} onClick={() => run(() => signOut(auth), 'Could not sign out.')}>Sign out</Button>
      </div>
    </>}
    <Link className="text-link" to="/">Return to store</Link>
  </section>;
}
