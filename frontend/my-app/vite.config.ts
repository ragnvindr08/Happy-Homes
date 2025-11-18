import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // change the dev server port
    proxy: {
      '/api': 'http://localhost:8000', // forward API requests to Django
    },
  },
});
