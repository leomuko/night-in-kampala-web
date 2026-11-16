import { useEffect, useState } from 'react';
import { defaultOrderSettings } from '../../../functions/order-model.js';
import { queuePageSize, queueQuery, queueRows, staffFirestore } from './orderAdmin.js';

const empty = { rows: [], loading: true, cursor: null };

export default function useOrderQueue(session) {
  const [live, setLive] = useState(empty);
  const [more, setMore] = useState(null);
  const [hours, setHours] = useState(defaultOrderSettings.overdueHours);
  const [retry, setRetry] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    if (!session) return;
    let active = true;
    const stops = [];
    staffFirestore().then(({ db, sdk }) => {
      if (!active) return;
      stops.push(sdk.onSnapshot(queueQuery(db, sdk), snapshot => {
        if (!active) return;
        setLive({ rows: queueRows(snapshot), loading: snapshot.metadata.fromCache && snapshot.empty,
          cursor: snapshot.size === queuePageSize ? snapshot.docs.at(-1) : null, session });
      }, () => { if (active) setLive(previous => ({ ...previous, loading: false, failed: true, session })); }));
      stops.push(sdk.onSnapshot(sdk.doc(db, 'orderSettings', 'config'), snapshot => {
        if (active) setHours(snapshot.data()?.overdueHours ?? defaultOrderSettings.overdueHours);
      }, () => {}));
    }).catch(() => { if (active) setLive({ ...empty, loading: false, failed: true, session }); });
    return () => { active = false; stops.forEach(stop => stop()); };
  }, [session, retry]);

  const head = live.session === session ? live : empty;
  const tail = more?.session === session ? more : null;
  async function loadMore() {
    const cursor = tail ? tail.cursor : head.cursor;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { db, sdk } = await staffFirestore();
      const snapshot = await sdk.getDocsFromServer(queueQuery(db, sdk, cursor));
      setMore({ session, rows: [...(tail?.rows ?? []), ...queueRows(snapshot)],
        cursor: snapshot.size === queuePageSize ? snapshot.docs.at(-1) : null });
    } catch {
      setMore({ session, rows: tail?.rows ?? [], cursor, failed: true });
    } finally { setLoadingMore(false); }
  }
  const rows = [...new Map([...(tail?.rows ?? []), ...head.rows].map(row => [row.id, row])).values()]
    .sort((first, second) => second.createdAt.toMillis() - first.createdAt.toMillis() || second.id.localeCompare(first.id));
  return { rows, unread: rows.filter(order => order.unread).length, hours, loadMore,
    hasMore: Boolean(tail ? tail.cursor : head.cursor), loading: head.loading, failed: head.failed, moreFailed: tail?.failed,
    loadingMore, retry: () => setRetry(value => value + 1) };
}
