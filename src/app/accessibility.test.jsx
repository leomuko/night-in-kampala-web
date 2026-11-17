import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import App from './App.jsx';
import { bagStorageKey } from '../features/orders/bagData.js';

const session = vi.hoisted(() => ({ owner: false }));
vi.mock('../features/admin/useStaffSession.js', () => ({ useStaffSession: () => session.owner
  ? { status: 'ready', user: { uid: 'demo-owner' }, role: 'owner' } : { status: 'ready' } }));
vi.mock('../features/admin/useOrderQueue.js', () => ({ default: () => ({ rows: [], unread: 0, loading: false }) }));
vi.mock('../features/admin/catalogueAdmin.js', () => ({
  readEditorData: async () => ({ rows: [], categories: [] }), callStaff: vi.fn(), staffError: () => 'Could not save.',
}));
vi.mock('../features/catalogue/catalogueData.js', () => ({
  availabilityLabels: { available: 'Available', requested: 'Requested', reserved: 'Reserved', sold: 'Sold' },
  productSorts: { newest: ['publishedAt', 'desc'] }, readProductPage: async () => ({ rows: [], cursor: null }),
  readPublicPage: async () => ({ rows: [], cursor: null }), readCategories: async () => [], readRequestableSizes: async () => [],
  readOrderPolicy: async () => null, readPublicDocument: async () => ({ status: 'published', name: 'Test real piece',
    isRealCatalogueStock: true, purchasable: true, stockType: 'one-of-one', priceUGX: 85000,
    requestableSizes: [{ id: 'm', label: 'M' }], photos: [{ smallUrl: '/piece.jpg', alt: 'Front of test garment' }] }),
}));

async function audit() {
  const result = await axe.run(document.body, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
}

test.each(['/', '/shop', '/cart', '/checkout', '/admin'])('structural WCAG checks on %s', async path => {
  session.owner = false;
  if (['/cart', '/checkout'].includes(path)) localStorage.setItem(bagStorageKey, JSON.stringify([
    { slug: 'piece', size: 'm', quantity: 1, priceUGX: 85000 },
  ]));
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
  await screen.findByRole('heading', { level: 1 });
  if (['/cart', '/checkout'].includes(path)) await screen.findByRole('img', { name: 'Front of test garment' });
  await audit();
});

test('owner product editor and modal navigation have labelled operable controls', async () => {
  session.owner = true;
  const view = render(<MemoryRouter initialEntries={['/admin']}><App /></MemoryRouter>);
  await userEvent.click(await screen.findByRole('button', { name: 'Add product' }));
  expect(screen.getByRole('region', { name: 'Product editor' })).toHaveFocus();
  await audit();
  await userEvent.click(screen.getByRole('button', { name: 'Close editor' }));
  expect(screen.getByRole('button', { name: 'Add product' })).toHaveFocus();
  view.unmount();
  render(<MemoryRouter><App /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  await audit();
});
