/* Obour Guide — Service Worker (Progressive Web App)
   يخزّن الأصول الأساسية ويقدّمها بسرعة، مع التأكد من عرض أحدث إصدار من الصفحات. */

const CACHE_NAME = "obour-guide-v2-20260821";
const OFFLINE_PAGE = "/offline/";
const PRECACHE = [
  "/",
  "/index.html",
  "/offline/",
  "/offline/index.html",
  "/search/",
  "/emergency/",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
  "/brand/logo.svg",
  "/brand/logo.png"
];

/* phase20-pwa */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
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

function isStaticAsset(request) {
  const dest = request.destination;
  return (
    dest === "style" ||
    dest === "script" ||
    dest === "font" ||
    dest === "image" ||
    /\.(css|js|woff2?|png|jpe?g|svg|gif|webp|avif)(\?.*)?$/i.test(request.url)
  );
}

// network-first للصفحات HTML — لضمان ظهور أحدث محتوى فور نشره
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const clone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await caches.match(OFFLINE_PAGE);
      if (offline) return offline;
      return caches.match("/").then((fallback) => fallback || new Response("", { status: 503 }));
    }
    throw err;
  }
}

// cache-first للأصول الثابتة — يحافظ على السرعة، والإصدارات الجديدة لها روابط جديدة (?v=...)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    const clone = networkResponse.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return networkResponse;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  }
  // باقي الطلبات تمر عاديًا بدون تدخل
});
