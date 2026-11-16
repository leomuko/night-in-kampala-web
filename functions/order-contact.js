import { HttpsError } from 'firebase-functions/v2/https';
import { isSupportedCountry, parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { boundedText } from './catalogue-drafts.js';

export function normalizePhone(input, country) {
  const text = boundedText(input, 48, 'Phone number');
  const number = parsePhoneNumberFromString(text, { defaultCountry: country, extract: false });
  if (!number?.isValid() || number.ext) throw new HttpsError('invalid-argument', 'Enter a valid phone or WhatsApp number.');
  return number.number;
}

export function validateOrderContact(data) {
  if (!data || data.website !== '') throw new HttpsError('invalid-argument', 'Check the order form and try again.');
  const country = boundedText(data.country, 2, 'Country').toUpperCase();
  if (!isSupportedCountry(country)) throw new HttpsError('invalid-argument', 'Choose a supported country or territory.');
  const name = boundedText(data.name, 120, 'Full name');
  const email = boundedText(data.email ?? '', 254, 'Email');
  const phone = normalizePhone(data.phone, country);
  if (!name || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new HttpsError('invalid-argument', 'Enter your name and a valid email if you provide one.');
  }
  if (!['collection', 'delivery'].includes(data.method)) throw new HttpsError('invalid-argument', 'Choose collection or delivery.');
  let delivery = null;
  if (data.method === 'delivery') {
    const locality = boundedText(data.locality, 120, 'District or city');
    const address = boundedText(data.address, 320, 'Address or nearest landmark');
    const postcode = country === 'UG' ? '' : boundedText(data.postcode ?? '', 32, 'Postal code');
    if (!locality || !address) throw new HttpsError('invalid-argument', 'Enter the district or city and the delivery address.');
    delivery = { locality, address, postcode };
  }
  return { name, phone, email, country, method: data.method, delivery };
}
