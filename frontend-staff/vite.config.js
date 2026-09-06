import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // Production build is nested under /staff/* behind the customer app's
  // root domain (see /vercel.json — frontend-staff/dist gets copied into
  // frontend-customer/dist/staff/). Without this, the built bundle's asset
  // references would point at "/", colliding with the customer app's own
  // assets. The dev server still serves from "/" on its own port for a
  // normal standalone local dev experience.
  base: command === 'build' ? '/staff/' : '/',
  plugins: [react()],
  server: {
    // Different port than frontend-customer (5173) so both dev servers can
    // run side by side.
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}));
