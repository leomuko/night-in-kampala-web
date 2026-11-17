import { Link, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/UI.jsx';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import useDetailHead from '../catalogue/useDetailHead.js';
import usePublicDocument from '../catalogue/usePublicDocument.js';
import EditorialList from './EditorialList.jsx';
import LaunchHelp from './LaunchHelp.jsx';
import { launchHelpHeadings } from './launchHelpHeadings.js';

async function readWithCover(collection, slug) {
  const page = await readPublicDocument(collection, slug);
  if (!page?.coverProductId) return page;
  const product = await readPublicDocument('products', page.coverProductId);
  return product ? {
    ...page, cover: product.photos?.[0], illustrativeCover: product.isRealCatalogueStock !== true,
    share: { ...page.share, imageUrl: product.share?.imageUrl, imageAlt: product.share?.imageAlt },
  } : page;
}

function PageBody({ page }) {
  return <>
    {page.illustrative && <p className="placeholder-label">Illustrative content</p>}
    {page.cover && <figure className="editorial-cover">
      <img src={page.cover.largeUrl} alt={page.cover.alt} />
      {page.illustrativeCover && <figcaption className="placeholder-label">AI-generated placeholder</figcaption>}
    </figure>}
    {page.body && <p className="editorial-body">{page.body}</p>}
    {!!page.links?.length && <ul className="editorial-links">{page.links.map(({ label, href }, index) =>
      <li key={`${href}-${index}`}><Link to={href}>{label}</Link></li>)}</ul>}
  </>;
}

export function SitePage({ slug, heading }) {
  const state = usePublicDocument('pages', slug, readWithCover);
  const page = state.document;
  return <article className="container page-section catalogue-page stack">
    <h1>{page?.title ?? heading}</h1>
    {state.loading && <LoadingState />}
    {state.failed && <ErrorState onRetry={state.retry}>Could not load this page.</ErrorState>}
    {page && <PageBody page={page} />}
    {!state.loading && !state.failed && !page && (slug === 'our-process'
      ? <p>We rework secondhand clothing with original prints and designs in Kampala.</p>
      : <LaunchHelp slug={slug} />)}
  </article>;
}

const helpHeadings = launchHelpHeadings;

export function HelpPage() {
  const { slug } = useParams();
  return <SitePage slug={slug} heading={Object.hasOwn(helpHeadings, slug) ? helpHeadings[slug] : 'Help'} />;
}

export function LookbooksPage() {
  return <EditorialList collection="lookbooks" heading="Lookbook" empty="No lookbooks have been published yet." />;
}

export function LookbookPage() {
  const { slug } = useParams();
  const state = usePublicDocument('lookbooks', slug, readWithCover);
  useDetailHead('lookbooks', slug, state);
  const lookbook = state.document;
  return <article className="container page-section catalogue-page stack">
    <Link className="text-link" to="/lookbooks">All lookbooks</Link>
    {state.loading && <LoadingState />}
    {state.failed && <ErrorState onRetry={state.retry}>Could not load this lookbook.</ErrorState>}
    {lookbook ? <><h1>{lookbook.title}</h1><PageBody page={lookbook} /></>
      : !state.loading && !state.failed && <h1>Lookbook unavailable</h1>}
  </article>;
}
