import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { readPublicPage } from '../catalogue/catalogueData.js';
import PagedList from '../catalogue/PagedList.jsx';

export default function EditorialList({ collection, heading, empty, renderDetails }) {
  const read = useCallback(cursor => readPublicPage(collection, () => [], cursor), [collection]);
  return <section className="container page-section catalogue-page stack">
    <h1>{heading}</h1>
    <PagedList key={collection} read={read} empty={empty}>
      {rows => <div className="editorial-list">{rows.map(row => <article key={row.slug} className="stack">
        <h2><Link to={`/${collection}/${row.slug}`}>{row.title}</Link></h2>
        {row.illustrative && <p className="placeholder-label">Illustrative content</p>}
        {renderDetails?.(row)}
      </article>)}</div>}
    </PagedList>
  </section>;
}
