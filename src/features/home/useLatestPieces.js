import { useEffect, useState } from 'react';
import { previewProducts } from '../../data/previewProducts.js';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { readProductPage } from '../catalogue/catalogueData.js';

export default function useLatestPieces() {
  const offline = getFirebaseRuntime().mode === 'preview';
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    if (offline) return;
    let current = true;
    readProductPage({ sort: 'newest' }, null, 3).then(({ rows }) => {
      if (current) setState({ attempt, rows });
    }).catch(() => { if (current) setState({ attempt, failed: true }); });
    return () => { current = false; };
  }, [attempt, offline]);
  return { rows: offline ? previewProducts : state.rows ?? [],
    loading: !offline && state.attempt !== attempt, failed: state.failed,
    retry: () => setAttempt(value => value + 1) };
}
