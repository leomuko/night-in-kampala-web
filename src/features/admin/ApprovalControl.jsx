import { useState } from 'react';
import { Button, ErrorState } from '../../components/UI.jsx';
import { callStaff, staffError } from './catalogueAdmin.js';

export default function ApprovalControl({ collection, draft, onSave }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const product = collection === 'products';
  const approved = draft.approvedRevision === draft.revision;
  const canApprove = !product || (draft.photos?.length > 0 && draft.photos.every(photo => photo.kind === 'photograph'));

  async function change(next) {
    setBusy(true);
    setError('');
    try {
      const result = await callStaff('publicationApproval', {
        collection, slug: draft.slug, revision: draft.revision, approved: next,
      });
      onSave({ ...draft, ...result });
    } catch (failure) {
      setError(staffError(failure));
    } finally {
      setBusy(false);
    }
  }

  return <section className="staff-panel stack">
    <h2>{product ? 'Real stock approval' : 'Content approval'}</h2>
    <p role="status">{approved ? 'Saved revision approved.' : 'Saved revision awaiting approval.'}</p>
    <p className="helper">{product
      ? 'Approve only after checking the saved details and photographs against the actual garment.'
      : 'Review the saved title, copy and details before marking this revision approved.'}</p>
    {!canApprove && <p className="helper">Every image must be a photograph of the actual piece.</p>}
    <div className="staff-actions">
      {!approved && <Button disabled={busy || !canApprove} onClick={() => change(true)}>{product ? 'Approve as real stock' : 'Approve content'}</Button>}
      {Number.isInteger(draft.approvedRevision) && <Button variant="secondary" disabled={busy} onClick={() => change(false)}>Revoke approval</Button>}
    </div>
    {error && <ErrorState>{error}</ErrorState>}
  </section>;
}
