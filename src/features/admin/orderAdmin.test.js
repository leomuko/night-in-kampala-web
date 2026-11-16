import { expect, test } from 'vitest';
import { groupOrders, isOverdue } from './orderAdmin.js';

const record = (id, state, time) => ({ id, state, createdAt: { toMillis: () => time },
  items: [{ slug: 'denim', name: 'Denim', state: 'requested' }] });

test('orders compete across queue tabs and print oldest first', () => {
  const older = record('one', 'contacted', 1000);
  const newer = record('two', 'new', 2000);
  expect(groupOrders([newer, older], [newer]).competing[0].orders).toEqual([older, newer]);
  expect(isOverdue(older, 24, 1000 + 86400000)).toBe(true);
  expect(isOverdue({ ...older, state: 'confirmed' }, 24, 1000 + 86400000)).toBe(false);
});
