import { useEffect, useState } from 'react';
import { resolveLaunchPolicy } from '../../../functions/launch-copy.js';
import { readOrderPolicy } from '../catalogue/catalogueData.js';

export default function useOrderPolicy() {
  const [policy, setPolicy] = useState(() => resolveLaunchPolicy(null));
  useEffect(() => {
    let current = true;
    readOrderPolicy().then(saved => { if (current) setPolicy(resolveLaunchPolicy(saved)); }).catch(() => {});
    return () => { current = false; };
  }, []);
  return policy;
}
