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
        explore: resolve(__dirname, 'explore.html'),
        subscriptions: resolve(__dirname, 'subscriptions.html'),
        community: resolve(__dirname, 'community.html'),
        discussion: resolve(__dirname, 'discussion.html'),
        article: resolve(__dirname, 'article.html'),
        profile: resolve(__dirname, 'profile.html'),
        saved: resolve(__dirname, 'saved.html'),
        write: resolve(__dirname, 'write.html'),
      },
    },
  },
});
