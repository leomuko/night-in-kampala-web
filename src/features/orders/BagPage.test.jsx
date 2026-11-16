import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import BagProvider from './BagProvider.jsx';
import BagPage from './BagPage.jsx';
import { bagStorageKey } from './bagData.js';

vi.mock('../catalogue/catalogueData.js', () => ({ readPublicDocument: vi.fn() }));

test('the saved bag rechecks price and availability before continuing', async () => {
  localStorage.setItem(bagStorageKey, JSON.stringify([
    { slug: 'denim', size: 'waist-32', quantity: 1, priceUGX: 85000 },
    { slug: 'withdrawn', size: 'm', quantity: 1, priceUGX: 85000 },
  ]));
  readPublicDocument.mockImplementation(async (_collection, slug) => slug === 'withdrawn' ? null : ({
    status: 'published', isRealCatalogueStock: true, purchasable: true, stockType: 'one-of-one', name: 'Illustrative denim', priceUGX: 90000,
    requestableSizes: [{ id: 'waist-32', label: 'Waist 32' }],
  }));
  render(<MemoryRouter><BagProvider><BagPage /></BagProvider></MemoryRouter>);
  expect(await screen.findByText('Price changed from UGX 85,000.')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Continue to order' })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Remove withdrawn' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Accept updated prices' }));
  expect(await screen.findByRole('link', { name: 'Continue to order' })).toHaveAttribute('href', '/checkout');
  expect(JSON.parse(localStorage.getItem(bagStorageKey))).toEqual([{ slug: 'denim', size: 'waist-32', quantity: 1, priceUGX: 90000 }]);
});
