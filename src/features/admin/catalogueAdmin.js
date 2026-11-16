import { getFirebaseFunctions, getFirebaseServices } from '../../services/firebase.js';

export async function callStaff(name, data) {
  const [{ httpsCallable }, functions] = await Promise.all([import('firebase/functions'), getFirebaseFunctions()]);
  return (await httpsCallable(functions, name)(data)).data;
}

export async function readEditorData() {
  const [{ collection, doc, getDoc, getDocs, query, orderBy }, { db }] = await Promise.all([
    import('firebase/firestore'), getFirebaseServices(),
  ]);
  const [drafts, categories] = await Promise.all([
    getDocs(query(collection(db, 'productDrafts'), orderBy('updatedAt', 'desc'))),
    getDoc(doc(db, 'catalogueSettings/categories')),
  ]);
  const rows = await Promise.all(drafts.docs.map(async row => {
    const draft = { ...row.data(), slug: row.id };
    if (draft.publicationStatus !== 'published' || Number.isInteger(draft.availableUnits)) return draft;
    const [stock, product] = await Promise.all([
      getDoc(doc(db, 'inventory', row.id)),
      getDoc(doc(db, 'products', row.id)).catch(error => {
        if (error.code === 'permission-denied') return null;
        throw error;
      }),
    ]);
    return { ...draft, availableUnits: stock.data()?.availableUnits, publishedAvailability: product?.data()?.availability };
  }));
  return { rows, categories: categories.data()?.items ?? [] };
}

export function staffError(error) {
  return error?.code?.startsWith('functions/') && error.code !== 'functions/internal'
    ? error.message : 'The change could not be saved. Try again.';
}

export async function readContentDrafts(kind) {
  const [{ collection, getDocs, query, where, limit }, { db }] = await Promise.all([
    import('firebase/firestore'), getFirebaseServices(),
  ]);
  const result = await getDocs(query(collection(db, 'contentDrafts'), where('collection', '==', kind), limit(30)));
  return result.docs.map(doc => doc.data());
}
