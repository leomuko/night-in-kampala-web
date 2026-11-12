import { Link } from 'react-router-dom';
import GarmentCard from '../../components/GarmentCard.jsx';
import Icon from '../../components/Icon.jsx';
import { previewProducts } from '../../data/previewProducts.js';

export default function HomePage() {
  return <>
    <section className="container hero" aria-labelledby="hero-title">
      <div className="hero-copy"><h1 id="hero-title">A SECOND LIFE.</h1><p className="editorial">Reworked in Kampala.</p><Link className="button" to="/collections">Shop the drop</Link></div>
      <figure className="hero-media"><img src="/assets/campaign-960.webp" srcSet="/assets/campaign-480.webp 480w, /assets/campaign-960.webp 960w, /assets/campaign-1440.webp 1440w" sizes="(min-width: 1440px) 720px, (min-width: 1024px) 55vw, 100vw" alt="AI-generated campaign placeholder: a model wearing reworked olive workwear in a daylight courtyard" width="1536" height="1024" fetchPriority="high" /><figcaption className="placeholder-label">AI-generated placeholder</figcaption></figure>
    </section>
    <section className="container page-section" aria-labelledby="latest-title">
      <div className="section-heading"><h2 id="latest-title">THE LATEST PIECES</h2><Link to="/shop" className="text-link">View all</Link></div>
      <div className="product-grid">{previewProducts.map(product => <GarmentCard key={product.slug} product={product} />)}</div>
    </section>
    <section className="container page-section process-teaser" aria-labelledby="process-title"><h2 id="process-title">FROM FOUND<br />TO REWORKED</h2><div className="stack"><p className="editorial">Secondhand clothing, given a new life through repair, original prints and design.</p><Link className="text-link arrow-link" to="/about">See our process <Icon name="arrow" /></Link></div></section>
    <section className="container page-section event-teaser" aria-labelledby="event-title"><div><p className="eyebrow">Beyond the clothes</p><h2 id="event-title">KAMPALA / NAIROBI</h2><p className="editorial">Our fashion events bring the community together.</p></div><Link className="text-link arrow-link" to="/events">Explore events <Icon name="arrow" /></Link></section>
    <section className="container page-section newsletter-teaser"><h2>BE FIRST TO THE NEXT DROP.</h2><div><p>Drop updates are coming with the first collection.</p><Link className="text-link" to="/contact">Get in touch</Link></div></section>
  </>;
}
