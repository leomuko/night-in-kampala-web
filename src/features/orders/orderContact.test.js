import { expect, test } from 'vitest';
import { validateOrderContact } from '../../../functions/order-contact.js';

const contact = { website: '', name: 'Demo shopper', phone: '0772 123 456', country: 'UG', method: 'collection' };

test('Uganda phone formats share one E.164 value and collection omits delivery', () => {
  const local = validateOrderContact(contact);
  expect(local.phone).toBe('+256772123456');
  expect(validateOrderContact({ ...contact, phone: '+256 772 123 456' })).toEqual(local);
  expect(local.delivery).toBeNull();
});
test('phone validation preserves foreign calling codes and denies invalid contact or bot input', () => {
  expect(validateOrderContact({ ...contact, phone: '+1 202 555 0123' }).phone).toBe('+12025550123');
  expect(() => validateOrderContact({ ...contact, phone: '077' })).toThrow(/valid phone/);
  expect(() => validateOrderContact({ ...contact, website: 'filled' })).toThrow(/order form/);
  expect(() => validateOrderContact({ ...contact, method: 'delivery', locality: '', address: '' })).toThrow(/district or city/);
});
