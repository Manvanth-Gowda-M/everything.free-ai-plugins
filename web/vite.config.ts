import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "../dist-web"),
    emptyOutDir: true,
    sourcemap: true,
    minify: "esbuild",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
