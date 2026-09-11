/**
 * seo-phase70-performance.mjs — تسريع FCP/LCP على الموبايل.
 *
 *  1) preload لخط العناوين (Kufi 800 — عنصر LCP هو الـ H1) وخط النص (Plex 400)
 *     قبل </head> في كل صفحة — الخط يبدأ تحميله فورًا بدل انتظار سلسلة
 *     googleapis → css2 → gstatic. idempotent بعلامة نصية.
 *  2) تصغير ملفات CSS الثابتة (تعليقات + مسافات زائدة) — site.css وشقيقاته
 *     render-blocking، وكل كيلوبايت فرق على معالجات الموبايل الضعيفة.
 * تعمل آخر سلسلة المراحل.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

// ── 1) preload الخطوط في الصفحات ──
const FONT_PRELOADS =
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/notokufiarabic/v27/CSRp4ydQnPyaDxEXLFF6LZVLKrodhu8t57o1kDc5Wh7v2LbNlrWEfIyC12E.woff2">' +
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/ibmplexsansarabic/v15/Qw3CZRtWPQCuHme67tEYUIx3Kh0PHR9N6Ys43PW5fslBEg0.woff2">';

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", "public"].includes(e.name)) continue;
      yield* walk(p);
    } else if (e.name === "index.html") yield p;
  }
}

let fontAdded = 0;
for (const file of walk(clientDir)) {
  const html = fs.readFileSync(file, "utf8");
  if (html.includes("CSRp4ydQnPya")) continue;
  if (!html.includes("</head>")) continue;
  fs.writeFileSync(file, html.replace("</head>", FONT_PRELOADS + "</head>"), "utf8");
  fontAdded++;
}

// ── 2) تصغير CSS الثابتة ──
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")          // تعليقات
    .replace(/\s+/g, " ")                       // مسافات متتالية
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")       // مسافات حول المحددات
    .replace(/;}/g, "}")                        // فاصلة منقوطة أخيرة
    .trim();
}

let cssSaved = 0;
const cssDir = path.join(clientDir, "public", "static");
for (const name of ["site.css", "ux-pack.css", "atlas-body.css", "qa.css", "schools-directory.css"]) {
  const p = path.join(cssDir, name);
  if (!fs.existsSync(p)) continue;
  const orig = fs.readFileSync(p, "utf8");
  if (!orig.includes("\n")) continue; // مُصغّرة مسبقًا (سطر واحد)
  const min = minifyCss(orig);
  fs.writeFileSync(p, min, "utf8");
  cssSaved += orig.length - min.length;
}

console.log(`[phase70] performance: font preload في ${fontAdded} صفحة · CSS صُغّرت (وفّر ${(cssSaved / 1024).toFixed(1)}KB)`);
