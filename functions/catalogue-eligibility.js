export function canRequestProduct(product) {
  return product?.status === 'published'
    && product.isRealCatalogueStock === true
    && ['available', 'requested'].includes(product.availability);
}

export function hasPhotographedStock(draft) {
  return !!draft.photos?.length && draft.photos.every(photo => photo.kind === 'photograph');
}
