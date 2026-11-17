import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BagProvider from './BagProvider.jsx';
import CheckoutPage from './CheckoutPage.jsx';
import { bagStorageKey } from './bagData.js';

vi.mock('../catalogue/catalogueData.js', () => ({
  readOrderPolicy: async () => null,
  readPublicDocument: async () => ({
    status: 'published', isRealCatalogueStock: true, purchasable: true, stockType: 'one-of-one', name: 'Illustrative denim', priceUGX: 90000,
    requestableSizes: [{ id: 'waist-32', label: 'Waist 32' }], photos: [{ smallUrl: '/example.webp', alt: 'Demo photo' }],
  }),
}));

test('guest form shows pieces and keeps contact while switching to collection', async () => {
  localStorage.setItem(bagStorageKey, JSON.stringify([{ slug: 'denim', size: 'waist-32', quantity: 1, priceUGX: 90000 }]));
  render(<MemoryRouter><BagProvider><CheckoutPage /></BagProvider></MemoryRouter>);
  expect(await screen.findByRole('img', { name: 'Demo photo' })).toBeInTheDocument();
  expect(screen.getByText(/Waist 32/)).toBeInTheDocument();
  expect(screen.getByText(/Delivery within Kampala by boda/)).toBeInTheDocument();
  expect(screen.getByLabelText('Phone or WhatsApp number')).toBeRequired();
  expect(screen.getByLabelText('Email (optional)')).not.toBeRequired();
  await userEvent.type(screen.getByLabelText('Full name'), 'Demo shopper');
  await userEvent.click(screen.getByRole('radio', { name: 'Collection' }));
  expect(screen.getByLabelText('Full name')).toHaveValue('Demo shopper');
  expect(screen.queryByLabelText('District')).toBeNull();
});

test('a failed submit retries the same request and saves a dismissible safe receipt', async () => {
  localStorage.setItem(bagStorageKey, JSON.stringify([{ slug: 'denim', size: 'waist-32', quantity: 1, priceUGX: 90000 }]));
  const submit = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
    reference: 'NK-DEMO', receivedAt: 1000, subtotalUGX: 90000, whatsappNumber: '',
    items: [{ name: 'Illustrative denim', sizeLabel: 'Waist 32', priceUGX: 90000, quantity: 1 }],
    contact: { name: 'Demo shopper' },
  });
  render(<MemoryRouter><BagProvider><CheckoutPage onOrder={submit} /></BagProvider></MemoryRouter>);
  await screen.findByRole('img', { name: 'Demo photo' });
  await userEvent.type(screen.getByLabelText('Full name'), 'Demo shopper');
  await userEvent.type(screen.getByLabelText('Phone or WhatsApp number'), '0772123456');
  await userEvent.click(screen.getByRole('radio', { name: 'Collection' }));
  await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
  expect(await screen.findByRole('heading', { name: 'We couldn’t confirm your submission' })).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'Order received, awaiting confirmation' })).toHaveFocus();
  expect(submit.mock.calls[0][0]).toEqual(submit.mock.calls[1][0]);
  expect(screen.queryByRole('link', { name: /on WhatsApp/ })).toBeNull();
  expect(localStorage.getItem('nk-recent-order-v1')).toContain('NK-DEMO');
  expect(localStorage.getItem('nk-recent-order-v1')).not.toContain('Demo shopper');
  expect(localStorage.getItem(bagStorageKey)).toBe('[]');
});
