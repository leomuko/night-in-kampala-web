// Presentation visibility is separate from stock availability: genuine Sold
// pieces remain visible in the archive. Approval and test markers come from
// the trusted publisher, never a shopper-supplied field.
export function isLaunchContent(collection, document) {
  if (!document || document.status !== 'published' || document.isTestData === true
    || document.fixture === true || document.illustrative === true) return false;
  return collection === 'products' ? document.isRealCatalogueStock === true : document.illustrative === false;
}
