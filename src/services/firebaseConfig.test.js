import { describe, expect, test } from 'vitest';
import { demoFirebaseConfig, resolveFirebaseRuntime } from './firebaseConfig.js';

import { fixtureFirebaseConfig } from '../test/fixtureFirebaseConfig.js';

describe('Firebase target selection', () => {
  test('development defaults to a synthetic project even with cloud configuration installed', () => {
    expect(resolveFirebaseRuntime({ development: true, hostname: 'localhost' })).toMatchObject({ mode: 'emulator', config: demoFirebaseConfig });
  });
  test('an ordinary built preview has no cloud project', () => {
    const result = resolveFirebaseRuntime({ development: false, hostname: 'store.example.test' });
    expect(result).toMatchObject({ mode: 'preview', config: null });
    expect(result).not.toHaveProperty('functionsRegion');
  });
  test('cloud access requires an explicit target and complete project config', () => {
    expect(resolveFirebaseRuntime({ development: true, hostname: 'localhost', useEmulators: 'false' }).mode).toBe('preview');
    expect(() => resolveFirebaseRuntime({ development: false, target: 'preview' })).toThrow(/complete/);
    expect(resolveFirebaseRuntime({ development: false, target: 'production', cloudConfig: fixtureFirebaseConfig })).toMatchObject({ mode: 'cloud', target: 'production', config: fixtureFirebaseConfig });
  });
  test('Hosting preview accepts the registered project and rejects cross-project storage', () => {
    const projectId = 'night-in-kampala';
    const preview = { ...fixtureFirebaseConfig, projectId, authDomain: `${projectId}.firebaseapp.com`, storageBucket: `${projectId}.firebasestorage.app` };
    expect(resolveFirebaseRuntime({ development: false, target: 'preview', cloudConfig: preview }).config.projectId).toBe(projectId);
    expect(() => resolveFirebaseRuntime({ development: false, target: 'preview', cloudConfig: { ...preview, storageBucket: fixtureFirebaseConfig.storageBucket } })).toThrow(/belong/);
  });
  test.each([
    { development: false, hostname: 'localhost', useEmulators: 'true' },
    { development: true, hostname: 'store.example.test', useEmulators: 'true' },
    { development: true, hostname: 'localhost', useEmulators: 'yes' },
  ])('rejects an unsafe or ambiguous configuration: %j', input => {
    expect(() => resolveFirebaseRuntime(input)).toThrow();
  });
});
