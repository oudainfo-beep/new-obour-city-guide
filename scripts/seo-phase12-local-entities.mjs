/**
 * seo-phase12-local-entities.mjs
 * صفحات كيانات محلية عالية النية: المولات والصيدليات.
 *
 * - /malls/<slug>/        للمولات ومراكز التسوق والسينمات (من بيانات الترفيه)
 * - /pharmacies/<slug>/   للصيدليات (من بيانات الصيدليات)
 * - /malls/               فهرس مركزي للمولات
 *
 * idempotent: تُعاد كتابة الصفحات بالكامل كل build، وحقن الروابط محمي بعلامة.
 * لا أرقام ولا حقائق غير منشورة في البيانات.
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

// -----------------------------------------------------------------------------
// Slugify: Arabic → Latin, safe, unique
// -----------------------------------------------------------------------------
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

const usedSlugs = new Set();
function uniqueSlug(base) {
  let s = transliterate(base).replace(/^-|-$/g, "");
  if (!s) s = "entity";
  if (!usedSlugs.has(s)) {
    usedSlugs.add(s);
    return s;
  }
  let i = 2;
  while (usedSlugs.has(`${s}-${i}`)) i++;
  usedSlugs.add(`${s}-${i}`);
  return `${s}-${i}`;
}

// -----------------------------------------------------------------------------
// Chrome borrowing
// -----------------------------------------------------------------------------
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

function breadcrumb(categoryName, categoryUrl, name, url) {
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

function faqSchema(questions) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };
}

function cleanPhone(p) {
  if (!p) return "غير منشور";
  return p.split(/;\s*/).join(" · ");
}

function districtHint(address) {
  const m = address && address.match(/(الحي\s+\w+|حي\s+\w+|جولف سيتي|المنطقة الصناعية|حي الشباب)/);
  return m ? m[1] : "";
}

// -----------------------------------------------------------------------------
// Entity page builders
// -----------------------------------------------------------------------------
function buildEntityPage(chrome, e) {
  const url = `${SITE}/${e.dir}/${e.slug}/`;
  const schemas = [
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: e.h1,
      url,
      description: e.description,
      inLanguage: "ar-EG",
      datePublished: "2026-08",
      dateModified: "2026-08",
      publisher: { "@id": SITE + "/#org" },
    },
    {
      "@context": "https://schema.org",
      "@type": e.schemaType,
      name: e.entity.name,
      address: { "@type": "PostalAddress", addressLocality: e.entity.address },
      telephone: e.entity.phone === "غير منشور" ? undefined : e.entity.phone,
      url: url,
    },
    breadcrumb(e.category.name, e.category.url, e.h1, url),
    faqSchema(e.faq),
  ].filter(Boolean);

  const head = buildHead(chrome.head, { title: e.title, description: e.description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/${e.dir}/">${e.category.name}</a><span>/</span><span>${e.h1}</span></div></nav>`;
  const tableRows = [
    ["الاسم", e.entity.name],
    ["العنوان", e.entity.address || "غير منشور"],
    ["الهاتف", e.entity.phone],
    ["التصنيف", e.entity.category],
    ["المصدر", e.entity.source],
  ];
  const table = `<div class="table-wrap"><table><tbody>${tableRows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</tbody></table></div>`;
  const faqHtml = `<div class="faq-block">${e.faq.map(q => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("")}</div>`;
  const main = `<main id="content"><section class="wrap"><h1>${e.h1}</h1><div class="lead"><p>${e.intro}</p></div><h2>البيانات المنشورة</h2>${table}<p><small>المصدر: ${e.entity.source} — تحقق مباشرة قبل الزيارة.</small></p><h2>أسئلة شائعة</h2>${faqHtml}<div class="action-card"><p>هل لديك تصحيح موثّق؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

// -----------------------------------------------------------------------------
// Load data
// -----------------------------------------------------------------------------
function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
}

function normalizeEntity(item, dir, categoryName, categoryUrl, schemaType) {
  const name = item.n || item.name || "غير مسماة";
  const address = item.a || item.address || "غير منشور";
  const phone = cleanPhone(item.p || item.phone);
  const source = item.s || item.source || "دليل العبور";
  const cat = item.c || item.category || categoryName;
  const slug = uniqueSlug(name);
  const district = districtHint(address);
  const h1 = `${name} — العبور`;
  const title = `${name} | العبور — عنوان وهاتف`;
  const description = `بيانات منشورة عن ${name} في العبور: العنوان، الهاتف، والمصدر. بدون تلميع أو تقييمات وهمية.`;
  const intro = `${name} هو أحد الكيانات المدرجة في دليل العبور والعبور الجديدة. العنوان والهاتف المسجلان في الجدول أدناه مأخوذان من المصدر المنشور. نوصي بالاتصال قبل الزيارة للتأكد من العنوان ومواعيد العمل، خاصة أن البيانات التجارية تتغير باستمرار.`;
  const faq = [
    { q: `أين يقع ${name}؟`, a: address === "غير منشور" ? "لم يُنشر عنوان محدد في المصادر المتاحة. تحقق مباشرة قبل الزيارة." : `العنوان المنشور: ${address}.` },
    { q: `ما رقم هاتف ${name}؟`, a: phone === "غير منشور" ? "لم يُنشر رقم هاتف موثوق في المصادر المتاحة." : `الهاتف المنشور: ${phone}.` },
    { q: `هل البيانات موثوقة؟`, a: `الدليل ينقل فقط ما هو منشور في المصدر المذكور (${source}). ننصحك بالتحقق بنفسك قبل أي قرار.` },
  ];
  return {
    slug,
    dir,
    schemaType,
    category: { name: categoryName, url: categoryUrl },
    title,
    h1,
    description,
    intro,
    entity: { name, address, phone, category: cat, source },
    faq,
    district,
  };
}

function readMalls() {
  const data = loadJson("entertainment.json");
  const cats = new Set(["مولات", "مراكز تجارية", "سينمات"]);
  return data.items.filter((it) => cats.has(it.c)).map((it) =>
    normalizeEntity(it, "malls", "المولات والمراكز التجارية", SITE + "/malls/", "ShoppingCenter")
  );
}

function readPharmacies() {
  const data = loadJson("pharmacies.json");
  return data.items.map((it) =>
    normalizeEntity(it, "pharmacies", "الصيدليات", SITE + "/pharmacies/", "Pharmacy")
  );
}

// -----------------------------------------------------------------------------
// /malls/ index
// -----------------------------------------------------------------------------
function buildMallsIndex(chrome, malls) {
  const url = SITE + "/malls/";
  const title = "مولات العبور والعبور الجديدة | دليل المولات والمراكز التجارية";
  const description = "فهرس المولات والمراكز التجارية والسينمات في العبور والعبور الجديدة: عناوين، هواتف، وصفحات كيانات فردية من دليل العبور.";
  const schemas = [
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url,
      description,
      inLanguage: "ar-EG",
      publisher: { "@id": SITE + "/#org" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "مولات العبور والعبور الجديدة",
      numberOfItems: malls.length,
      itemListElement: malls.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "ShoppingCenter", name: m.entity.name, url: `${SITE}/malls/${m.slug}/` },
      })),
    },
    breadcrumb("الدليل", SITE + "/directory/", "المولات والمراكز التجارية", url),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/directory/">الدليل</a><span>/</span><span>المولات والمراكز التجارية</span></div></nav>`;
  const list = `<div class="dir-list">${malls.map(m => `<article class="dir-item"><h3><a href="/malls/${m.slug}/">${m.entity.name}</a></h3><p>${m.entity.address}</p></article>`).join("")}</div>`;
  const main = `<main id="content"><section class="wrap paper section"><h1>مولات العبور والعبور الجديدة</h1><p class="lead">دليل المولات والمراكز التجارية والسينمات المسجلة في بيانات الدليل. كل صفحة تتضمن العنوان والهاتف المنشورين (إن وُجدت) مع المصدر. لا يقدم الدليل تقييمات أو توصيات؛ الهدف هو توفير بيانات موثوقة يمكنك التحقق منها.</p>${list}</section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

// -----------------------------------------------------------------------------
// Idempotent index link injection
// -----------------------------------------------------------------------------
function injectIndexLinks(indexPath, marker, blockHtml) {
  if (!fs.existsSync(indexPath)) {
    rep("WARN", `${indexPath} not found`);
    return;
  }
  let html = fs.readFileSync(indexPath, "utf8");
  if (html.includes(marker)) {
    rep("SKIP", `${path.basename(path.dirname(indexPath))}/ already linked`);
    return;
  }
  html = html.replace(
    /<!-- phase2\.6-enriched -->/,
    `${marker}\n<section class="paper section wrap" aria-label="صفحات كيانات فردية">${blockHtml}</section>\n<!-- phase2.6-enriched -->`
  );
  fs.writeFileSync(indexPath, html, "utf8");
  rep("OK", `${path.basename(path.dirname(indexPath))}/ linked to entity pages`);
}

function mallsIndexBlock(malls) {
  const links = malls.slice(0, 24).map(m => `<a href="/malls/${m.slug}/">${m.entity.name}</a>`).join(" · ");
  return `<h2>صفحات مولات ومراكز تجارية فردية</h2><p>${links}</p><p><a class="button" href="/malls/">عرض كل المولات ↖</a></p>`;
}

function pharmaciesIndexBlock(pharmacies) {
  const links = pharmacies.slice(0, 30).map(p => `<a href="/pharmacies/${p.slug}/">${p.entity.name}</a>`).join(" · ");
  return `<h2>صفحات صيدليات فردية</h2><p>${links}</p>`;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const malls = readMalls();
  const pharmacies = readPharmacies();

  rep("INFO", `malls entities: ${malls.length}`);
  rep("INFO", `pharmacies entities: ${pharmacies.length}`);

  // Malls index
  const mallsIndexDir = path.join(clientDir, "malls");
  fs.mkdirSync(mallsIndexDir, { recursive: true });
  fs.writeFileSync(path.join(mallsIndexDir, "index.html"), buildMallsIndex(chrome, malls), "utf8");
  rep("OK", "/malls/ index created");

  // Entity pages
  for (const e of malls) {
    const outDir = path.join(clientDir, e.dir, e.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), buildEntityPage(chrome, e), "utf8");
    rep("OK", `/malls/${e.slug}/ created`);
  }
  for (const e of pharmacies) {
    const outDir = path.join(clientDir, e.dir, e.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), buildEntityPage(chrome, e), "utf8");
    rep("OK", `/pharmacies/${e.slug}/ created`);
  }

  // Link injection
  injectIndexLinks(path.join(clientDir, "shopping", "index.html"), "<!-- phase12-malls-shopping -->", mallsIndexBlock(malls));
  injectIndexLinks(path.join(clientDir, "entertainment", "index.html"), "<!-- phase12-malls-entertainment -->", mallsIndexBlock(malls));
  injectIndexLinks(path.join(clientDir, "pharmacies", "index.html"), "<!-- phase12-pharmacies-index -->", pharmaciesIndexBlock(pharmacies));

  console.log("Phase 12 local entity pages done");
  console.log(report.join("\n"));
}

main();
