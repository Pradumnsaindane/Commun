// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        learning: resolve(__dirname, 'learning-path.html'),
        community: resolve(__dirname, 'community.html'),
        jobs: resolve(__dirname, 'jobs.html'),
        mcp: resolve(__dirname, 'mcp.html'),
      },
    },
  },
});
