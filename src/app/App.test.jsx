import { describe, test, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

function visit(path = '/') { return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }

describe('store foundations', () => {
  test('preview clothing is visibly labelled and cannot be purchased', () => {
    visit();
    expect(screen.getAllByText('AI-generated placeholder')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /add to bag/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('UGX 160,000')).toHaveLength(1);
  });

  test('mobile menu preserves exact destinations and cancel restores focus', async () => {
    const user = userEvent.setup();
    visit();
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    const links = within(dialog).getAllByRole('link');
    expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Shop', '/shop'], ['Drops', '/collections'], ['Our process', '/about'], ['Lookbook', '/lookbooks'], ['Events', '/events'],
    ]);
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test('following a mobile destination closes the menu and focuses main content', async () => {
    const user = userEvent.setup();
    visit();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('link', { name: 'Events' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Events' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  test('search encodes input and routes without claiming results exist', async () => {
    const user = userEvent.setup();
    visit();
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    const dialog = screen.getByRole('dialog', { name: 'Search' });
    await user.type(within(dialog).getByRole('searchbox'), '  denim & tees  ');
    await user.click(within(dialog).getByRole('button', { name: 'Search', exact: true }));
    expect(screen.getByRole('heading', { level: 1, name: 'Shop' })).toBeInTheDocument();
    expect(screen.getByText('denim & tees', { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('region preference does not imply currency conversion', async () => {
    const user = userEvent.setup();
    visit();
    await user.click(screen.getByRole('button', { name: 'Choose shopping region' }));
    const dialog = screen.getByRole('dialog', { name: 'Shopping region' });
    await user.click(within(dialog).getByRole('radio', { name: 'International' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save region' }));
    expect(localStorage.getItem('nk-region')).toBe('international');
    expect(screen.getByRole('button', { name: 'Choose shopping region' })).toHaveTextContent('INT / UGX');
  });

  test('order numbers alone never disclose an order', () => {
    visit('/orders/fixture-private');
    expect(screen.getByText(/An order number alone does not give access/)).toBeInTheDocument();
    expect(screen.queryByText(/awaiting_payment/)).not.toBeInTheDocument();
  });

  test.each(['/missing-page', '/account'])('unknown or deferred route %s has a not-found view', path => {
    visit(path);
    expect(screen.getByRole('heading', { name: 'PAGE NOT FOUND' })).toBeInTheDocument();
  });

  test('form errors are linked to their input and clear on correction', async () => {
    const user = userEvent.setup();
    visit('/components');
    const email = await screen.findByRole('textbox', { name: 'Email address' });
    await user.click(screen.getByRole('button', { name: 'Validate example' }));
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Enter a valid email address.');
    await user.type(email, 'fixture@example.test');
    await user.click(screen.getByRole('button', { name: 'Validate example' }));
    expect(email).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument();
  });
});
