import { Link } from 'react-router-dom';

const messages = {
  orders: {
    heading: 'Order status',
    copy: 'Order access is being prepared. Once ordering opens, staff will follow up using the contact details you provide. An order number alone does not give access.',
  },
};

export default function PlaceholderPage({ page }) {
  const { heading, copy } = messages[page];
  return <section className="container placeholder-page"><p className="eyebrow">Night in Kampala</p><h1>{heading}</h1>
    <p>{copy}</p><Link className="button button--secondary" to="/">Back to home</Link>
  </section>;
}
