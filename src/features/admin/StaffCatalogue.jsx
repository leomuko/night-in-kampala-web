import { useEffect, useRef, useState } from 'react';
import { Button, ErrorState, LoadingState } from '../../components/UI.jsx';
import ManualSale from './ManualSale.jsx';
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
  const [manual, setManual] = useState(null);
  const [selling, setSelling] = useState(null);
  const [saleError, setSaleError] = useState('');
  const selectionId = useRef(0);
  const editor = useRef(null);
  const editorTrigger = useRef(null);
  const editorKey = selection?.key;
  useEffect(() => { if (editorKey) editor.current?.focus(); }, [editorKey]);
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
        ...next, publicationStatus: existing.publicationStatus, publishedAvailability: existing.publishedAvailability, publishedRealStock: next.publishedRealStock ?? existing.publishedRealStock,
        availableUnits: existing.availableUnits,
      } : next;
      return { ...previous, rows: [saved, ...previous.rows.filter(row => row.slug !== next.slug)] };
    });
    setSelection(previous => previous?.key === selection?.key ? { ...previous, slug: next.slug } : previous);
  }
  function updatePublication(slug, result) {
    setState(previous => ({ ...previous, rows: previous.rows.map(row => row.slug === slug ? {
      ...row, publicationStatus: result.status, publishedAvailability: result.availability,
      publishedRealStock: result.publishedRealStock ?? row.publishedRealStock,
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
  function open(slug) {
    editorTrigger.current = document.activeElement;
    setSelection({ key: ++selectionId.current, slug });
  }

  return <div className="staff-catalogue stack">
    {saleError && <ErrorState>{saleError}</ErrorState>}
    <div className={selection ? 'staff-product-workspace staff-product-workspace--editing' : 'staff-product-workspace'}>
      <ProductTable rows={state.rows} onEdit={open} onAdd={() => open('')} onSell={markSold} onManual={setManual} selling={selling} />
      {selection && <section className="staff-product-editor stack" ref={editor} tabIndex={-1} aria-label="Product editor">
        <Button variant="secondary" onClick={() => { setSelection(null); editorTrigger.current?.focus(); }}>Close editor</Button>
        <DraftEditor key={`draft-${selection.key}`} draft={draft} categories={state.categories} onSave={saveDraft} />
        {draft.slug && <PhotoEditor key={`photos-${selection.key}`} draft={draft} user={user} onSave={saveDraft} />}
        {draft.slug && <PublicationControls key={`publication-${draft.slug}`} draft={draft} onChange={result => updatePublication(draft.slug, result)} />}
        {draft.slug && role === 'owner' && <ApprovalControl key={draft.slug} collection="products" draft={draft} onSave={saveDraft} />}
      </section>}
    </div>
    {manual && <ManualSale key={manual} slug={manual} onClose={() => setManual(null)}
      onSave={result => { updatePublication(manual, result); setManual(null); }} />}
    <CategoryEditor items={state.categories} onSave={categories => setState(previous => ({ ...previous, categories }))} />
  </div>;
}
