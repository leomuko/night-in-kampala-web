import { useEffect, useRef, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import Dialog from '../../components/Dialog.jsx';
import { Button, Field } from '../../components/UI.jsx';
import { takeResetEmailTurn } from './resetEmailThrottle.js';

import { neutralResetMessage } from './resetEmailCopy.js';

export default function ForgotPassword({ auth, initialEmail, onClose }) {
  const [busy, setBusy] = useState(false), [response, setResponse] = useState(0);
  const emailRef = useRef(null), resultRef = useRef(null), active = useRef(true);
  useEffect(() => {
    active.current = true;
    emailRef.current?.focus();
    return () => { active.current = false; };
  }, []);
  useEffect(() => { if (response) resultRef.current?.focus(); }, [response]);
  async function submit(event) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('resetEmail').trim();
    setBusy(true);
    try {
      if (takeResetEmailTurn()) await sendPasswordResetEmail(auth, email, { url: new URL('/admin', window.location.origin).href });
    } catch { /* Deliberately identical UI for missing, suspended, non-staff and provider failures. */ }
    finally {
      if (active.current) { setBusy(false); setResponse(value => value + 1); }
    }
  }
  return <Dialog open onClose={onClose} title="Reset password" className="team-dialog">
    <form className="stack" onSubmit={submit}>
      <Field ref={emailRef} label="Reset email" name="resetEmail" type="email" autoComplete="email" defaultValue={initialEmail} maxLength={254} required />
      <p className="helper">Allow 60 seconds between requests. Firebase also rate-limits reset emails.</p>
      <Button type="submit" disabled={busy}>{busy ? 'Sending request…' : 'Send reset email'}</Button>
      {response > 0 && <p role="status" tabIndex={-1} ref={resultRef}>{neutralResetMessage}</p>}
      <Button variant="secondary" onClick={onClose}>Back to sign in</Button>
    </form>
  </Dialog>;
}
