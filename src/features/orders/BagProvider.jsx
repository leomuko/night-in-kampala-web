import { useEffect, useState } from 'react';
import { BagContext } from './bagContext.js';
import { bagStorageKey, maxBagItems, readStoredBag } from './bagData.js';

export default function BagProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return readStoredBag(window.localStorage); } catch { return []; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(bagStorageKey, JSON.stringify(items)); } catch { /* Keep the current-session bag. */ }
  }, [items]);

  function put(item) {
    setItems(previous => previous.some(row => row.slug === item.slug)
      ? previous.map(row => row.slug === item.slug ? item : row)
      : previous.length < maxBagItems ? [...previous, item] : previous);
  }

  return <BagContext.Provider value={{
    items, put,
    remove: slug => setItems(previous => previous.filter(item => item.slug !== slug)),
    acknowledge: review => setItems(previous => previous.map(item => {
      const row = review.find(candidate => candidate.entry === item);
      return row?.priceChanged ? { ...item, priceUGX: row.product.priceUGX } : item;
    })),
  }}>{children}</BagContext.Provider>;
}
