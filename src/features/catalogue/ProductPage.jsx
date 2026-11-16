import { Link, useParams } from 'react-router-dom';
import { Accordion, Button, ErrorState, LoadingState } from '../../components/UI.jsx';
import { formatPrice, previewProducts } from '../../data/previewProducts.js';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { availabilityLabels } from './catalogueData.js';
import ProductGallery from './ProductGallery.jsx';
import useDetailHead from './useDetailHead.js';
import usePublicDocument from './usePublicDocument.js';

export default function ProductPage() {
  const { slug } = useParams();
  const state = usePublicDocument('products', slug);
  useDetailHead('products', slug, state);
  const fixture = getFirebaseRuntime().mode === 'preview' && previewProducts.find(product => product.slug === slug);
  const product = state.document ?? fixture;

  if (state.loading && !fixture) return <div className="container page-section"><LoadingState>Loading piece…</LoadingState></div>;
  if (state.failed) return <div className="container page-section"><ErrorState onRetry={state.retry}>Could not load this piece.</ErrorState></div>;
  if (!product) return <section className="container placeholder-page"><h1>Piece unavailable</h1>
    <p>This piece may have been withdrawn.</p><Link className="text-link" to="/shop">Return to shop</Link></section>;

  const photos = product.photos?.length ? product.photos : product.image
    ? [{ id: product.image, mediumUrl: `/assets/${product.image}-640.webp`, alt: product.alt }]
    : [];
  const illustrative = product.isRealCatalogueStock !== true;
  const availability = availabilityLabels[product.availability];

  return <article className="container page-section product-layout">
    <nav aria-label="Breadcrumb"><Link to="/shop">Shop</Link><span aria-hidden="true"> / </span><span>{product.name}</span></nav>
    <div>
      <ProductGallery key={slug} photos={photos} />
      {illustrative && <p className="placeholder-label">AI-generated placeholder</p>}
    </div>
    <div className="product-information stack">
      <div className="product-heading">
        {availability && <span className={`badge badge--${product.availability}`}>{availability}</span>}
        <h1>{product.name}</h1>
        {product.itemCode && <p className="helper">{product.itemCode}</p>}
        <p>{formatPrice(product.priceUGX ?? product.price)}</p>
      </div>
      {product.availability === 'requested' && <p>Someone has requested this piece. Another request is welcome. We’ll confirm requests in the order received.</p>}
      {product.sizeLabel && <p><strong>Size</strong> {product.sizeLabel}</p>}
      {!!product.measurements?.length && <section className="product-measurements">
        <h2>Measurements (cm)</h2>
        <dl>{product.measurements.map(({ label, cm }, index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd>{cm}</dd></div>)}</dl>
      </section>}
      <div className="product-ordering">
        <Button disabled>Add to bag</Button>
        <Button disabled variant="secondary">Order on WhatsApp</Button>
        <p className="helper">{illustrative ? 'Illustrative piece. Ordering is unavailable.' : 'Ordering will open with the first collection.'}</p>
      </div>
      <div className="product-accordions">
        {product.condition && <Accordion title="Condition" open><p>{product.condition}</p></Accordion>}
        {product.reworkNotes && <Accordion title="How it was reworked"><p>{product.reworkNotes}</p></Accordion>}
        {product.care && <Accordion title="Care"><p>{product.care}</p></Accordion>}
        <Accordion title="Delivery and returns"><p><Link to="/help/delivery">Delivery</Link> · <Link to="/help/returns">Returns</Link></p></Accordion>
      </div>
    </div>
  </article>;
}
