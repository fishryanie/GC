const CACHE_NAME = "gc-admin-static-v2";
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/gc-mark.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];
const PRECACHE_PATHS = new Set(PRECACHE_URLS);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
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
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const isNextAsset =
    requestUrl.pathname.startsWith("/_next/") ||
    requestUrl.pathname.startsWith("/__nextjs");
  const isApi = requestUrl.pathname.startsWith("/api/");

  if (isNextAsset || isApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((cached) => cached || fetch("/")),
      ),
    );
    return;
  }

  if (PRECACHE_PATHS.has(requestUrl.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
    return;
  }

  event.respondWith(fetch(event.request));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
