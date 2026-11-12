import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="site-footer"><div className="container footer-grid">
    <div><Link to="/" className="wordmark">NIGHT IN KAMPALA</Link><p className="helper">Reworked in Kampala.</p></div>
    <nav aria-label="Shop links"><h2>Shop</h2><Link to="/shop">All pieces</Link><Link to="/collections">Drops</Link><Link to="/archive">Archive</Link></nav>
    <nav aria-label="Help links"><h2>Help</h2><Link to="/help/delivery">Delivery</Link><Link to="/help/returns">Returns</Link><Link to="/help/sizing">Sizing & care</Link><Link to="/contact">Contact</Link></nav>
    <nav aria-label="Brand links"><h2>Brand</h2><Link to="/about">Our process</Link><Link to="/lookbooks">Lookbook</Link><Link to="/events">Events</Link><Link to="/help/privacy">Privacy</Link></nav>
    <p className="footer-note helper">Preview collection · illustrative pieces are not available for purchase.</p>
  </div></footer>;
}
