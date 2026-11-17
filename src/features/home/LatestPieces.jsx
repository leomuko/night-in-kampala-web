import GarmentCard from '../../components/GarmentCard.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { ErrorState, LoadingState } from '../../components/UI.jsx';

export default function LatestPieces({ state }) {
  if (state.loading) return <LoadingState>Loading the latest pieces…</LoadingState>;
  if (state.failed) return <ErrorState onRetry={state.retry}>Could not load the latest pieces.</ErrorState>;
  if (!state.rows.length) return <EmptyState title="Every piece starts somewhere" to="/about" label="Our process">
    The shop will show each piece as it is published. For now, discover how we rework clothing in Kampala.
  </EmptyState>;
  return <div className={`product-grid${state.rows.length < 3 ? ' product-grid--sparse' : ''}`}>
    {state.rows.map(product => <GarmentCard key={product.slug} product={product} />)}
  </div>;
}
