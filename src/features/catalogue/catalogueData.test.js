import { expect, test, vi } from 'vitest';
import { readProductPage, readPublicDocument } from './catalogueData.js';

const sdk = vi.hoisted(() => ({
  mode: 'emulator', app: {}, db: {}, connectFirestoreEmulator: vi.fn(),
  getFirestore: vi.fn(), getDocs: vi.fn(), getDoc: vi.fn(),
}));
vi.mock('../../services/firebaseApp.js', () => ({
  getFirebaseRuntime: () => ({ mode: sdk.mode }), getFirebaseApp: () => sdk.app,
}));
vi.mock('firebase/firestore/lite', () => ({
  getFirestore: sdk.getFirestore, connectFirestoreEmulator: sdk.connectFirestoreEmulator,
  collection: (db, name) => ({ db, name }), doc: (db, name, slug) => ({ db, name, slug }),
  where: (...values) => ({ where: values }), orderBy: (...values) => ({ orderBy: values }),
  limit: value => ({ limit: value }), startAfter: cursor => ({ cursor }),
  query: (collection, ...constraints) => ({ collection, constraints }),
  getDocs: sdk.getDocs, getDoc: sdk.getDoc,
}));

test('server-only catalogue reads connect to loopback once and keep the Firestore cursor', async () => {
  sdk.getFirestore.mockReturnValue(sdk.db);
  const first = { id: 'first', data: () => ({ name: 'First piece' }) };
  const next = { id: 'second', data: () => ({ name: 'Second piece' }) };
  sdk.getDocs.mockResolvedValueOnce({ docs: [first, next], size: 2 });
  sdk.getDocs.mockResolvedValueOnce({ docs: [next], size: 1 });
  const criteria = { category: 'denim', availability: 'sold', sort: 'price-low' };
  const page = await readProductPage(criteria, null, 1);
  expect(page).toEqual({ rows: [{ slug: 'first', name: 'First piece' }], cursor: first });
  expect(await readProductPage(criteria, page.cursor, 1)).toEqual({ rows: [{ slug: 'second', name: 'Second piece' }], cursor: null });
  expect(sdk.connectFirestoreEmulator).toHaveBeenCalledExactlyOnceWith(sdk.db, '127.0.0.1', 8080);
  expect(sdk.getDocs).toHaveBeenLastCalledWith({
    collection: { db: sdk.db, name: 'products' }, constraints: [
      { where: ['status', '==', 'published'] }, { where: ['categoryId', '==', 'denim'] },
      { where: ['availability', '==', 'sold'] }, { orderBy: ['priceUGX', 'asc'] }, { cursor: first }, { limit: 2 },
    ],
  });
});

test('a connection failure remains distinct from a private or withdrawn document', async () => {
  sdk.getDoc.mockRejectedValueOnce(Object.assign(new Error(), { code: 'permission-denied' }));
  sdk.getDoc.mockRejectedValueOnce(Object.assign(new Error('Disconnected'), { code: 'unavailable' }));
  await expect(readPublicDocument('products', 'withdrawn')).resolves.toBeNull();
  await expect(readPublicDocument('products', 'unreachable')).rejects.toThrow('Disconnected');
});
