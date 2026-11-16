import { test, vi, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import { DropPage } from './DropPages.jsx';

vi.mock('../catalogue/catalogueData.js', async original => ({ ...(await original()), readPublicDocument: vi.fn() }));

test('a drop keeps the saved order and hides withdrawn product references', async () => {
  readPublicDocument.mockImplementation(async (collection, slug) => {
    if (collection === 'collections') return {
      slug, title: 'Illustrative drop', illustrative: true, productIds: ['second', 'withdrawn', 'first'], coverProductId: 'first',
    };
    if (slug === 'withdrawn') return null;
    return { slug, name: slug, priceUGX: 85000, photos: [{ largeUrl: '/cover.webp', alt: 'Illustrative cover' }] };
  });
  render(<MemoryRouter initialEntries={['/collections/drop']}><Routes><Route path="/collections/:slug" element={<DropPage />} /></Routes></MemoryRouter>);
  await screen.findByRole('heading', { name: 'Illustrative drop' });
  expect(within(screen.getByRole('figure')).getByText('AI-generated placeholder')).toBeInTheDocument();
  expect(screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent)).toEqual(['second', 'first']);
});
