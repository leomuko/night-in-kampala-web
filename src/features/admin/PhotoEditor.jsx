import { useEffect, useState } from 'react';
import { Button, ErrorState, Field, Select } from '../../components/UI.jsx';
import { getFirebaseServices } from '../../services/firebase.js';
import { callStaff, staffError } from './catalogueAdmin.js';
import { preparePhoto } from './preparePhoto.js';

function PhotoPreview({ photo }) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    let active = true;
    let url;
    Promise.all([import('firebase/storage'), getFirebaseServices()]).then(async ([sdk, { storage }]) => {
      const blob = await sdk.getBlob(sdk.ref(storage, photo.sourcePath), 2 * 1024 * 1024);
      if (!active) return;
      url = URL.createObjectURL(blob);
      setPreview(url);
    }).catch(() => { if (active) setPreview(false); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [photo.sourcePath]);
  if (preview === false) return <p className="helper">Preview unavailable.</p>;
  return preview ? <img className="staff-photo" src={preview} alt={photo.alt} /> : <span className="helper">Loading photo…</span>;
}

export default function PhotoEditor({ draft, user, onSave }) {
  const [photos, setPhotos] = useState(draft.photos ?? []);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(null);
  const dirty = JSON.stringify(photos) !== JSON.stringify(draft.photos ?? []);

  async function attach(data) {
    const result = await callStaff('cataloguePhotoAdd', { ...data, slug: draft.slug, revision: draft.revision });
    setPhotos(result.photos);
    onSave({ ...draft, ...result });
    setPending(null);
    setStatus('Photo saved.');
  }

  async function upload(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const file = fields.get('photo');
    setError('');
    setStatus('Preparing photo…');
    setBusy(true);
    let stage = 'prepare';
    try {
      const jpeg = await preparePhoto(file);
      stage = 'upload';
      const id = crypto.randomUUID();
      const data = { id, alt: fields.get('alt').trim(), extension: 'jpg', kind: fields.get('kind') };
      const [{ ref, uploadBytesResumable }, { storage }] = await Promise.all([import('firebase/storage'), getFirebaseServices()]);
      const task = uploadBytesResumable(ref(storage, `product-drafts/${draft.slug}/${user.uid}/${id}.jpg`), jpeg, { contentType: 'image/jpeg' });
      await new Promise((resolve, reject) => task.on('state_changed', snapshot => {
        setProgress(Math.round(snapshot.bytesTransferred * 100 / snapshot.totalBytes));
      }, reject, resolve));
      stage = 'attach';
      setPending(data);
      setStatus('Checking and saving photo…');
      await attach(data);
      form.reset();
    } catch (failure) {
      setStatus('');
      setError(stage === 'prepare' ? failure.message : stage === 'upload' ? 'The upload failed. Select the photo and try again.' : staffError(failure));
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }

  async function saveOrder() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const result = await callStaff('cataloguePhotosSave', {
        slug: draft.slug, revision: draft.revision,
        photos: photos.map(({ id, alt }) => ({ id, alt })),
      });
      onSave({ ...draft, ...result });
      setPhotos(result.photos);
      setStatus('Photo changes saved.');
    } catch (failure) { setError(staffError(failure)); }
    finally { setBusy(false); }
  }

  function move(index, step) {
    const next = [...photos];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    setPhotos(next);
  }

  return <section className="staff-panel stack">
    <h2>Draft photos</h2>
    {photos.map((photo, index) => <div className="stack staff-form" key={photo.id}>
      <PhotoPreview photo={photo} />
      <p className="helper">{photo.kind === 'photograph' ? 'Photograph of the piece' : 'Illustrative image'}</p>
      <Field label={`Photo ${index + 1} alt text`} value={photo.alt} maxLength={200} disabled={busy} onChange={event => {
        const alt = event.target.value;
        setPhotos(previous => previous.map(item => item.id === photo.id ? { ...item, alt } : item));
      }} />
      <div className="staff-actions">
        <Button variant="secondary" disabled={busy || index === 0} onClick={() => move(index, -1)}>Move up</Button>
        <Button variant="secondary" disabled={busy || index === photos.length - 1} onClick={() => move(index, 1)}>Move down</Button>
        <Button variant="secondary" disabled={busy} onClick={() => setPhotos(previous => previous.filter(item => item.id !== photo.id))}>Remove photo</Button>
      </div>
    </div>)}
    {dirty && <Button disabled={busy} onClick={saveOrder}>Save photo changes</Button>}
    <form className="stack staff-form" onSubmit={upload}>
      <Field label="Photo" name="photo" type="file" accept="image/*,.heic,.heif" required disabled={busy || dirty || !!pending || photos.length >= 8}
        hint="Up to eight photos. The browser compresses each to 2 MiB and 2400 px on the longest side." />
      <Field label="New photo alt text" name="alt" maxLength={200} required disabled={busy || dirty || !!pending || photos.length >= 8} />
      <Select label="Image source" name="kind" disabled={busy || dirty || !!pending || photos.length >= 8}>
        <option value="illustrative">Illustrative or generated image</option>
        <option value="photograph">Photograph of the actual piece</option>
      </Select>
      <Button type="submit" disabled={busy || dirty || !!pending || photos.length >= 8}>Upload photo</Button>
    </form>
    {progress !== null && <progress aria-label="Upload progress" max="100" value={progress}>{progress}%</progress>}
    {status && <p role="status">{status}</p>}
    {error && <ErrorState>{error}</ErrorState>}
    {pending && !busy && <div className="staff-actions">
      <Button onClick={async () => {
        setBusy(true); setError('');
        try { await attach(pending); } catch (failure) { setError(staffError(failure)); }
        finally { setBusy(false); }
      }}>Retry saving uploaded photo</Button>
      <Button variant="secondary" onClick={() => { setPending(null); setError(''); }}>Choose another photo</Button>
    </div>}
  </section>;
}
