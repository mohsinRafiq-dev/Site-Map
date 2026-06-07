import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    open: true,
    // Exclude the Floor Plans asset folder from file-watching —
    // it holds hundreds of PNGs that are never imported by Vite.
    // Without this, chokidar slows to a crawl and the dev server
    // can fail to serve JS modules (causing the map to go black).
    watch: {
      ignored: [
        "**/Floor Plans/**",
        "**/node_modules/**",
        "**/dist/**",
      ],
    },
  },

  // Mapbox GL JS is CommonJS — Vite must pre-bundle it so the
  // `import mapboxgl from "mapbox-gl"` default export resolves correctly.
  optimizeDeps: {
    include: ["mapbox-gl"],
  },

  // Allow Vite to serve PNG/JPG from anywhere inside the project.
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.jpeg"],

  build: {
    // Split heavy vendors into separate chunks so the browser caches them
    // independently and the main app bundle stays smaller.
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ["mapbox-gl"],
          firebase: ["firebase/app", "firebase/firestore", "firebase/storage", "firebase/auth"],
          react: ["react", "react-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
