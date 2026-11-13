import { describe, expect, test } from 'vitest';
import { demoFirebaseConfig, PROTECTED_PROJECT_ID, resolveFirebaseRuntime } from './firebaseConfig.js';

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
    expect(() => resolveFirebaseRuntime({ development: false, target: 'staging' })).toThrow(/complete/);
    expect(resolveFirebaseRuntime({ development: false, target: 'production', cloudConfig: fixtureFirebaseConfig })).toMatchObject({ mode: 'cloud', target: 'production', config: fixtureFirebaseConfig });
  });
  test('staging rejects the registered project and cross-project Storage/Auth', () => {
    const staging = { ...fixtureFirebaseConfig, projectId: 'nik-example-staging', authDomain: 'nik-example-staging.firebaseapp.com', storageBucket: 'nik-example-staging.firebasestorage.app' };
    expect(() => resolveFirebaseRuntime({ development: false, target: 'staging', cloudConfig: { ...fixtureFirebaseConfig, projectId: PROTECTED_PROJECT_ID } })).toThrow(/protected/);
    expect(resolveFirebaseRuntime({ development: false, target: 'staging', cloudConfig: staging }).config.projectId).toBe(staging.projectId);
    expect(() => resolveFirebaseRuntime({ development: false, target: 'staging', cloudConfig: { ...staging, storageBucket: fixtureFirebaseConfig.storageBucket } })).toThrow(/belong/);
  });
  test.each([
    { development: false, hostname: 'localhost', useEmulators: 'true' },
    { development: true, hostname: 'store.example.test', useEmulators: 'true' },
    { development: true, hostname: 'localhost', useEmulators: 'yes' },
  ])('rejects an unsafe or ambiguous configuration: %j', input => {
    expect(() => resolveFirebaseRuntime(input)).toThrow();
  });
});
