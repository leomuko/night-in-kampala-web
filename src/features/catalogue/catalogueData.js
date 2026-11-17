import { getFirebaseApp, getFirebaseRuntime } from '../../services/firebaseApp.js';
import { isLaunchContent } from '../../../functions/public-content.js';

export const availabilityLabels = { available: 'Available', requested: 'Requested', reserved: 'Reserved', sold: 'Sold' };
export const productSorts = {
  newest: ['publishedAt', 'desc'],
  'price-low': ['priceUGX', 'asc'],
  'price-high': ['priceUGX', 'desc'],
};

let publicClient;
async function publicFirestore() {
  const { mode } = getFirebaseRuntime();
  if (mode === 'preview') return null;
  // The catalogue uses server reads. The Lite SDK avoids a realtime connection
  // for guests and never substitutes a local cache for a publication check.
  publicClient ??= import('firebase/firestore/lite').then(sdk => {
    const db = sdk.getFirestore(getFirebaseApp());
    if (mode === 'emulator') sdk.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    return { db, sdk };
  }).catch(error => { publicClient = undefined; throw error; });
  return publicClient;
}

export async function readPublicPage(collection, buildConstraints, cursor, pageSize = 12) {
  const firestore = await publicFirestore();
  if (!firestore) return { rows: [], cursor: null };
  const { db, sdk } = firestore;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 23) throw new Error('Use a bounded catalogue page.');
  const cloud = getFirebaseRuntime().mode === 'cloud';
  const eligible = [];
  let next = cursor;
  // Retain bounded reads and raw Firestore cursors while stepping over old
  // fixtures. Hidden documents must not leave an apparently empty first page.
  do {
    const constraints = [sdk.where('status', '==', 'published'), ...buildConstraints(sdk)];
    if (next) constraints.push(sdk.startAfter(next));
    const snapshot = await sdk.getDocs(sdk.query(sdk.collection(db, collection), ...constraints, sdk.limit(pageSize + 1)));
    eligible.push(...snapshot.docs.filter(doc => !cloud || isLaunchContent(collection, doc.data())));
    next = snapshot.size === pageSize + 1 ? snapshot.docs.at(-1) : null;
  } while (cloud && eligible.length <= pageSize && next);
  const docs = eligible.slice(0, pageSize);
  return { rows: docs.map(doc => ({ ...doc.data(), slug: doc.id })), cursor: eligible.length > pageSize ? docs.at(-1) : null };
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

export async function readRequestableSizes() {
  const firestore = await publicFirestore();
  if (!firestore) return [];
  const { db, sdk } = firestore;
  const sizes = [];
  let cursor;
  do {
    const constraints = [sdk.orderBy('label'), sdk.limit(24)];
    if (cursor) constraints.push(sdk.startAfter(cursor));
    const result = await sdk.getDocs(sdk.query(sdk.collection(db, 'catalogueSizes'), ...constraints));
    sizes.push(...result.docs.filter(doc => getFirebaseRuntime().mode !== 'cloud' || doc.data().isTestData !== true)
      .map(doc => ({ id: doc.id, label: doc.data().label })));
    cursor = result.size === 24 ? result.docs.at(-1) : undefined;
  } while (cursor);
  return sizes;
}

export async function readPublicDocument(collection, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  const firestore = await publicFirestore();
  if (!firestore) return null;
  const { db, sdk } = firestore;
  try {
    // Missing optional Help pages must be an empty published query, rather than
    // a denied get on a non-existent document. Never broaden public access.
    const snapshot = collection === 'pages'
      ? (await sdk.getDocs(sdk.query(sdk.collection(db, collection),
        sdk.where('status', '==', 'published'), sdk.orderBy(sdk.documentId()), sdk.startAt(slug), sdk.limit(1)))).docs
        .find(doc => doc.id === slug)
      : await sdk.getDoc(sdk.doc(db, collection, slug));
    const document = snapshot?.data();
    return document?.status === 'published' && (getFirebaseRuntime().mode !== 'cloud' || isLaunchContent(collection, document))
      ? { ...document, slug: snapshot.id } : null;
  } catch (error) {
    if (error.code === 'permission-denied') return null;
    throw error;
  }
}

export async function readOrderPolicy() {
  const firestore = await publicFirestore();
  if (!firestore) return null;
  const { db, sdk } = firestore;
  return (await sdk.getDoc(sdk.doc(db, 'orderPolicy', 'current'))).data() ?? null;
}
