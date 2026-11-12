import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveFirebaseRuntime } from './src/services/firebaseConfig.js';

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const runtime = resolveFirebaseRuntime({ development: false, useEmulators: env.VITE_USE_EMULATORS, target: env.VITE_FIREBASE_TARGET, cloudConfig: env.VITE_FIREBASE_CONFIG });
    if (mode === 'preview' ? runtime.mode !== 'preview' : runtime.target !== mode) throw new Error('Build mode and explicit Firebase target must match. Use npm run build for an offline preview.');
  }
  return {
  plugins: [react()],
  server: {
    watch: { ignored: ['**/.cache/**', '**/artifacts/**', '**/docs/**'] },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
  },
  };
});
