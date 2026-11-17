import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useBag } from '../features/orders/bagContext.js';
import { navigation } from '../app/navigation.js';
import Dialog from './Dialog.jsx';
import Icon from './Icon.jsx';
import { Button } from './UI.jsx';

function initialRegion() {
  try { return localStorage.getItem('nk-region') === 'international' ? 'international' : 'uganda'; }
  catch { return 'uganda'; }
}

export default function Header() {
  const count = useBag()?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const [dialog, setDialog] = useState(null);
  const [region, setRegion] = useState(initialRegion);
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
        <button className="market-control" type="button" aria-label="Choose shopping region" aria-haspopup="dialog" onClick={() => setDialog('region')}>{region === 'uganda' ? 'UG' : 'INT'} / UGX <Icon name="chevron" /></button>
        <Link className="icon-button bag-link" to="/cart" aria-label={count ? `Your bag, ${count} ${count === 1 ? 'item' : 'items'}` : 'Your bag'}>
          <Icon name="bag" />{count > 0 && <span className="bag-count" aria-hidden="true">{count}</span>}
        </Link>
      </div>
    </div></header>
    <Dialog open={dialog === 'menu'} onClose={() => setDialog(null)} title="Menu" className="navigation-dialog">
      <nav aria-label="Mobile navigation">{navigation.map(item => <NavLink key={item.to} to={item.to} onClick={() => setDialog(null)}>{item.label}</NavLink>)}</nav>
      <button type="button" className="text-button" aria-haspopup="dialog" onClick={() => setDialog('region')}>Shopping region · {region === 'uganda' ? 'Uganda' : 'International'} / UGX</button>
    </Dialog>
    <Dialog open={dialog === 'region'} onClose={() => setDialog(null)} title="Shopping region">
      {dialog === 'region' && <form className="stack" onSubmit={saveRegion}>
        <p>Prices are shown in Ugandan shillings. Collection and delivery arrangements are confirmed with the team.</p>
        <label className="radio-row"><input type="radio" name="region" value="uganda" defaultChecked={region === 'uganda'} />Uganda</label>
        <label className="radio-row"><input type="radio" name="region" value="international" defaultChecked={region === 'international'} />International</label>
        <Button type="submit">Save region</Button>
      </form>}
    </Dialog>
  </>;
}
