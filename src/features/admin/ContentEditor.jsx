import { useEffect, useRef, useState } from 'react';
import { Button, ErrorState, Field, LoadingState, Select } from '../../components/UI.jsx';
import { callStaff, readContentDrafts, staffError } from './catalogueAdmin.js';

function DropFields({ draft }) {
  const [ids, setIds] = useState(draft.productIds ?? []);
  const [cover, setCover] = useState(draft.coverProductId ?? '');
  const input = useRef(null);
  function move(index, direction) {
    const next = [...ids];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setIds(next);
  }
  return <div className="stack content-fields">
    <Field label="Published product slug" ref={input} maxLength={120} />
    <Button variant="secondary" onClick={() => {
      const field = input.current;
      const value = field.value.trim();
      if (value && !ids.includes(value) && ids.length < 24) setIds([...ids, value]);
      field.value = '';
    }}>Add piece</Button>
    {ids.length > 0 && <ol className="staff-list">
      {ids.map((id, index) => <li key={id} className="staff-actions">
        <span>{id}</span><input type="hidden" name="productId" value={id} />
        <Button variant="secondary" aria-label={`Move ${id} up`} disabled={index === 0} onClick={() => move(index, -1)}>Up</Button>
        <Button variant="secondary" aria-label={`Move ${id} down`} disabled={index === ids.length - 1} onClick={() => move(index, 1)}>Down</Button>
        <Button variant="secondary" aria-label={`Remove ${id}`} onClick={() => {
          setIds(ids.filter(value => value !== id));
          if (cover === id) setCover('');
        }}>Remove</Button>
      </li>)}
    </ol>}
    <Select name="coverProductId" label="Cover photo" value={cover} onChange={event => setCover(event.target.value)}>
      <option value="">Choose the cover piece</option>{ids.map(id => <option key={id} value={id}>{id}</option>)}
    </Select>
  </div>;
}

function EventFields({ draft }) {
  return <>
    <Field name="city" label="City" defaultValue={draft.city ?? ''} maxLength={120} />
    <Field name="date" label="Event date (optional)" type="date" defaultValue={draft.date ?? ''} />
    <Field name="venue" label="Venue (optional)" defaultValue={draft.venue ?? ''} maxLength={160} />
    <Select name="season" label="Event listing" defaultValue={draft.season ?? 'upcoming'}>
      <option value="upcoming">Upcoming</option><option value="past">Past</option>
    </Select>
  </>;
}

function PageFields({ collection, draft }) {
  return <div className="stack content-fields">
    {collection === 'pages' && <p className="helper">Use the slug our-process for Our process, contact for Contact, or the slug from a footer help link.</p>}
    <Field name="coverProductId" label="Cover product slug (optional)" defaultValue={draft.coverProductId ?? ''} maxLength={120} />
    <label className="field content-fields">Related links (one per line, label | /site-path)
      <textarea name="links" rows={4} defaultValue={draft.links?.map(link => `${link.label} | ${link.href}`).join('\n') ?? ''} />
    </label>
  </div>;
}

const editorFields = { collections: DropFields, events: EventFields, lookbooks: PageFields, pages: PageFields };

function DraftForm({ collection, draft, save }) {
  const Fields = editorFields[collection];
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const publish = event.nativeEvent.submitter?.value === 'publish';
    const slug = fields.get('slug').trim();
    const links = (fields.get('links') ?? '').split('\n').filter(line => line.trim()).map(line => {
      const [label, href] = line.split('|');
      return { label: label.trim(), href: href?.trim() ?? '' };
    });
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const saved = await callStaff('editorialDraftSave', {
        collection, slug, revision: draft.revision ?? 0,
        draft: { ...Object.fromEntries(fields), productIds: fields.getAll('productId'), links },
      });
      save({ ...draft, ...saved });
      setStatus('Draft saved.');
      if (publish) {
        await callStaff('editorialPublish', { collection, slug, revision: saved.revision });
        save({ ...saved, publishedRevision: saved.revision });
        setStatus('Published.');
      }
    } catch (failure) {
      setError(staffError(failure));
    } finally {
      setBusy(false);
    }
  }

  return <form className="stack" onSubmit={submit}>
    <Field name="slug" label="Page slug" defaultValue={draft.slug ?? ''} readOnly={Boolean(draft.slug)} maxLength={120} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
    <Field name="title" label="Title" defaultValue={draft.title ?? ''} maxLength={160} />
    <label className="field content-fields">Description<textarea name="body" rows={5} maxLength={5000} defaultValue={draft.body ?? ''} /></label>
    <Fields collection={collection} draft={draft} />
    {draft.publishedRevision && <p className="helper">Published revision {draft.publishedRevision}</p>}
    <div className="staff-actions">
      <Button type="submit" disabled={busy} value="save">Save draft</Button>
      <Button type="submit" disabled={busy} variant="secondary" value="publish">Save and publish</Button>
    </div>
    {status && <p role="status">{status}</p>}
    {error && <ErrorState>{error}</ErrorState>}
  </form>;
}

export default function ContentEditor({ collection, heading }) {
  const [state, setState] = useState({ loading: true });
  const [selection, setSelection] = useState({ key: 0, slug: '' });
  useEffect(() => {
    let current = true;
    readContentDrafts(collection).then(rows => { if (current) setState({ rows }); })
      .catch(() => { if (current) setState({ failed: true }); });
    return () => { current = false; };
  }, [collection]);

  if (state.loading) return <LoadingState>Loading drafts…</LoadingState>;
  if (state.failed) return <ErrorState>Could not load content drafts.</ErrorState>;
  const draft = state.rows.find(row => row.slug === selection.slug) ?? {};
  function select(slug) { setSelection(previous => ({ key: previous.key + 1, slug })); }
  function save(next) {
    setState(previous => ({ rows: [next, ...previous.rows.filter(row => row.slug !== next.slug)] }));
    setSelection(previous => ({ ...previous, slug: next.slug }));
  }
  return <section className="staff-panel stack">
    <h2>{heading}</h2>
    <Button variant="secondary" onClick={() => select('')}>New page</Button>
    <ul className="staff-list">{state.rows.map(row => <li key={row.slug}>
      <button className="text-button" type="button" onClick={() => select(row.slug)}>{row.title || row.slug}</button>
    </li>)}</ul>
    <DraftForm key={selection.key} draft={draft} collection={collection} save={save} />
  </section>;
}
