import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5400,
    proxy: {
      '/api': {
        target: 'http://localhost:4700',
        changeOrigin: true,
      },
    },
  },
});
