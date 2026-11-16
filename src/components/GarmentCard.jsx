import { Link } from 'react-router-dom';
import { formatPrice } from '../data/previewProducts.js';
import { availabilityLabels } from '../features/catalogue/catalogueData.js';

export default function GarmentCard({ product }) {
  const placeholder = product.isRealCatalogueStock !== true;
  const photo = product.photos?.[0];
  const image = product.image && `/assets/${product.image}`;
  const src = photo?.mediumUrl ?? (image && `${image}-640.webp`);
  const srcSet = photo
    ? `${photo.smallUrl} 320w, ${photo.mediumUrl} 640w, ${photo.largeUrl} 1280w`
    : image && `${image}-320.webp 320w, ${image}-640.webp 640w, ${image}-960.webp 960w`;
  const status = availabilityLabels[product.availability];
  return <article className="garment-card">
    <Link to={`/products/${product.slug}`} className="garment-image-link" aria-label={`View ${product.name}${placeholder ? ', illustrative piece' : ''}`}>
      <div className={`garment-image${product.availability === 'sold' ? ' garment-image--sold' : ''}`}>
        {(status || product.stockType === 'one-of-one' || image) && <span className={`badge badge--${product.availability || 'illustrative'}`}>{status || 'One of one'}</span>}
        {src && <img src={src} srcSet={srcSet} sizes="(min-width: 1440px) 405px, (min-width: 1024px) 30vw, 45vw" alt={photo?.alt ?? product.alt} width="640" height="960" loading="lazy" decoding="async" />}
      </div>
      <h3>{product.name}</h3>
    </Link>
    <p>{formatPrice(product.priceUGX ?? product.price)}</p>
    {placeholder && <p className="placeholder-label">AI-generated placeholder</p>}
  </article>;
}
