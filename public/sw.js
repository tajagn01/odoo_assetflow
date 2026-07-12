const CACHE_NAME = "assetflow-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/login",
  "https://cdn-icons-png.flaticon.com/512/3616/3616223.png"
];

// Install Service Worker
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Cache intercept fetch
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Fallback for API offline loads
        return new Response("AssetFlow Offline Service Active: Server connection disconnected.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" })
        });
      });
    })
  );
});
