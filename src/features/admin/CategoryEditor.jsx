import { useState } from 'react';
import { Button, ErrorState, Field, Select } from '../../components/UI.jsx';
import { callStaff, staffError } from './catalogueAdmin.js';

export default function CategoryEditor({ items, onSave }) {
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = items.find(item => item.id === selected);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const id = current?.id ?? form.get('id').trim();
      const result = await callStaff('catalogueCategorySave', {
        id, label: form.get('label'), active: form.has('active'), create: !current,
      });
      onSave(result.items);
      setSelected(id);
    } catch (failure) {
      setError(staffError(failure));
    } finally {
      setBusy(false);
    }
  }

  return <section className="staff-panel stack">
    <h2>Categories</h2>
    <Select label="Category to edit" value={selected} onChange={event => setSelected(event.target.value)} disabled={busy}>
      <option value="">New category</option>
      {items.map(item => <option key={item.id} value={item.id}>{item.label}{!item.active && ' (inactive)'}</option>)}
    </Select>
    <form className="stack staff-form" key={selected} onSubmit={save}>
      <Field label="Category ID" name="id" defaultValue={current?.id ?? ''} readOnly={Boolean(current)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} />
      <Field label="Category label" name="label" defaultValue={current?.label ?? ''} required maxLength={60} />
      <label className="radio-row"><input type="checkbox" name="active" defaultChecked={current?.active ?? true} />Active</label>
      {error && <ErrorState>{error}</ErrorState>}
      <Button type="submit" disabled={busy}>Save category</Button>
    </form>
  </section>;
}
