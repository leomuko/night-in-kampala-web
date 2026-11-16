import { useEffect } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { parseDetailPath, publicDetailMetadata } from '../../../functions/shared-links.js';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';

export default function useDetailHead(collection, slug, { document, loading, failed }) {
  const { pathname } = useLocation();
  const head = useOutletContext();
  useEffect(() => {
    if (!head || loading) return;
    const route = parseDetailPath(pathname);
    if (!route || route.collection !== collection || route.slug !== slug) {
      head.applyDetail(pathname, null, 404);
      return;
    }
    const mode = getFirebaseRuntime().mode;
    if (!document && mode === 'preview' && head.hasServerPage(pathname)) return;
    if (!document) {
      head.applyDetail(pathname, null, failed ? 503 : 404);
      return;
    }
    const origin = mode === 'emulator' ? 'http://127.0.0.1:5500' : (import.meta.env.VITE_SITE_ORIGIN || window.location.origin);
    head.applyDetail(pathname, publicDetailMetadata(document, route, origin));
  }, [collection, slug, document, loading, failed, pathname, head]);
}
