import { useEffect, useState } from 'react';
import { Button, ErrorState, LoadingState } from '../../components/UI.jsx';

export default function PagedList({ read, empty, children }) {
  const [pages, setPages] = useState({ rows: [], cursor: null });
  const [request, setRequest] = useState({ cursor: null });
  const [pending, setPending] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    read(request.cursor).then(result => {
      if (!current) return;
      setPages(previous => ({
        rows: [...new Map([...previous.rows, ...result.rows].map(row => [row.slug, row])).values()],
        cursor: result.cursor,
      }));
      setPending(false);
    }).catch(() => {
      if (!current) return;
      setFailed(true);
      setPending(false);
    });
    return () => { current = false; };
  }, [read, request]);

  function load(cursor) {
    setFailed(false);
    setPending(true);
    setRequest({ cursor });
  }

  return <>
    {pages.rows.length > 0 && children(pages.rows)}
    {pending && <LoadingState />}
    {failed && <ErrorState onRetry={() => load(request.cursor)}>Could not load this list. Please try again.</ErrorState>}
    {!pending && !failed && !pages.rows.length && <p role="status">{empty}</p>}
    {!pending && !failed && pages.cursor && <Button variant="secondary" onClick={() => load(pages.cursor)}>Load more</Button>}
  </>;
}
