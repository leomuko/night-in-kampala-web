import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { getFirebaseServices } from '../../services/firebase.js';

export const availabilityLabels = { available: 'Available', requested: 'Requested', reserved: 'Reserved', sold: 'Sold' };
export const productSorts = {
  newest: ['publishedAt', 'desc'],
  'price-low': ['priceUGX', 'asc'],
  'price-high': ['priceUGX', 'desc'],
};

export async function publicFirestore() {
  if (getFirebaseRuntime().mode === 'preview') return null;
  const [{ db }, sdk] = await Promise.all([getFirebaseServices(), import('firebase/firestore')]);
  return { db, sdk };
}

export async function readPublicPage(collection, buildConstraints, cursor, pageSize = 12) {
  const firestore = await publicFirestore();
  if (!firestore) return { rows: [], cursor: null };
  const { db, sdk } = firestore;
  const constraints = [sdk.where('status', '==', 'published'), ...buildConstraints(sdk)];
  if (cursor) constraints.push(sdk.startAfter(cursor));
  const snapshot = await sdk.getDocs(sdk.query(sdk.collection(db, collection), ...constraints, sdk.limit(pageSize + 1)));
  const docs = snapshot.docs.slice(0, pageSize);
  return { rows: docs.map(doc => ({ ...doc.data(), slug: doc.id })), cursor: snapshot.size > pageSize ? docs.at(-1) : null };
}

export function readProductPage(filters, cursor, pageSize) {
  return readPublicPage('products', sdk => {
    const constraints = [];
    if (filters.category) constraints.push(sdk.where('categoryId', '==', filters.category));
    if (filters.size) constraints.push(sdk.where('sizeKeys', 'array-contains', filters.size));
    if (filters.availability) constraints.push(sdk.where('availability', '==', filters.availability));
    constraints.push(sdk.orderBy(...(productSorts[filters.sort] ?? productSorts.newest)));
    return constraints;
  }, cursor, pageSize);
}

export async function readCategories() {
  const firestore = await publicFirestore();
  if (!firestore) return [];
  const { db, sdk } = firestore;
  return (await sdk.getDoc(sdk.doc(db, 'catalogueSettings', 'categories'))).data()?.items ?? [];
}

export async function readPublicDocument(collection, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  const firestore = await publicFirestore();
  if (!firestore) return null;
  const { db, sdk } = firestore;
  try {
    const snapshot = await sdk.getDoc(sdk.doc(db, collection, slug));
    const document = snapshot.data();
    return document?.status === 'published' ? { ...document, slug: snapshot.id } : null;
  } catch (error) {
    if (error.code === 'permission-denied') return null;
    throw error;
  }
}
