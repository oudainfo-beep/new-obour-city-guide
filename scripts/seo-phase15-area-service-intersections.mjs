/**
 * seo-phase15-area-service-intersections.mjs
 * صفحات تقاطع الحي + الخدمة: /districts/<district>/<category>/
 *
 * - idempotent: لا يكرّر حقن الروابط ولا يكتب فوق صفحة غير منشأة به.
 * - ينشئ فقط عند وجود 3 مدخلات منشورة تطابق الحي في العنوان/المنطقة.
 * - لا يُختلق مدخلات ولا تقييمات/مراجعات وهمية.
 * - يعيد بناء sitemap.xml في النهاية.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data", "directories");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";
const MIN_ENTRIES = 3;
const PAGE_MARKER = "<!-- phase15-intersection-page -->";
const LINKS_MARKER = "<!-- phase15-intersection-links -->";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// -----------------------------------------------------------------------------
// Districts
// -----------------------------------------------------------------------------
const DISTRICTS = [
  {
    slug: "district-1",
    name: "الحي الأول",
    keywords: [
      { text: "الحي الأول", prio: 10 },
      { text: "حي اول", prio: 9 },
      { text: "الحي 1", prio: 8 },
      { text: "حي 1", prio: 8 },
      { text: "district 1", prio: 5 },
      { text: "1st district", prio: 5 },
    ],
  },
  {
    slug: "district-2",
    name: "الحي الثاني",
    keywords: [
      { text: "الحي الثاني", prio: 10 },
      { text: "حي تاني", prio: 9 },
      { text: "الحي 2", prio: 8 },
      { text: "حي 2", prio: 8 },
      { text: "district 2", prio: 5 },
      { text: "2nd district", prio: 5 },
    ],
  },
  {
    slug: "district-3",
    name: "الحي الثالث",
    keywords: [
      { text: "الحي الثالث", prio: 10 },
      { text: "حي تالت", prio: 9 },
      { text: "الحي 3", prio: 8 },
      { text: "حي 3", prio: 8 },
      { text: "district 3", prio: 5 },
      { text: "3rd district", prio: 5 },
    ],
  },
  {
    slug: "district-4",
    name: "الحي الرابع",
    keywords: [
      { text: "الحي الرابع", prio: 10 },
      { text: "حي رابع", prio: 9 },
      { text: "الحي 4", prio: 8 },
      { text: "حي 4", prio: 8 },
      { text: "district 4", prio: 5 },
      { text: "4th district", prio: 5 },
    ],
  },
  {
    slug: "district-5",
    name: "الحي الخامس",
    keywords: [
      { text: "الحي الخامس", prio: 10 },
      { text: "حي خامس", prio: 9 },
      { text: "الحي 5", prio: 8 },
      { text: "حي 5", prio: 8 },
      { text: "district 5", prio: 5 },
      { text: "5th district", prio: 5 },
    ],
  },
  {
    slug: "district-6",
    name: "الحي السادس",
    keywords: [
      { text: "الحي السادس", prio: 10 },
      { text: "حي سادس", prio: 9 },
      { text: "الحي 6", prio: 8 },
      { text: "حي 6", prio: 8 },
      { text: "district 6", prio: 5 },
      { text: "6th district", prio: 5 },
    ],
  },
  {
    slug: "district-7",
    name: "الحي السابع",
    keywords: [
      { text: "الحي السابع", prio: 10 },
      { text: "حي سابع", prio: 9 },
      { text: "الحي 7", prio: 8 },
      { text: "حي 7", prio: 8 },
      { text: "district 7", prio: 5 },
      { text: "7th district", prio: 5 },
    ],
  },
  {
    slug: "district-8",
    name: "الحي الثامن",
    keywords: [
      { text: "الحي الثامن", prio: 10 },
      { text: "حي تامن", prio: 9 },
      { text: "الحي 8", prio: 8 },
      { text: "حي 8", prio: 8 },
      { text: "district 8", prio: 5 },
      { text: "8th district", prio: 5 },
    ],
  },
  {
    slug: "district-9",
    name: "الحي التاسع",
    keywords: [
      { text: "الحي التاسع", prio: 10 },
      { text: "حي تاسع", prio: 9 },
      { text: "الحي 9", prio: 8 },
      { text: "حي 9", prio: 8 },
      { text: "district 9", prio: 5 },
      { text: "9th district", prio: 5 },
    ],
  },
  {
    slug: "district-24-bet-el-watan",
    name: "الحي 24 · بيت الوطن",
    keywords: [
      { text: "بيت الوطن", prio: 10 },
      { text: "حي 24", prio: 8 },
      { text: "district 24", prio: 5 },
      { text: "24th district", prio: 5 },
    ],
  },
  {
    slug: "district-25",
    name: "الحي 25 · الإسكان الفاخر",
    keywords: [
      { text: "الإسكان الفاخر", prio: 10 },
      { text: "حي 25", prio: 8 },
      { text: "district 25", prio: 5 },
      { text: "25th district", prio: 5 },
    ],
  },
  {
    slug: "el-momtaz",
    name: "الحي المتميز",
    keywords: [
      { text: "الحي المتميز", prio: 10 },
      { text: "المتميز", prio: 8 },
      { text: "el momtaz", prio: 5 },
      { text: "momtaz", prio: 4 },
    ],
  },
];

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------
const CATEGORIES = [
  {
    slug: "restaurants",
    title: "المطاعم والكافيهات",
    one: "مطعم أو كافيه",
    source: "restaurants",
    entityDir: "restaurants",
    schemaType: "Restaurant",
    filter: () => true,
  },
  {
    slug: "cafes",
    title: "الكافيهات ومحلات القهوة",
    one: "كافيه",
    source: "restaurants",
    entityDir: "restaurants",
    schemaType: "CafeOrCoffeeShop",
    filter: (it) => {
      const c = normText(it.c || "");
      return (
        c.includes("كافيه") ||
        c.includes("قهوه") ||
        c.includes("شاي") ||
        c.includes("محمص") ||
        c.includes("coffee") ||
        c.includes("cafe")
      );
    },
  },
  {
    slug: "clinics",
    title: "العيادات والمراكز الطبية",
    one: "عيادة",
    source: "clinics",
    entityDir: "clinics",
    schemaType: "MedicalBusiness",
    filter: () => true,
  },
  {
    slug: "hospitals",
    title: "المستشفيات والمراكز الطبية",
    one: "مستشفى",
    source: "hospitals",
    entityDir: "hospitals",
    schemaType: "Hospital",
    filter: () => true,
  },
  {
    slug: "pharmacies",
    title: "الصيدليات",
    one: "صيدلية",
    source: "pharmacies",
    entityDir: "pharmacies",
    schemaType: "Pharmacy",
    filter: () => true,
  },
  {
    slug: "banks",
    title: "البنوك والصرافات",
    one: "بنك أو ماكينة",
    source: "banks",
    entityDir: "banks",
    schemaType: "BankOrCreditUnion",
    filter: () => true,
  },
  {
    slug: "supermarkets",
    title: "السوبرماركت والهايبر ماركت",
    one: "سوبرماركت",
    source: "shopping",
    entityDir: "shopping",
    schemaType: "GroceryStore",
    filter: (it) => {
      const c = normText(it.c || "");
      return (
        c.includes("سوبرماركت") ||
        c.includes("هايبر") ||
        c.includes("supermarket") ||
        c.includes("hyper")
      );
    },
  },
  {
    slug: "home-services",
    title: "الخدمات المنزلية",
    one: "خدمة منزلية",
    source: "home-services",
    entityDir: "home-services",
    schemaType: "HomeAndConstructionBusiness",
    filter: () => true,
  },
  {
    slug: "professional-services",
    title: "الخدمات المهنية",
    one: "خدمة مهنية",
    source: "professional-services",
    entityDir: "professional-services",
    schemaType: "ProfessionalService",
    filter: () => true,
  },
  {
    slug: "automotive",
    title: "خدمات السيارات",
    one: "خدمة سيارات",
    source: "automotive",
    entityDir: "automotive",
    schemaType: "AutomotiveBusiness",
    filter: () => true,
  },
  {
    slug: "fitness",
    title: "اللياقة والتجميل",
    one: "مركز لياقة أو تجميل",
    source: "fitness",
    entityDir: "fitness",
    schemaType: "HealthAndBeautyBusiness",
    filter: () => true,
  },
  {
    slug: "entertainment",
    title: "الترفيه والأنشطة",
    one: "مكان ترفيهي",
    source: "entertainment",
    entityDir: "entertainment",
    schemaType: "EntertainmentBusiness",
    filter: () => true,
  },
  {
    slug: "nurseries",
    title: "الحضانات والمراكز التعليمية",
    one: "حضانة",
    source: "nurseries",
    entityDir: "nurseries",
    schemaType: "ChildCare",
    filter: () => true,
  },
  {
    slug: "shopping",
    title: "التسوق والمحلات",
    one: "محل",
    source: "shopping",
    entityDir: "shopping",
    schemaType: "Store",
    filter: (it) => {
      const c = normText(it.c || "");
      return !(
        c.includes("سوبرماركت") ||
        c.includes("هايبر") ||
        c.includes("supermarket") ||
        c.includes("hyper")
      );
    },
  },
];

// -----------------------------------------------------------------------------
// Helpers
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

function normText(str) {
  return String(str)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[\-_\s,\.\/]+/g, " ")
    .trim();
}

function cleanPhone(p) {
  if (!p) return "";
  return p.split(/;\s*/).join(" · ");
}

function firstTel(p, t) {
  if (t) return t.replace(/\D/g, "");
  if (!p) return "";
  const first = p.split(/[;,]/)[0];
  return first.replace(/[\s\-]/g, "").replace(/[^0-9+]/g, "");
}

function mapUrl(name, address) {
  const q = encodeURIComponent(`${name} ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function haystack(item) {
  return normText(`${item.a || ""} ${item.c || ""} ${item.n || ""}`);
}

function matchDistrict(item) {
  const text = haystack(item);
  let best = null;
  for (const d of DISTRICTS) {
    for (const kw of d.keywords) {
      const nkw = normText(kw.text);
      let hit = false;
      if (/\d/.test(nkw)) {
        const re = new RegExp(
          "(?:^|[^0-9])" + nkw.replace(/\s+/g, "\\s+") + "(?:[^0-9]|$)"
        );
        hit = re.test(text);
      } else {
        hit = text.includes(nkw);
      }
      if (!hit) continue;
      if (
        !best ||
        kw.prio > best.prio ||
        (kw.prio === best.prio && nkw.length > best.nkw.length)
      ) {
        best = { district: d, prio: kw.prio, nkw };
      }
    }
  }
  return best?.district || null;
}

function dedupeEntries(entries) {
  const seen = new Set();
  return entries.filter((it) => {
    const key = `${normText(it.n || "")}|${normText(it.a || "")}|${normText(it.p || "")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  h = h.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${description}">`
  );
  h = h.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${url}">`
  );
  h = h.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${title}">`
  );
  h = h.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${description}">`
  );
  h = h.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${url}">`
  );
  const ld = schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

function findEntityPage(item, entityDir) {
  if (!item.n) return null;
  const base = transliterate(item.n).replace(/^-|-$/g, "");
  if (!base) return null;
  const file = path.join(clientDir, entityDir, base, "index.html");
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes("<!-- phase14-entity-page -->")) return null;
  return `/${entityDir}/${base}/`;
}

function localBusinessSchema(item, cat, entityUrl) {
  const name = item.n || "غير مسماة";
  const address = item.a || "غير منشور";
  const schema = {
    "@context": "https://schema.org",
    "@type": cat.schemaType,
    name,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: "العبور",
      addressRegion: "القليوبية",
      addressCountry: "EG",
    },
  };
  if (item.p && item.p !== "غير منشور") schema.telephone = item.p;
  if (entityUrl) schema.url = SITE + entityUrl;
  return schema;
}

function buildListingTable(entries, cat) {
  const rows = entries
    .map((it, idx) => {
      const name = escapeHtml(it.n || "غير مسماة");
      const address = escapeHtml(it.a || "غير منشور");
      const phoneDisplay = cleanPhone(it.p) || "غير منشور";
      const tel = firstTel(it.p, it.t);
      const phoneCell = tel
        ? `<a href="tel:${tel}" class="dir-call">☎ ${phoneDisplay}</a>`
        : `☎ ${phoneDisplay}`;
      const entityUrl = findEntityPage(it, cat.entityDir);
      const nameCell = entityUrl
        ? `<a href="${entityUrl}">${name}</a>`
        : name;
      const mapLink =
        it.a && it.a !== "غير منشور"
          ? `<a href="${mapUrl(it.n || "", it.a)}" target="_blank" rel="nofollow noopener noreferrer">الخريطة ↗</a>`
          : "غير متاح";
      return `<tr><td>${idx + 1}</td><td>${nameCell}</td><td>${address}</td><td>${phoneCell}</td><td>${mapLink}</td></tr>`;
    })
    .join("");
  return `<div class="table-wrap"><table><thead><tr><th>#</th><th>الاسم</th><th>العنوان</th><th>الهاتف</th><th>الخريطة</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function buildPage(chrome, district, cat, entries) {
  const url = `${SITE}/districts/${district.slug}/${cat.slug}/`;
  const title = `${cat.title} ${district.name} في العبور | دليل العبور`;
  const description = `قائمة ${cat.title} في ${district.name} من العناوين والأرقام المنشورة في دليل العبور. يتم تحديثها من البيانات المنشورة دون تقييمات أو مراجعات وهمية.`;
  const h1 = `${cat.title} ${district.name} في العبور`;

  const itemList = entries.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: localBusinessSchema(
      it,
      cat,
      findEntityPage(it, cat.entityDir)
    ),
  }));

  const schemas = [
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: h1,
      url,
      description,
      inLanguage: "ar-EG",
      datePublished: DEFAULT_LASTMOD,
      dateModified: DEFAULT_LASTMOD,
      publisher: { "@id": SITE + "/#org" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "الأحياء والمناطق", item: SITE + "/districts/" },
        { "@type": "ListItem", position: 3, name: district.name, item: `${SITE}/districts/${district.slug}/` },
        { "@type": "ListItem", position: 4, name: cat.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${cat.title} ${district.name}`,
      itemListElement: itemList,
    },
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas }).replace(
    /<\/head>/,
    `${PAGE_MARKER}\n</head>`
  );

  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/districts/">الأحياء والمناطق</a></li><li class="sep">›</li><li><a href="/districts/${district.slug}/">${escapeHtml(district.name)}</a></li><li class="sep">›</li><li><span aria-current="page">${escapeHtml(cat.title)}</span></li></ol></div></nav>`;

  const listing = buildListingTable(entries, cat);

  const body = `<main id="content"><section class="wrap paper section">${PAGE_MARKER}<h1>${escapeHtml(h1)}</h1><p class="lead">هذه الصفحة تعرض ${cat.title} المسجّلة في <strong>${escapeHtml(district.name)}</strong> وفق العناوين المنشورة في دليل العبور. تم العثور على ${entries.length} ${cat.one} تطابق المنطقة؛ القائمة لا تتضمن تقييمات أو مراجعات وهمية.</p>${listing}<p><a href="/districts/${district.slug}/">← العودة إلى ${escapeHtml(district.name)}</a> · <a href="/${cat.slug}/">← تصفّح كل ${cat.title}</a></p></section></main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${body}${chrome.footer}</body></html>`;
}

function injectDistrictLinks(district, categoriesWithPages) {
  const file = path.join(clientDir, "districts", district.slug, "index.html");
  if (!fs.existsSync(file)) {
    rep("WARN", `/${district.slug}/ district page not found`);
    return;
  }
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(LINKS_MARKER)) {
    rep("SKIP", `/${district.slug}/ already has intersection links`);
    return;
  }
  categoriesWithPages.sort((a, b) => a.title.localeCompare(b.title, "ar"));
  const links = categoriesWithPages
    .map(
      (cat) =>
        `<a class="text-link" href="/districts/${district.slug}/${cat.slug}/">${escapeHtml(cat.title)}</a>`
    )
    .join(" · ");
  const block = `<section class="paper section wrap" aria-label="خدمات الحي">${LINKS_MARKER}<h2>خدمات ${escapeHtml(district.name)}</h2><p>${links}</p></section>`;
  html = html.replace(/<\/main>/, `${block}\n</main>`);
  fs.writeFileSync(file, html, "utf8");
  rep("OK", `/${district.slug}/ linked to ${categoriesWithPages.length} intersection pages`);
}

function rebuildSitemap() {
  const AR_MONTHS = {
    يناير: "01", فبراير: "02", مارس: "03", أبريل: "04", مايو: "05", يونيو: "06",
    يوليو: "07", أغسطس: "08", سبتمبر: "09", أكتوبر: "10", نوفمبر: "11", ديسمبر: "12",
  };
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
  const buckets = new Map();

  for (const cat of CATEGORIES) {
    const file = path.join(dataDir, `${cat.source}.json`);
    if (!fs.existsSync(file)) {
      rep("SKIP", `${cat.slug}: source ${cat.source}.json not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const items = (data.items || []).filter(cat.filter);
    for (const item of items) {
      const district = matchDistrict(item);
      if (!district) continue;
      const key = `${district.slug}|${cat.slug}`;
      if (!buckets.has(key)) buckets.set(key, { district, cat, entries: [] });
      buckets.get(key).entries.push(item);
    }
  }

  const districtCreated = new Map();
  let created = 0;

  for (const { district, cat, entries: rawEntries } of buckets.values()) {
    const entries = dedupeEntries(rawEntries);
    if (entries.length < MIN_ENTRIES) continue;

    const outDir = path.join(clientDir, "districts", district.slug, cat.slug);
    const outFile = path.join(outDir, "index.html");

    if (fs.existsSync(outFile) && !fs.readFileSync(outFile, "utf8").includes(PAGE_MARKER)) {
      rep("SKIP", `/districts/${district.slug}/${cat.slug}/ exists and is not a phase15 page`);
      continue;
    }

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, buildPage(chrome, district, cat, entries), "utf8");
    created++;
    rep("OK", `/districts/${district.slug}/${cat.slug}/ created (${entries.length} entries)`);

    if (!districtCreated.has(district.slug)) districtCreated.set(district.slug, { district, cats: [] });
    districtCreated.get(district.slug).cats.push(cat);
  }

  for (const { district, cats } of districtCreated.values()) {
    injectDistrictLinks(district, cats);
  }

  if (created > 0) {
    rebuildSitemap();
  }

  console.log(`=== Phase 15 area+service intersection pages done: ${created} pages ===`);
  console.log(report.join("\n"));
}

main();
