import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import GarmentCard from '../../components/GarmentCard.jsx';
import { ErrorState, Select } from '../../components/UI.jsx';
import { availabilityLabels, productSorts, readCategories, readProductPage, readRequestableSizes } from './catalogueData.js';
import PagedList from './PagedList.jsx';

function ShopFilters({ filters, categories, sizes, onChange }) {
  const activeSizes = sizes.some(size => size.id === filters.size);
  return <div className="shop-filters" role="group" aria-label="Catalogue filters">
    <Select name="category" label="Category" value={filters.category} onChange={event => onChange('category', event.target.value)}>
      <option value="">All categories</option>
      {categories.filter(category => category.active || category.id === filters.category).map(category =>
        <option value={category.id} key={category.id}>{category.label}</option>)}
      {filters.category && !categories.some(category => category.id === filters.category) && <option value={filters.category}>{filters.category}</option>}
    </Select>
    <Select name="size" label="Size" value={filters.size} onChange={event => onChange('size', event.target.value)}>
      <option value="">All sizes</option>
      {sizes.map(size => <option value={size.id} key={size.id}>{size.label}</option>)}
      {filters.size && !activeSizes && <option value={filters.size} disabled>{filters.size.replaceAll('-', ' ')} (unavailable)</option>}
    </Select>
    <Select name="availability" label="Availability" value={filters.availability} onChange={event => onChange('availability', event.target.value)}>
      <option value="">All availability</option>
      {Object.entries(availabilityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
    </Select>
    <Select name="sort" label="Sort" value={filters.sort} onChange={event => onChange('sort', event.target.value)}>
      <option value="newest">Newest</option>
      <option value="price-low">Price, low to high</option>
      <option value="price-high">Price, high to low</option>
    </Select>
  </div>;
}

export default function ShopPage() {
  const [query, setQuery] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [categoryError, setCategoryError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [sizeAttempt, setSizeAttempt] = useState(0);
  const category = query.get('category')?.slice(0, 120) || '';
  const size = query.get('size')?.slice(0, 120) || '';
  const availability = Object.hasOwn(availabilityLabels, query.get('availability')) ? query.get('availability') : '';
  const sort = Object.hasOwn(productSorts, query.get('sort')) ? query.get('sort') : 'newest';
  const key = JSON.stringify([category, size, availability, sort]);
  const read = useCallback(cursor => readProductPage({ category, size, availability, sort }, cursor), [category, size, availability, sort]);
  useEffect(() => {
    let current = true;
    readCategories().then(items => { if (current) setCategories(items); })
      .catch(() => { if (current) setCategoryError(true); });
    return () => { current = false; };
  }, []);
  useEffect(() => {
    let current = true;
    readRequestableSizes().then(items => { if (current) setSizes(items); })
      .catch(() => { if (current) setSizeError(true); });
    return () => { current = false; };
  }, [sizeAttempt]);

  function updateFilter(name, value) {
    setQuery(previous => {
      const next = new URLSearchParams(previous);
      if (value && (name !== 'sort' || value !== 'newest')) next.set(name, value);
      else next.delete(name);
      return next;
    });
  }

  return <section className="container page-section catalogue-page stack">
    <div className="section-heading"><h1>Shop</h1><Link className="text-link" to="/archive">Sold archive</Link></div>
    <ShopFilters filters={{ category, size, availability, sort }} categories={categories} sizes={sizes} onChange={updateFilter} />
    {categoryError && <ErrorState>Could not load category options.</ErrorState>}
    {sizeError && <ErrorState onRetry={() => { setSizeError(false); setSizeAttempt(value => value + 1); }}>Could not load the sizes in stock.</ErrorState>}
    <PagedList key={key} read={read} emptyTo={category || size || availability ? '/shop' : '/about'}
      emptyLabel={category || size || availability ? 'Clear filters' : 'Our process'}
      empty={category || size || availability ? 'No pieces match these filters. Try another selection.' : 'Pieces will appear here as they are published. Explore our process while you browse.'}>
      {rows => <div className="product-grid">{rows.map(product => <GarmentCard key={product.slug} product={product} />)}</div>}
    </PagedList>
  </section>;
}
