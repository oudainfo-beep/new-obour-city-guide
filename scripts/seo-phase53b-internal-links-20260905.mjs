import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";

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

// --- 3د: توحيد مسار صيدليات الأحياء (المسطح هو القانوني) ---
const PHARM_MATRIX_DISTRICTS = ["1", "2", "5", "6", "9"];

function consolidatePharmacyUrls(pages) {
  let hrefsFixed = 0, dirsRemoved = 0;
  for (const p of pages) {
    let html = read(p.file);
    let touched = false;
    for (const n of PHARM_MATRIX_DISTRICTS) {
      const from = `/districts/district-${n}/pharmacies/`;
      const to = `/pharmacies-district-${n}/`;
      if (html.includes(`href="${from}"`)) { html = html.split(`href="${from}"`).join(`href="${to}"`); touched = true; }
    }
    if (touched) { write(p.file, html); hrefsFixed++; }
  }
  for (const n of PHARM_MATRIX_DISTRICTS) {
    const dir = path.join(clientDir, "districts", `district-${n}`, "pharmacies");
    if (fs.existsSync(dir)) { fs.rmSync(dir, { recursive: true, force: true }); dirsRemoved++; }
  }
  rep("pharma", `صفحات حُدّثت روابطها: ${hrefsFixed} — مجلدات مكررة أزيلت: ${dirsRemoved}`);
}

// --- 3أ: الأدلة القطاعية — «القائمة الكاملة» ---
const HUB_DENYLIST = new Set([
  "districts", "en", "guides", "compare", "public", "brand", "static", "404",
  "data", "search", "ask", "manifest.webmanifest",
]);

function fixSectionHubs(pages) {
  const firstLevel = new Map();
  for (const p of pages) {
    const parts = p.route.split("/").filter(Boolean);
    if (parts.length === 1 && !HUB_DENYLIST.has(parts[0])) firstLevel.set(parts[0], p);
  }
  let hubsTouched = 0, linksAdded = 0;
  for (const [seg, hub] of firstLevel) {
    const children = pages.filter((p) => {
      const parts = p.route.split("/").filter(Boolean);
      return parts.length === 2 && parts[0] === seg;
    });
    if (!children.length) continue;
    let html = read(hub.file);
    const missing = children.filter((c) => !hasLink(html, c.route));
    if (!missing.length) continue;
    const items = missing
      .map((c) => `<li><a href="${c.route}">${pageName(c.file, c.route)}</a></li>`)
      .join("");
    const block = `<section class="dir-full-list" aria-label="القائمة الكاملة"><h2>القائمة الكاملة (${missing.length})</h2><ul class="dir-full-grid">${items}</ul></section><!-- phase53-hub -->`;
    const res = insertModule(html, "phase53-hub", block);
    if (res.inserted) { write(hub.file, res.html); hubsTouched++; linksAdded += missing.length; }
  }
  rep("hubs", `أدلة قطاعية اكتملت قوائمها: ${hubsTouched} دليلًا، ${linksAdded} رابطًا`);
}

// --- 3ب: شبكات خدمات الأحياء + روابط متقاطعة ---
const AR_NUM = { 1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس", 6: "السادس", 7: "السابع", 8: "الثامن", 9: "التاسع" };
const districtKey = (route) => (route.match(/district-(\d+)/) || [])[1];

function serviceRoute(districtNum, serviceSlug) {
  if (serviceSlug === "pharmacies") return `/pharmacies-district-${districtNum}/`;
  return `/districts/district-${districtNum}/${serviceSlug}/`;
}

function fixDistrictMatrix(pages) {
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  const districts = new Map();
  for (const p of pages) {
    const m = p.route.match(/^\/districts\/(district-\d+)\/$/);
    if (m) districts.set(m[1].replace("district-", ""), { ...p, services: new Map() });
  }
  if (!districts.size) return;
  for (const p of pages) {
    const m = p.route.match(/^\/districts\/district-(\d+)\/([a-z-]+)\/$/);
    if (m && districts.has(m[1])) districts.get(m[1]).services.set(m[2], p.route);
  }
  const allServiceSlugs = new Set();
  for (const d of districts.values()) d.services.forEach((_, s) => allServiceSlugs.add(s));
  allServiceSlugs.add("pharmacies");

  let gridsAdded = 0, crossAdded = 0;
  for (const [num, d] of districts) {
    const links = [];
    for (const slug of [...allServiceSlugs].sort()) {
      const route = serviceRoute(num, slug);
      const exists = d.services.get(slug) || (slug === "pharmacies" && byRoute.has(route));
      if (!exists || hasLink(read(d.file), route)) continue;
      const targetFile = byRoute.get(d.services.get(slug) || route)?.file;
      links.push(`<li><a href="${route}">${targetFile ? pageName(targetFile, slug) : slug}</a></li>`);
    }
    if (!links.length) continue;
    const name = `الحي ${AR_NUM[num] || num}`;
    const block = `<section class="district-services" aria-label="خدمات الحي"><h2>خدمات ومرافق ${name}</h2><ul class="dir-full-grid">${links.join("")}</ul></section><!-- phase53-dgrid -->`;
    const res = insertModule(read(d.file), "phase53-dgrid", block);
    if (res.inserted) { write(d.file, res.html); gridsAdded++; }
  }
  for (const [num, d] of districts) {
    for (const [slug, route] of d.services) {
      if (slug === "pharmacies") continue; // ستُحوَّل للمسار المسطح
      const p = byRoute.get(route);
      if (!p) continue;
      let html = read(p.file);
      const sameElsewhere = [...districts.keys()]
        .filter((n) => n !== num && districts.get(n).services.has(slug))
        .map((n) => `/districts/district-${n}/${slug}/`);
      const siblings = [...d.services.keys()].filter((s) => s !== slug).map((s) => `/districts/district-${num}/${s}/`);
      const blocks = [];
      const other = sameElsewhere.filter((r) => byRoute.has(r) && !hasLink(html, r));
      if (other.length) {
        blocks.push(`<section class="related-services" aria-label="نفس الخدمة في أحياء أخرى"><h2>نفس الخدمة في أحياء أخرى</h2><ul class="dir-full-grid">${other.map((r) => `<li><a href="${r}">الحي ${AR_NUM[districtKey(r)] || districtKey(r)}</a></li>`).join("")}</ul></section>`);
      }
      const sib = siblings.filter((r) => byRoute.has(r) && !hasLink(html, r));
      if (sib.length) {
        blocks.push(`<section class="related-services" aria-label="خدمات أخرى في الحي"><h2>خدمات أخرى في الحي ${AR_NUM[num] || num}</h2><ul class="dir-full-grid">${sib.map((r) => `<li><a href="${r}">${pageName(byRoute.get(r).file, r)}</a></li>`).join("")}</ul></section>`);
      }
      if (!blocks.length) continue;
      const res = insertModule(html, "phase53-xlink", blocks.join("\n") + "<!-- phase53-xlink -->");
      if (res.inserted) { write(p.file, res.html); crossAdded++; }
    }
  }
  rep("districts", `شبكات خدمات على ${gridsAdded} صفحة حي + روابط متقاطعة على ${crossAdded} صفحة مصفوفة`);
}

// --- 3ج: ربط صفحات المقارنات من صفحات الأحياء ---
function fixCompareLinks(pages) {
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  let added = 0;
  for (const p of pages) {
    const m = p.route.match(/^\/compare\/(.+)\/$/);
    if (!m) continue;
    const nums = [...m[1].matchAll(/district-(\d+)/g)].map((x) => x[1]);
    for (const num of nums) {
      const d = byRoute.get(`/districts/district-${num}/`);
      if (!d) continue;
      let html = read(d.file);
      if (hasLink(html, p.route)) continue;
      const block = `<p class="related-compare">مقارنة ذات صلة: <a href="${p.route}">${pageName(p.file, p.route)}</a></p><!-- phase53-cmp -->`;
      const res = insertModule(html, "phase53-cmp", block);
      if (res.inserted) { write(d.file, res.html); added++; }
    }
  }
  rep("compare", `روابط مقارنات مضافة من صفحات الأحياء: ${added}`);
}

// --- 3هـ: hreflang متبادل + رابط لغة للمكافئ ---
function fixEnAr(pages) {
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  const stripTags = (html) => html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>/g, "");
  let pairs = 0;
  for (const p of pages) {
    const m = p.route.match(/^\/en\/(.+)\/$/);
    if (!m) continue;
    const arRoute = "/" + m[1] + "/";
    const ar = byRoute.get(arRoute);
    if (!ar) continue;
    let enHtml = stripTags(read(p.file));
    let arHtml = stripTags(read(ar.file));
    const tags = `<link rel="alternate" hreflang="ar" href="${SITE}${arRoute}"><link rel="alternate" hreflang="en" href="${SITE}${p.route}"><link rel="alternate" hreflang="x-default" href="${SITE}${arRoute}">`;
    enHtml = enHtml.replace("</head>", `${tags}</head>`);
    arHtml = arHtml.replace("</head>", `${tags}</head>`);
    // رابط اللغة في الصفحة العربية يشير للمكافئ الإنجليزي بدل /en/ العام
    arHtml = arHtml.split('href="/en/"').join(`href="${p.route}"`);
    // الصفحة الإنجليزية تكتسب رابط «العربية» للمكافئ إن لم يوجد
    if (!hasLink(enHtml, arRoute)) {
      const switcher = `<p class="lang-switch" dir="rtl"><a href="${arRoute}" hreflang="ar" lang="ar">النسخة العربية من هذه الصفحة</a></p><!-- phase53-lang -->`;
      const res = insertModule(enHtml, "phase53-lang", switcher);
      enHtml = res.html;
    }
    write(p.file, enHtml);
    write(ar.file, arHtml);
    pairs++;
  }
  rep("hreflang", `أزواج ar↔en مترابطة: ${pairs}`);
}

// --- 3و: /guides/ فهرس الأدلة + رابط تذييل شامل ---
const GUIDES_DENY = new Set([
  "/", "/en/", "/guides/", "/404/", "/search/", "/ask/", "/contact/", "/privacy/",
  "/corrections/", "/disclosure/", "/methodology/", "/editorial-policy/", "/sources/",
  "/about/", "/about-us/", "/data/", "/map/", "/manifest.webmanifest/", "/feed.xml/",
]);

function buildLinkGraph(pages) {
  const routes = new Set(pages.map((p) => p.route));
  const inlinks = new Map([...routes].map((r) => [r, new Set()]));
  for (const p of pages) {
    const html = read(p.file);
    for (const m of html.matchAll(/href="(\/[^"#?]*?)"/g)) {
      let u = m[1];
      if (!u.endsWith("/")) u += "/";
      if (routes.has(u) && u !== p.route) inlinks.get(u).add(p.route);
    }
  }
  return inlinks;
}

function buildGuidesHub(pages) {
  const inlinks = buildLinkGraph(pages);
  const candidates = pages.filter((p) => {
    if (GUIDES_DENY.has(p.route)) return false;
    if (p.route.startsWith("/en/")) return false;
    const n = inlinks.get(p.route)?.size ?? 0;
    return p.route.startsWith("/best-") || n <= 1;
  });
  const bestOf = candidates.filter((p) => p.route.startsWith("/best-"));
  const others = candidates.filter((p) => !p.route.startsWith("/best-"));
  const li = (p) => `<li><a href="${p.route}">${pageName(p.file, p.route)}</a></li>`;
  const section = (title, list) =>
    list.length ? `<section><h2>${title} (${list.length})</h2><ul class="dir-full-grid">${list.map(li).join("")}</ul></section>` : "";
  const body = `${section("أدلة «الأفضل» في العبور", bestOf)}${section("أدلة الخدمات والصفحات المحلية", others)}`;
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>فهرس الأدلة والقوائم — كل أدلة العبور في مكان واحد | دليل العبور</title>
<meta name="description" content="فهرس شامل لكل أدلة وقوائم دليل العبور: أدلة الأفضل، أدلة الخدمات المحلية، والتقارير المتخصصة عن مدينة العبور والعبور الجديدة.">
<link rel="canonical" href="${SITE}/guides/">
<link rel="stylesheet" href="/static/site.css">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "فهرس الأدلة والقوائم", url: `${SITE}/guides/`, inLanguage: "ar", publisher: { "@id": `${SITE}/#org` } })}</script>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
  { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE}/` },
  { "@type": "ListItem", position: 2, name: "فهرس الأدلة", item: `${SITE}/guides/` },
] })}</script>
</head><body><main class="wrap"><h1>فهرس الأدلة والقوائم</h1>
<p>كل أدلة وقوائم دليل العبور والعبور الجديدة في مكان واحد — أدلة «الأفضل»، أدلة الخدمات المحلية، والتقارير المتخصصة.</p>
<nav aria-label="أقسام رئيسية"><p><a href="/">الرئيسية</a> · <a href="/directory/">دليل الخدمات</a> · <a href="/districts/">الأحياء</a> · <a href="/compare/">المقارنات</a></p></nav>
${body}
</main><footer class="site-footer"><div class="wrap footer-base"><span>© 2026 دليل العبور والعبور الجديدة</span></div></footer></body></html>`;
  const dir = path.join(clientDir, "guides");
  fs.mkdirSync(dir, { recursive: true });
  write(path.join(dir, "index.html"), html);
  // روابط «أدلة ذات صلة» بين أعضاء كل مجموعة (i±1, i±2) — تكسر عزلة الرابط الواحد
  let relAdded = 0;
  for (const group of [bestOf, others]) {
    for (let i = 0; i < group.length; i++) {
      const p = group[i];
      let h = read(p.file);
      if (h.includes("phase53-rel")) continue;
      const neighbors = [i - 2, i - 1, i + 1, i + 2]
        .filter((j) => j >= 0 && j < group.length && j !== i)
        .map((j) => group[j]);
      if (!neighbors.length) continue;
      const block = `<section class="related-guides" aria-label="أدلة ذات صلة"><h2>أدلة ذات صلة</h2><ul class="dir-full-grid">${neighbors.map((n) => `<li><a href="${n.route}">${pageName(n.file, n.route)}</a></li>`).join("")}</ul></section><!-- phase53-rel -->`;
      const res = insertModule(h, "phase53-rel", block);
      if (res.inserted) { write(p.file, res.html); relAdded++; }
    }
  }
  rep("guides-rel", `روابط «أدلة ذات صلة»: ${relAdded} صفحة`);
  // رابط تذييل شامل
  let footers = 0;
  for (const p of pages) {
    if (p.route.startsWith("/en/")) continue;
    let h = read(p.file);
    if (h.includes('href="/guides/"')) continue;
    if (h.includes('<a href="/directory/">دليل الخدمات</a>')) {
      h = h.replace('<a href="/directory/">دليل الخدمات</a>', '<a href="/directory/">دليل الخدمات</a><a href="/guides/">فهرس الأدلة</a>');
      write(p.file, h); footers++;
    }
  }
  rep("guides", `أُنشئ /guides/ يضم ${candidates.length} صفحة (best-of: ${bestOf.length}) + رابط تذييل على ${footers} صفحة`);
}

// --- 6: إعادة بناء sitemap.xml من شجرة الملفات النهائية ---
const LASTMOD = "2026-09";

function rebuildSitemap(pages) {
  const routes = new Set(pages.map((p) => p.route));
  if (!routes.has("/guides/")) routes.add("/guides/");
  const file = path.join(clientDir, "public", "sitemap.xml");
  const old = fs.existsSync(file) ? read(file) : "";
  const oldLastmod = new Map([...old.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]*)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
  const urls = [...routes]
    .filter((r) => r !== "/404/")
    .sort()
    .map((r) => {
      const loc = r === "/" ? `${SITE}/` : `${SITE}${r}`;
      const lastmod = oldLastmod.get(loc) || LASTMOD;
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
    });
  write(file, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${urls.length} عنوانًا (بدون صفحات مُحوَّلة أو محذوفة)`);
}

function main() {
  let pages = listPages();
  rep("scan", `إجمالي الصفحات: ${pages.length}`);
  consolidatePharmacyUrls(pages); // قبل بناء الشبكات حتى ترتبط بالمسار القانوني
  pages = listPages();
  fixSectionHubs(pages);
  fixDistrictMatrix(pages);
  fixCompareLinks(pages);
  fixEnAr(pages);
  pages = listPages();
  fixSectionHubs(pages); // تمريرة ثانية بعد ظهور روابط جديدة
  buildGuidesHub(listPages());
  rebuildSitemap(listPages());
  console.log("phase53b internal links — تمّت:");
  console.log(report.map((r) => "  " + r).join("\n"));
}

main();
