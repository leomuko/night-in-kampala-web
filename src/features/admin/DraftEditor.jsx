import { useState } from 'react';
import { Button, ErrorState, Field, Select } from '../../components/UI.jsx';
import { callStaff, staffError } from './catalogueAdmin.js';

function rows(text) {
  return text.split('\n').filter(line => line.trim()).map(line => line.split('|').map(value => value.trim()));
}

export default function DraftEditor({ draft, categories, onSave }) {
  const [stockType, setStockType] = useState(draft.stockType ?? 'one-of-one');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const slug = form.get('slug').trim();
    const values = Object.fromEntries(form);
    const proposed = {
      ...values, priceUGX: values.priceUGX === '' ? null : Number(values.priceUGX),
      measurements: rows(values.measurements).map(([label, cm]) => ({ label, cm: Number(cm) })),
      variants: rows(values.variants ?? '').map(([id, sizeLabel, quantity]) => ({
        id, sizeLabel, quantity: quantity ? Number(quantity) : NaN,
      })),
    };
    setError('');
    setSaved(false);
    setBusy(true);
    try {
      const result = await callStaff('catalogueDraftSave', { slug, revision: draft.revision ?? 0, draft: proposed });
      onSave({ ...draft, ...proposed, ...result });
      setSaved(true);
    } catch (failure) {
      setError(staffError(failure));
    } finally {
      setBusy(false);
    }
  }

  return <section className="staff-panel stack">
    <h2>{draft.slug ? 'Edit product draft' : 'New product draft'}</h2>
    <form className="stack staff-form" onSubmit={save}>
      <Field label="Product URL slug" name="slug" defaultValue={draft.slug ?? ''} readOnly={Boolean(draft.slug)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} />
      <Field label="Product name" name="name" defaultValue={draft.name ?? ''} maxLength={160} />
      <Field label="Item code" name="itemCode" defaultValue={draft.itemCode ?? ''} maxLength={60} />
      <Select label="Category" name="categoryId" defaultValue={draft.categoryId ?? ''}>
        <option value="">Choose a category</option>
        {categories.filter(item => item.active || item.id === draft.categoryId).map(item => (
          <option key={item.id} value={item.id}>{item.label}{!item.active && ' (inactive)'}</option>
        ))}
      </Select>
      <Field label="Price in UGX" name="priceUGX" type="number" min="1" step="1" defaultValue={draft.priceUGX ?? ''} />
      <Select label="Stock type" name="stockType" value={stockType} onChange={event => setStockType(event.target.value)}>
        <option value="one-of-one">One of one · one unit</option><option value="repeatable">Repeatable</option>
      </Select>
      <Field label="Size label" name="sizeLabel" defaultValue={draft.sizeLabel ?? ''} maxLength={80} />
      {stockType === 'repeatable' && <label className="field">Variants (one per line: ID | Size | Quantity)
        <textarea name="variants" rows="4" defaultValue={draft.variants?.map(row => `${row.id} | ${row.sizeLabel} | ${row.quantity}`).join('\n')} />
      </label>}
      <label className="field">Measurements (one per line: Label | cm)
        <textarea name="measurements" rows="4" defaultValue={draft.measurements?.map(row => `${row.label} | ${row.cm}`).join('\n')} />
      </label>
      {[['condition', 'Condition', 1000], ['reworkNotes', 'How it was reworked', 2000], ['care', 'Care', 1000], ['shareDescription', 'Share description', 320]].map(([name, label, max]) => (
        <label className="field" key={name}>{label}<textarea name={name} rows="3" maxLength={max} defaultValue={draft[name] ?? ''} /></label>
      ))}
      {error && <ErrorState>{error}</ErrorState>}
      {saved && <p role="status">Draft saved.</p>}
      <Button type="submit" disabled={busy}>Save draft</Button>
    </form>
  </section>;
}
