import { useEffect, useState } from 'react';
import { Button, ErrorState, LoadingState } from '../../components/UI.jsx';
import { callStaff, staffError } from './catalogueAdmin.js';
import { getFirebaseServices } from '../../services/firebase.js';

export default function PublicationControls({ draft, onChange }) {
  const [state, setState] = useState({ loading: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([getFirebaseServices(), import('firebase/firestore')]).then(async ([{ db }, sdk]) => {
      const result = await sdk.getDoc(sdk.doc(db, 'products', draft.slug)).catch(failure => {
        if (failure.code !== 'permission-denied') throw failure;
        return null;
      });
      if (active) setState(result?.data() ?? { status: draft.publicationStatus ?? 'draft' });
    }).catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, [draft.slug, draft.publicationStatus]);

  async function run(name, data) {
    setBusy(true);
    setError('');
    try {
      const updated = await callStaff(name, { slug: draft.slug, ...data });
      setState(updated);
      onChange(updated);
    }
    catch (failure) { setError(staffError(failure)); }
    finally { setBusy(false); }
  }

  if (state.loading) return <LoadingState>Checking publication…</LoadingState>;
  if (state.status === 'error') return <ErrorState>Could not check publication. Refresh to try again.</ErrorState>;
  const published = state.status === 'published';
  return <section className="staff-panel stack">
    <h2>Publication</h2>
    <p role="status">{published ? `Published · ${state.availability}` : state.status === 'archived' ? 'Archived' : 'Unpublished'}</p>
    <p className="helper">Save draft and photo changes before publishing.</p>
    <div className="staff-actions">
      <Button disabled={busy} onClick={() => run('cataloguePublish', { revision: draft.revision })}>{published ? 'Publish changes' : 'Publish product'}</Button>
      {published && <>
        <Button variant="secondary" disabled={busy} onClick={() => run('catalogueWithdraw', { status: 'draft' })}>Unpublish</Button>
        <Button variant="secondary" disabled={busy} onClick={() => run('catalogueWithdraw', { status: 'archived' })}>Archive</Button>
        {['available', 'sold'].includes(state.availability) && <Button variant="secondary" disabled={busy} onClick={() => run('catalogueAvailability', {
          availability: state.availability === 'sold' ? 'available' : 'sold',
        })}>{state.availability === 'sold' ? 'Mark as available' : 'Mark as sold'}</Button>}
      </>}
    </div>
    {error && <ErrorState>{error}</ErrorState>}
  </section>;
}
