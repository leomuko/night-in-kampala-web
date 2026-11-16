import { useEffect, useRef, useState } from 'react';
import { Button, ErrorState, Field, LoadingState, Select } from '../../components/UI.jsx';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import { maxLineQuantity } from '../../../functions/order-model.js';
import { callStaff, staffError } from './catalogueAdmin.js';

export default function ManualSale({ slug, onClose, onSave }) {
  const [state, setState] = useState({ loading: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const identity = useRef(null);
  useEffect(() => {
    let active = true;
    readPublicDocument('products', slug).then(product => {
      if (active) setState({ product });
    }).catch(() => { if (active) setState({ product: null }); });
    return () => { active = false; };
  }, [slug]);

  async function save(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    identity.current ??= crypto.randomUUID();
    setError('');
    setBusy(true);
    try {
      onSave(await callStaff('manualSaleRecord', { slug, saleId: identity.current,
        size: fields.get('size'), channel: fields.get('channel'), quantity: Number(fields.get('quantity') || 1) }));
    } catch (failure) { setError(staffError(failure)); }
    finally { setBusy(false); }
  }

  const product = state.product;
  const sizes = product?.requestableSizes ?? [];
  return <section className="staff-panel stack">
    <h2>Record manual sale</h2>
    {state.loading && <LoadingState>Checking stock…</LoadingState>}
    {!state.loading && !sizes.length && <p>No available stock can be sold for this piece.</p>}
    {!!sizes.length && <form className="staff-form stack" onSubmit={save}>
      <p>{product.name}</p>
      <Select name="channel" label="Sale channel" defaultValue="in_person">
        <option value="in_person">In person</option><option value="whatsapp">WhatsApp</option>
      </Select>
      <Select name="size" label="Size sold" required>{sizes.map(size => <option value={size.id} key={size.id}>{size.label}</option>)}</Select>
      {product.stockType === 'repeatable' && <Field name="quantity" label="Quantity sold" type="number" min="1" max={maxLineQuantity} defaultValue="1" step="1" required />}
      <Button type="submit" disabled={busy}>Record sale and mark sold</Button>
    </form>}
    {error && <ErrorState>{error}</ErrorState>}
    <Button variant="secondary" onClick={onClose} disabled={busy}>Close sale form</Button>
  </section>;
}
