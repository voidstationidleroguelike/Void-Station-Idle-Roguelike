const CACHE_VERSION = "ex-pocket-guide-v14b";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",

  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/views.css",

  "./data/app-config.js",
  "./data/general-text-templates.js",
  "./data/content-meta.js",
  "./data/translations.js",
  "./data/courses.js",
  "./data/ex-demo-rules.js",
  "./data/marking-systems.js",
  "./data/ex-marking-rules.js",
  "./data/ex-code-library.js",

  "./js/app.js",
  "./js/core/i18n.js",
  "./js/core/router.js",
  "./js/core/pan-zoom.js",
  "./js/core/ex-marking-parser.js",
  "./js/core/ex-code-extractor.js",
  "./js/core/ex-marking-interpreter.js",
  "./js/core/general-text-generator.js",

  "./js/services/ocr-service.js",
  "./js/services/pwa-service.js",

  "./js/features/guide.js",
  "./js/features/marking.js",
  "./js/features/poster.js",
  "./js/features/courses.js",

  "./assets/branding/trainor-apave-placeholder.svg",
  "./assets/home/ex-home-symbol.png",
  "./assets/marking-systems/atex-official-symbol.png",
  "./assets/marking-systems/iecex-placeholder.svg",
  "./assets/marking-systems/other-placeholder.svg",
  "./assets/poster/poster-no.svg",
  "./assets/poster/poster-en.svg",
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

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) =>
            cache.put("./index.html", copy)
          );
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) =>
            cache.put(request, copy)
          );

          return response;
        });
      })
    );
  }
});
