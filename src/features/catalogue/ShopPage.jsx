import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import GarmentCard from '../../components/GarmentCard.jsx';
import { Button, ErrorState, Field, Select } from '../../components/UI.jsx';
import { availabilityLabels, productSorts, readCategories, readProductPage } from './catalogueData.js';
import PagedList from './PagedList.jsx';

function ShopFilters({ filters, categories, onApply }) {
  const [category, setCategory] = useState(filters.category);
  return <form className="shop-filters" onSubmit={event => {
    event.preventDefault();
    onApply(new FormData(event.currentTarget));
  }}>
    <Select name="category" label="Category" value={category} onChange={event => setCategory(event.target.value)}>
      <option value="">All categories</option>
      {categories.filter(category => category.active || category.id === filters.category).map(category =>
        <option value={category.id} key={category.id}>{category.label}</option>)}
      {filters.category && !categories.some(category => category.id === filters.category) && <option value={filters.category}>{filters.category}</option>}
    </Select>
    <Field label="Size" name="size" defaultValue={filters.size} placeholder="e.g. Medium" maxLength={120} />
    <Select name="availability" label="Availability" defaultValue={filters.availability}>
      <option value="">All availability</option>
      {Object.entries(availabilityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
    </Select>
    <Select name="sort" label="Sort" defaultValue={filters.sort}>
      <option value="newest">Newest</option>
      <option value="price-low">Price, low to high</option>
      <option value="price-high">Price, high to low</option>
    </Select>
    <Button type="submit">Apply filters</Button>
  </form>;
}

export default function ShopPage() {
  const [query, setQuery] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(false);
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

  function applyFilters(values) {
    const next = new URLSearchParams(query);
    for (const [name, input] of values) {
      const value = name === 'size' ? input.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : input;
      if (value && value !== 'newest') next.set(name, value);
      else next.delete(name);
    }
    setQuery(next);
  }

  return <section className="container page-section catalogue-page stack">
    <div className="section-heading"><h1>Shop</h1><Link className="text-link" to="/archive">Sold archive</Link></div>
    {query.get('q') && <p>Search for <strong>{query.get('q')}</strong> is being prepared. Browse the catalogue below.</p>}
    <ShopFilters key={`filters-${key}`} filters={{ category, size, availability, sort }} categories={categories} onApply={applyFilters} />
    {categoryError && <ErrorState>Could not load category options.</ErrorState>}
    <PagedList key={`results-${key}`} read={read} empty="No pieces match these filters.">
      {rows => <div className="product-grid">{rows.map(product => <GarmentCard key={product.slug} product={product} />)}</div>}
    </PagedList>
  </section>;
}
