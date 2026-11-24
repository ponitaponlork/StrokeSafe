/*
  StrokeSafe service worker (offline support, brief Part 6.4).
  - On install: caches every built file listed in /precache-manifest.json (written by vite.config.js),
    so the Emergency screen, FAST instructions and the bundled hospital list work with no internet.
  - Page navigations: network first, fall back to the cached app shell (index.html).
  - Same-origin files: cache first. Map tiles and /api/* are never cached.
*/
const CACHE = "strokesafe-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      let files = ["/", "/index.html", "/manifest.webmanifest"];
      try {
        const res = await fetch("/precache-manifest.json", { cache: "no-store" });
        if (res.ok) files = (await res.json()).files;
      } catch {
        /* offline during install: keep the minimal list */
      }
      await Promise.all(files.map((f) => cache.add(new Request(f, { cache: "reload" })).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // map tiles etc.: browser default
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put("/index.html", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          return (await caches.match("/index.html")) || (await caches.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        return Response.error();
      }
    })()
  );
});
