import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { preparePhoto } from './preparePhoto.js';
import { callStaff } from './catalogueAdmin.js';
import PhotoEditor from './PhotoEditor.jsx';
import { uploadBytesResumable } from 'firebase/storage';

const fixture = vi.hoisted(() => ({ error: null }));
vi.mock('../../services/firebaseApp.js', () => ({ getFirebaseRuntime: vi.fn(() => ({ target: 'preview' })) }));
vi.mock('../../services/firebase.js', () => ({ getFirebaseServices: async () => ({ storage: {} }) }));
vi.mock('./PhotoPreview.jsx', () => ({ default: () => <span>Saved image</span> }));
vi.mock('./preparePhoto.js', () => ({ preparePhoto: vi.fn(async () => new Blob(['fixture'], { type: 'image/jpeg' })) }));
vi.mock('./catalogueAdmin.js', () => ({ callStaff: vi.fn(async () => ({ revision: 2, photos: [{ id: 'fixture', kind: 'illustrative' }] })), staffError: error => error.message }));
vi.mock('firebase/storage', () => ({
  ref: (_storage, path) => path,
  uploadBytesResumable: vi.fn(() => ({ on: (_event, progress, failure, complete) => {
    if (fixture.error) failure(fixture.error);
    else { progress({ bytesTransferred: 1, totalBytes: 1 }); complete(); }
  } })),
}));
afterEach(() => { vi.unstubAllGlobals(); fixture.error = null; vi.clearAllMocks(); });
const draft = { slug: 'test-piece', revision: 1, photos: [], isTestData: true };

test.each(['JPEG', 'WEBP'])('preview %s samples use the normal preparation and trusted photo attachment path', async format => {
  const fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['source']) }));
  vi.stubGlobal('fetch', fetch);
  const save = vi.fn();
  render(<PhotoEditor draft={draft} user={{ uid: 'test-owner' }} onSave={save} />);
  await userEvent.click(screen.getByRole('button', { name: `Use test ${format}` }));
  expect(await screen.findByText('Photo saved.')).toBeInTheDocument();
  expect(preparePhoto.mock.calls[0][0].type).toBe(format === 'JPEG' ? 'image/jpeg' : 'image/webp');
  expect(uploadBytesResumable).toHaveBeenCalledWith(expect.stringContaining('product-drafts/test-piece/test-owner/'),
    expect.any(Blob), { contentType: 'image/jpeg', customMetadata: { nikDraftUpload: 'true' } });
  expect(callStaff).toHaveBeenCalledWith('cataloguePhotoAdd', expect.objectContaining({ slug: 'test-piece',
    revision: 1, kind: 'illustrative', extension: 'jpg', alt: `TEST illustrative ${format.toLowerCase()} upload` }));
  expect(save).toHaveBeenCalled();
});

test('upload authorization errors retain the actionable SDK code and never attach a failed upload', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob(['source']) })));
  fixture.error = { code: 'storage/unauthorized' };
  render(<PhotoEditor draft={draft} user={{ uid: 'test-owner' }} onSave={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Use test JPEG' }));
  expect(await screen.findByText(/storage\/unauthorized/)).toBeInTheDocument();
  expect(callStaff).not.toHaveBeenCalled();
});

test('production keeps preview image controls out of staff forms', () => {
  getFirebaseRuntime.mockReturnValue({ target: 'production' });
  render(<PhotoEditor draft={draft} user={{ uid: 'test-owner' }} onSave={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Use test JPEG' })).toBeNull();
});
