const maxSide = 2400;
const maxBytes = 2 * 1024 * 1024;

export async function preparePhoto(file) {
  const heic = /\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]/i.test(file.type);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error(heic
        ? 'This browser cannot open HEIC photos. Export the photo as JPEG or choose Most Compatible in your iPhone camera settings.'
        : 'This photo could not be opened. Try a JPEG, PNG or WebP image.');
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    let scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    for (const quality of [0.86, 0.72, 0.58, 0.50]) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-paper').trim();
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (jpeg?.type === 'image/jpeg' && jpeg.size > 0 && jpeg.size <= maxBytes) return jpeg;
      scale *= 0.82;
    }
    throw new Error('This photo could not be compressed below 2 MiB.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
