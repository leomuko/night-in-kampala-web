import { Link } from 'react-router-dom';
import { formatPrice } from '../../data/previewProducts.js';

export default function OrderItems({ rows, controls }) {
  return <ul className="order-items">
    {rows.map(row => {
      const { entry, product, size, available, priceChanged } = row;
      const photo = product?.photos?.[0];
      return <li key={entry.slug}>
        {photo?.smallUrl && <img src={photo.smallUrl} alt={photo.alt} />}
        <div>
          {product ? <Link className="text-link" to={`/products/${entry.slug}`}>{product.name}</Link> : <span>Unavailable piece</span>}
          {size && <p>{size.label} · Quantity {entry.quantity}</p>}
          {available && <p>{formatPrice(product.priceUGX)}{entry.quantity > 1 ? ' each' : ''}</p>}
          {!available && <p role="status">This piece or size is no longer available to request.</p>}
          {priceChanged && <p role="status">Price changed from {formatPrice(entry.priceUGX)}.</p>}
          {controls?.(row)}
        </div>
      </li>;
    })}
  </ul>;
}
