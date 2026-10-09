import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The backend serves the API and the generated simulations. Proxy both in dev
// so the frontend can use relative URLs (and the iframe src) without CORS.
const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/simulations': { target: BACKEND, changeOrigin: true },
    },
  },
});
