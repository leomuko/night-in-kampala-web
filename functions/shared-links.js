// Only public, published document fields cross this boundary. Admin SDK reads
// bypass Firestore rules, so the visibility check here is mandatory.
export const PREVIEW_CACHE_SECONDS = 60;
export const PREVIEW_CACHE_CONTROL = `public, max-age=0, s-maxage=${PREVIEW_CACHE_SECONDS}, must-revalidate`;
export const HEAD_START = '<!-- shared-link-head:start -->';
export const HEAD_END = '<!-- shared-link-head:end -->';

export function configuredOrigin(value, { emulator = false } = {}) {
  const url = new URL(value);
  const local = emulator && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname);
  if ((!local && url.protocol !== 'https:') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_ORIGIN must be a trusted HTTPS origin (HTTP loopback only in emulators).');
  }
  return url.origin;
}

export function parseDetailPath(requestUrl) {
  try {
    const path = decodeURIComponent(requestUrl.split('?')[0]);
    const match = /^\/(products|collections|events|lookbooks)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(path);
    if (!match || match[2].length > 120) return null;
    return { collection: match[1], slug: match[2], path: `/${match[1]}/${match[2]}` };
  } catch { return null; }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function text(value, limit) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new Error('Incomplete public share metadata.');
  return value.trim().replace(/\s+/g, ' ');
}

function publicImage(value, origin) {
  if (typeof value !== 'string' || !value || value.length > 2048 || value.includes('\\') || value.startsWith('//')) throw new Error('Invalid share image.');
  // Root-relative static assets or public HTTPS URLs only. Never fetch this URL.
  if (!value.startsWith('/') && !value.startsWith('https://')) throw new Error('Invalid share image.');
  const url = new URL(value, origin);
  if (url.username || url.password || url.hash || (url.protocol !== 'https:' && url.origin !== origin)) throw new Error('Invalid share image.');
  return url.href;
}

function replaceHead(template, metadata, path, status) {
  const start = template.indexOf(HEAD_START);
  const end = template.indexOf(HEAD_END);
  if (start < 0 || end < start || template.indexOf(HEAD_START, start + 1) !== -1 || template.indexOf(HEAD_END, end + 1) !== -1) throw new Error('Built HTML is missing its unique shared-link head markers.');
  const tag = (name, content, attribute = 'name') => `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`;
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    tag('description', metadata.description),
    tag('nik:route', path), tag('nik:status', String(status)),
  ];
  if (metadata.canonical) tags.push(
    `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`,
    tag('og:site_name', 'Night in Kampala', 'property'),
    tag('og:type', 'website', 'property'),
    tag('og:title', metadata.title, 'property'),
    tag('og:description', metadata.description, 'property'),
    tag('og:url', metadata.canonical, 'property'),
    tag('og:image', metadata.image, 'property'),
    tag('og:image:alt', metadata.imageAlt, 'property'),
  );
  return `${template.slice(0, start + HEAD_START.length)}\n${tags.join('\n')}\n${template.slice(end)}`;
}

export function createSharedLinkHandler({ origin, template, readDocument, reportError = console.error, emulator = false }) {
  // Validate once, before accepting requests. The adapter supplies only trusted config.
  origin = configuredOrigin(origin, { emulator });
  const errorPage = (status, path = '') => ({
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    body: replaceHead(template, {
      title: `${status === 404 ? 'Page not found' : 'Page temporarily unavailable'} — Night in Kampala`,
      description: status === 404 ? 'This page is unavailable. Explore Night in Kampala.' : 'Please try again shortly.',
    }, path, status),
  });
  return async ({ method = 'GET', url }) => {
    if (!['GET', 'HEAD'].includes(method)) return { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' }, body: '' };
    const route = parseDetailPath(url);
    if (!route) return errorPage(404);
    try {
      const document = await readDocument(route.collection, route.slug);
      if (!document || document.status !== 'published') return errorPage(404, route.path);
      const title = text(route.collection === 'products' ? document.name : document.title, 200);
      const share = document.share;
      const metadata = {
        title: `${title} — Night in Kampala`,
        description: text(share?.description, 500),
        canonical: `${origin}${route.path}`,
        image: publicImage(share?.imageUrl, origin),
        imageAlt: text(share?.imageAlt, 300),
      };
      return {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': PREVIEW_CACHE_CONTROL, 'X-Content-Type-Options': 'nosniff' },
        body: replaceHead(template, metadata, route.path, 200),
      };
    } catch {
      // No document, error stack, credentials or private fields in HTML responses.
      reportError('Shared-link rendering failed.', { path: route.path });
      return errorPage(503, route.path);
    }
  };
}
