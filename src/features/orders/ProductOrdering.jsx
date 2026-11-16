import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Select } from '../../components/UI.jsx';
import { maxBagItems } from './bagData.js';
import { useBag } from './bagContext.js';
import { isOrderingOpen } from './orderAvailability.js';

export default function ProductOrdering({ slug, product }) {
  const bag = useBag();
  const prior = bag?.items.find(item => item.slug === slug);
  const sizes = product.requestableSizes ?? [];
  const [selected, setSelected] = useState(prior?.size);
  const [message, setMessage] = useState('');
  const size = sizes.some(option => option.id === selected) ? selected : sizes[0]?.id;
  const real = product.isRealCatalogueStock === true;
  const open = isOrderingOpen();
  const eligible = open && product.status === 'published' && real && product.purchasable === true
    && ['available', 'requested'].includes(product.availability) && Boolean(size && bag);

  function add() {
    if (!eligible) return;
    if (!prior && bag.items.length >= maxBagItems) {
      setMessage('Your bag is full. Remove a piece to add another.');
      return;
    }
    bag.put({ slug, size, quantity: prior?.size === size ? prior.quantity : 1, priceUGX: product.priceUGX });
    setMessage(prior ? 'Your bag was updated.' : 'Added to your bag.');
  }

  return <div className="product-ordering">
    {!open && <p role="status">Ordering opens soon</p>}
    {eligible && product.stockType === 'repeatable' && <Select label="Size to request" value={size}
      onChange={event => { setSelected(event.target.value); setMessage(''); }}>
      {sizes.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}
    </Select>}
    <Button disabled={!eligible} onClick={add}>Add to bag</Button>
    {eligible && <p className="helper">Adding to your bag does not reserve stock.</p>}
    {!real && <p className="helper">Illustrative piece. Ordering is unavailable.</p>}
    {message && <p role="status">{message} <Link to="/cart">View bag</Link></p>}
  </div>;
}
