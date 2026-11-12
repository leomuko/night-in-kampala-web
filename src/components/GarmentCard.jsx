import { Link } from 'react-router-dom';
import { formatPrice } from '../data/previewProducts.js';
import { Badge } from './UI.jsx';

export default function GarmentCard({ product }) {
  return <article className="garment-card">
    <Link to={`/products/${product.slug}`} className="garment-image-link" aria-label={`View ${product.name}, illustrative piece`}>
      <div className="garment-image"><Badge>One of one</Badge><img src={`/assets/${product.image}-640.webp`} srcSet={`/assets/${product.image}-320.webp 320w, /assets/${product.image}-640.webp 640w, /assets/${product.image}-960.webp 960w`} sizes="(min-width: 1440px) 405px, (min-width: 1024px) 30vw, 45vw" alt={product.alt} width="640" height="960" loading="lazy" decoding="async" /></div>
      <h3>{product.name}</h3>
    </Link>
    <p>{formatPrice(product.price)}</p>
    <p className="placeholder-label">AI-generated placeholder</p>
  </article>;
}
