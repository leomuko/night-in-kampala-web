import { useRef, useState } from 'react';
import { Button, Field } from '../../components/UI.jsx';
import ForgotPassword from './ForgotPassword.jsx';

export default function SignInForm({ auth, busy, onSubmit }) {
  const formRef = useRef(null);
  const [reset, setReset] = useState(null);
  return <>
    <form ref={formRef} className="stack" onSubmit={onSubmit}>
      <Field label="Email" name="email" type="email" autoComplete="username" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={busy}>Sign in</Button>
      <button type="button" className="text-link reset-disclosure" aria-haspopup="dialog" aria-expanded={reset !== null}
        onClick={() => setReset({ email: formRef.current.elements.namedItem('email').value.trim() })}>Forgot password?</button>
    </form>
    {reset && <ForgotPassword auth={auth} initialEmail={reset.email} onClose={() => setReset(null)} />}
  </>;
}
