import { Link } from 'react-router-dom';
import { Button, ErrorState, LoadingState, Select } from '../../components/UI.jsx';
import { formatPrice } from '../../data/previewProducts.js';
import { canContinue, maxItemQuantity, subtotal } from './bagData.js';
import { useBag } from './bagContext.js';
import OrderItems from './OrderItems.jsx';
import useBagReview from './useBagReview.js';

export default function BagPage() {
  const { items, put, remove, acknowledge } = useBag();
  const { rows, failed, loading, retry } = useBagReview(items);
  return <section className="container page-section order-page stack">
    <h1>Your bag</h1>
    {!items.length && <><p>Your bag is empty.</p><Link to="/shop" className="button button--secondary">Browse shop</Link></>}
    {items.length > 0 && loading && <LoadingState>Checking your pieces…</LoadingState>}
    {failed && <ErrorState onRetry={retry}>Could not check the bag. Your selections are still here.</ErrorState>}
    {!!rows?.length && <>
      <OrderItems rows={rows} controls={({ entry, product, available }) => <div className="staff-actions">
        {available && product.stockType === 'repeatable' && <Select label={`Quantity for ${product.name}`} value={entry.quantity}
          onChange={event => put({ ...entry, quantity: Number(event.target.value) })}>
          {Array.from({ length: maxItemQuantity }, (_, index) => <option key={index + 1}>{index + 1}</option>)}
        </Select>}
        <Button variant="secondary" aria-label={`Remove ${product?.name ?? entry.slug}`} onClick={() => remove(entry.slug)}>Remove</Button>
      </div>} />
      <p><strong>Item subtotal</strong> {formatPrice(subtotal(rows))}</p>
      <p>Staff confirm availability after receiving a request.</p>
      {rows.some(row => row.priceChanged) && <Button variant="secondary" onClick={() => acknowledge(rows)}>Accept updated prices</Button>}
      {canContinue(rows) && <Link to="/checkout" className="button button--primary">Continue to order</Link>}
    </>}
  </section>;
}
