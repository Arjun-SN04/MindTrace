import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const shared = fileURLToPath(new URL('../shared/src', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: [{ find: /^@shared$/, replacement: `${shared}/index.ts` }, { find: '@shared', replacement: shared }] },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': 'http://localhost:4000' },
  },
  build: { chunkSizeWarningLimit: 3000 },
});
