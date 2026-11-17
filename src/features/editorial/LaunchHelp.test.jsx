import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LaunchHelp from './LaunchHelp.jsx';
import { readOrderPolicy } from '../catalogue/catalogueData.js';

vi.mock('../catalogue/catalogueData.js', () => ({ readOrderPolicy: vi.fn(async () => null) }));

test.each(['how-to-order', 'delivery', 'payment', 'returns', 'privacy', 'contact', 'sizing'])('launch %s help gives a useful contact and marks review status', slug => {
  render(<MemoryRouter><LaunchHelp slug={slug} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Call +256759334383' })).toHaveAttribute('href', 'tel:+256759334383');
  expect(screen.getByText('Launch wording · awaiting owner review')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Chat on WhatsApp' })).toBeNull();
  if (slug === 'returns') expect(screen.getByText(/within 10 days of receiving your piece/)).toBeInTheDocument();
});

test('saved business policy enables WhatsApp without exposing private order data', async () => {
  readOrderPolicy.mockResolvedValueOnce({ whatsappNumber: '+256759334383', copyReviewed: true });
  render(<MemoryRouter><LaunchHelp slug="contact" /></MemoryRouter>);
  expect(await screen.findByRole('link', { name: 'Chat on WhatsApp' })).toHaveAttribute('href', 'https://wa.me/256759334383');
  expect(screen.queryByText('Launch wording · awaiting owner review')).toBeNull();
});
