import { Link, useParams, useSearchParams } from 'react-router-dom';
import { previewProducts } from '../data/previewProducts.js';

const headings = { shop: 'Shop', collections: 'Drops', archive: 'Archive', about: 'Our process', lookbooks: 'Lookbook', events: 'Events', contact: 'Contact', cart: 'Your bag', checkout: 'Checkout', help: 'Help' };

export default function PlaceholderPage({ page }) {
  const { slug, id } = useParams();
  const [query] = useSearchParams();
  const product = page === 'products' && previewProducts.find(item => item.slug === slug);
  const title = product?.name || headings[page] || (page === 'orders' ? 'Order status' : 'Page being prepared');
  return <section className="container placeholder-page"><p className="eyebrow">Night in Kampala</p><h1>{title}</h1>
    {product ? <><p>This illustrative piece is a preview, and is not available for purchase.</p><p className="placeholder-label">AI-generated placeholder</p></> : page === 'orders' || id ? <p>Order access is being prepared. Once ordering opens, staff will follow up using the contact details you provide. An order number alone does not give access.</p> : page === 'cart' ? <p>The shop is preparing its first collection. No items have been added to your bag.</p> : page === 'checkout' ? <p>Online ordering will open with the first collection.</p> : <p>We’re preparing this part of the store. Come back for the first collection.</p>}
    {page === 'shop' && query.get('q') && <p>Search: <strong>{query.get('q')}</strong></p>}
    <Link className="button button--secondary" to="/">Back to home</Link>
  </section>;
}
