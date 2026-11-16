import { robotsForPath } from '../../functions/indexing.js';

const selector = 'title, meta[name="description"], meta[name="robots"], meta[name^="nik:"], meta[property^="og:"], link[rel="canonical"]';
const defaultDescription = 'Night in Kampala. Reworked clothing, original prints and one-of-one pieces from Uganda.';

function normalPath(path) {
  try { return decodeURIComponent(path).replace(/\/$/, '') || '/'; }
  catch { return path; }
}

// Preserve the server head on hydration and browser back. Other shell routes
// must not inherit a previous garment's title, canonical or social image.
export function createRouteHeadManager(document) {
  const path = document.head.querySelector('meta[name="nik:route"]')?.content;
  const status = Number(document.head.querySelector('meta[name="nik:status"]')?.content);
  const indexPublicPages = document.head.querySelector('meta[name="nik:indexing"]')?.content === 'enabled';
  const original = [...document.head.querySelectorAll(selector)].map(node => node.cloneNode(true));
  const matches = pathname => Boolean(path && normalPath(pathname) === normalPath(path));
  function setMeta(attribute, key, value) {
    const meta = document.head.querySelector(`meta[${attribute}="${key}"]`) ?? document.createElement('meta');
    meta.setAttribute(attribute, key);
    meta.content = value;
    if (!meta.parentNode) document.head.append(meta);
  }

  return {
    hasServerPage: pathname => matches(pathname) && status === 200,
    applyDetail(pathname, metadata, detailStatus = 200) {
      document.head.querySelectorAll(selector).forEach(node => node.remove());
      document.title = metadata?.title ?? `${detailStatus === 404 ? 'Page not found' : 'Page temporarily unavailable'} — Night in Kampala`;
      setMeta('name', 'description', metadata?.description ?? defaultDescription);
      setMeta('name', 'robots', robotsForPath(normalPath(pathname), indexPublicPages, detailStatus));
      if (!metadata) return;
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = metadata.canonical;
      document.head.append(canonical);
      const openGraph = {
        site_name: 'Night in Kampala', type: 'website', title: metadata.title, description: metadata.description,
        url: metadata.canonical, image: metadata.image, 'image:alt': metadata.imageAlt,
      };
      for (const [name, value] of Object.entries(openGraph)) setMeta('property', `og:${name}`, value);
    },
    statusFor: pathname => matches(pathname) ? status : null,
    apply(pathname, fallbackTitle) {
      document.head.querySelectorAll(selector).forEach(node => node.remove());
      if (matches(pathname)) {
        original.forEach(node => document.head.append(node.cloneNode(true)));
      } else {
        const title = document.createElement('title');
        title.textContent = fallbackTitle;
        const description = document.createElement('meta');
        description.name = 'description';
        description.content = defaultDescription;
        document.head.append(title, description);
      }
      const robots = document.head.querySelector('meta[name="robots"]') || document.createElement('meta');
      robots.name = 'robots';
      robots.content = robotsForPath(normalPath(pathname), indexPublicPages, matches(pathname) ? status : 200);
      if (!robots.parentNode) document.head.append(robots);
    },
  };
}
