import sharp from 'sharp';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { assertDraftRevision, boundedText, catalogueId } from './catalogue-drafts.js';

export const renditionWidths = [320, 640, 1280];
const maxBytes = 2 * 1024 * 1024;
const maxSide = 2400;

export async function renderPhoto(bytes) {
  if (!bytes.length || bytes.length > maxBytes) throw new HttpsError('invalid-argument', 'A photo must be at most 2 MiB.');
  try {
    const image = sharp(bytes, { limitInputPixels: maxSide ** 2, failOn: 'warning' });
    const { format, width, height, pages } = await image.metadata();
    if (!['jpeg', 'webp'].includes(format) || Math.max(width, height) > maxSide || (pages ?? 1) > 1) {
      throw new Error('Unsupported photo');
    }
    const entries = await Promise.all(renditionWidths.map(async size => [
      `${size}.webp`,
      await image.clone().autoOrient().resize({ width: size, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    ]));
    entries.push(['share.jpg', await image.clone().autoOrient().resize(1200, 630, { fit: 'contain', background: '#f1f1ef' }).jpeg({ quality: 83 }).toBuffer()]);
    return entries;
  } catch {
    throw new HttpsError('invalid-argument', 'The uploaded photo must be a valid JPEG or WebP, up to 2400 px on either side.');
  }
}

export async function addDraftPhoto(db, bucket, data, actor) {
  const slug = catalogueId(data?.slug);
  const id = catalogueId(data?.id);
  const alt = boundedText(data?.alt, 200, 'Photo alt text');
  if (!alt || !['jpg', 'webp'].includes(data.extension)) throw new HttpsError('invalid-argument', 'Provide photo alt text and a supported file.');
  const kind = data.kind ?? 'illustrative';
  if (!['illustrative', 'photograph'].includes(kind)) throw new HttpsError('invalid-argument', 'Choose the image source.');
  const path = db.doc(`productDrafts/${slug}`);
  const initial = await path.get();
  if (!initial.exists) throw new HttpsError('not-found', 'Save a draft before uploading photos.');
  const alreadySaved = initial.data().photos?.find(photo => photo.id === id);
  if (alreadySaved?.uploadedBy === actor.uid) return { photos: initial.data().photos, revision: initial.data().revision };
  assertDraftRevision(initial, data.revision);
  if ((initial.data().photos?.length ?? 0) >= 8 || alreadySaved) throw new HttpsError('failed-precondition', 'Use a new photo ID and a maximum of eight photos.');

  const sourcePath = `product-drafts/${slug}/${actor.uid}/${id}.${data.extension}`;
  const upload = bucket.file(sourcePath);
  const [metadata] = await upload.getMetadata().catch(() => { throw new HttpsError('not-found', 'The uploaded file could not be found.'); });
  if (Number(metadata.size) > maxBytes) throw new HttpsError('invalid-argument', 'A photo must be at most 2 MiB.');
  const [bytes] = await upload.download();
  const entries = await renderPhoto(bytes);
  // Removing a photo from a draft never makes its uploaded source reclassifiable.
  const photoSource = db.doc(`productPhotoSources/${slug}/photos/${actor.uid}--${id}`);
  await db.runTransaction(async tx => {
    const existing = await tx.get(photoSource);
    if (!existing.exists) {
      tx.create(photoSource, { kind, extension: data.extension });
    } else if (existing.data().kind !== kind || existing.data().extension !== data.extension) {
      throw new HttpsError('failed-precondition', 'This upload already has a saved image source.');
    }
  });
  const marker = initial.data().isTestData === true ? { metadata: { nikTestData: 'true' } } : {};
  const processedPath = `product-processed/${slug}/${actor.uid}/${id}`;
  await Promise.all(entries.map(([name, buffer]) =>
    bucket.file(`${processedPath}/${name}`).save(buffer, {
      resumable: false, metadata: { contentType: name.endsWith('.jpg') ? 'image/jpeg' : 'image/webp', ...marker },
    }),
  ));

  return db.runTransaction(async tx => {
    const current = await tx.get(path);
    const previous = current.data()?.photos ?? [];
    if (previous.some(photo => photo.id === id && photo.uploadedBy === actor.uid)) {
      return { photos: previous, revision: current.data().revision };
    }
    assertDraftRevision(current, data.revision);
    const photos = [...previous, { id, alt, kind, sourcePath, processedPath, uploadedBy: actor.uid }];
    const revision = data.revision + 1;
    tx.update(path, { photos, revision, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
    return { photos, revision };
  });
}

export async function updateDraftPhotos(db, data, actor) {
  const slug = catalogueId(data?.slug);
  if (!Array.isArray(data.photos) || data.photos.length > 8) throw new HttpsError('invalid-argument', 'Select up to eight photos.');
  const path = db.doc(`productDrafts/${slug}`);
  return db.runTransaction(async tx => {
    const current = await tx.get(path);
    assertDraftRevision(current, data.revision);
    if (!current.exists) throw new HttpsError('not-found', 'Save a draft first.');
    const seen = new Set();
    const photos = data.photos.map(selection => {
      const photo = current.data().photos?.find(item => item.id === selection?.id);
      const alt = boundedText(selection?.alt, 200, 'Photo alt text');
      if (!photo || !alt || seen.has(photo.id)) throw new HttpsError('invalid-argument', 'Use distinct saved photos with alt text.');
      seen.add(photo.id);
      return { ...photo, alt };
    });
    const revision = data.revision + 1;
    tx.update(path, { photos, revision, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
    return { photos, revision };
  });
}
