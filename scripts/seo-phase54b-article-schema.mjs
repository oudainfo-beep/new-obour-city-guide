/**
 * seo-phase54b-article-schema.mjs — يُستدعى من seo-phase54-post-build.mjs على dist/public.
 * ====================================================================================
 * تدقيق GEO (21 نوفمبر 2026): ~140 صفحة دليل/مقال (مثل /bakeries-obour/ و/apartment-vs-villa-obour/)
 * كانت تحمل WebPage فقط بلا Article، ومقالات Article الموجودة (540) بلا image.
 * هذه المرحلة تعمل على الناتج النهائي فلا يتجاوزها أي مولّد:
 *   1) تضيف Article لكل صفحة تحريرية فيها WebPage بلا Article/BlogPosting/NewsArticle
 *      (تستثني صفحات المنشآت والقوائم والصفحات الخدمية). التواريخ من WebPage نفسها — لا تواريخ مخترعة.
 *   2) تكمّل image (من og:image) وauthor/mainEntityOfPage لعُقد Article الموجودة الناقصة.
 *   3) تحذف من sitemap.xml أي رابط canonical صفحته يشير لرابط آخر (تكرار).
 * idempotent: تشغيلها مرتين لا يكرر شيئًا.
 */
import fs from "node:fs";
import path from "node:path";

const SITE = "https://obourguide.com";
const ARTICLE_TYPES = /^(Article|BlogPosting|NewsArticle|Report|ScholarlyArticle|TechArticle)$/;
const ENTITY_TYPES = /(Business|Bank|Medical|Pharmacy|School|Store|Restaurant|ChildCare|GovernmentOffice|ShoppingCenter|MovingCompany|ProfessionalService|RealEstateAgent|Lodging|ApartmentComplex|Place|Event|Dataset|SoftwareApplication|CollectionPage|ProfilePage|Hospital|Physician|Residence)/;
const SKIP_PATHS = new Set(["/", "/en/", "/about/", "/about-us/", "/en/about/", "/contact/", "/privacy/", "/corrections/",
  "/sources/", "/disclosure/", "/editorial-policy/", "/methodology/", "/badge/", "/tools/", "/map/", "/tracker/",
  "/updates/", "/ask/", "/offline/", "/search/", "/terms/", "/404/"]);
const SKIP_RE = [/^\/developers\/[^/]+\/$/, /^\/en\/developers\/[^/]+\/$/, /^\/districts\/[^/]+\/[^/]+\/$/];

const LD_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function walkFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else if (e.name === "index.html") out.push(p);
  }
  return out;
}

function nodesOf(json) {
  const out = [];
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object") { if (o["@type"]) out.push(o); if (o["@graph"]) walk(o["@graph"]); }
  };
  walk(json);
  return out;
}
const typesOf = (n) => [].concat(n["@type"] || []);
const meta = (html, attr, name) => (html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)) || [])[1] || "";
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const text = (s) => decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const wordCount = (html) => text(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>|<header[\s\S]*?<\/header>/g, "")).split(" ").length;

function articleFor(html, webPage, url) {
  const h1 = text((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "");
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "").replace(/\s*[|—-]\s*(دليل العبور|Obour Guide)[^|]*$/, "").trim();
  let headline = h1 || webPage.name || title;
  if (headline.length > 110) headline = headline.slice(0, 107).replace(/\s+\S*$/, "") + "…";
  const en = url.startsWith(`${SITE}/en/`);
  const a = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline,
    description: webPage.description || decode(meta(html, "name", "description")),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: webPage.inLanguage || (en ? "en" : "ar-EG"),
    image: meta(html, "property", "og:image") || `${SITE}/brand/og.png`,
    author: { "@type": "Organization", name: en ? "Obour Guide editorial team" : "فريق تحرير دليل العبور", url: `${SITE}/editorial-policy/` },
    publisher: { "@id": `${SITE}/#org` },
    isPartOf: { "@type": "WebSite", name: "دليل العبور والعبور الجديدة", url: `${SITE}/` },
  };
  if (webPage.datePublished) a.datePublished = webPage.datePublished;
  if (webPage.dateModified || webPage.datePublished) a.dateModified = webPage.dateModified || webPage.datePublished;
  return a;
}

export function runArticleSchema(distPublic, report) {
  let added = 0, enriched = 0;
  const canonicalElsewhere = new Set();
  for (const file of walkFiles(distPublic)) {
    let html = fs.readFileSync(file, "utf8");
    const rel = "/" + path.relative(distPublic, path.dirname(file)).split(path.sep).join("/") + "/";
    const urlPath = rel === "//" ? "/" : rel;
    const url = SITE + urlPath;
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canon && canon !== url) canonicalElsewhere.add(url);

    const blocks = [];
    for (const m of html.matchAll(LD_RE)) { try { blocks.push({ raw: m[0], json: JSON.parse(m[1]) }); } catch { /* تجاهل */ } }
    if (!blocks.length) continue;
    const all = blocks.flatMap((b) => nodesOf(b.json));
    const types = all.flatMap(typesOf);
    let changed = false;

    // (2) إكمال عُقد Article الموجودة
    const ogImage = meta(html, "property", "og:image") || `${SITE}/brand/og.png`;
    for (const b of blocks) {
      let touched = false;
      for (const n of nodesOf(b.json)) {
        if (!typesOf(n).some((t) => ARTICLE_TYPES.test(t))) continue;
        if (!n.image) { n.image = ogImage; touched = true; }
        if (!n.author) { n.author = { "@id": `${SITE}/#org` }; touched = true; }
        if (!n.mainEntityOfPage && (n.url || canon)) { n.mainEntityOfPage = n.url || canon; touched = true; }
        if (!n.dateModified && n.datePublished) { n.dateModified = n.datePublished; touched = true; }
      }
      if (touched) {
        html = html.replace(b.raw, `<script type="application/ld+json">${JSON.stringify(b.json)}</script>`);
        enriched++; changed = true;
      }
    }

    // (1) إضافة Article للصفحات التحريرية الناقصة
    const hasArticle = types.some((t) => ARTICLE_TYPES.test(t));
    const webPage = all.find((n) => typesOf(n).includes("WebPage"));
    const eligible = !hasArticle && webPage && !canonicalElsewhere.has(url)
      && !types.some((t) => ENTITY_TYPES.test(t))
      && !SKIP_PATHS.has(urlPath) && !SKIP_RE.some((r) => r.test(urlPath))
      && !/name="robots" content="noindex/.test(html)
      && wordCount(html) >= 300;
    if (eligible) {
      const a = articleFor(html, webPage, canon || url);
      html = html.replace("</head>", `<script type="application/ld+json">${JSON.stringify(a)}</script></head>`);
      added++; changed = true;
    }
    if (changed) fs.writeFileSync(file, html);
  }

  // (3) sitemap: حذف الروابط التي canonical صفحتها يشير لغيرها
  const sm = path.join(distPublic, "sitemap.xml");
  if (fs.existsSync(sm) && canonicalElsewhere.size) {
    let x = fs.readFileSync(sm, "utf8"); let removed = 0;
    x = x.replace(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>\s*/g, (blk, loc) => (canonicalElsewhere.has(loc) ? (removed++, "") : blk));
    fs.writeFileSync(sm, x);
    report.push(`sitemap: removed ${removed} non-canonical URL(s)`);
  }
  report.push(`article-schema: +${added} Article added, ${enriched} existing Article block(s) completed (image/author/dates)`);
}
