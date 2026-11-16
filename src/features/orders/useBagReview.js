import { useEffect, useState } from 'react';
import { reviewBag } from './bagData.js';

export default function useBagReview(items) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    let current = true;
    reviewBag(items).then(rows => {
      if (current) setState({ items, attempt, rows });
    }).catch(() => {
      if (current) setState({ items, attempt, failed: true });
    });
    return () => { current = false; };
  }, [items, attempt]);
  return {
    ...(state.items === items && state.attempt === attempt ? state : { loading: true }),
    retry: () => setAttempt(value => value + 1),
  };
}
