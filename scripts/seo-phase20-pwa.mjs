/**
 * seo-phase20-pwa.mjs
 * المرحلة 20: تحسينات PWA — صفحة offline + استراتيجية cache محسّنة.
 *
 * المبادئ:
 *   - idempotent: marker <!-- phase20-pwa --> في SW وفي صفحة offline.
 *   - لا تعديل يدوي لـ client/ يُفقد عند إعادة البناء.
 *   - offline page تستخدم نفس الأصول وتبقى قابلة للفهرسة (لا noindex).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const offlineDir = path.join(clientDir, "offline");
const swPath = path.join(publicDir, "sw.js");
const manifestPath = path.join(publicDir, "manifest.webmanifest");

const cssVer = (file) => {
  const full = path.join(publicDir, "static", file);
  if (!fs.existsSync(full)) return Date.now().toString(36);
  return crypto.createHash("md5").update(fs.readFileSync(full)).digest("hex").slice(0, 8);
};
const siteCssVer = cssVer("site.css");
const uiJsVer = cssVer("ui.js");

const MARKER = "<!-- phase20-pwa -->";
const SW_MARKER = "/* phase20-pwa */";

// ---------------------------------------------------------------------------
// 1) إنشاء/تحديث صفحة offline
// ---------------------------------------------------------------------------
const offlineHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أنت غير متصل | دليل العبور والعبور الجديدة</title>
  <meta name="description" content="يبدو أنك غير متصل بالإنترنت. بعض صفحات دليل العبور متاحة حتى بدون اتصال.">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="https://obourguide.com/offline/">
  <link rel="stylesheet" href="/static/site.css?v=${siteCssVer}">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/brand/icon-192.png">
  ${MARKER}
</head>
<body class="page-offline">
  <a href="#main" class="skip-link">تخطّ إلى المحتوى</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="logo" href="/" aria-label="دليل العبور - الصفحة الرئيسية">
        <img src="/brand/logo.svg" alt="دليل العبور" width="140" height="40">
      </a>
    </div>
  </header>

  <main id="main" class="paper section">
    <div class="wrap" style="max-width:720px;text-align:center;padding-block:var(--space-3xl)">
      <div style="font-size:4rem;margin-bottom:var(--space-md)" aria-hidden="true">📡</div>
      <h1>أنت غير متصل بالإنترنت</h1>
      <p class="lead">لا يزال بإمكانك الوصول إلى بعض صفحات <strong>دليل العبور</strong> التي تم تحميلها مسبقًا. إذا كانت الصفحة التي تبحث عنها غير متاحة، جرّب إحدى الروابط التالية أو أعد الاتصال بالشبكة.</p>

      <div class="button-row" style="justify-content:center;margin-block:var(--space-lg)">
        <button class="button" type="button" onclick="location.reload()">إعادة المحاولة</button>
        <a class="button button--ghost" href="/">الصفحة الرئيسية</a>
      </div>

      <section class="offline-grid" style="margin-top:var(--space-xl);text-align:right">
        <h2>صفحات متاحة غالبًا حتى بدون إنترنت</h2>
        <div class="dir-hub-grid" style="margin-top:var(--space-md)">
          <a class="dir-hub-card" href="/search/">
            <strong>البحث في الدليل</strong>
            <span>ابحث عن خدمة، منطقة، أو مشروع</span>
          </a>
          <a class="dir-hub-card" href="/emergency/">
            <strong>أرقام الطوارئ</strong>
            <span>مستشفيات، مراكز شرطة، إطفاء</span>
          </a>
          <a class="dir-hub-card" href="/services/">
            <strong>فهرس الخدمات</strong>
            <span>تصفّح حسب نوع الخدمة</span>
          </a>
          <a class="dir-hub-card" href="/districts/">
            <strong>أحياء العبور</strong>
            <span>مقارنة الأحياء والخدمات</span>
          </a>
          <a class="dir-hub-card" href="/compounds/">
            <strong>المشاريع السكنية</strong>
            <span>كمبوندات العبور والعبور الجديدة</span>
          </a>
          <a class="dir-hub-card" href="/directory/">
            <strong>دليل الخدمات</strong>
            <span>فهرس شامل حسب النشاط</span>
          </a>
        </div>
      </section>

      <aside class="note" style="margin-top:var(--space-xl)">
        <p>لتثبيت دليل العبور كتطبيق على جهازك والوصول إليه بسرعة حتى بدون إنترنت، استخدم زر <strong>تثبيت التطبيق</strong> في الأعلى أو القائمة.</p>
      </aside>
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>دليل العبور والعبور الجديدة — مصدر مستقل للمعلومات المحلية.</p>
    </div>
  </footer>

  <script src="/static/ui.js?v=${uiJsVer}" defer></script>
</body>
</html>
`;

if (!fs.existsSync(offlineDir)) fs.mkdirSync(offlineDir, { recursive: true });
fs.writeFileSync(path.join(offlineDir, "index.html"), offlineHtml);
console.log("[offline] تم إنشاء/تحديث صفحة /offline/");

// ---------------------------------------------------------------------------
// 2) تحديث Service Worker
// ---------------------------------------------------------------------------
let sw = fs.existsSync(swPath) ? fs.readFileSync(swPath, "utf8") : "";

const newSw = `/* Obour Guide — Service Worker (Progressive Web App)
   يخزّن الأصول الأساسية ويقدّمها بسرعة، مع التأكد من عرض أحدث إصدار من الصفحات. */

const CACHE_NAME = "obour-guide-v2-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}";
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

${SW_MARKER}

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
    /\\.(css|js|woff2?|png|jpe?g|svg|gif|webp|avif)(\\?.*)?$/i.test(request.url)
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
`;

fs.writeFileSync(swPath, newSw);
console.log("[sw] تم تحديث Service Worker: offline page + precache");

// ---------------------------------------------------------------------------
// 3) التأكد من أن الـ manifest يشير إلى offline كـ related application/fallback
// ---------------------------------------------------------------------------
if (fs.existsSync(manifestPath)) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    manifest = {};
  }
  // إضافة screenshots لتحسين تثبيت PWA (اختياري)
  if (!manifest.screenshots) {
    manifest.screenshots = [
      { src: "/brand/og.png", sizes: "1200x630", type: "image/png", form_factor: "wide", label: "Obour Guide homepage" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", form_factor: "narrow", label: "Obour Guide app icon" }
    ];
  }
  if (!manifest.categories) manifest.categories = ["reference", "lifestyle", "travel"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log("[manifest] تم تحديث manifest.webmanifest");
}

console.log("=== المرحلة 20: PWA improvements انتهت ===");
