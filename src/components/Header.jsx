import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { navigation } from '../app/navigation.js';
import Dialog from './Dialog.jsx';
import Icon from './Icon.jsx';
import { Button, Field } from './UI.jsx';

function initialRegion() {
  try { return localStorage.getItem('nk-region') === 'international' ? 'international' : 'uganda'; }
  catch { return 'uganda'; }
}

export default function Header() {
  const [dialog, setDialog] = useState(null);
  const [region, setRegion] = useState(initialRegion);
  const navigate = useNavigate();
  function saveRegion(event) {
    event.preventDefault();
    const next = new FormData(event.currentTarget).get('region');
    setRegion(next);
    try { localStorage.setItem('nk-region', next); } catch { /* Session preference still works without storage. */ }
    setDialog(null);
  }
  return <>
    <header className="site-header"><div className="container header-inner">
      <button className="icon-button menu-trigger" type="button" aria-label="Open menu" aria-haspopup="dialog" onClick={() => setDialog('menu')}><Icon name="menu" /></button>
      <Link to="/" className="wordmark" aria-label="Night in Kampala home">NIGHT IN KAMPALA</Link>
      <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(item => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}</nav>
      <div className="header-actions">
        <button className="market-control" type="button" aria-label="Choose shopping region" onClick={() => setDialog('region')}>{region === 'uganda' ? 'UG' : 'INT'} / UGX <Icon name="chevron" /></button>
        <button className="icon-button" type="button" aria-label="Open search" onClick={() => setDialog('search')}><Icon name="search" /></button>
        <Link className="icon-button" to="/cart" aria-label="Your bag"><Icon name="bag" /></Link>
      </div>
    </div></header>
    <Dialog open={dialog === 'menu'} onClose={() => setDialog(null)} title="Menu" className="navigation-dialog">
      <nav aria-label="Mobile navigation">{navigation.map(item => <NavLink key={item.to} to={item.to} onClick={() => setDialog(null)}>{item.label}</NavLink>)}</nav>
      <button type="button" className="text-button" onClick={() => setDialog('region')}>Shopping region · {region === 'uganda' ? 'Uganda' : 'International'} / UGX</button>
    </Dialog>
    <Dialog open={dialog === 'search'} onClose={() => setDialog(null)} title="Search">
      <form className="stack" onSubmit={event => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('search').trim();
        if (!value) return;
        setDialog(null);
        navigate(`/shop?q=${encodeURIComponent(value)}`);
      }}>
        <Field label="What are you looking for?" name="search" type="search" placeholder="Denim, tees, jackets…" required maxLength={100} />
        <Button type="submit">Search</Button>
      </form>
    </Dialog>
    <Dialog open={dialog === 'region'} onClose={() => setDialog(null)} title="Shopping region">
      <form className="stack" onSubmit={saveRegion}>
        <p>Prices are shown in Ugandan shillings. Delivery destinations will be confirmed when the store opens.</p>
        <label className="radio-row"><input type="radio" name="region" value="uganda" defaultChecked={region === 'uganda'} />Uganda</label>
        <label className="radio-row"><input type="radio" name="region" value="international" defaultChecked={region === 'international'} />International</label>
        <Button type="submit">Save region</Button>
      </form>
    </Dialog>
  </>;
}
