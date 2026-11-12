import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveFirebaseRuntime } from './src/services/firebaseConfig.js';
import { publicIndexingEnabled } from './functions/indexing.js';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const indexPublicPages = publicIndexingEnabled(env.VITE_FIREBASE_TARGET, env.VITE_PUBLIC_INDEXING);
  if (command === 'build') {
    const runtime = resolveFirebaseRuntime({ development: false, useEmulators: env.VITE_USE_EMULATORS, target: env.VITE_FIREBASE_TARGET, cloudConfig: env.VITE_FIREBASE_CONFIG });
    if (mode === 'preview' ? runtime.mode !== 'preview' : runtime.target !== mode) throw new Error('Build mode and explicit Firebase target must match. Use npm run build for an offline preview.');
  }
  return {
  plugins: [react(), {
    name: 'site-indexing-policy',
    transformIndexHtml(html) {
      return html.replace('<meta name="robots" content="noindex, nofollow" />', `<meta name="robots" content="${indexPublicPages ? 'index, follow' : 'noindex, nofollow'}" /><meta name="nik:indexing" content="${indexPublicPages ? 'enabled' : 'disabled'}" />`);
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\n${indexPublicPages ? 'Allow: /' : 'Disallow: /'}\n` });
    },
  }],
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
