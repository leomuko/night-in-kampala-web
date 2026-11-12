import { Link } from 'react-router-dom';
export default function AdminShell() {
  return <section className="container placeholder-page"><p className="eyebrow">Night in Kampala</p><h1>STAFF ACCESS</h1><p>Staff sign-in is not open yet. No customer or order information is available here.</p><Link className="button button--secondary" to="/">Return to store</Link></section>;
}
