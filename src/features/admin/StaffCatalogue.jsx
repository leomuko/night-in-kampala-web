import { useEffect, useState } from 'react';
import { Button, ErrorState, LoadingState } from '../../components/UI.jsx';
import CategoryEditor from './CategoryEditor.jsx';
import PhotoEditor from './PhotoEditor.jsx';
import DraftEditor from './DraftEditor.jsx';
import { readEditorData } from './catalogueAdmin.js';

export default function StaffCatalogue({ user }) {
  const [state, setState] = useState({ status: 'loading' });
  const [selection, setSelection] = useState({ key: 0, slug: '' });
  useEffect(() => {
    let active = true;
    readEditorData().then(data => {
      if (active) setState({ status: 'ready', ...data });
    }).catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);
  if (state.status === 'loading') return <LoadingState>Loading catalogue…</LoadingState>;
  if (state.status === 'error') return <ErrorState>Could not load the catalogue. Refresh the page to try again.</ErrorState>;

  const draft = state.rows.find(row => row.slug === selection.slug) ?? {};
  function saveDraft(next) {
    setState(previous => ({ ...previous, rows: [next, ...previous.rows.filter(row => row.slug !== next.slug)] }));
    setSelection(previous => ({ ...previous, slug: next.slug }));
  }

  return <div className="staff-catalogue stack">
    <section className="staff-panel stack">
      <h2>Product drafts</h2>
      <Button variant="secondary" onClick={() => setSelection(({ key }) => ({ key: key + 1, slug: '' }))}>New draft</Button>
      {!state.rows.length && <p>No drafts yet.</p>}
      <ul className="staff-list">
        {state.rows.map(row => <li key={row.slug}>
          <button className="text-button" onClick={() => setSelection(({ key }) => ({ key: key + 1, slug: row.slug }))}>{row.name || row.slug}</button>
        </li>)}
      </ul>
    </section>
    <DraftEditor key={selection.key} draft={draft} categories={state.categories} onSave={saveDraft} />
    {draft.slug && <PhotoEditor key={selection.key} draft={draft} user={user} onSave={saveDraft} />}
    <CategoryEditor items={state.categories} onSave={categories => setState(previous => ({ ...previous, categories }))} />
  </div>;
}
