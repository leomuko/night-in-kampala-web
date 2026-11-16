import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { readProductPage, readCategories } from './catalogueData.js';
import ShopPage from './ShopPage.jsx';

vi.mock('./catalogueData.js', async original => ({
  ...(await original()), readProductPage: vi.fn(), readCategories: vi.fn(),
}));

function Screen() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate(-1)}>Previous screen</button><ShopPage /></>;
}

test('shop applies URL filters, appends the next cursor and restores filters on Back', async () => {
  const user = userEvent.setup();
  readCategories.mockResolvedValue([{ id: 'denim', label: 'Denim', active: true }]);
  readProductPage.mockImplementation((filters, cursor) => Promise.resolve(filters.availability === 'sold'
    ? { rows: [{ slug: 'sold-one', name: 'Sold piece', priceUGX: 85000, availability: 'sold' }], cursor: null }
    : cursor ? { rows: [{ slug: 'next-piece', name: 'Next piece', priceUGX: 90000 }], cursor: null }
      : { rows: [{ slug: 'requested-one', name: 'Requested piece', priceUGX: 85000, availability: 'requested' }], cursor: 'next' }));
  render(<MemoryRouter initialEntries={['/shop?category=denim&sort=price-high']}><Screen /></MemoryRouter>);
  expect(await screen.findByText('Requested', { selector: '.badge--requested' })).toBeInTheDocument();
  expect(screen.getByLabelText('Category')).toHaveValue('denim');
  await user.click(screen.getByRole('button', { name: 'Load more' }));
  expect(await screen.findByText('Next piece')).toBeInTheDocument();
  expect(screen.getByText('Requested piece')).toBeInTheDocument();
  expect(readProductPage).toHaveBeenCalledWith(expect.objectContaining({ category: 'denim', sort: 'price-high' }), 'next');
  await user.type(screen.getByLabelText('Size'), 'Waist 32');
  await user.selectOptions(screen.getByLabelText('Availability'), 'sold');
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));
  expect(await screen.findByText('Sold', { selector: '.badge--sold' })).toBeInTheDocument();
  expect(readProductPage).toHaveBeenLastCalledWith(expect.objectContaining({ size: 'waist-32', availability: 'sold' }), null);
  await user.click(screen.getByRole('button', { name: 'Previous screen' }));
  expect(await screen.findByText('Requested piece')).toBeInTheDocument();
  expect(screen.getByLabelText('Size')).toHaveValue('');
});
