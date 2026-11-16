import { useEffect, useRef, useState } from 'react';
import { Button, ErrorState, LoadingState } from '../../components/UI.jsx';
import CategoryEditor from './CategoryEditor.jsx';
import ApprovalControl from './ApprovalControl.jsx';
import PublicationControls from './PublicationControls.jsx';
import PhotoEditor from './PhotoEditor.jsx';
import DraftEditor from './DraftEditor.jsx';
import ProductTable from './ProductTable.jsx';
import { callStaff, readEditorData, staffError } from './catalogueAdmin.js';

export default function StaffCatalogue({ user, role }) {
  const [state, setState] = useState({ status: 'loading' });
  const [selection, setSelection] = useState(null);
  const [selling, setSelling] = useState(null);
  const [saleError, setSaleError] = useState('');
  const selectionId = useRef(0);
  useEffect(() => {
    let active = true;
    readEditorData().then(data => {
      if (active) setState({ status: 'ready', ...data });
    }).catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);
  if (state.status === 'loading') return <LoadingState>Loading catalogue…</LoadingState>;
  if (state.status === 'error') return <ErrorState>Could not load the catalogue. Refresh the page to try again.</ErrorState>;

  const draft = state.rows.find(row => row.slug === selection?.slug) ?? {};
  function saveDraft(next) {
    setState(previous => {
      const existing = previous.rows.find(row => row.slug === next.slug);
      if (existing?.revision > next.revision) return previous;
      const saved = existing ? {
        ...next, publicationStatus: existing.publicationStatus, publishedAvailability: existing.publishedAvailability,
        availableUnits: existing.availableUnits,
      } : next;
      return { ...previous, rows: [saved, ...previous.rows.filter(row => row.slug !== next.slug)] };
    });
    setSelection(previous => previous?.key === selection?.key ? { ...previous, slug: next.slug } : previous);
  }
  function updatePublication(slug, result) {
    setState(previous => ({ ...previous, rows: previous.rows.map(row => row.slug === slug ? {
      ...row, publicationStatus: result.status, publishedAvailability: result.availability,
      availableUnits: result.availableUnits ?? row.availableUnits, reservationCount: result.reservationCount ?? row.reservationCount,
    } : row) }));
  }
  async function markSold(slug) {
    if (selling) return;
    setSelling(slug);
    setSaleError('');
    try { updatePublication(slug, await callStaff('catalogueMarkSold', { slug })); }
    catch (failure) { setSaleError(staffError(failure)); }
    finally { setSelling(null); }
  }
  function open(slug) { setSelection({ key: ++selectionId.current, slug }); }

  return <div className="staff-catalogue stack">
    {saleError && <ErrorState>{saleError}</ErrorState>}
    <div className={selection ? 'staff-product-workspace staff-product-workspace--editing' : 'staff-product-workspace'}>
      <ProductTable rows={state.rows} onEdit={open} onAdd={() => open('')} onSell={markSold} selling={selling} />
      {selection && <div className="staff-product-editor stack">
        <Button variant="secondary" onClick={() => setSelection(null)}>Close editor</Button>
        <DraftEditor key={`draft-${selection.key}`} draft={draft} categories={state.categories} onSave={saveDraft} />
        {draft.slug && <PhotoEditor key={`photos-${selection.key}`} draft={draft} user={user} onSave={saveDraft} />}
        {draft.slug && <PublicationControls key={`publication-${draft.slug}`} draft={draft} onChange={result => updatePublication(draft.slug, result)} />}
        {draft.slug && role === 'owner' && <ApprovalControl key={draft.slug} collection="products" draft={draft} onSave={saveDraft} />}
      </div>}
    </div>
    <CategoryEditor items={state.categories} onSave={categories => setState(previous => ({ ...previous, categories }))} />
  </div>;
}
