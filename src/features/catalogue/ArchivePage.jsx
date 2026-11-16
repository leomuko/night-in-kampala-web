import { Link } from 'react-router-dom';
import GarmentCard from '../../components/GarmentCard.jsx';
import PagedList from './PagedList.jsx';
import { readProductPage } from './catalogueData.js';

const readArchive = cursor => readProductPage({ availability: 'sold', sort: 'newest' }, cursor);

export default function ArchivePage() {
  return <section className="container page-section catalogue-page stack">
    <div className="section-heading"><h1>Sold archive</h1><Link className="text-link" to="/shop">View shop</Link></div>
    <PagedList read={readArchive} empty="No sold pieces have been published yet.">
      {rows => <div className="product-grid">{rows.map(product => <GarmentCard key={product.slug} product={product} />)}</div>}
    </PagedList>
  </section>;
}
