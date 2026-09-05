import { defineConfig } from "vite";

export default defineConfig({
  assetsInclude: ["**/*.glb"],
  server: {watch: {ignored: ["**/.review/**"]}},
  build: {rollupOptions: {input: {viewer: "index.html", comparison: "compare.html", exploration: "explore.html"}}},
});
