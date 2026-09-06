import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: './',
  assetsInclude: ["**/*.glb"],
  server: {watch: {ignored: ["**/.review/**"]}},
  build: {
    outDir: mode === 'pages' ? 'dist-pages' : 'dist',
    rollupOptions: {input: mode === 'pages'
      ? {viewer: 'index.html', presentation: 'watch.html'}
      : {viewer: 'index.html', presentation: 'watch.html', comparison: 'compare.html', exploration: 'explore.html', lugs: 'lugs.html', finishing: 'finish.html'}},
  },
}));
