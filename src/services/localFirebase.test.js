import { describe, expect, test } from 'vitest';
import { localFirebaseSettings } from './localFirebase.js';

describe('local-only Firebase boundary', () => {
  test('a local opt-in always returns the synthetic project', () => {
    expect(localFirebaseSettings({ enabled: true, development: true, hostname: '127.0.0.1' }).projectId).toBe('demo-night-in-kampala');
  });
  test.each([
    { enabled: true, development: false, hostname: 'localhost' },
    { enabled: false, development: true, hostname: 'localhost' },
    { enabled: true, development: true, hostname: 'store.example.test' },
  ])('rejects connections outside the emulator boundary: %j', settings => {
    expect(() => localFirebaseSettings(settings)).toThrow(/restricted to local/);
  });
});
