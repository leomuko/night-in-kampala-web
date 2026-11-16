import { afterEach, expect, test, vi } from 'vitest';
import { preparePhoto } from './preparePhoto.js';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function camera(decode, sizes) {
  vi.stubGlobal('Image', class {
    naturalWidth = 4000;
    naturalHeight = 3000;
    decode = decode;
  });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fixture'), revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn(), fillRect: vi.fn() });
  const dimensions = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
    dimensions.push([this.width, this.height]);
    callback(new Blob([new Uint8Array(sizes.shift())], { type }));
  });
  return dimensions;
}

test('a browser-decoded HEIC gets downscaled and retried as a bounded JPEG', async () => {
  const dimensions = camera(async () => {}, [2 * 1024 * 1024 + 1, 1000]);
  const photo = await preparePhoto(new File(['fixture'], 'IMG.HEIC', { type: 'image/heic' }));
  expect(dimensions).toEqual([[2400, 1800], [1968, 1476]]);
  expect(photo.type).toBe('image/jpeg');
  expect(photo.size).toBe(1000);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
});

test('unsupported HEIC is explained and the local file URL is released', async () => {
  camera(async () => { throw new Error('decode'); }, []);
  await expect(preparePhoto(new File(['fixture'], 'IMG.HEIC'))).rejects.toThrow(/Export the photo as JPEG/);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
});
