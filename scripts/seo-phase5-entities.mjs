/**
 * seo-phase5-entities.mjs
 * المرحلة الخامسة (5.3): صفحة /entities/ المركزية لفهرس كل كيانات الدليل.
 *
 * تنشئ:
 *   - client/entities/index.html
 *
 * المبادئ:
 *   - idempotent: تُعاد كتابة الصفحة بالكامل في كل تشغيل.
 *   - لا معلومات مُختلعة: الأسماء والأوصاف مأخوذة من الصفحات/البيانات المنشورة.
 *   - schema: CollectionPage + ItemList.
 *   - لا يُعاد بناء sitemap هنا؛ هذا مهمة السكربت الأخير في السلسلة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// ---------------------------------------------------------------------------
// استعارة الهيكل من about-us
// ---------------------------------------------------------------------------
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
    "name": "دليل العبور والعبور الجديدة",
    "url": SITE + "/",
    "logo": "https://obourguide.com/brand/logo.png",
    "foundingDate": "2026",
    "publishingPrinciples": SITE + "/editorial-policy/",
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

function pageShell(chrome, { title, description, url, h1, tag, breadcrumbItems, body, extraSchemas = [] }) {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": h1,
      "url": url,
      "inLanguage": "ar-EG",
      "datePublished": DEFAULT_LASTMOD,
      "dateModified": DEFAULT_LASTMOD,
      "publisher": { "@id": SITE + "/#org" },
      "description": description,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((it, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": it.name,
        "item": it.item,
      })),
    },
    orgNode(),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas: [...schemas, ...extraSchemas] });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${breadcrumbItems
    .map((it, i) => {
      if (i === breadcrumbItems.length - 1) {
        return `<li><span aria-current="page">${it.name}</span></li>`;
      }
      return `<li><a href="${it.item}">${it.name}</a></li><li class="sep">›</li>`;
    })
    .join("")}</ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap">${body}</div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// جمع الكيانات من المجلدات والملفات
// ---------------------------------------------------------------------------
function listSlugs(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const idx = path.join(dir, e.name, "index.html");
    if (fs.existsSync(idx)) out.push({ slug: "/" + path.relative(clientDir, dir) + "/" + e.name + "/", file: idx });
  }
  return out;
}

function extractTitle(file) {
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!m) return path.basename(path.dirname(file));
  let title = m[1].replace(/\|.*$/, "").replace(/دليل العبور/, "").trim();
  return title;
}

function extractH1(file) {
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!m) return path.basename(path.dirname(file));
  return m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function readJsonEntities(file, typeField, nameField) {
  const p = path.join(dataDir, file);
  if (!fs.existsSync(p)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(data)) return [];
    return data.map((item, i) => ({
      name: item[nameField] || item[typeField] || `بند ${i + 1}`,
      description: item.description || item.notes || "بيانات منشورة في مركز البيانات.",
    }));
  } catch {
    return [];
  }
}

function entitiesList(items) {
  return items.map((it) => `<li><a href="${it.slug}">${it.name}</a><span>— ${it.description}</span></li>`).join("");
}

function buildItemListSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "url": SITE + it.slug,
    })),
  };
}

// ---------------------------------------------------------------------------
function entitiesPage(chrome) {
  const url = `${SITE}/entities/`;
  const title = "فهرس كيانات دليل العبور | دليل العبور";
  const description = "فهرس مركزي لكل الكيانات في دليل العبور: المدينة، الأحياء، المشروعات، المطورون، المدارس، الأدوات، والتقارير — بروابط داخلية وأوصاف من البيانات المنشورة.";
  const h1 = "فهرس كيانات دليل العبور";

  // City
  const city = [{ slug: "/about/", name: "مدينة العبور الجديدة", description: "موقع، مساحة، والفرق بين العبور الجديدة والعبور القائمة من بيانات منشورة." }];

  // Districts
  const districts = listSlugs(path.join(clientDir, "districts")).map((it) => ({
    slug: it.slug,
    name: extractH1(it.file),
    description: "ملخص الحي من البيانات المنشورة، مع مرحلة الخدمات ونوع الهدف المناسب.",
  }));

  // Compounds
  const compounds = listSlugs(path.join(clientDir, "compounds")).map((it) => ({
    slug: it.slug,
    name: extractH1(it.file),
    description: "البيانات المنشورة للمشروع: المطوّر، الحي، الحالة، والمصدر.",
  }));

  // Developers
  const developers = listSlugs(path.join(clientDir, "developers")).map((it) => ({
    slug: it.slug,
    name: extractH1(it.file),
    description: "درجات المطوّر في المعايير الخمسة من البيانات المنشورة.",
  }));

  // Schools
  const schools = listSlugs(path.join(clientDir, "schools")).map((it) => ({
    slug: it.slug,
    name: extractH1(it.file),
    description: "بيانات المدرسة المنشورة في دليل المدارس.",
  }));

  // Tools
  const tools = [
    { slug: "/tools/mortgage-affordability/", name: "حاسبة قسط التمويل العقاري", description: "حاسبة تقديرية لأقصى قسط شهري بناءً على الدخل والمصروفات." },
    { slug: "/tools/commute-cost/", name: "حاسبة تكلفة المواصلات", description: "حاسبة تقديرية لمقارنة تكلفة السيارة والمواصلات العامة." },
    { slug: "/tools/school-fees/", name: "حاسبة المصروفات الدراسية", description: "حاسبة تقديرية لإجمالي تكلفة الدراسة على مدى سنوات." },
  ];

  // Reports
  const reports = [
    { slug: "/price-report-q3-2026/", name: "تقرير أسعار العقارات Q3 2026", description: "لقطة سعرية ربع سنوية من بيانات منشورة." },
    { slug: "/price-report/", name: "أرشيف تقارير الأسعار", description: "أرشيف تقارير الأسعار الربع سنوية المنشورة." },
  ];

  const allItems = [...city, ...districts, ...compounds, ...developers, ...schools, ...tools, ...reports];

  const body = `
<p>هذا الفهرس يربط كل كيانات الدليل بروابط داخلية. لا توجد هنا معلومات جديدة؛ الأوصاف مأخوذة من الصفحات والبيانات المنشورة.</p>

<h2>المدينة</h2>
<ul class="entity-list">${entitiesList(city)}</ul>

<h2>الأحياء (${districts.length})</h2>
<ul class="entity-list">${entitiesList(districts)}</ul>

<h2>المشروعات (${compounds.length})</h2>
<ul class="entity-list">${entitiesList(compounds)}</ul>

<h2>المطوّرون (${developers.length})</h2>
<ul class="entity-list">${entitiesList(developers)}</ul>

<h2>المدارس (${schools.length})</h2>
<ul class="entity-list">${entitiesList(schools)}</ul>

<h2>الأدوات الحسابية (${tools.length})</h2>
<ul class="entity-list">${entitiesList(tools)}</ul>

<h2>التقارير (${reports.length})</h2>
<ul class="entity-list">${entitiesList(reports)}</ul>
`;

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": h1,
      "url": url,
      "inLanguage": "ar-EG",
      "description": description,
      "mainEntity": { "@id": SITE + "/entities/#itemlist" },
    },
    {
      "@context": "https://schema.org",
      "@id": SITE + "/entities/#itemlist",
      ...buildItemListSchema(allItems),
    },
  ];

  return pageShell(chrome, {
    title,
    description,
    url,
    h1,
    tag: "فهرس الكيانات",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "فهرس الكيانات", item: url },
    ],
    body,
    extraSchemas: schemas,
  });
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const dir = path.join(clientDir, "entities");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), entitiesPage(chrome));
  rep("page", "أُنشئت /entities/");

  console.log("=== تقرير المرحلة الخامسة: فهرس الكيانات (5.3) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
