import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: '/erprompt-agent',
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@nasajon/erprompt-lib': path.resolve(__dirname, '../../packages/erprompt-lib/src'),
      '@nasajon/erprompt-login-lib': path.resolve(__dirname, '../../packages/erprompt-login-lib/src'),
      '@nasajon/erprompt-launcher-lib': path.resolve(__dirname, '../../packages/erprompt-launcher-lib/src'),
    },
  },
  server: {
    fs: {
      allow: [
        '..', // já está presente
        path.resolve(__dirname, '../../node_modules'),
      ],
    },
    host: true, // Faz o Vite escutar em 0.0.0.0
    port: 5199,
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    exclude: [],
  },
});
