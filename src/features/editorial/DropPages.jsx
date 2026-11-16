import { Link, useParams } from 'react-router-dom';
import GarmentCard from '../../components/GarmentCard.jsx';
import { ErrorState, LoadingState } from '../../components/UI.jsx';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import useDetailHead from '../catalogue/useDetailHead.js';
import usePublicDocument from '../catalogue/usePublicDocument.js';
import EditorialList from './EditorialList.jsx';

export function DropsPage() {
  return <EditorialList collection="collections" heading="Drops" empty="No drops have been published yet." />;
}

async function readDrop(collection, slug) {
  const drop = await readPublicDocument(collection, slug);
  if (!drop) return null;
  const pieces = (await Promise.all((drop.productIds ?? []).map(id => readPublicDocument('products', id)))).filter(Boolean);
  const cover = pieces.find(product => product.slug === drop.coverProductId);
  return {
    ...drop, pieces, cover: cover?.photos?.[0],
    share: cover ? { ...drop.share, imageUrl: cover.share?.imageUrl, imageAlt: cover.share?.imageAlt } : drop.share,
  };
}

export function DropPage() {
  const { slug } = useParams();
  const state = usePublicDocument('collections', slug, readDrop);
  useDetailHead('collections', slug, state);
  if (state.loading) return <div className="container page-section"><LoadingState>Loading drop…</LoadingState></div>;
  if (state.failed) return <div className="container page-section"><ErrorState onRetry={state.retry}>Could not load this drop.</ErrorState></div>;
  const drop = state.document;
  if (!drop) return <section className="container placeholder-page"><h1>Drop unavailable</h1><Link to="/collections">View drops</Link></section>;
  return <article className="container page-section catalogue-page stack">
    <Link className="text-link" to="/collections">All drops</Link>
    <h1>{drop.title}</h1>
    {drop.illustrative && <p className="placeholder-label">Illustrative content</p>}
    {drop.body && <p className="editorial-body">{drop.body}</p>}
    {drop.cover && <figure className="editorial-cover"><img src={drop.cover.largeUrl} alt={drop.cover.alt} />
      {drop.illustrative && <figcaption className="placeholder-label">AI-generated placeholder</figcaption>}
    </figure>}
    {drop.pieces.length > 0 ? <div className="product-grid">{drop.pieces.map(product => <GarmentCard key={product.slug} product={product} />)}</div>
      : <p>No pieces are currently listed for this drop.</p>}
  </article>;
}
