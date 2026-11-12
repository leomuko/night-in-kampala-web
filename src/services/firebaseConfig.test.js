import { describe, expect, test } from 'vitest';
import { demoFirebaseConfig, firebaseConfig, resolveFirebaseRuntime } from './firebaseConfig.js';

describe('Firebase target selection', () => {
  test('registered browser configuration identifies the supplied web app', () => {
    expect(firebaseConfig).toMatchObject({ projectId: 'night-in-kampala', appId: '1:1097680313454:web:d17294460797935ec8da7f', storageBucket: 'night-in-kampala.firebasestorage.app', measurementId: 'G-FVHHV82J6F' });
  });
  test('development defaults to a synthetic project even with cloud configuration installed', () => {
    expect(resolveFirebaseRuntime({ development: true, hostname: 'localhost' })).toMatchObject({ mode: 'emulator', config: demoFirebaseConfig });
  });
  test('production uses the registered project without selecting a Functions region', () => {
    const result = resolveFirebaseRuntime({ development: false, hostname: 'store.example.test' });
    expect(result).toMatchObject({ mode: 'cloud', config: firebaseConfig });
    expect(result).not.toHaveProperty('functionsRegion');
  });
  test('a developer can explicitly choose the cloud app', () => {
    expect(resolveFirebaseRuntime({ development: true, hostname: 'localhost', useEmulators: 'false' }).mode).toBe('cloud');
  });
  test.each([
    { development: false, hostname: 'localhost', useEmulators: 'true' },
    { development: true, hostname: 'store.example.test', useEmulators: 'true' },
    { development: true, hostname: 'localhost', useEmulators: 'yes' },
  ])('rejects an unsafe or ambiguous configuration: %j', input => {
    expect(() => resolveFirebaseRuntime(input)).toThrow();
  });
});
