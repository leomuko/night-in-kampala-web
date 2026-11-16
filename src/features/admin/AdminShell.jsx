import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Button, ErrorState, Field, LoadingState } from '../../components/UI.jsx';
import OrderQueue from './OrderQueue.jsx';
import useOrderQueue from './useOrderQueue.js';
import OrderSettings from './OrderSettings.jsx';
import ContentEditor from './ContentEditor.jsx';
import StaffCatalogue from './StaffCatalogue.jsx';
import { useStaffSession } from './useStaffSession.js';

const staffSections = { products: 'Products', orders: 'Orders', collections: 'Drops', events: 'Events', lookbooks: 'Lookbooks', pages: 'Site pages' };

export default function AdminShell() {
  const { status, auth, user, role } = useStaffSession();
  const queue = useOrderQueue(status === 'ready' && role ? user.uid : null);
  const [section, setSection] = useState('products');
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

  const actions = <div className="staff-actions">
    <Button variant="secondary" disabled={busy} onClick={() => run(() => user.getIdToken(true), 'Could not refresh access.')}>Refresh access</Button>
    <Button variant="secondary" disabled={busy} onClick={() => run(() => signOut(auth), 'Could not sign out.')}>Sign out</Button>
  </div>;

  if (status === 'ready' && role) return <section className="admin-dashboard">
    <aside className="admin-sidebar">
      <Link to="/" className="wordmark">NIGHT IN KAMPALA</Link>
      <nav aria-label="Staff sections">
        {Object.entries(role === 'owner' ? { ...staffSections, settings: 'Settings' } : staffSections).map(([id, label]) => <Button key={id} variant="secondary" aria-pressed={section === id} onClick={() => setSection(id)}>{label}{id === 'orders' && queue.unread > 0 && <span className="admin-unread" aria-live="polite"> {queue.unread} unread</span>}</Button>)}
      </nav>
    </aside>
    <div className="admin-dashboard-main">
      <div className="admin-dashboard-heading">
        <div><h1>Store administration</h1><p className="helper">Signed in as {role}.</p></div>
        <div className="staff-actions"><Link className="button button--secondary" to="/">View store</Link>{actions}</div>
      </div>
      {error && <ErrorState>{error}</ErrorState>}
      {section === 'orders' ? <OrderQueue queue={queue} />
        : section === 'settings' && role === 'owner' ? <OrderSettings key={user.uid} />
        : section === 'products' || section === 'settings' ? <StaffCatalogue key={user.uid} user={user} role={role} />
        : <ContentEditor key={`${user.uid}-${section}`} collection={section} role={role} heading={`${staffSections[section]} drafts`} />}
    </div>
  </section>;

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
    {status === 'ready' && user && <><p>This account does not have staff access.</p>{actions}</>}
    <Link className="text-link" to="/">Return to store</Link>
  </section>;
}
