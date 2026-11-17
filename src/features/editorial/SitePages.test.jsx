import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import { SitePage } from './SitePages.jsx';

vi.mock('../catalogue/catalogueData.js', async original => ({ ...(await original()), readPublicDocument: vi.fn(), readOrderPolicy: async () => null }));

test('published page links are keyboard-accessible and description renders as text', async () => {
  readPublicDocument.mockResolvedValue({
    title: 'Illustrative Help', body: '<strong>Plain text</strong>', links: [{ label: 'See shop', href: '/shop' }],
  });
  render(<MemoryRouter><SitePage slug="delivery" heading="Delivery" /></MemoryRouter>);
  expect(await screen.findByText('<strong>Plain text</strong>')).toBeInTheDocument();
  await userEvent.tab();
  const link = screen.getByRole('link', { name: 'See shop' });
  expect(link).toHaveFocus();
  expect(link).toHaveAttribute('href', '/shop');
});

test('the delivery page shows a useful state while approved information is absent', async () => {
  readPublicDocument.mockResolvedValue(null);
  render(<MemoryRouter><SitePage slug="delivery" heading="Delivery" /></MemoryRouter>);
  expect(await screen.findByText('Collect from Muyenga, by appointment.')).toBeInTheDocument();
  expect(screen.getByText('Launch wording · awaiting owner review')).toBeInTheDocument();
});
