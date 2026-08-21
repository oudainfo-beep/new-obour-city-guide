/* Obour Guide — Service Worker (Progressive Web App)
   يخزّن الأصول الأساسية ويقدّمها أولًا لتقليل زمن التحميل. */

const CACHE_NAME = "obour-guide-v1";
const PRECACHE = [
  "/",
  "/index.html",
  "/static/site.css",
  "/static/schools-directory.css",
  "/static/ui.js",
  "/search/",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
  "/brand/logo.svg",
  "/brand/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => keys.filter((k) => k !== CACHE_NAME))
      .then((toDelete) => Promise.all(toDelete.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // إذا كان الطلب صفحة، نُعيد الصفحة الرئيسية المخزنة بدل صفحة 404
          if (request.mode === "navigate") {
            return caches.match("/").then((fallback) => fallback || new Response("", { status: 503 }));
          }
          return new Response("", { status: 503 });
        });
    })
  );
});
