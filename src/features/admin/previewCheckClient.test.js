import { afterEach, expect, test, vi } from 'vitest';
import { getToken } from 'firebase/app-check';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { getFirebaseServices } from '../../services/firebase.js';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import { previewTestPhone, runPreviewCheck } from './previewCheckClient.js';
import { normalizePhone } from '../../../functions/order-contact.js';

vi.mock('firebase/app-check', () => ({ getToken: vi.fn(async () => ({ token: 'synthetic-attestation' })) }));
vi.mock('../../services/firebaseAppCheck.js', () => ({ initializeFirebaseAppCheck: async () => ({ fixture: true }) }));
vi.mock('../../services/firebaseApp.js', () => ({ getFirebaseRuntime: vi.fn() }));
vi.mock('../../services/firebase.js', () => ({ getFirebaseServices: vi.fn() }));
vi.mock('../catalogue/catalogueData.js', () => ({ readPublicDocument: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

test('the preview form default passes the server phone validator', () => {
  expect(normalizePhone(previewTestPhone, 'UG')).toBe(previewTestPhone);
});

test('preview checks refuse production and non-owner identities before transmitting', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  getFirebaseRuntime.mockReturnValue({ mode: 'cloud', target: 'production' });
  await expect(runPreviewCheck({})).rejects.toThrow('Hosting preview');
  getFirebaseRuntime.mockReturnValue({ mode: 'cloud', target: 'preview', config: { projectId: 'test-fixture' } });
  getFirebaseServices.mockResolvedValue({ auth: { currentUser: { getIdTokenResult: async () => ({ claims: { staff: true } }) } } });
  await expect(runPreviewCheck({})).rejects.toThrow('Owner access');
  expect(fetch).not.toHaveBeenCalled();
});

test('owner preview probes attest requests, enforce test stock and keep tokens out of results', async () => {
  getFirebaseRuntime.mockReturnValue({ mode: 'cloud', target: 'preview', config: { projectId: 'test-fixture' } });
  getFirebaseServices.mockResolvedValue({ auth: { currentUser: { getIdTokenResult: async () => ({ claims: { owner: true }, token: 'synthetic-identity' }) } } });
  const fetch = vi.fn(async () => ({ status: 200, json: async () => ({ result: { reference: 'NK-TEST', previewSource: { fingerprint: 'fixture', count: 1 } } }) }));
  vi.stubGlobal('fetch', fetch);
  readPublicDocument.mockResolvedValue({ isTestData: false, purchasable: true, requestableSizes: [{ id: 'm' }] });
  await expect(runPreviewCheck({ slug: 'real', phone: '+447700900100' })).rejects.toThrow('test stock');
  expect(fetch).not.toHaveBeenCalled();
  const result = await runPreviewCheck({ slug: '', spoof: true });
  expect(getToken).toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledWith('https://europe-west1-test-fixture.cloudfunctions.net/orderCreate', expect.objectContaining({
    headers: expect.objectContaining({ 'X-Firebase-AppCheck': 'synthetic-attestation', 'X-Forwarded-For': '198.51.100.77' }),
    body: JSON.stringify({ data: { previewCheck: true } }),
  }));
  expect(result.source).toEqual({ fingerprint: 'fixture', count: 1 });
  expect(JSON.stringify(result)).not.toContain('synthetic-attestation');
  expect(JSON.stringify(result)).not.toContain('synthetic-identity');
});
