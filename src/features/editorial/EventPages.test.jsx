import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readPublicDocument } from '../catalogue/catalogueData.js';
import { EventPage } from './EventPages.jsx';

vi.mock('../catalogue/catalogueData.js', async original => ({ ...(await original()), readPublicDocument: vi.fn() }));

test.each([
  { season: 'upcoming', expected: 'Date to be announced' },
  { season: 'past', date: '2030-02-03', expected: '3 February 2030' },
])('event dates stay on the published calendar day and missing fields remain clearly labelled', async ({ expected, ...fields }) => {
  readPublicDocument.mockResolvedValue({ title: 'Illustrative test event', city: 'Kampala', illustrative: true, ...fields });
  render(<MemoryRouter initialEntries={['/events/example']}><Routes><Route path="/events/:slug" element={<EventPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText(expected)).toBeInTheDocument();
  expect(screen.getByText('Illustrative event')).toBeInTheDocument();
  expect(screen.queryByText('Venue to be announced') !== null).toBe(fields.season === 'upcoming');
});
