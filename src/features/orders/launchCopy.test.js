import { expect, test } from 'vitest';
import { defaultLaunchCopy, launchContactPhone, resolveLaunchPolicy } from '../../../functions/launch-copy.js';

test('unreviewed old defaults become the supplied launch facts without overwriting reviewed or custom wording', () => {
  const old = { collection: 'Staff will contact you to arrange collection.', delivery: 'Delivery and final total to be confirmed.', payment: 'Staff will contact you to confirm the order and arrange payment.' };
  expect(resolveLaunchPolicy({ copy: old, copyReviewed: false }).copy).toEqual(defaultLaunchCopy);
  expect(resolveLaunchPolicy({ copy: old, copyReviewed: true }).copy).toEqual(old);
  expect(resolveLaunchPolicy({ copy: { payment: 'Owner custom wording' }, copyReviewed: false }).copy.payment).toBe('Owner custom wording');
  expect(launchContactPhone).toBe('+256759334383');
});

test('WhatsApp remains absent until a valid saved business number is supplied by the public policy', () => {
  expect(resolveLaunchPolicy(null).whatsappNumber).toBe('');
  expect(resolveLaunchPolicy({ whatsappNumber: 'unvalidated' }).whatsappNumber).toBe('');
  expect(resolveLaunchPolicy({ whatsappNumber: '+256759334383' }).whatsappNumber).toBe('+256759334383');
});
