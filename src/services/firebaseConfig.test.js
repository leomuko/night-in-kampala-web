import { describe, expect, test } from 'vitest';
import { demoFirebaseConfig, firebaseConfig, resolveFirebaseRuntime } from './firebaseConfig.js';

describe('Firebase target selection', () => {
  test('registered browser configuration identifies the supplied web app', () => {
    expect(firebaseConfig).toMatchObject({ projectId: 'night-in-kampala', appId: '1:1097680313454:web:d17294460797935ec8da7f', storageBucket: 'night-in-kampala.firebasestorage.app', measurementId: 'G-FVHHV82J6F' });
  });
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
    expect(resolveFirebaseRuntime({ development: false, target: 'production', cloudConfig: firebaseConfig })).toMatchObject({ mode: 'cloud', target: 'production', config: firebaseConfig });
  });
  test('staging rejects the registered project and cross-project Storage/Auth', () => {
    const staging = { ...firebaseConfig, projectId: 'nik-example-staging', authDomain: 'nik-example-staging.firebaseapp.com', storageBucket: 'nik-example-staging.firebasestorage.app' };
    expect(() => resolveFirebaseRuntime({ development: false, target: 'staging', cloudConfig: firebaseConfig })).toThrow(/protected/);
    expect(resolveFirebaseRuntime({ development: false, target: 'staging', cloudConfig: staging }).config.projectId).toBe(staging.projectId);
    expect(() => resolveFirebaseRuntime({ development: false, target: 'staging', cloudConfig: { ...staging, storageBucket: firebaseConfig.storageBucket } })).toThrow(/belong/);
  });
  test.each([
    { development: false, hostname: 'localhost', useEmulators: 'true' },
    { development: true, hostname: 'store.example.test', useEmulators: 'true' },
    { development: true, hostname: 'localhost', useEmulators: 'yes' },
  ])('rejects an unsafe or ambiguous configuration: %j', input => {
    expect(() => resolveFirebaseRuntime(input)).toThrow();
  });
});
