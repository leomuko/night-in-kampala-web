import { afterEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, useNavigate } from 'react-router-dom';
import App from './App.jsx';
import { createRouteHeadManager } from './routeHead.js';
import { readPublicDocument } from '../features/catalogue/catalogueData.js';

vi.mock('../features/catalogue/catalogueData.js', async original => ({
  ...(await original()), readPublicDocument: vi.fn(() => new Promise(() => {})),
}));

const selector = 'title, meta[name="description"], meta[name="robots"], meta[name^="nik:"], meta[property^="og:"], link[rel="canonical"]';
afterEach(() => document.head.querySelectorAll(selector).forEach(node => node.remove()));
function seed(status = 200) {
  document.head.insertAdjacentHTML('beforeend', `<title>Illustrative denim — Night in Kampala</title><meta name="description" content="Illustrative piece" /><meta name="nik:route" content="/products/fixture" /><meta name="nik:status" content="${status}" /><link rel="canonical" href="https://example.test/products/fixture" /><meta property="og:image" content="https://example.test/image.webp" />`);
}
test('server title survives mounting and stale item metadata clears on navigation', async () => {
  seed();
  render(<MemoryRouter initialEntries={['/products/fixture']}><App /></MemoryRouter>);
  expect(document.title).toBe('Illustrative denim — Night in Kampala');
  await userEvent.click(screen.getByRole('link', { name: 'Shop', exact: true }));
  expect(document.title).toBe('Shop — Night in Kampala');
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.querySelector('meta[property="og:image"]')).toBeNull();
});
test('returning to the original route restores its server metadata without duplicate tags', () => {
  seed();
  const head = createRouteHeadManager(document);
  head.apply('/shop', 'Shop — Night in Kampala');
  head.apply('/products/fixture/', 'Fallback');
  head.apply('/products/fixture', 'Fallback');
  expect(document.title).toBe('Illustrative denim — Night in Kampala');
  expect(document.querySelector('link[rel="canonical"]').href).toBe('https://example.test/products/fixture');
  expect(document.head.querySelectorAll('title')).toHaveLength(1);
});
test('server 404s display the useful not-found screen and navigation still works', async () => {
  seed(404);
  render(<MemoryRouter initialEntries={['/products/fixture']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'PAGE NOT FOUND' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('link', { name: 'Back to home' }));
  expect(document.title).toBe('Reworked in Kampala — Night in Kampala');
  expect(screen.getAllByText('AI-generated placeholder')).toHaveLength(4);
});
test('server failures display a retry explanation without pretending the page is missing', () => {
  seed(503);
  render(<MemoryRouter initialEntries={['/products/fixture']}><App /></MemoryRouter>);
  expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'PAGE NOT FOUND' })).not.toBeInTheDocument();
});
test('production indexing stays off on private routes and returns on public navigation', () => {
  seed();
  document.head.insertAdjacentHTML('beforeend', '<meta name="nik:indexing" content="enabled" />');
  const head = createRouteHeadManager(document);
  head.apply('/shop', 'Shop');
  expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow');
  head.apply('/orders/private', 'Order status');
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex, nofollow');
  head.apply('/shop', 'Shop');
  expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow');
});

function DetailLinks() {
  const navigate = useNavigate();
  return <><Link to="/products/second">Next piece</Link><Link to="/products/missing">Missing piece</Link><button onClick={() => navigate(-1)}>Go back</button><App /></>;
}

test('in-app product navigation and Back replace the head and unavailable items clear it', async () => {
  readPublicDocument.mockImplementation(async (_collection, slug) => slug === 'missing' ? null : {
    slug, name: slug === 'first' ? 'First piece' : 'Second piece', priceUGX: 85000, availability: 'sold',
    share: slug === 'first' ? { description: 'First description', imageUrl: '/share/first.jpg' } : {},
  });
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/products/first']}><DetailLinks /></MemoryRouter>);
  await screen.findByRole('heading', { name: 'First piece' });
  expect(document.title).toBe('First piece — Night in Kampala');
  expect(document.querySelector('meta[name="description"]').content).toBe('First description');
  await user.click(screen.getByRole('link', { name: 'Next piece' }));
  await screen.findByRole('heading', { name: 'Second piece' });
  expect(document.querySelector('link[rel="canonical"]').href).toMatch(/\/products\/second$/);
  expect(document.querySelector('meta[property="og:image"]').content).toMatch(/\/share\/campaign.jpg$/);
  expect(document.querySelectorAll('meta[property="og:image"]')).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Go back' }));
  await screen.findByRole('heading', { name: 'First piece' });
  expect(document.querySelector('meta[property="og:image"]').content).toMatch(/\/share\/first.jpg$/);
  await user.click(screen.getByRole('link', { name: 'Missing piece' }));
  await screen.findByRole('heading', { name: 'Piece unavailable' });
  expect(document.querySelector('meta[property="og:image"]')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex, nofollow');
});
