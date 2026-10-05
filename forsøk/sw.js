const CACHE_VERSION = "ex-pocket-guide-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",

  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/views.css",

  "./data/app-config.js",
  "./data/translations.js",
  "./data/courses.js",
  "./data/ex-demo-rules.js",

  "./js/app.js",
  "./js/core/i18n.js",
  "./js/core/router.js",
  "./js/core/pan-zoom.js",
  "./js/services/ocr-service.js",
  "./js/features/guide.js",
  "./js/features/marking.js",
  "./js/features/poster.js",
  "./js/features/courses.js",

  "./assets/branding/trainor-apave-placeholder.svg",
  "./assets/poster/poster-placeholder.svg",
  "./assets/pwa/icon-192.svg",
  "./assets/pwa/icon-512.svg",
  "./assets/pwa/icon-maskable.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navigation: network first, fall back to app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Same-origin static assets: cache first, then network.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});
