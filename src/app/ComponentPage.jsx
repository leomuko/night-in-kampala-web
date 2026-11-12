import { useState } from 'react';
import { Accordion, Badge, Button, ErrorState, Field, LoadingState, Select } from '../components/UI.jsx';

export default function ComponentPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  return <section className="container placeholder-page component-page"><h1>COMPONENT PREVIEW</h1><p>Local development view. No form data is saved or sent.</p><div className="component-grid">
    <div className="stack"><Button>Primary action</Button><Button variant="secondary">Secondary action</Button><Button disabled>Sold</Button><div><Badge>One of one</Badge></div><LoadingState /><ErrorState>Example: the image could not be loaded.</ErrorState></div>
    <div className="stack"><form className="stack" noValidate onSubmit={event => { event.preventDefault(); setError(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address.'); }}><Field label="Email address" value={email} onChange={event => setEmail(event.target.value)} error={error} hint="Development example only." /><Button type="submit">Validate example</Button></form><Select label="Sort"><option>Newest</option><option>Price</option></Select><Accordion title="Care"><p>Follow the care instructions for the exact piece.</p></Accordion></div>
  </div></section>;
}
