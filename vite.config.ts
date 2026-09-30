import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.glb"],
  server: {watch: {ignored: ["**/.review/**"]}},
  build: {rollupOptions: {input: {viewer: "index.html", presentation: "watch.html", comparison: "compare.html"}}},
});
