import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return <section className="container placeholder-page"><p className="eyebrow">404</p><h1>PAGE NOT FOUND</h1><p>This link may have changed. Explore the store from the homepage.</p><Link className="button" to="/">Back to home</Link></section>;
}
