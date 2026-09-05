/**
 * seo-phase53c-ahrefs-round2-20260905.mjs
 * =======================================
 * الجولة الثانية — تقرير Ahrefs بتاريخ 2026-09-05 (بعد نشر إصلاحات 53/53b):
 *  1) علامات OG/Twitter افتراضية لأي صفحة تنقصها (كانت /guides/ و/price-report-q3-2026/).
 *  2) عناوين طويلة (>580px تقريبًا) تُقصّ يدويًا — 8 صفحات.
 *  3) أوصاف ميتا قصيرة (<70 حرفًا) تُستبدل بأوصاف كاملة — 9 صفحات.
 *  4) الروابط الداخلية المشيرة إلى مسارات 301 تُعاد كتابتها إلى الوجهة النهائية
 *     (يُقرأ الجدول من client/public/_redirects — يشمل ما حقنه 53b في /guides/).
 *  5) hreflang: تطهير كل الوسوم القديمة ثم إعادة بناء أزواج ar↔en المتطابقة
 *     المسار فقط — يقضي على "no return-tag" ووسوم تشير لصفحات غير مكافئة.
 *  5ب) روابط أشقاء داخل كل قسم — صفحات التفاصيل كانت تعيش على رابط واحد من دليلها.
 *  6) sitemap.xml: استبعاد صفحات noindex (مثل /search/ و/offline/) ومصادر 301.
 *  7) شبكة أمان أخيرة: أي صفحة يتبقّى لها ≤1 رابط داخلي تُرفع تلقائيًا.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const OG_IMG = SITE + "/brand/og.png";
const LASTMOD = "2026-09";

const report = [];
const rep = (section, msg) => report.push(`[${section}] ${msg}`);
const read = (f) => fs.readFileSync(f, "utf8");
const write = (f, c) => fs.writeFileSync(f, c);

function listPages() {
  const pages = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (["public", "node_modules"].includes(entry.name)) continue;
      const sub = path.join(dir, entry.name);
      const idx = path.join(sub, "index.html");
      if (fs.existsSync(idx)) {
        pages.push({ route: "/" + path.relative(clientDir, sub).split(path.sep).join("/") + "/", file: idx });
      }
      walk(sub);
    }
  };
  walk(clientDir);
  if (fs.existsSync(path.join(clientDir, "index.html"))) {
    pages.push({ route: "/", file: path.join(clientDir, "index.html") });
  }
  return pages;
}

// --- 1 — OG/Twitter افتراضية ---
function fixSocialTags(html, route) {
  if (html.includes('property="og:title"')) return { html, added: false };
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "دليل العبور والعبور الجديدة";
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || "";
  const url = route === "/" ? SITE + "/" : SITE + route;
  const block = `<meta property="og:type" content="website"><meta property="og:locale" content="ar_EG"><meta property="og:site_name" content="دليل العبور والعبور الجديدة"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${url}"><meta property="og:image" content="${OG_IMG}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${OG_IMG}">`;
  return { html: html.replace("</head>", block + "</head>"), added: true };
}

// --- 2 — عناوين طويلة ---
const MANUAL_TITLES = new Map(Object.entries({
  "/developers/eagle/": "إيجل جروب للتطوير العقاري في العبور والعبور الجديدة | دليل العبور",
  "/real-estate-offices/al-hamd-for-real-estate-investment-land-reform/": "Al Hamd Real Estate Investment & Land Reform | دليل العبور",
  "/developers/alashraaf/": "الأشراف للتطوير العقاري في العبور الجديدة | دليل العبور",
  "/developers/alsafwa/": "الصفوة للتطوير العقاري في العبور الجديدة | دليل العبور",
  "/developers/elmoltqa/": "الملتقى للتطوير العقاري في العبور الجديدة | دليل العبور",
  "/districts/district-25/": "الحي 25 في العبور الجديدة: الخدمات والأسعار | دليل العبور",
  "/developers/alraei/": "الراعي للتطوير العقاري في العبور الجديدة | دليل العبور",
  "/developers/foryou/": "فور يو للتطوير العقاري في العبور الجديدة | دليل العبور",
}));

// --- 3 — أوصاف قصيرة تُعزَّز ---
const MANUAL_DESC = new Map(Object.entries({
  "/about-us/": "تعرّف على فريق دليل العبور والعبور الجديدة: من نحن، وكيف نجمع بيانات الخدمات والأسعار، ومنهجية التحقق المنشورة التي نلتزم بها في كل صفحة.",
  "/automotive/car-dealers/": "معارض وموزعو السيارات في العبور: العناوين والأرقام ونقاط الفحص المهمة قبل الشراء، مع روابط لمراكز الصيانة والإطارات في دليل العبور.",
  "/banks/atm/": "أقرب ماكينة صراف آلي لك في العبور: مواقع ماكينات ATM لكل بنك موزعة حسب الحي، مع حدود السحب اليومية ورسوم السحب بين البنوك المختلفة.",
  "/corrections/": "سياسة التصحيح في دليل العبور: كيف تبلّغ عن خطأ في رقم أو عنوان أو سعر، وكيف نوثّق كل تصحيح ونحدّث الصفحة المعنية خلال أيام عمل قليلة.",
  "/en/developers/": "Obour and New Obour developers: published projects, payment plans, and a five-criterion verification framework — the guide comes before the grade.",
  "/entertainment/malls/": "مولات العبور والعبور الجديدة: القائمة الكاملة بالمواقع والمحلات وساعات العمل، ومقارنات بين المولات الكبرى لتختار الأنسب لزيارتك وتسوقك.",
  "/home-services/plumbers/": "سباكون وفنيو صحي في العبور: أرقام موثقة حسب الحي وأسعار الزيارات الشائعة، ومتى تحتاج سباكًا فوريًا ومتى يكفي إصلاح بسيط بنفسك.",
  "/restaurants/bakeries/": "مخابز وأفران العبور: العناوين والأرقام ومواعيد العمل، مع قوائم أسعار الخبز والمخبوزات الشرقية والغربية من الدليل الموثق للمدينة.",
  "/shopping/furniture/": "محلات الأثاث في العبور: العناوين والأرقام والتخصصات، ونصائح القياس والنقل والتركيب قبل الشراء — من دليل العبور الموثق للخدمات.",
}));

// --- 4 — روابط 301 ---
function redirectMap() {
  const file = path.join(clientDir, "public", "_redirects");
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of read(file).split("\n")) {
    const m = line.trim().match(/^(\/\S*)\s+(\/\S*)\s+301$/);
    if (m && !m[1].includes("*") && !m[2].includes("*")) {
      const from = m[1].endsWith("/") ? m[1] : m[1] + "/";
      const to = m[2].endsWith("/") ? m[2] : m[2] + "/";
      map.set(from, to);
    }
  }
  return map;
}

// --- 5 — hreflang: تطهير شامل ثم أزواج متطابقة المسار فقط ---
function fixHreflang(pages) {
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  const stripTags = (html) => html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>/g, "");
  let stripped = 0, pairs = 0;
  for (const p of pages) {
    const h = read(p.file);
    const s = stripTags(h);
    if (s !== h) { write(p.file, s); stripped++; }
  }
  for (const p of pages) {
    const m = p.route.match(/^\/en\/(.+)\/$/);
    if (!m) continue;
    const arRoute = "/" + m[1] + "/";
    if (!byRoute.has(arRoute)) continue; // لا مكافئ حقيقي — لا hreflang (أفضل من إشارة خاطئة)
    const tags = `<link rel="alternate" hreflang="ar" href="${SITE}${arRoute}"><link rel="alternate" hreflang="en" href="${SITE}${p.route}"><link rel="alternate" hreflang="x-default" href="${SITE}${arRoute}">`;
    write(p.file, read(p.file).replace("</head>", `${tags}</head>`));
    write(byRoute.get(arRoute).file, read(byRoute.get(arRoute).file).replace("</head>", `${tags}</head>`));
    pairs++;
  }
  rep("hreflang", `أزواج متبادلة سليمة: ${pairs} — صفحات طُهّرت من وسوم قديمة: ${stripped}`);
}

/** اسم مختصر للصفحة من H1/Title */
function pageName(file, fallback) {
  try {
    const h = read(file);
    const h1 = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (h1) return h1[1].replace(/<[^>]+>/g, "").trim().slice(0, 80);
    const t = h.match(/<title>([\s\S]*?)<\/title>/);
    if (t) return t[1].split("|")[0].trim().slice(0, 80);
  } catch {}
  return fallback;
}

function insertModule(html, marker, block) {
  if (html.includes(marker)) return { html, inserted: false };
  const wrapped = `\n${block}\n`;
  let i = html.indexOf("</main>");
  if (i !== -1) return { html: html.slice(0, i) + wrapped + html.slice(i), inserted: true };
  i = html.indexOf("<footer");
  if (i !== -1) return { html: html.slice(0, i) + wrapped + html.slice(i), inserted: true };
  return { html, inserted: false };
}

const hasLink = (html, route) => html.includes(`href="${route}"`) || html.includes(`href="${route.slice(0, -1)}"`);

// --- 5ب — روابط أشقاء داخل كل قسم: صفحات التفاصيل كانت تعيش على رابط واحد من دليلها ---
const SIBLING_DENY = new Set(["districts", "en", "guides", "compare", "public", "brand", "static", "404", "data", "search", "ask", "developers-directory"]);

function fixSiblingLinks(pages) {
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  const sections = new Map();
  for (const p of pages) {
    const parts = p.route.split("/").filter(Boolean);
    if (parts.length === 2 && !SIBLING_DENY.has(parts[0])) {
      if (!sections.has(parts[0])) sections.set(parts[0], []);
      sections.get(parts[0]).push(p.route);
    }
  }
  let added = 0;
  for (const [, children] of sections) {
    if (children.length < 3) continue;
    children.sort();
    for (let i = 0; i < children.length; i++) {
      const p = byRoute.get(children[i]);
      let html = read(p.file);
      if (html.includes("phase53-sib")) continue;
      const sibs = [children[i - 1], children[(i + 1) % children.length]]
        .filter((r, idx, arr) => r && arr.indexOf(r) === idx && r !== p.route)
        .filter((r) => !hasLink(html, r));
      if (!sibs.length) continue;
      const block = `<section class="sibling-links" aria-label="صفحات ذات صلة في القسم"><h2>صفحات ذات صلة</h2><ul class="dir-full-grid">${sibs.map((r) => `<li><a href="${r}">${pageName(byRoute.get(r).file, r)}</a></li>`).join("")}</ul></section><!-- phase53-sib -->`;
      const res = insertModule(html, "phase53-sib", block);
      if (res.inserted) { write(p.file, res.html); added++; }
    }
  }
  rep("siblings", `روابط أشقاء داخل الأقسام: ${added} صفحة`);
}

/** رسم روابط نهائي — يحسب الروابط النسبية والمطلقة معًا */
function buildAbsLinkGraph(pages) {
  const routes = new Set(pages.map((p) => p.route));
  const inlinks = new Map([...routes].map((r) => [r, new Set()]));
  for (const p of pages) {
    const html = read(p.file);
    for (const m of html.matchAll(/href="((?:https:\/\/obourguide\.com)?\/[^"#?]*?)"/g)) {
      let u = m[1].replace("https://obourguide.com", "");
      if (!u.endsWith("/")) u += "/";
      if (routes.has(u) && u !== p.route) inlinks.get(u).add(p.route);
    }
  }
  return inlinks;
}

// --- 7 — الشبكة الأخيرة: أي صفحة بقي لها ≤1 رابط بعد كل الوحدات تُرفع ---
function fixStragglers(pages) {
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  const inlinks = buildAbsLinkGraph(pages);
  const redirSrcs = new Set([...redirectMap().keys()]);
  const guidesFile = path.join(clientDir, "guides", "index.html");
  let guidesHtml = fs.existsSync(guidesFile) ? read(guidesFile) : null;
  const extraItems = [];
  let hubLinks = 0;
  const SKIP = new Set(["/", "/404/", "/offline/", "/search/", "/guides/"]);
  for (const p of pages) {
    if (SKIP.has(p.route) || redirSrcs.has(p.route) || p.route.startsWith("/en/")) continue;
    const n = inlinks.get(p.route)?.size ?? 0;
    if (n > 1) continue;
    const parts = p.route.split("/").filter(Boolean);
    let done = false;
    if (parts.length === 2) {
      const hub = byRoute.get("/" + parts[0] + "/");
      if (hub && !hasLink(read(hub.file), p.route)) {
        const block = `<section class="dir-full-list" aria-label="القائمة الكاملة"><h2>القائمة الكاملة</h2><ul class="dir-full-grid"><li><a href="${p.route}">${pageName(p.file, p.route)}</a></li></ul></section><!-- phase53-hub -->`;
        const res = insertModule(read(hub.file), "phase53-hub", block);
        if (res.inserted) { write(hub.file, res.html); hubLinks++; done = true; }
      }
    }
    if (!done && guidesHtml && !guidesHtml.includes(`href="${p.route}"`)) {
      extraItems.push(`<li><a href="${p.route}">${pageName(p.file, p.route)}</a></li>`);
    }
  }
  if (extraItems.length && guidesHtml) {
    const block = `<section><h2>صفحات إضافية</h2><ul class="dir-full-grid">${extraItems.join("")}</ul></section>`;
    guidesHtml = guidesHtml.replace("</main>", block + "\n</main>");
    write(guidesFile, guidesHtml);
  }
  rep("stragglers", `أُنقذت صفحات ضعيفة الروابط: ${hubLinks} عبر أدلة الأقسام + ${extraItems.length} عبر /guides/`);
}

// --- 6 — sitemap بدون noindex وبدون مصادر 301 ---
function rebuildSitemap(pages) {
  const ex = new Set(["/404/"]);
  for (const p of pages) {
    if (/<meta name="robots" content="[^"]*noindex/i.test(read(p.file))) ex.add(p.route);
  }
  for (const [from] of redirectMap()) ex.add(from);
  const file = path.join(clientDir, "public", "sitemap.xml");
  const old = fs.existsSync(file) ? read(file) : "";
  const oldLastmod = new Map([...old.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]*)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
  const urls = [...new Set(pages.map((p) => p.route))]
    .filter((r) => !ex.has(r))
    .sort()
    .map((r) => {
      const loc = r === "/" ? `${SITE}/` : `${SITE}${r}`;
      return `<url><loc>${loc}</loc><lastmod>${oldLastmod.get(loc) || LASTMOD}</lastmod></url>`;
    });
  write(file, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  rep("sitemap", `sitemap.xml: ${urls.length} عنوانًا (بدون noindex أو مُحوَّلات)`);
}

function main() {
  const pages = listPages();
  const redirs = redirectMap();
  let og = 0, titles = 0, descs = 0, rlinks = 0;
  for (const p of pages) {
    let html = read(p.file);
    const so = fixSocialTags(html, p.route);
    html = so.html; if (so.added) og++;
    if (MANUAL_TITLES.has(p.route)) {
      const m = html.match(/<title>([\s\S]*?)<\/title>/);
      if (m && m[1].trim() !== MANUAL_TITLES.get(p.route)) {
        html = html.replace(m[0], `<title>${MANUAL_TITLES.get(p.route)}</title>`); titles++;
      }
    }
    if (MANUAL_DESC.has(p.route)) {
      const m = html.match(/<meta name="description" content="([^"]*)">/);
      if (m && m[1].length < 100 && m[1] !== MANUAL_DESC.get(p.route)) {
        html = html.replace(m[0], `<meta name="description" content="${MANUAL_DESC.get(p.route)}">`); descs++;
      }
    }
    let touched = false;
    for (const [from, to] of redirs) {
      for (const variant of [from, from.slice(0, -1)]) {
        if (html.includes(`href="${variant}"`)) {
          html = html.split(`href="${variant}"`).join(`href="${to}"`);
          touched = true;
        }
      }
    }
    if (touched) rlinks++;
    if (html !== read(p.file)) write(p.file, html);
  }
  rep("social", `OG/Twitter أُضيفت: ${og} — عناوين قُصّت: ${titles} — أوصاف عُزّزت: ${descs}`);
  rep("rlinks", `صفحات أُعيدت كتابة روابط 301 فيها: ${rlinks}`);
  fixSiblingLinks(listPages());
  fixStragglers(listPages());
  fixHreflang(listPages());
  rebuildSitemap(listPages());
  console.log("phase53c (Ahrefs round 2) — تمّت:");
  console.log(report.map((r) => "  " + r).join("\n"));
}

main();
