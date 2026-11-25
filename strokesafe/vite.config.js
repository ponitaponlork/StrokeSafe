import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/*
  Tiny in-house PWA helper (no extra dependency): after the build, writes /precache-manifest.json
  listing every built file. public/sw.js reads it on install, so the Emergency screen and the
  whole app shell work offline after the first visit.
*/
function precacheManifest() {
  return {
    name: "strokesafe-precache-manifest",
    apply: "build",
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith(".map"));
      const staticFiles = [
        "/",
        "/index.html",
        "/manifest.webmanifest",
        "/brand/strokesafe-mark-96.png",
        "/brand/strokesafe-mark-192.png",
        "/brand/strokesafe-mark-512.png",
        "/brand/strokesafe-logo.png",
        "/brand/strokesafe-wordmark.png",
        "/fonts/MiSansKhmer-Heavy.woff",
      ];
      this.emitFile({
        type: "asset",
        fileName: "precache-manifest.json",
        source: JSON.stringify({ version: Date.now(), files: [...staticFiles, ...files.map((f) => "/" + f)] }),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precacheManifest()],
  // The developer preview page from the UI kit is kept and still works in dev at /preview.html
  build: { target: "es2020", chunkSizeWarningLimit: 600 },
  server: {
    // Local development of the server functions: run `vercel dev` (it serves /api/*), or set this proxy.
    // proxy: { "/api": "http://localhost:3000" },
  },
});
