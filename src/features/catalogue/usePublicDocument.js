import { useEffect, useState } from 'react';
import { readPublicDocument } from './catalogueData.js';

export default function usePublicDocument(collection, slug, read = readPublicDocument) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    let current = true;
    read(collection, slug).then(document => {
      if (current) setState({ collection, slug, attempt, document });
    }).catch(() => {
      if (current) setState({ collection, slug, attempt, failed: true });
    });
    return () => { current = false; };
  }, [collection, slug, attempt, read]);
  return {
    ...(state.collection === collection && state.slug === slug && state.attempt === attempt ? state : { loading: true }),
    retry: () => setAttempt(value => value + 1),
  };
}
