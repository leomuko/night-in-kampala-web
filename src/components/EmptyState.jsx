import { Link } from 'react-router-dom';

export default function EmptyState({ title, children, to = '/shop', label = 'Explore the shop' }) {
  return <section className="empty-state stack">
    <h2>{title}</h2>
    <p>{children}</p>
    <Link className="text-link" to={to}>{label}</Link>
  </section>;
}
