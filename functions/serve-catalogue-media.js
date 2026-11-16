const path = /^\/media\/products\/([a-z0-9-]{1,120})\/([a-z0-9-]{1,120})\/(share\.jpg|[a-z0-9-]{1,120}-(?:320|640|1280)\.webp)$/;

export function catalogueMediaHandler(db, getBucket) {
  return async (request, response) => {
    response.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.set('Allow', 'GET, HEAD').status(405).end();
      return;
    }
    const match = path.exec(request.originalUrl.split('?')[0]);
    if (!match) { response.status(404).end(); return; }
    const [, slug, revision, name] = match;
    try {
      const product = (await db.doc(`products/${slug}`).get()).data();
      if (product?.status !== 'published' || product.mediaRevision !== revision) {
        response.status(404).end();
        return;
      }
      const [bytes] = await getBucket().file(`product-media/${slug}/${revision}/${name}`).download();
      response.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': name.endsWith('.jpg') ? 'image/jpeg' : 'image/webp',
        'Content-Length': String(bytes.length),
        'X-Content-Type-Options': 'nosniff',
      });
      response.status(200).end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      response.status(Number(error.code) === 404 ? 404 : 503).end();
    }
  };
}
