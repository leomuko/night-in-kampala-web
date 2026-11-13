const availabilityStates = new Set(['available', 'requested', 'reserved', 'sold']);
const stockTypes = new Set(['one-of-one', 'repeatable']);

function publicText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be text.`);
  return value.trim();
}

function publicId(value, field) {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 120) {
    throw new TypeError(`${field} must be a lowercase ID.`);
  }
  return value;
}

// The publishing function must validate completeness, category and inventory
// in P2.05. This boundary copies only shopper-facing fields, including in lists.
export function buildPublicProduct(draft, { slug, availability, mediaRevision, photos, publishedAt }) {
  publicId(slug, 'Product slug');
  publicId(mediaRevision, 'Media revision');
  if (!availabilityStates.has(availability) || !stockTypes.has(draft.stockType)) {
    throw new TypeError('Invalid catalogue availability or stock type.');
  }
  if (!Number.isSafeInteger(draft.priceUGX) || draft.priceUGX <= 0) {
    throw new TypeError('Price must be a positive whole UGX amount.');
  }
  if (!Number.isFinite(publishedAt?.toMillis?.())) throw new TypeError('A Firestore publication timestamp is required.');

  const mediaBase = `/media/products/${slug}/${mediaRevision}`;
  const gallery = photos.map(photo => {
    const id = publicId(photo.id, 'Photo ID');
    return {
      id,
      alt: publicText(photo.alt, 'Photo alt text'),
      smallUrl: `${mediaBase}/${id}-320.webp`,
      mediumUrl: `${mediaBase}/${id}-640.webp`,
      largeUrl: `${mediaBase}/${id}-1280.webp`,
    };
  });
  if (!gallery.length) throw new TypeError('At least one processed photo is required.');
  return {
    status: 'published',
    name: publicText(draft.name, 'Product name'),
    itemCode: publicText(draft.itemCode, 'Item code'),
    categoryId: publicId(draft.categoryId, 'Category ID'),
    priceUGX: draft.priceUGX,
    stockType: draft.stockType,
    sizeLabel: publicText(draft.sizeLabel, 'Size label'),
    sizeKeys: [...new Set(draft.sizeKeys.map(key => publicId(key, 'Size key')))],
    measurements: draft.measurements.map(({ label, cm }) => {
      if (!Number.isFinite(cm) || cm <= 0) throw new TypeError('Measurements must be positive numbers in cm.');
      return { label: publicText(label, 'Measurement label'), cm };
    }),
    condition: publicText(draft.condition, 'Condition'),
    reworkNotes: publicText(draft.reworkNotes, 'Rework notes'),
    care: publicText(draft.care, 'Care'),
    availability,
    publishedAt,
    isRealCatalogueStock: draft.isRealCatalogueStock === true,
    purchasable: false,
    mediaRevision,
    photos: gallery,
    share: {
      description: publicText(draft.shareDescription, 'Share description'),
      imageUrl: `${mediaBase}/share.jpg`,
      imageAlt: gallery[0].alt,
    },
  };
}
