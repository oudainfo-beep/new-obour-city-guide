/**
 * seo-phase14-top-entity-pages.mjs
 * صفحات كيانات فردية غنية للقوائم الأعلى تصنيفًا في الفئات التي لا تمتلك
 * صفحات فردية بعد (مطاعم، عيادات، بنوك، خدمات منزلية، مهنية، سيارات،
 * تسوق، لياقة، ترفيه، ...).
 *
 * - idempotent: لا يكرّر الروابط ولا يكتب فوق صفحة موجودة.
 * - لا يُنشئ بيانات غير منشورة ولا تقييمات/مراجعات وهمية.
 * - يعيد بناء sitemap.xml في النهاية.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data", "directories");
const SITE = "https://obourguide.com";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const MAX_PER_CATEGORY = 10;

// فئات تمتلك صفحات فردية جيدة بالفعل — نتجنب تكرارها.
const SKIP_DIRS = new Set(["hospitals", "schools", "schools-all", "pharmacies", "malls"]);

// فئات الترفيه التي غطّاها بالفعل إنشاء صفحات المولات.
const MALL_CATEGORIES = new Set(["مولات", "مراكز تجارية", "سينمات"]);

const SCHEMA_TYPES = {
  restaurants: "Restaurant",
  clinics: "MedicalBusiness",
  banks: "BankOrCreditUnion",
  automotive: "AutomotiveBusiness",
  fitness: "HealthAndBeautyBusiness",
  "home-services": "HomeAndConstructionBusiness",
  "professional-services": "ProfessionalService",
  shopping: "Store",
  entertainment: "EntertainmentBusiness",
  "government-services": "GovernmentOffice",
  nurseries: "ChildCare",
  logistics: "MovingCompany",
  hotels: "LodgingBusiness",
  "real-estate-offices": "RealEstateAgent",
};

// -----------------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const AR_MAP = {
  ا: "a", أ: "a", إ: "i", آ: "a", ء: "", ى: "a", ي: "y", و: "w",
  ب: "b", ت: "t", ث: "th", ج: "g", ح: "h", خ: "kh", د: "d", ذ: "th",
  ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z",
  ع: "aa", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
  ه: "h", ة: "h", ـ: "",
};

function transliterate(str) {
  return str
    .split("")
    .map((ch) => AR_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function cleanPhone(p) {
  if (!p) return "";
  return p.split(/;\s*/).join(" · ");
}

function firstTel(p, t) {
  if (t) return t.replace(/\D/g, "");
  if (!p) return "";
  const first = p.split(/[;,]/)[0];
  const digits = first.replace(/[\s\-]/g, "").replace(/[^0-9+]/g, "");
  return digits;
}

function mapUrl(name, address) {
  const q = encodeURIComponent(`${name} ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function loadChrome() {
  const donorPath = path.join(clientDir, "about-us", "index.html");
  const donor = fs.readFileSync(donorPath, "utf8");
  const head = donor.match(/<head>[\s\S]*?<\/head>/)[0];
  const header = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
  const footer = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];
  return { head, header, footer };
}

function orgNode() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": SITE + "/#org",
    name: "دليل العبور والعبور الجديدة",
    url: SITE + "/",
    logo: "https://obourguide.com/brand/logo.png",
    foundingDate: "2026",
    publishingPrinciples: SITE + "/editorial-policy/",
  };
}

function buildHead(head, { title, description, url, schemas }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

function breadcrumbSchema(categoryName, categoryUrl, name, url) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: categoryName, item: categoryUrl },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };
}

function webPageSchema(e, url) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: e.entity.name,
    url,
    description: e.description,
    inLanguage: "ar-EG",
    datePublished: "2026-08",
    dateModified: "2026-08",
    publisher: { "@id": SITE + "/#org" },
  };
}

function localBusinessSchema(e, url) {
  const schema = {
    "@context": "https://schema.org",
    "@type": e.schemaType,
    name: e.entity.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: e.entity.address,
      addressLocality: "العبور",
      addressRegion: "القليوبية",
      addressCountry: "EG",
    },
    url,
  };
  if (e.entity.phone && e.entity.phone !== "غير منشور") {
    schema.telephone = e.entity.rawPhone || e.entity.phone;
  }
  return schema;
}

function isPhase14Page(slug, dir) {
  const file = path.join(clientDir, dir, slug, "index.html");
  if (!fs.existsSync(file)) return false;
  return fs.readFileSync(file, "utf8").includes("<!-- phase14-entity-page -->");
}

function isBlockedSlug(slug, dir) {
  const dirPath = path.join(clientDir, dir, slug);
  if (!fs.existsSync(dirPath)) return false;
  // allow reusing pages previously generated by this script
  return !isPhase14Page(slug, dir);
}

function resolveSlug(name, used, dir) {
  let base = transliterate(name).replace(/^-|-$/g, "");
  if (!base) base = "entity";
  let candidate = base;
  let i = 2;
  while (used.has(candidate) || isBlockedSlug(candidate, dir)) {
    candidate = `${base}-${i++}`;
  }
  used.add(candidate);
  return candidate;
}

function loadDirectory(dir) {
  const file = path.join(dataDir, `${dir}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function score(item) {
  let s = 0;
  if (item.n) s += 1;
  if (item.a) s += 1;
  if (item.p || item.t) s += 1;
  return s;
}

function selectTopItems(items, dir) {
  let list = items.slice();
  if (dir === "entertainment") {
    list = list.filter((it) => !MALL_CATEGORIES.has(it.c));
  }
  list.sort((a, b) => score(b) - score(a));
  return list.slice(0, MAX_PER_CATEGORY);
}

function buildEntity(e, related) {
  const url = `${SITE}/${e.dir}/${e.slug}/`;
  const canonicalUrl = e.canonicalOverride || url;
  const schemas = [
    orgNode(),
    webPageSchema(e, url),
    localBusinessSchema(e, url),
    breadcrumbSchema(e.category.name, e.category.url, e.entity.name, url),
  ];
  let head = buildHead(e.chrome.head, { title: e.title, description: e.description, url: canonicalUrl, schemas });
  if (e.canonicalOverride) {
    // og:url stays on the page's own URL; only rel=canonical consolidates.
    head = head.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  }
  head = head.replace(
    /<\/head>/,
    "<!-- phase14-entity-page -->\n</head>"
  );

  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="${e.category.url}">${e.category.name}</a><span>/</span><span>${escapeHtml(e.entity.name)}</span></div></nav>`;

  const phoneDisplay = e.entity.phone || "غير منشور";
  const tel = e.entity.tel;
  const phoneCell = tel
    ? `<a href="tel:${tel}" class="dir-call">☎ ${phoneDisplay}</a>`
    : `☎ ${phoneDisplay}`;

  const mapLink = e.entity.address && e.entity.address !== "غير منشور"
    ? `<a href="${mapUrl(e.entity.name, e.entity.address)}" target="_blank" rel="nofollow noopener noreferrer">الخريطة ↗</a>`
    : "";

  const mapCell = mapLink || "غير متاح";
  const tableRows = [
    ["الاسم", escapeHtml(e.entity.name)],
    ["العنوان", escapeHtml(e.entity.address)],
    ["الهاتف", phoneCell],
    ["الخريطة", mapCell],
    ["التصنيف", escapeHtml(e.entity.category)],
    ["المصدر", escapeHtml(e.entity.source)],
  ];
  const table = `<div class="table-wrap"><table><tbody>${tableRows
    .map(([th, td]) => `<tr><th>${th}</th><td>${td}</td></tr>`)
    .join("")}</tbody></table></div>`;

  const relatedListings = related.length
    ? `<ul>${related
        .map((r) => `<li><a href="/${r.dir}/${r.slug}/">${escapeHtml(r.entity.name)}</a></li>`)
        .join("")}</ul>`
    : "<p>لا توجد كيانات مشابهة منشورة في نفس التصنيف.</p>";

  const relatedCategories = `<ul><li><a href="${e.category.url}">${e.category.name}</a></li><li><a href="/directory/">دليل الخدمات</a></li><li><a href="/corrections/">اقترح تصحيحًا</a></li></ul>`;

  const main = `<main id="content"><section class="wrap paper section"><h1>${escapeHtml(e.entity.name)}</h1><p class="lead">${escapeHtml(e.description)}</p><h2>البيانات المنشورة</h2>${table}<p><small>المصدر: ${escapeHtml(e.entity.source)} — يُفضل التحقق من البيانات قبل الزيارة.</small></p><h2>روابط ذات صلة</h2><h3>كيانات قريبة</h3>${relatedListings}<h3>تصنيفات ذات صلة</h3>${relatedCategories}<div class="action-card"><p>هل لديك تصحيح موثّق؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a></div></section></main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${e.chrome.header}${breadcrumbHtml}${main}${e.chrome.footer}</body></html>`;
}

function injectCategoryLinks(dir, entities) {
  const indexPath = path.join(clientDir, dir, "index.html");
  if (!fs.existsSync(indexPath)) {
    rep("WARN", `/${dir}/ index not found`);
    return;
  }
  const marker = `<!-- phase14-top-entities-${dir} -->`;
  let html = fs.readFileSync(indexPath, "utf8");
  if (html.includes(marker)) {
    rep("SKIP", `/${dir}/ already linked to top entities`);
    return;
  }
  const links = entities
    .slice(0, 8)
    .map((e) => `<a href="/${e.dir}/${e.slug}/">${escapeHtml(e.entity.name)}</a>`)
    .join(" · ");
  const block = `<section class="paper section wrap" aria-label="صفحات كيانات فردية">${marker}<h2>صفحات كيانات فردية</h2><p>${links}</p></section>`;

  if (html.includes("<!-- phase2.6-enriched -->")) {
    html = html.replace(
      /<!-- phase2\.6-enriched -->/,
      `${block}\n<!-- phase2.6-enriched -->`
    );
  } else {
    html = html.replace(/<\/main>/, `${block}</main>`);
  }
  fs.writeFileSync(indexPath, html, "utf8");
  rep("OK", `/${dir}/ linked to ${entities.length} top entities`);
}

function rebuildSitemap() {
  const AR_MONTHS = {
    يناير: "01", فبراير: "02", مارس: "03", أبريل: "04", مايو: "05", يونيو: "06",
    يوليو: "07", أغسطس: "08", سبتمبر: "09", أكتوبر: "10", نوفمبر: "11", ديسمبر: "12",
  };
  const DEFAULT_LASTMOD = "2026-08";
  const EXCLUDE = new Set(["public/sitemap.xml", "public/404.html", "404"]);

  function walk(dir, out) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      const rel = path.relative(clientDir, full).replace(/\\/g, "/");
      if (EXCLUDE.has(rel)) continue;
      if (ent.isDirectory()) walk(full, out);
      else if (ent.name === "index.html") out.push(full);
    }
  }
  const files = [];
  walk(clientDir, files);

  function slugOf(f) {
    const rel = path.relative(clientDir, f).replace(/\\/g, "/").replace(/\/index\.html$/, "");
    return rel === "" ? "/" : "/" + rel + "/";
  }
  function pageLastmod(html) {
    const m = html.match(/آخر تحديث: ([\u0600-\u06FF]+) (\d{4})/);
    if (!m) return DEFAULT_LASTMOD;
    const mm = AR_MONTHS[m[1]];
    return mm ? `${m[2]}-${mm}` : DEFAULT_LASTMOD;
  }
  const entries = [];
  for (const f of files) {
    const slug = slugOf(f);
    if (EXCLUDE.has(slug.slice(1, -1))) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(clientDir, "public", "sitemap.xml"), xml);
  rep("sitemap", `rebuilt sitemap.xml: ${entries.length} pages`);
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const categories = JSON.parse(fs.readFileSync(path.join(dataDir, "index.json"), "utf8"));

  const allEntities = [];
  // Ahrefs audit 2026-09-06: the same real-world entity can appear in several
  // category directories (e.g. a club listed under both entertainment and
  // fitness), producing near-duplicate pages. The first category keeps the
  // indexable page; later ones canonical to it.
  const entityCanonical = new Map();

  for (const cat of categories) {
    if (SKIP_DIRS.has(cat.slug)) {
      rep("SKIP", `${cat.slug}: already has individual entity pages`);
      continue;
    }
    const data = loadDirectory(cat.slug);
    if (!data || !Array.isArray(data.items)) {
      rep("SKIP", `${cat.slug}: no data/items`);
      continue;
    }
    const dir = cat.slug === "schools-all" ? "schools" : cat.slug;
    const categoryUrl = `${SITE}/${dir}/`;
    const schemaType = SCHEMA_TYPES[cat.slug] || "LocalBusiness";
    const topItems = selectTopItems(data.items, cat.slug);
    if (topItems.length === 0) {
      rep("SKIP", `${cat.slug}: no eligible top items`);
      continue;
    }

    const usedSlugs = new Set();
    const categoryEntities = [];

    for (const item of topItems) {
      const name = item.n || "غير مسماة";
      const address = item.a || "غير منشور";
      const rawPhone = item.p || "";
      const phone = cleanPhone(rawPhone) || "غير منشور";
      const tel = firstTel(rawPhone, item.t);
      const categoryTag = item.c || cat.title;
      const source = item.s || "دليل العبور";
      const slug = resolveSlug(name, usedSlugs, dir);

      const pageUrl = `${SITE}/${dir}/${slug}/`;
      const dedupeKey = name.trim().toLowerCase();
      let canonicalOverride;
      if (entityCanonical.has(dedupeKey)) {
        canonicalOverride = entityCanonical.get(dedupeKey);
      } else {
        entityCanonical.set(dedupeKey, pageUrl);
      }

      const title = `${name} | ${cat.title} العبور`;
      const description = `بيانات منشورة عن ${name} في العبور ضمن دليل ${cat.title}: العنوان، الهاتف، والتصنيف. بدون تقييمات أو مراجعات وهمية.`;

      const entity = {
        chrome,
        slug,
        dir,
        canonicalOverride,
        schemaType,
        category: { name: cat.title, url: categoryUrl },
        title,
        description,
        entity: {
          name,
          address,
          phone,
          rawPhone: rawPhone || undefined,
          tel,
          category: categoryTag,
          source,
        },
      };
      categoryEntities.push(entity);
      allEntities.push(entity);
    }

    // write pages with related listings from same category
    for (let i = 0; i < categoryEntities.length; i++) {
      const e = categoryEntities[i];
      const related = categoryEntities.filter((_, idx) => idx !== i).slice(0, 4);
      const outDir = path.join(clientDir, e.dir, e.slug);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), buildEntity(e, related), "utf8");
      rep("OK", `/${e.dir}/${e.slug}/ created (${e.entity.name})`);
    }

    if (categoryEntities.length) {
      injectCategoryLinks(dir, categoryEntities);
    }
  }

  if (allEntities.length) {
    rebuildSitemap();
  }

  console.log(`=== Phase 14 top entity pages done: ${allEntities.length} pages ===`);
  console.log(report.join("\n"));
}

main();
