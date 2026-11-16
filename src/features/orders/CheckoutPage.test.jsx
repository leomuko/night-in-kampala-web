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
  expect(screen.getByText('Delivery and final total to be confirmed.')).toBeInTheDocument();
  expect(screen.getByLabelText('Phone or WhatsApp number')).toBeRequired();
  expect(screen.getByLabelText('Email (optional)')).not.toBeRequired();
  await userEvent.type(screen.getByLabelText('Full name'), 'Demo shopper');
  await userEvent.click(screen.getByRole('radio', { name: 'Collection' }));
  expect(screen.getByLabelText('Full name')).toHaveValue('Demo shopper');
  expect(screen.queryByLabelText('District')).toBeNull();
});
