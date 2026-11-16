import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import OrderQueue from './OrderQueue.jsx';
import { watchOrder } from './orderAdmin.js';
import { callStaff } from './catalogueAdmin.js';

vi.mock('./orderAdmin.js', async original => ({ ...(await original()), watchOrder: vi.fn() }));
vi.mock('./catalogueAdmin.js', () => ({ callStaff: vi.fn(async () => ({})), staffError: error => error.message }));

test('a live detail update replaces actions that no longer apply', async () => {
  const pending = {
    reference: 'NK-DEMO', state: 'new', unread: true, fulfilment: 'unfulfilled', paymentState: 'unpaid',
    contact: { name: 'Demo shopper', phone: 'Demo phone', email: '', method: 'collection', country: 'UG' },
    items: [{ slug: 'sample-denim', name: 'Sample denim', state: 'requested', sizeLabel: 'Waist 32', priceUGX: 85000, quantity: 1 }],
    subtotalUGX: 85000,
  };
  let update;
  watchOrder.mockImplementation(async (_id, receive) => {
    update = receive;
    receive(pending);
    return () => {};
  });
  render(<OrderQueue queue={{ rows: [{ ...pending, id: 'demo-order', createdAt: { toMillis: () => Date.now() } }], hours: 24 }} />);
  await userEvent.click(screen.getByRole('button', { name: /NK-DEMO/ }));
  expect(await screen.findByRole('button', { name: 'Mark contacted' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Mark as sold' })).toBeNull();
  expect(callStaff).toHaveBeenCalledWith('orderDesk', { id: 'demo-order', action: 'seen' });
  act(() => update({ ...pending, state: 'confirmed', unread: false, items: [{ ...pending.items[0], state: 'reserved' }] }));
  expect(screen.queryByRole('button', { name: 'Mark contacted' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Mark as spam' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Mark as sold' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Record payment' })).toBeInTheDocument();
});
