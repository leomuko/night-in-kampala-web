import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage.jsx';
import ShopPage from '../catalogue/ShopPage.jsx';
import { DropsPage } from '../editorial/DropPages.jsx';
import { LookbooksPage } from '../editorial/SitePages.jsx';
import { EventsPage } from '../editorial/EventPages.jsx';

const data = vi.hoisted(() => ({ rows: [] }));
vi.mock('../../services/firebaseApp.js', () => ({ getFirebaseRuntime: () => ({ mode: 'cloud' }) }));
vi.mock('../catalogue/catalogueData.js', async original => ({ ...(await original()),
  readProductPage: async () => ({ rows: data.rows, cursor: null }), readPublicPage: async () => ({ rows: [], cursor: null }),
  readRequestableSizes: async () => [], readCategories: async () => [],
}));
const piece = i => ({ slug: `real-${i}`, status: 'published', isRealCatalogueStock: true, name: `Real test piece ${i}`,
  priceUGX: 85000, photos: [{ id: 'front', alt: `Front of real test piece ${i}`, smallUrl: '/real-320.jpg', mediumUrl: '/real-640.jpg', largeUrl: '/real-1280.jpg' }] });

test.each([0, 1, 2])('home and shop show %i pieces without filler images or invented products', async count => {
  data.rows = Array.from({ length: count }, (_, index) => piece(index));
  const home = render(<MemoryRouter><HomePage /></MemoryRouter>);
  if (count) await screen.findByRole('link', { name: 'View Real test piece 0' });
  else await screen.findByRole('heading', { name: 'Every piece starts somewhere' });
  expect(home.container.querySelectorAll('.garment-card')).toHaveLength(count);
  expect(home.container.querySelectorAll('img[src*="campaign"]')).toHaveLength(0);
  expect(screen.queryByText(/AI-generated placeholder/)).toBeNull();
  expect(home.container.querySelectorAll('.hero-media')).toHaveLength(count ? 1 : 0);
  home.unmount();
  const shop = render(<MemoryRouter><ShopPage /></MemoryRouter>);
  if (count) await screen.findByRole('link', { name: 'View Real test piece 0' });
  else await screen.findByRole('heading', { name: 'A little more to come' });
  expect(shop.container.querySelectorAll('.garment-card')).toHaveLength(count);
});

test.each([['Drops', DropsPage], ['Lookbook', LookbooksPage], ['Events', EventsPage]])('%s has a deliberate empty state and a working way back to the shop', async (_heading, Component) => {
  render(<MemoryRouter><Component /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'A little more to come' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Explore the shop' })).toHaveAttribute('href', '/shop');
  expect(screen.queryByRole('img')).toBeNull();
});
