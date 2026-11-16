import { afterEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fixtureFirebaseConfig } from '../../test/fixtureFirebaseConfig.js';
import { orderSource } from '../../../functions/order-submit.js';
import { isOrderingOpen } from './orderAvailability.js';
import { createOrder } from './orderClient.js';
import CheckoutPage from './CheckoutPage.jsx';
import ProductOrdering from './ProductOrdering.jsx';

afterEach(() => vi.unstubAllEnvs());

test('a cloud preview without App Check offers browsing and keeps all order entry points closed', async () => {
  vi.stubEnv('VITE_USE_EMULATORS', 'false');
  vi.stubEnv('VITE_FIREBASE_TARGET', 'preview');
  vi.stubEnv('VITE_FIREBASE_CONFIG', JSON.stringify(fixtureFirebaseConfig));
  vi.stubEnv('VITE_APP_CHECK_SITE_KEY', '');
  vi.stubEnv('VITE_ORDER_TRUSTED_PROXY_HOPS', '1');
  expect(isOrderingOpen()).toBe(false);
  const send = vi.fn();
  const { rerender } = render(<MemoryRouter><CheckoutPage onOrder={send} /><ProductOrdering slug="piece" product={{}} /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Ordering opens soon' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Place order' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Add to bag' })).toBeDisabled();
  expect(screen.queryByLabelText('Phone or WhatsApp number')).toBeNull();
  expect(send).not.toHaveBeenCalled();
  await expect(createOrder({})).rejects.toThrow('Ordering opens soon');
  vi.stubEnv('VITE_APP_CHECK_SITE_KEY', 'REPLACE');
  expect(isOrderingOpen()).toBe(false);
  vi.stubEnv('VITE_APP_CHECK_SITE_KEY', 'fixture-site-key');
  expect(isOrderingOpen()).toBe(true);
  vi.stubEnv('VITE_ORDER_TRUSTED_PROXY_HOPS', '');
  expect(isOrderingOpen()).toBe(false);
  rerender(<MemoryRouter><CheckoutPage onOrder={send} /><ProductOrdering slug="piece" product={{}} /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Ordering opens soon' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add to bag' })).toBeDisabled();
  await expect(createOrder({})).rejects.toThrow('Ordering opens soon');
});

test('server rejects even attested requests until both site key and proxy hop are configured', () => {
  const request = { app: { appId: 'fixture' }, rawRequest: { get: () => '203.0.113.1' } };
  const runtime = { order: { appCheckSiteKey: '' } };
  expect(() => orderSource(request, runtime, null)).toThrow('Ordering opens soon');
  expect(() => orderSource(request, runtime, 1)).toThrow('Ordering opens soon');
  runtime.order.appCheckSiteKey = 'fixture-site-key';
  expect(() => orderSource(request, runtime, null)).toThrow('Ordering opens soon');
  expect(orderSource(request, runtime, 1)).toBe('203.0.113.1');
});
