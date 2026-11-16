import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DraftEditor from './DraftEditor.jsx';
import ProductTable from './ProductTable.jsx';
import { callStaff } from './catalogueAdmin.js';

vi.mock('./catalogueAdmin.js', () => ({ callStaff: vi.fn(), staffError: () => 'Could not save' }));

test('product table searches all supplied rows and switches between publication tabs', async () => {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  render(<ProductTable onEdit={onEdit} rows={[
    { slug: 'blue-denim', name: 'Blue denim', itemCode: 'NK-T1', sizeLabel: 'Waist 32', priceUGX: 85000, availableUnits: 0, publicationStatus: 'published', publishedAvailability: 'sold' },
    { slug: 'black-shirt', name: 'Black shirt', stockType: 'one-of-one' },
  ]} />);
  const table = screen.getByRole('table', { name: 'Products' });
  expect(within(table).getByText('UGX 85,000')).toBeInTheDocument();
  expect(within(table).getByText('Sold')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Drafts' }));
  expect(screen.queryByText('Blue denim')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'All products' }));
  await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'nk-t1');
  expect(screen.queryByText('Black shirt')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Blue denim' }));
  expect(onEdit).toHaveBeenCalledWith('blue-denim');
});

test('measurement controls submit labels and numbers without requiring a URL slug', async () => {
  callStaff.mockResolvedValue({ slug: 'test-denim', revision: 1 });
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<MemoryRouter><DraftEditor draft={{}} categories={[]} onSave={onSave} /></MemoryRouter>);
  await user.type(screen.getByLabelText('Product name'), 'Test denim');
  await user.click(screen.getByRole('button', { name: 'Add measurement' }));
  await user.type(screen.getByLabelText('Measurement 1 label'), 'Waist');
  await user.type(screen.getByLabelText('Measurement 1 (cm)'), '81.5');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(callStaff).toHaveBeenCalledWith('catalogueDraftSave', expect.objectContaining({
    slug: undefined, revision: 0, draft: expect.objectContaining({ name: 'Test denim', measurements: [{ label: 'Waist', cm: 81.5 }] }),
  }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ slug: 'test-denim' }));
});
