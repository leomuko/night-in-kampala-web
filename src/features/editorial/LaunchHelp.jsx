import { Link } from 'react-router-dom';
import { launchContactPhone, launchReturnsDays } from '../../../functions/launch-copy.js';
import useOrderPolicy from '../orders/useOrderPolicy.js';

export const launchHelpHeadings = {
  'how-to-order': 'How to order', delivery: 'Delivery & collection', collection: 'Collection', payment: 'Payment',
  returns: 'Returns', privacy: 'Privacy', contact: 'Contact', sizing: 'Sizing & care',
};

export default function LaunchHelp({ slug }) {
  const policy = useOrderPolicy();
  const phone = policy.whatsappNumber || launchContactPhone;
  const paragraphs = {
    'how-to-order': [
      'Choose your pieces, add them to your bag and send an order request with your contact details.',
      'Your reference confirms that we received the request. Staff will contact you to confirm availability, collection or delivery, and payment.',
    ],
    delivery: [policy.copy.collection, policy.copy.delivery], collection: [policy.copy.collection], payment: [policy.copy.payment],
    returns: [`Each piece is one of a kind. Contact us within ${launchReturnsDays} days of receiving your piece to discuss a return.`],
    privacy: [
      'We keep the name, phone number, optional email and any delivery details you submit with your order so authorised staff can follow up and fulfil the request.',
      'We also keep order, payment and fulfilment history, staff audit records and technical records used to limit spam. Firebase provides hosting, storage and verification services.',
      'This browser remembers your bag and a limited recent-order summary. You can dismiss that summary on the homepage. Contact us with questions about your order data.',
    ],
    contact: ['Call the team about a piece, an existing order, collection or delivery. Have your order reference ready if you have one.'],
    sizing: ['Check the size, measurements, condition and care details listed for each piece before requesting it. Contact the team if you need more information.'],
  };
  if (!Object.hasOwn(paragraphs, slug)) return <p>This information will appear when it is published.</p>;
  return <div className="stack launch-help">
    {!policy.copyReviewed && <p className="helper">Launch wording · awaiting owner review</p>}
    {paragraphs[slug].map(text => <p key={text}>{text}</p>)}
    <div className="staff-actions">
      <a className="text-link" href={`tel:${phone}`}>Call {phone}</a>
      {policy.whatsappNumber && <a className="text-link" href={`https://wa.me/${phone.slice(1)}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>}
    </div>
    <Link className="text-link" to="/shop">Explore the shop</Link>
  </div>;
}
