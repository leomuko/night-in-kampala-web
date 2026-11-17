import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { RecentOrder } from '../orders/OrderReceipt.jsx';
import LatestPieces from './LatestPieces.jsx';
import useLatestPieces from './useLatestPieces.js';
import { isLaunchContent } from '../../../functions/public-content.js';

export default function HomePage() {
  const latest = useLatestPieces();
  const photo = latest.rows.find(product => isLaunchContent('products', product))?.photos?.[0];
  return <>
    <section className={`container hero${photo ? '' : ' hero--text-only'}`} aria-labelledby="hero-title">
      <div className="hero-copy"><h1 id="hero-title">A SECOND LIFE.</h1><p className="editorial">Reworked in Kampala.</p><Link className="button" to="/shop">Explore the shop</Link></div>
      {photo && <figure className="hero-media"><img src={photo.largeUrl ?? photo.mediumUrl} alt={photo.alt} fetchPriority="high" /></figure>}
    </section>
    <RecentOrder />
    <section className="container page-section" aria-labelledby="latest-title">
      <div className="section-heading"><h2 id="latest-title">THE LATEST PIECES</h2><Link to="/shop" className="text-link">View all</Link></div>
      <LatestPieces state={latest} />
    </section>
    <section className="container page-section process-teaser" aria-labelledby="process-title"><h2 id="process-title">FROM FOUND<br />TO REWORKED</h2><div className="stack"><p className="editorial">Secondhand clothing, given a new life through repair, original prints and design.</p><Link className="text-link arrow-link" to="/about">See our process <Icon name="arrow" /></Link></div></section>
    <section className="container page-section event-teaser" aria-labelledby="event-title"><div><p className="eyebrow">Beyond the clothes</p><h2 id="event-title">KAMPALA / NAIROBI</h2><p className="editorial">Fashion events by Night in Kampala. Find dates and details here when announced.</p></div><Link className="text-link arrow-link" to="/events">Explore events <Icon name="arrow" /></Link></section>
  </>;
}
