import { defineConfig } from 'vite';

// Set base to './' so the built app works when served from any sub-path
// (e.g. https://<user>.github.io/<repo>/). This is critical for GitHub Pages.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
  },
  server: {
    host: true,
    port: 5173,
  },
});
