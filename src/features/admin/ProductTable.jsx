import { useState } from 'react';
import { formatPrice } from '../../data/previewProducts.js';
import { Button, Field } from '../../components/UI.jsx';
import PhotoPreview from './PhotoPreview.jsx';

const tabs = { all: 'All products', published: 'Published', draft: 'Drafts' };

function status(product) {
  if (product.publicationStatus === 'published') return product.publishedAvailability === 'sold' ? 'Sold' : 'Published';
  return product.publicationStatus === 'archived' ? 'Archived' : 'Draft';
}

function quantity(product) {
  if (product.publicationStatus === 'published') return product.availableUnits;
  if (product.stockType === 'one-of-one') return 1;
  return product.variants?.reduce((total, variant) => total + variant.quantity, 0);
}

export default function ProductTable({ rows, onEdit, onAdd }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const match = search.trim().toLowerCase();
  const products = rows.filter(product =>
    (tab === 'all' || tab === (product.publicationStatus ?? 'draft'))
    && [product.name, product.itemCode, product.slug].some(value => value?.toLowerCase().includes(match)),
  );

  return <section className="staff-product-index stack">
    <div className="staff-table-heading"><h2>Products</h2><Button onClick={onAdd}>Add product</Button></div>
    <div className="staff-table-tabs" role="group" aria-label="Product status">
      {Object.entries(tabs).map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    <Field label="Search products" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or item code" />
    {products.length ? <div className="staff-table-scroll" tabIndex={0} role="region" aria-label="Product table">
      <table className="staff-product-table" aria-label="Products">
        <thead><tr><th scope="col">Product</th><th scope="col">Size</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Status</th></tr></thead>
        <tbody>{products.map(product => <tr key={product.slug}>
          <th scope="row"><div className="staff-table-product">
            {product.photos?.[0] ? <PhotoPreview key={product.photos[0].id} photo={product.photos[0]} thumbnail /> : <span className="staff-thumbnail" />}
            <button className="text-button" type="button" onClick={() => onEdit(product.slug)}>{product.name || product.slug}</button>
          </div></th>
          <td>{product.sizeLabel || '—'}</td><td>{product.priceUGX ? formatPrice(product.priceUGX) : '—'}</td>
          <td>{quantity(product) ?? '—'}</td><td>{status(product)}</td>
        </tr>)}</tbody>
      </table>
    </div> : <p role="status">{rows.length ? 'No products match.' : 'No product drafts yet.'}</p>}
  </section>;
}
