import { useEffect, useRef, useState } from 'react';
import { getFirebaseServices } from '../../services/firebase.js';

export default function PhotoPreview({ photo, thumbnail = false }) {
  const [visible, setVisible] = useState(!thumbnail);
  const [preview, setPreview] = useState(null);
  const frame = useRef(null);

  useEffect(() => {
    if (visible || !frame.current || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible && typeof IntersectionObserver === 'function') return;
    let current = true;
    let url;
    Promise.all([import('firebase/storage'), getFirebaseServices()]).then(async ([sdk, { storage }]) => {
      const blob = await sdk.getBlob(sdk.ref(storage, photo.sourcePath), 2 * 1024 * 1024);
      if (!current) return;
      url = URL.createObjectURL(blob);
      setPreview({ path: photo.sourcePath, url });
    }).catch(() => { if (current) setPreview({ path: photo.sourcePath }); });
    return () => { current = false; if (url) URL.revokeObjectURL(url); };
  }, [photo.sourcePath, visible]);

  const image = preview?.path === photo.sourcePath && preview.url && (
    <img className={thumbnail ? 'staff-thumbnail-image' : 'staff-photo'} src={preview.url} alt={thumbnail ? '' : photo.alt} />
  );
  return thumbnail ? <span className="staff-thumbnail" ref={frame}>{image}</span>
    : image || <p className="helper">{preview?.path === photo.sourcePath ? 'Preview unavailable.' : 'Loading photo…'}</p>;
}
