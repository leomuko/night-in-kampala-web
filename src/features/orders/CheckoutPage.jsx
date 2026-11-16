import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultOrderSettings } from '../../../functions/order-model.js';
import { Button, ErrorState, Field, LoadingState, Select } from '../../components/UI.jsx';
import { formatPrice } from '../../data/previewProducts.js';
import { readOrderPolicy } from '../catalogue/catalogueData.js';
import { countries } from './countries.js';
import { canContinue, subtotal } from './bagData.js';
import { useBag } from './bagContext.js';
import OrderItems from './OrderItems.jsx';
import useBagReview from './useBagReview.js';

export default function CheckoutPage({ onOrder }) {
  const { items } = useBag();
  const { rows, failed, loading, retry } = useBagReview(items);
  const [country, setCountry] = useState('UG');
  const [method, setMethod] = useState('delivery');
  const [policy, setPolicy] = useState(defaultOrderSettings.copy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    readOrderPolicy().then(result => { if (current && result?.copy) setPolicy(result.copy); }).catch(() => {});
    return () => { current = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!onOrder || busy || !canContinue(rows ?? [])) return;
    const details = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try { await onOrder({ details, items }); }
    catch (failure) { setError(failure.message || 'We couldn’t confirm your submission. Try again.'); }
    finally { setBusy(false); }
  }

  return <section className="container page-section order-page stack">
    <h1>Place an order</h1>
    <Link className="text-link" to="/cart">Back to bag</Link>
    {!items.length && <p>Add pieces to your bag to place an order.</p>}
    {items.length > 0 && loading && <LoadingState>Checking your pieces…</LoadingState>}
    {failed && <ErrorState onRetry={retry}>Could not check the bag. Your selections are still here.</ErrorState>}
    {!!rows?.length && !canContinue(rows) && <ErrorState>Review the changes in your bag before placing an order.</ErrorState>}
    {!!items.length && <form className="order-form stack" onSubmit={submit}>
      <Field name="name" label="Full name" autoComplete="name" maxLength={120} required />
      <Field name="phone" label="Phone or WhatsApp number" type="tel" autoComplete="tel" maxLength={48} required />
      <Field name="email" label="Email (optional)" type="email" autoComplete="email" maxLength={254} />
      <Select name="country" label="Country" value={country} onChange={event => setCountry(event.target.value)}>
        {countries.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
      </Select>
      <fieldset className="order-method stack">
        <legend>Collection or delivery</legend>
        {['collection', 'delivery'].map(value => <label className="radio-row" key={value}>
          <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} />
          {value === 'collection' ? 'Collection' : 'Delivery'}
        </label>)}
      </fieldset>
      {method === 'delivery' && <>
        <Field name="locality" label={country === 'UG' ? 'District' : 'City or locality'} autoComplete="address-level2" maxLength={120} required />
        <Field name="address" label={country === 'UG' ? 'Address or nearest landmark' : 'Street address'} autoComplete="street-address" maxLength={320} required />
        {country !== 'UG' && <Field name="postcode" label="Postal code (if applicable)" autoComplete="postal-code" maxLength={32} />}
      </>}
      <div hidden><input name="website" aria-hidden="true" tabIndex={-1} autoComplete="off" /></div>
      {!!rows?.length && <>
        <OrderItems rows={rows} />
        <p><strong>Item subtotal</strong> {formatPrice(subtotal(rows))}</p>
      </>}
      <p>{policy[method]}</p>
      <p>{policy.payment}</p>
      {error && <ErrorState>{error}</ErrorState>}
      <Button type="submit" disabled={!onOrder || busy || !canContinue(rows ?? [])}>{busy ? 'Submitting…' : 'Place order'}</Button>
    </form>}
  </section>;
}
