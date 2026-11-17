import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/UI.jsx';
import { formatPrice } from '../../data/previewProducts.js';
import { dismissRecentOrder, readRecentOrder, whatsappOrderLink } from './receiptData.js';
import useOrderPolicy from './useOrderPolicy.js';

function Summary({ receipt }) {
  return <>
    <p>Order reference <strong>{receipt.reference}</strong></p>
    <ul className="order-items">
      {receipt.items.map((item, index) => <li key={index}><div>
        <strong>{item.name}</strong>
        <p>{item.sizeLabel} · Quantity {item.quantity}</p>
        <p>{formatPrice(item.priceUGX)}{item.quantity > 1 ? ' each' : ''}</p>
      </div></li>)}
    </ul>
    <p><strong>Item subtotal</strong> {formatPrice(receipt.subtotalUGX)}</p>
  </>;
}

export function RecentOrder() {
  const [receipt, setReceipt] = useState(readRecentOrder);
  if (!receipt) return null;
  return <section className="container page-section order-page recent-order stack">
    <h2>Your recent order</h2>
    <Summary receipt={receipt} />
    <Button variant="secondary" onClick={() => { dismissRecentOrder(); setReceipt(null); }}>Dismiss recent order</Button>
  </section>;
}

export default function OrderReceipt({ receipt }) {
  const policy = useOrderPolicy();
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [receipt.reference]);
  const whatsapp = whatsappOrderLink(receipt);
  return <section className="container page-section order-page stack">
    <h1 ref={heading} tabIndex={-1}>Order received, awaiting confirmation</h1>
    <Summary receipt={receipt} />
    {whatsapp && <>
      <a href={whatsapp} className="button button--primary" target="_blank" rel="noreferrer">Send this order to us on WhatsApp</a>
      <p className="helper">Open WhatsApp and press Send.</p>
    </>}
    <h2>What happens next</h2>
    <p>Staff will follow up to confirm availability, delivery and payment.</p>
    <p>{policy.copy.payment}</p>
    <p>{policy.copy.collection}</p>
    <p>{policy.copy.delivery}</p>
    {!policy.copyReviewed && <p className="helper">Launch wording · awaiting owner review</p>}
    <Link className="text-link" to="/shop">Back to shop</Link>
  </section>;
}
