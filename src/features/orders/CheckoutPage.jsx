import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultOrderSettings } from '../../../functions/order-model.js';
import { Button, ErrorState, Field, LoadingState, Select } from '../../components/UI.jsx';
import { formatPrice } from '../../data/previewProducts.js';
import { readOrderPolicy } from '../catalogue/catalogueData.js';
import { createOrder } from './orderClient.js';
import { countries } from './countries.js';
import { canContinue, subtotal } from './bagData.js';
import { useBag } from './bagContext.js';
import OrderReceipt from './OrderReceipt.jsx';
import { saveRecentOrder } from './receiptData.js';
import OrderItems from './OrderItems.jsx';
import useBagReview from './useBagReview.js';

export default function CheckoutPage({ onOrder = createOrder }) {
  const { items, removeSubmitted } = useBag();
  const { rows, failed, loading, retry } = useBagReview(items);
  const [country, setCountry] = useState('UG');
  const [method, setMethod] = useState('delivery');
  const [policy, setPolicy] = useState(defaultOrderSettings.copy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const submission = useRef(null);
  const lastRequest = useRef(null);
  useEffect(() => {
    let current = true;
    readOrderPolicy().then(result => { if (current && result?.copy) setPolicy(result.copy); }).catch(() => {});
    return () => { current = false; };
  }, []);

  async function send(request) {
    if (busy) return;
    lastRequest.current = request;
    setBusy(true);
    setError('');
    try {
      const result = await onOrder(request);
      setReceipt(result);
      saveRecentOrder(result);
      removeSubmitted(request.items);
    } catch (failure) {
      const details = ['functions/invalid-argument', 'functions/failed-precondition', 'functions/resource-exhausted', 'functions/already-exists'].includes(failure?.code)
        ? failure.message : 'Your details are still here. Try again.';
      setError(details);
    } finally { setBusy(false); }
  }

  function submit(event) {
    event.preventDefault();
    if (!canContinue(rows ?? [])) return;
    submission.current ??= crypto.randomUUID();
    const details = Object.fromEntries(new FormData(event.currentTarget));
    void send({ details, items, submissionId: submission.current });
  }

  if (receipt) return <OrderReceipt receipt={receipt} />;

  return <section className="container page-section order-page stack">
    <h1>Place an order</h1>
    <Link className="text-link" to="/cart">Back to bag</Link>
    {!items.length && <p>Add pieces to your bag to place an order.</p>}
    {items.length > 0 && loading && <LoadingState>Checking your pieces…</LoadingState>}
    {failed && <ErrorState onRetry={retry}>Could not check the bag. Your selections are still here.</ErrorState>}
    {!!rows?.length && !canContinue(rows) && <ErrorState>Review the changes in your bag before placing an order.</ErrorState>}
    {error && <section className="order-submit-error stack" aria-labelledby="order-error">
      <h2 id="order-error">We couldn’t confirm your submission</h2>
      <p role="alert">{error}</p>
      <Button disabled={busy} onClick={() => send(lastRequest.current)}>Try again</Button>
      <Button variant="secondary" onClick={() => setError('')}>Back to order form</Button>
    </section>}
    {!!items.length && <div className="order-form-frame" hidden={Boolean(error)}><form className="order-form stack" onSubmit={submit}>
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
      <Button type="submit" disabled={busy || !canContinue(rows ?? [])}>{busy ? 'Submitting…' : 'Place order'}</Button>
    </form></div>}
  </section>;
}
