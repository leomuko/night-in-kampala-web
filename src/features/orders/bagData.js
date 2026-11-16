import { readPublicDocument } from '../catalogue/catalogueData.js';

export const bagStorageKey = 'nk-bag-v1';
export const maxBagItems = 12;
export const maxItemQuantity = 20;

export function readStoredBag(storage) {
  try {
    const value = JSON.parse(storage.getItem(bagStorageKey));
    if (!Array.isArray(value)) return [];
    const valid = value.filter(item => item && typeof item.slug === 'string' && item.slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)
      && typeof item.size === 'string' && item.size.length <= 120 && Number.isSafeInteger(item.priceUGX)
      && item.priceUGX > 0 && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= maxItemQuantity);
    return [...new Map(valid.map(({ slug, size, quantity, priceUGX }) => [slug, { slug, size, quantity, priceUGX }])).values()].slice(0, maxBagItems);
  } catch { return []; }
}

export async function reviewBag(items) {
  return Promise.all(items.map(async entry => {
    const product = await readPublicDocument('products', entry.slug);
    const size = product?.requestableSizes?.find(value => value.id === entry.size);
    const available = product?.status === 'published' && product.isRealCatalogueStock === true
      && product.purchasable === true && Boolean(size) && (product.stockType !== 'one-of-one' || entry.quantity === 1);
    return { entry, product, size, available, priceChanged: available && product.priceUGX !== entry.priceUGX };
  }));
}

export function canContinue(review) {
  return review.length > 0 && review.every(row => row.available && !row.priceChanged);
}

export function subtotal(rows) {
  return rows.reduce((amount, { entry, product, available }) => amount + (available ? product.priceUGX * entry.quantity : 0), 0);
}
