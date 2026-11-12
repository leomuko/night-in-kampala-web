import { afterEach, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { createRouteHeadManager } from './routeHead.js';

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
