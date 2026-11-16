import { allowedFulfilment, canCompleteOrder } from '../../../functions/order-model.js';
import { useEffect, useState } from 'react';
import { Button, ErrorState, Field, LoadingState, Select } from '../../components/UI.jsx';
import { formatPrice } from '../../data/previewProducts.js';
import { callStaff, staffError } from './catalogueAdmin.js';
import { groupOrders, isOverdue, readOrder } from './orderAdmin.js';

const tabs = { new: 'New', contacted: 'Contacted', confirmed: 'Confirmed', completed: 'Completed' };
const terminal = ['completed', 'declined', 'cancelled', 'spam'];
const label = value => value.replaceAll('_', ' ');

function OrderDetails({ id }) {
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [reason, setReason] = useState('');
  useEffect(() => {
    let active = true;
    readOrder(id).then(order => {
      if (!active) return;
      setState({ order });
      if (order?.unread) {
        callStaff('orderDesk', { id, action: 'seen' }).catch(() => { if (active) setError('Could not mark this order as read.'); });
      }
    }).catch(() => { if (active) setState({ failed: true }); });
    return () => { active = false; };
  }, [id, retry]);

  async function action(name, fields = {}) {
    setBusy(true);
    setError('');
    try {
      const result = await callStaff('orderDesk', { id, action: name, ...fields });
      setNotice(result.competing ? 'Review and follow up on competing requests for this piece.' : 'Order updated.');
      setRetry(value => value + 1);
    } catch (failure) { setError(staffError(failure)); }
    finally { setBusy(false); }
  }

  if (state.loading) return <LoadingState>Loading order…</LoadingState>;
  if (state.failed) return <ErrorState onRetry={() => setRetry(value => value + 1)}>Could not read the order.</ErrorState>;
  const order = state.order;
  if (!order) return <p>Order unavailable.</p>;
  const { contact } = order;
  const fulfilment = allowedFulfilment(order);
  const canPay = order.state === 'confirmed' && order.paymentState === 'unpaid'
    && order.items.some(item => ['reserved', 'sold'].includes(item.state));
  const canAllocate = ['new', 'contacted', 'confirmed'].includes(order.state) && ['unfulfilled', 'ready_for_collection'].includes(order.fulfilment);
  return <section className="staff-order-detail stack">
    <h2>{order.reference}</h2>
    <p className="helper">{label(order.state)} · {order.paymentState} · {label(order.fulfilment)}</p>
    <section className="stack">
      <h3>Customer details</h3>
      <div>
        <p>{contact.name}</p><p>{contact.phone}</p>{contact.email && <p>{contact.email}</p>}
        <p>{label(contact.method)} · {contact.country}</p>
        {contact.delivery && <p>{contact.delivery.address}, {contact.delivery.locality} {contact.delivery.postcode}</p>}
      </div>
    </section>
    <ul className="order-items">{order.items.map(item => <li key={item.slug}>
      {item.photo && <img src={item.photo} alt="" />}
      <div><strong>{item.name}</strong><p>{item.sizeLabel} · Quantity {item.quantity}</p>
        <p>{formatPrice(item.priceUGX)} · {label(item.state)}</p>
        {canAllocate && item.state === 'requested' && <div className="staff-actions">
          <Button disabled={busy} onClick={() => action('confirm', { slug: item.slug, reason })}>Confirm</Button>
          <Button variant="secondary" disabled={busy} onClick={() => action('decline', { slug: item.slug })}>Decline</Button>
        </div>}
        {order.state === 'confirmed' && item.state === 'reserved' && <Button disabled={busy} onClick={() => action('sell', { slug: item.slug })}>Mark as sold</Button>}
        {canAllocate && item.state === 'reserved' && <Button variant="secondary" disabled={busy} onClick={() => action('release', { slug: item.slug })}>Release reservation</Button>}
      </div>
    </li>)}</ul>
    <p><strong>Item subtotal</strong> {formatPrice(order.subtotalUGX)}</p>
    {order.state === 'new' && <Button disabled={busy} onClick={() => action('contact')}>Mark contacted</Button>}
    {canAllocate && order.items.some(item => item.state === 'requested') && <Field label="Reason if confirming ahead of an older request" maxLength={300} value={reason}
      onChange={event => setReason(event.target.value)} />}
    {canAllocate && !order.items.some(item => item.state === 'sold') && <Button variant="secondary" disabled={busy} onClick={() => action('cancel')}>Cancel order</Button>}
    {order.payment && <p>Payment recorded · {formatPrice(order.payment.amountUGX)} · {order.payment.method}</p>}
    {canPay && <form className="staff-form stack" onSubmit={event => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      void action('payment', { method: fields.get('method'), amountUGX: Number(fields.get('amount')) });
    }}>
      <Field label="Payment method used" name="method" required maxLength={80} />
      <Field label="Amount received (UGX)" name="amount" type="number" step="1" required min="1" />
      <Button type="submit" disabled={busy}>Record payment</Button>
    </form>}
    {!!fulfilment.length && <Select label="Fulfilment status" value={order.fulfilment} disabled={busy}
      onChange={event => action('fulfil', { fulfilment: event.target.value })}>
      <option value={order.fulfilment}>{label(order.fulfilment)}</option>
      {fulfilment.map(status => <option value={status} key={status}>{label(status)}</option>)}
    </Select>}
    {canCompleteOrder(order) && <Button disabled={busy} onClick={() => action('complete')}>Complete order</Button>}
    {notice && <p role="status">{notice}</p>}
    {error && <ErrorState>{error}</ErrorState>}
  </section>;
}

export default function OrderQueue({ queue }) {
  const [tab, setTab] = useState('new');
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const visible = queue.rows.filter(order => tab === 'completed' ? terminal.includes(order.state) : order.state === tab);
  const { competing, remaining } = groupOrders(queue.rows, visible);
  const renderRow = order => <li key={order.id}>
    <button type="button" className="order-queue-row" aria-pressed={selected === order.id} onClick={() => setSelected(order.id)}>
      <strong>{order.reference}</strong>
      <span>{label(order.state)}</span>
      {order.unread && <span className="badge">Unread</span>}
      {isOverdue(order, queue.hours, now) && <span className="badge badge--requested">Overdue</span>}
      {order.paidReserved && <span className="badge badge--requested">Paid · still Reserved</span>}
    </button>
  </li>;
  return <section className="stack order-queue">
    <h2>Orders</h2>
    <div className="staff-table-tabs" role="group" aria-label="Order status">
      {Object.entries(tabs).map(([key, name]) => <button type="button" key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{name}</button>)}
    </div>
    {queue.loading && <LoadingState>Waiting for the live order queue…</LoadingState>}
    {queue.failed && <ErrorState onRetry={queue.retry}>Live updates paused. Check the connection and try again.</ErrorState>}
    <div className="order-queue-workspace">
      <div className="stack">
        {!queue.loading && !queue.failed && !visible.length && <p>No orders in this view.</p>}
        {competing.map(group => <section key={group.slug} className="order-competition">
          <h3>{group.name}</h3><p className="helper">Competing requests · Oldest first</p>
          <ul>{group.orders.map(renderRow)}</ul>
        </section>)}
        {!!remaining.length && <ul className="order-queue-list">{remaining.map(renderRow)}</ul>}
        {queue.hasMore && <Button variant="secondary" disabled={queue.loadingMore} onClick={queue.loadMore}>Load older orders</Button>}
        {queue.moreFailed && <ErrorState>Could not load older orders.</ErrorState>}
      </div>
      {selected && <OrderDetails key={selected} id={selected} />}
    </div>
  </section>;
}
