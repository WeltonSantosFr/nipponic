const CACHE_NAME = "nipponic-pwa-v2";

const isLocalhost = Boolean(
  self.location.hostname === "localhost" ||
  self.location.hostname === "[::1]" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname === "10.0.2.2"
);

if (isLocalhost) {
  // Self-unregister immediately and clear all caches if running in development
  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .catch(() => {})
    );
  });
} else {
  const PRECACHE_ASSETS = [
    "/",
    "/offline.html",
    "/favicon.ico",
  ];

  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        await Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`[SW] Pre-cache failed for ${asset}:`, err);
            })
          )
        );
        return self.skipWaiting();
      }).catch(() => {})
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
        .catch(() => {})
    );
  });

  self.addEventListener("message", (event) => {
    if (
      event.data &&
      event.data.type === "CACHE_URLS" &&
      Array.isArray(event.data.urls)
    ) {
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.allSettled(
            event.data.urls.map(async (url) => {
              try {
                const res = await fetch(url, { cache: "force-cache" });
                if (res.ok) {
                  await cache.put(url, res).catch(() => {});
                }
              } catch {
                // Ignore failure for individual asset
              }
            })
          );
        }).catch(() => {})
      );
    }
  });

  self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Only handle GET requests
    if (request.method !== "GET") {
      return;
    }

    let url;
    try {
      url = new URL(request.url);
    } catch {
      return;
    }

    // Ignore non-http/https requests (e.g. chrome-extension://, blob:, data:)
    if (!url.protocol.startsWith("http")) {
      return;
    }

    // Bypass API requests to allow application-level sync and offline handling
    if (url.pathname.startsWith("/api/")) {
      return;
    }

    // Bypass Next.js development and HMR endpoints
    if (
      url.pathname.includes("/_next/webpack-hmr") ||
      url.pathname.includes("__turbopack__") ||
      url.pathname.includes("/__nextjs")
    ) {
      return;
    }

    // 1. Navigation requests (HTML pages like '/', '/sponsors', etc.)
    // Strategy: Network-First with Cache fallback and root shell fallback
    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const cloneForReq = response.clone();
              const cloneForRoot = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, cloneForReq).catch(() => {});
                cache.put("/", cloneForRoot).catch(() => {});
              }).catch(() => {});
            }
            return response;
          })
          .catch(async () => {
            try {
              const cache = await caches.open(CACHE_NAME);
              const cachedMatch =
                (await cache.match(request)) ||
                (await cache.match("/")) ||
                (await cache.match(new Request("/")));
              if (cachedMatch) {
                return cachedMatch;
              }
              const fallback = await cache.match("/offline.html");
              if (fallback) {
                return fallback;
              }
            } catch {
              // Ignore cache read error
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
        caches.match(request)
          .catch(() => undefined)
          .then((cachedResponse) => {
            const fetchPromise = fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const clone = networkResponse.clone();
                  caches.open(CACHE_NAME).then((cache) =>
                    cache.put(request, clone).catch(() => {})
                  ).catch(() => {});
                }
                return networkResponse;
              })
              .catch(() => {
                return (
                  cachedResponse ||
                  new Response(null, { status: 404, statusText: "Not Found" })
                );
              });

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
              cache.put(request, clone).catch(() => {})
            ).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          try {
            const cached = await caches.match(request);
            if (cached) {
              return cached;
            }
          } catch {
            // Ignore cache match error
          }
          return new Response(null, {
            status: 503,
            statusText: "Offline",
          });
        })
    );
  });
}
