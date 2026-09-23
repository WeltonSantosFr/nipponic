const CACHE_NAME = "nipponic-pwa-v1";

const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn("[SW] Pre-caching warning:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Bypass API requests to allow application-level sync and offline handling
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 1. Navigation requests (HTML pages like '/', '/sponsors', etc.)
  // Strategy: Network-First with Cache fallback and root shell fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
              cache.put("/", response.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedMatch =
            (await cache.match(request)) || (await cache.match("/"));
          if (cachedMatch) {
            return cachedMatch;
          }
          const fallback = await cache.match("/offline.html");
          if (fallback) {
            return fallback;
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        })
    );
    return;
  }

  // 2. Next.js static assets (_next/static/**, fonts, images, css, js)
  // Strategy: Stale-While-Revalidate (serve from cache instantly, refresh in background)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) =>
                cache.put(request, clone)
              );
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Other requests: Network-First with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, clone)
          );
        }
        return response;
      })
      .catch(async () => {
        return caches.match(request);
      })
  );
});
