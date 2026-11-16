import { expect, test } from 'vitest';
import { dismissRecentOrder, readRecentOrder, saveRecentOrder, whatsappOrderLink } from './receiptData.js';

test('the WhatsApp prefill and recent record contain only public snapshot fields', () => {
  const receipt = { reference: 'NK-EXAMPLE', receivedAt: 1000, subtotalUGX: 160000,
    whatsappNumber: '+12025550123',
    items: [{ name: 'Painted denim', sizeLabel: 'Waist 32', priceUGX: 160000, quantity: 1, customerPhone: 'private' }],
    contact: { address: 'Private address' },
  };
  const link = new URL(whatsappOrderLink(receipt));
  expect(link.hostname).toBe('wa.me');
  expect(link.searchParams.get('text')).toContain('NK-EXAMPLE');
  expect(link.searchParams.get('text')).not.toContain('Private');
  saveRecentOrder(receipt);
  expect(readRecentOrder().whatsappNumber).toBeUndefined();
  expect(readRecentOrder().items[0].customerPhone).toBeUndefined();
  dismissRecentOrder();
  expect(readRecentOrder()).toBeNull();
});
