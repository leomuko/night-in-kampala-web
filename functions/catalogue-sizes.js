import { canRequestProduct } from './catalogue-eligibility.js';

export function sizeKey(label) {
  return label.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function requestableSizes(product, inventory) {
  if (!canRequestProduct(product) || !(inventory?.availableUnits > 0)) return [];
  const labels = product.stockType === 'one-of-one' ? [product.sizeLabel]
    : (inventory.variants ?? []).filter(variant => variant.quantity > 0).map(variant => variant.sizeLabel);
  const sizes = new Map();
  for (const label of labels) {
    if (typeof label !== 'string') continue;
    const id = sizeKey(label);
    if (id && !sizes.has(id)) sizes.set(id, { id, label });
  }
  return [...sizes.values()];
}

// Call before any other writes in the transaction. The public facet contains
// labels only, while its private counter keeps a size visible across products.
export async function updateSizeFacets(tx, db, previous, product, stock) {
  const before = new Map((previous?.requestableSizes ?? []).map(size => [size.id, size]));
  const after = requestableSizes(product, stock);
  const idsAfter = new Set(after.map(size => size.id));
  const changes = [
    ...after.filter(size => !before.has(size.id)).map(size => ({ ...size, delta: 1 })),
    ...[...before.values()].filter(size => !idsAfter.has(size.id)).map(size => ({ ...size, delta: -1 })),
  ];
  if (!changes.length) return after;
  const counts = await tx.getAll(...changes.map(({ id }) => db.doc(`catalogueSizeCounts/${id}`)));
  for (const [index, { id, label, delta }] of changes.entries()) {
    const snapshot = counts[index];
    const current = snapshot.data()?.count ?? 0;
    const count = current + delta;
    const publicRef = db.doc(`catalogueSizes/${id}`);
    if (count <= 0) {
      tx.delete(snapshot.ref);
      tx.delete(publicRef);
    } else {
      tx.set(snapshot.ref, { count });
      if (current === 0) tx.set(publicRef, { label });
    }
  }
  return after;
}
