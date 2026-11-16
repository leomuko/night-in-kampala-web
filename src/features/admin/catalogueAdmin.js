import { getFirebaseFunctions, getFirebaseServices } from '../../services/firebase.js';

export async function callStaff(name, data) {
  const [{ httpsCallable }, functions] = await Promise.all([import('firebase/functions'), getFirebaseFunctions()]);
  return (await httpsCallable(functions, name)(data)).data;
}

export async function readEditorData() {
  const [{ collection, doc, getDoc, getDocs, query, limit, orderBy }, { db }] = await Promise.all([
    import('firebase/firestore'), getFirebaseServices(),
  ]);
  const [drafts, categories] = await Promise.all([
    getDocs(query(collection(db, 'productDrafts'), orderBy('updatedAt', 'desc'), limit(30))),
    getDoc(doc(db, 'catalogueSettings/categories')),
  ]);
  return { rows: drafts.docs.map(row => ({ slug: row.id, ...row.data() })), categories: categories.data()?.items ?? [] };
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
