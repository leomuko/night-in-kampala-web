// Presentation fixtures only. Never map these records into purchasable stock.
export const previewProducts = Object.freeze([
  { slug: 'preview-graphic-tee', name: 'Reworked graphic tee', price: 85000, image: 'graphic-tee', alt: 'AI-generated placeholder: washed black tee with three cream brush marks' },
  { slug: 'preview-painted-denim', name: 'Painted denim', price: 160000, image: 'painted-denim', alt: 'AI-generated placeholder: blue denim with repaired seams and white brush marks' },
  { slug: 'preview-workwear-jacket', name: 'Reworked jacket', price: 220000, image: 'workwear-jacket', alt: 'AI-generated placeholder: olive jacket with a small cream repair patch' },
].map(item => Object.freeze({ ...item, isRealCatalogueStock: false, purchasable: false })));

export function formatPrice(amount) {
  return `UGX ${new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(amount)}`;
}
