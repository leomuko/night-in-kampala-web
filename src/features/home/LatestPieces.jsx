import { useEffect, useState } from 'react';
import GarmentCard from '../../components/GarmentCard.jsx';
import { ErrorState, LoadingState } from '../../components/UI.jsx';
import { previewProducts } from '../../data/previewProducts.js';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { readProductPage } from '../catalogue/catalogueData.js';

export default function LatestPieces() {
  const offline = getFirebaseRuntime().mode === 'preview';
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    if (offline) return;
    let current = true;
    readProductPage({ sort: 'newest' }, null, 3).then(({ rows }) => {
      if (current) setState({ attempt, rows });
    }).catch(() => {
      if (current) setState({ attempt, failed: true });
    });
    return () => { current = false; };
  }, [attempt, offline]);

  if (!offline && state.attempt !== attempt) return <LoadingState>Loading the latest pieces…</LoadingState>;
  if (state.failed) return <ErrorState onRetry={() => setAttempt(value => value + 1)}>Could not load the latest pieces.</ErrorState>;
  const rows = offline ? previewProducts : state.rows;
  if (!rows.length) return <p role="status">The first pieces will appear here when they’re published.</p>;
  return <div className="product-grid">{rows.map(product => <GarmentCard key={product.slug} product={product} />)}</div>;
}
