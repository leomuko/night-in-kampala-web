import { useRef, useState } from 'react';

export default function ProductGallery({ photos }) {
  const track = useRef(null);
  const [active, setActive] = useState(0);
  if (!photos.length) return null;
  function go(index) {
    const next = Math.max(0, Math.min(photos.length - 1, index));
    const element = track.current;
    element.scrollTo({ left: next * element.clientWidth });
    setActive(next);
  }

  return <section className="product-gallery" aria-label="Product photos">
    <div className="gallery-track" ref={track} tabIndex={photos.length > 1 ? 0 : undefined}
      onScroll={event => {
        const { scrollLeft, clientWidth } = event.currentTarget;
        if (clientWidth) setActive(Math.max(0, Math.min(photos.length - 1, Math.round(scrollLeft / clientWidth))));
      }}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        go(active + (event.key === 'ArrowLeft' ? -1 : 1));
      }}>
      {photos.map((photo, index) => <img key={photo.id} src={photo.mediumUrl}
        srcSet={photo.smallUrl && photo.largeUrl ? `${photo.smallUrl} 320w, ${photo.mediumUrl} 640w, ${photo.largeUrl} 1280w` : undefined}
        sizes="(min-width: 1024px) 48vw, 90vw" loading={index ? 'lazy' : 'eager'} alt={photo.alt} />)}
    </div>
    {photos.length > 1 && <>
      <div className="gallery-dots" role="group" aria-label="Photo positions">
        {photos.map((photo, index) => <button type="button" key={photo.id} aria-label={`Photo ${index + 1} of ${photos.length}`}
          aria-pressed={active === index} onClick={() => go(index)}><span /></button>)}
      </div>
      <div className="gallery-thumbnails" role="group" aria-label="Photo thumbnails">
        {photos.map((photo, index) => <button type="button" key={photo.id} aria-label={`Show ${photo.alt}`}
          aria-pressed={active === index} onClick={() => go(index)}><img src={photo.smallUrl ?? photo.mediumUrl} loading="lazy" alt="" /></button>)}
      </div>
    </>}
  </section>;
}
