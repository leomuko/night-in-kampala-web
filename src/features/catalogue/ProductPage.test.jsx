import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readPublicDocument } from './catalogueData.js';
import ProductPage from './ProductPage.jsx';

vi.mock('./catalogueData.js', async original => ({ ...(await original()), readPublicDocument: vi.fn() }));

test('requested detail exposes one state, measurements and operable gallery controls', async () => {
  readPublicDocument.mockResolvedValue({
    slug: 'piece', name: 'Reworked denim', availability: 'requested', itemCode: 'NK-TEST', priceUGX: 160000,
    sizeLabel: 'Waist 32', measurements: [{ label: 'Waist', cm: 81 }], photos: [
      { id: 'front', alt: 'Front view', mediumUrl: '/front.webp' }, { id: 'back', alt: 'Back view', mediumUrl: '/back.webp' },
    ],
  });
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/products/piece']}><Routes><Route path="/products/:slug" element={<ProductPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'Reworked denim' })).toBeInTheDocument();
  expect(screen.getByText('Requested', { exact: true })).toBeInTheDocument();
  expect(screen.queryByText('Reserved', { exact: true })).toBeNull();
  expect(screen.getByText(/Another request is welcome/)).toBeInTheDocument();
  expect(screen.getByText('81')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add to bag' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Order on WhatsApp' })).toBeNull();
  const track = screen.getByAltText('Front view').parentElement;
  const scrollTo = vi.fn();
  Object.defineProperties(track, { clientWidth: { value: 300 }, scrollTo: { value: scrollTo } });
  const dots = within(screen.getByRole('group', { name: 'Photo positions' }));
  await user.click(dots.getByRole('button', { name: 'Photo 2 of 2' }));
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 300 });
  expect(screen.getByRole('button', { name: 'Show Back view' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.scroll(track, { target: { scrollLeft: 0 } });
  expect(dots.getByRole('button', { name: 'Photo 1 of 2' })).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: 'Show Back view' }));
  expect(dots.getByRole('button', { name: 'Photo 2 of 2' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('status')).toHaveTextContent('Photo 2 of 2');
  expect(screen.queryByRole('img', { name: 'Front view' })).toBeNull();
  fireEvent.keyDown(track, { key: 'ArrowLeft' });
  expect(screen.getByRole('img', { name: 'Front view' })).toBeInTheDocument();
});

test('a missing or private piece has no order or product details', async () => {
  readPublicDocument.mockResolvedValue(null);
  render(<MemoryRouter initialEntries={['/products/draft']}><Routes><Route path="/products/:slug" element={<ProductPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'Piece unavailable' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add to bag' })).toBeNull();
});

test('a requested real piece can enter the bag and a reserved piece stays disabled', async () => {
  const { default: BagProvider } = await import('../orders/BagProvider.jsx');
  const product = { slug: 'real', name: 'Test denim', status: 'published', isRealCatalogueStock: true, purchasable: true,
    priceUGX: 85000, stockType: 'one-of-one', sizeLabel: 'Waist 32', requestableSizes: [{ id: 'waist-32', label: 'Waist 32' }], availability: 'requested' };
  readPublicDocument.mockResolvedValueOnce(product);
  const visit = () => render(<MemoryRouter initialEntries={['/products/real']}><BagProvider><Routes><Route path="/products/:slug" element={<ProductPage />} /></Routes></BagProvider></MemoryRouter>);
  const real = visit();
  await userEvent.click(await screen.findByRole('button', { name: 'Add to bag' }));
  expect(screen.getByRole('link', { name: 'View bag' })).toHaveAttribute('href', '/cart');
  expect(JSON.parse(localStorage.getItem('nk-bag-v1'))[0]).toEqual({ slug: 'real', size: 'waist-32', quantity: 1, priceUGX: 85000 });
  real.unmount();
  readPublicDocument.mockResolvedValueOnce({ ...product, availability: 'reserved', purchasable: false });
  visit();
  expect(await screen.findByRole('button', { name: 'Add to bag' })).toBeDisabled();
});
