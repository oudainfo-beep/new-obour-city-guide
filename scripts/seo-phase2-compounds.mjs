/**
 * seo-phase2-compounds.mjs
 * المرحلة الثانية (2.3): فهرس /compounds/ + صفحات موحّدة للمشروعات المذكورة في الصفحات المنشورة.
 *
 * يعمل ضمن سلسلة البناء بعد render-static.mjs وseo-phase2-developers.mjs وseo-phase2-districts.mjs.
 *
 * المبادئ الملزمة (الخطة الموحدة):
 *  - مصدر البيانات: الصفحات المنشورة (/developers/ و/prices/ و/investment/).
 *  - لا حقائق غير منشورة؛ ما لا مصدر له يُوسم «غير منشور».
 *  - لا AggregateRating ولا Review schema.
 *  - المشروع → المطوّر → الحي في كل صفحة.
 *  - كناري واحد من الجميع بنفس الحقول حرفيًا.
 *  - idempotent: الصفحات تُعاد كتابتها، وحقن الروابط في /compounds/ محمي بالفحص.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// ---------------------------------------------------------------------------
// البيانات — مصدرها الصفحات المنشورة فقط
// ---------------------------------------------------------------------------
const COMPOUNDS = [
  {
    slug: "canary",
    name: "كناري",
    developer: { slug: "ouda", name: "عوده للتطوير العقاري" },
    district: { slug: "district-25", name: "الحي 25 · الإسكان الفاخر" },
    status: "تحت التنفيذ / طرح معلن",
    source: "موقع عوده للتطوير العقاري — مراجعة أغسطس 2026",
    published: [
      "يقع في الحي 25 (الإسكان الفاخر) — النطاق المنشور كـ«نمو متسارع».",
      "نسبة بناء لا تتجاوز 25% بحسب البيانات المنشورة.",
      "المشروع على 15 فدانًا بارتفاع أرضي + 4 طوابق.",
      "المطور ينشر قائمة أسعار وأنظمة سداد وموعد تسليم.",
    ],
  },
  {
    slug: "solana",
    name: "سولانا",
    developer: { slug: "ouda", name: "عوده للتطوير العقاري" },
    district: null,
    status: "مشروع معلن",
    source: "موقع عوده للتطوير العقاري — مراجعة أغسطس 2026",
    published: [
      "مشروع مفهرس ضمن مشروعات عوده المنشورة على موقع الشركة.",
    ],
  },
  {
    slug: "sundus",
    name: "سندس",
    developer: { slug: "ouda", name: "عوده للتطوير العقاري" },
    district: null,
    status: "مشروع معلن",
    source: "موقع عوده للتطوير العقاري — مراجعة أغسطس 2026",
    published: [
      "مشروع مفهرس ضمن مشروعات عوده المنشورة على موقع الشركة.",
    ],
  },
  {
    slug: "safari",
    name: "سفاري",
    developer: { slug: "ouda", name: "عوده للتطوير العقاري" },
    district: null,
    status: "مشروع معلن",
    source: "موقع عوده للتطوير العقاري — مراجعة أغسطس 2026",
    published: [
      "مشروع مفهرس ضمن مشروعات عوده المنشورة على موقع الشركة.",
    ],
  },
  {
    slug: "vaily-residence",
    name: "فيالي ريزيدنس",
    developer: { slug: "mrs", name: "MRS Development" },
    district: { slug: null, name: "العبور الجديدة" },
    status: "مشروع معلن",
    source: "موقع MRS Development الرسمي المنشور",
    published: [
      "مشروع سكني معلن في العبور الجديدة.",
      "المطور مدرج في صفحة 'قيد الاستكمال' بدليل المطورين لقلة البيانات المنشورة الكافية للمقارنة.",
    ],
  },
  {
    slug: "the-mars",
    name: "ذا مارس",
    developer: { slug: "metwadee", name: "متواضع جروب" },
    district: null,
    status: "مشروع معلن",
    source: "موقع متواضع جروب الرسمي المنشور",
    published: [
      "مشروع تجاري/إداري معلن ضمن محفظة متواضع جروب.",
    ],
  },
  {
    slug: "jeddah-mall",
    name: "مول جدة",
    developer: { slug: "metwadee", name: "متواضع جروب" },
    district: null,
    status: "مشروع معلن",
    source: "موقع متواضع جروب الرسمي المنشور",
    published: [
      "مشروع تجاري معلن ضمن محفظة متواضع جروب.",
    ],
  },
  {
    slug: "obour-mall",
    name: "اوبو مول",
    developer: { slug: "metwadee", name: "متواضع جروب" },
    district: null,
    status: "مشروع معلن",
    source: "موقع متواضع جروب الرسمي المنشور",
    published: [
      "مشروع تجاري معلن ضمن محفظة متواضع جروب.",
    ],
  },
  {
    slug: "town-ten",
    name: "Town Ten",
    developer: { slug: "mazaya", name: "مزايا للتطوير العقاري" },
    district: { slug: null, name: "عرابي الجديدة / العبور الجديدة" },
    status: "مشروع معلن",
    source: "موقع مزايا للتطوير العقاري الرسمي المنشور",
    published: [
      "مشروع معلن في منطقة عرابي الجديدة / العبور الجديدة.",
    ],
  },
  {
    slug: "glory-gardens",
    name: "جلوري جاردنز",
    developer: { slug: "eagle", name: "إيجل جروب للتطوير العقاري" },
    district: { slug: null, name: "العبور الجديدة" },
    status: "مشروع معلن",
    source: "مصادر صحفية ووسيطة — لا يوجد موقع رسمي ظاهر",
    published: [
      "مشروع سكني معلن في العبور الجديدة.",
      "المطور مدرج في صفحة 'قيد الاستكمال' لعدم توفر موقع رسمي ظاهر.",
    ],
  },
  {
    slug: "o-kardia",
    name: "أو كارديا",
    developer: { slug: "foryou", name: "فور يو للتطوير العقاري" },
    district: { slug: "district-8", name: "أمام الحي الثامن" },
    status: "مشروع معلن",
    source: "مصادر صحفية ووسيطة — لا يوجد موقع رسمي ظاهر",
    published: [
      "موقع المشروع معلن بأنه أمام الحي الثامن.",
      "المطور مدرج في صفحة 'قيد الاستكمال' لعدم توفر موقع رسمي ظاهر.",
    ],
  },
  {
    slug: "river-park",
    name: "River Park",
    developer: { slug: "alraei", name: "الراعي للتطوير العقاري" },
    district: { slug: null, name: "الجولدن سكوير" },
    status: "مشروع معلن",
    source: "مصادر صحفية ووسيطة — لا يوجد موقع رسمي ظاهر",
    published: [
      "مشروع معلن في منطقة الجولدن سكوير.",
      "المطور مدرج في صفحة 'قيد الاستكمال' لعدم توفر موقع رسمي ظاهر.",
    ],
  },
  {
    slug: "golf-city",
    name: "جولف سيتي",
    city: "العبور",
    developer: { slug: "ebdaa", name: "إبداع للتطوير العقاري" },
    district: { slug: null, name: "مدخل العبور — طريق مصر إسماعيلية" },
    status: "وحدات جاهزة للتسليم",
    source: "الموقع الرسمي لجولف سيتي + بيانات الشراكة المنشورة — مراجعة أغسطس 2026",
    published: [
      "شراكة معلنة بين المهندسون المصريون وإبداع للتطوير العقاري، إحدى شركات عودة للتطوير العقاري.",
      "موقع مدخل العبور على طريق مصر إسماعيلية؛ وحدات جاهزة للتسليم.",
      "أنواع الوحدات المنشورة: شقق، دوبلكس، بنتهاوس، تاون هاوس، توين هاوس، وفيلات.",
      "مول جولف سيتي وسينما وخدمات تجارية قائمة داخل النطاق.",
    ],
  },
];

const BY_SLUG = Object.fromEntries(COMPOUNDS.map((c) => [c.slug, c]));

// ---------------------------------------------------------------------------
// Chrome — نفس نمط المرحلة 2.1
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

function peersOf(slug) {
  const i = COMPOUNDS.findIndex((c) => c.slug === slug);
  return [COMPOUNDS[(i + 1) % COMPOUNDS.length], COMPOUNDS[(i + 2) % COMPOUNDS.length]];
}

function dataTable(c) {
  const districtCell = c.district
    ? (c.district.slug ? `<a href="/districts/${c.district.slug}/">${c.district.name}</a>` : c.district.name)
    : "غير منشور";
  return `<div class="table-wrap"><table><thead><tr><th>البند</th><th>البيانات المنشورة</th></tr></thead><tbody>
<tr><td>المشروع</td><td><strong>${c.name}</strong></td></tr>
<tr><td>المطوّر</td><td><a href="/developers/${c.developer.slug}/">${c.developer.name}</a></td></tr>
<tr><td>الحي / الموقع</td><td>${districtCell}</td></tr>
<tr><td>الحالة</td><td>${c.status}</td></tr>
<tr><td>المصدر</td><td>${c.source}</td></tr>
</tbody></table></div>`;
}

function compoundPage(chrome, c) {
  const url = `${SITE}/compounds/${c.slug}/`;
  const city = c.city || "العبور الجديدة";
  const title = `${c.name} في ${city}: البيانات المنشورة | دليل العبور`;
  const description = `صفحة ${c.name} في ${city}: ما نشره المطور، ما هو ناقص، وكيف تتحقق بنفسك قبل أي قرار.`;
  const h1 = `${c.name} في ${city}`;
  const [p1, p2] = peersOf(c.slug);

  const publishedList = `<ul>${c.published.map((x) => `<li>${x}</li>`).join("")}</ul>`;

  const missingList = `<h2>ما هو ناقص عند الجميع</h2>
<ul>
<li>العقد النموذجي ومواصفات التشطيب التفصيلية.</li>
<li>رسوم الإدارة والصيانة بعد التسليم بشكل مكتوب.</li>
<li>الإحداثيات الجغرافية الرسمية للمشروع.</li>
${c.district ? "" : "<li>الحي / الموقع الدقيق داخل العبور الجديدة.</li>"}
</ul>`;

  const districtLink = c.district && c.district.slug
    ? `<a href="/districts/${c.district.slug}/">${c.district.name}</a>`
    : (c.district ? c.district.name : "دليل الأحياء");

  const body = `
<h2>ملخص المشروع من البيانات المنشورة</h2>
${dataTable(c)}
<h2>ما هو منشور وقابل للفحص</h2>
${publishedList}
${missingList}
<h2>كيف تتحقق بنفسك قبل الحجز</h2>
<ol>
<li>اطلب موقع القطعة على المخطط الرسمي للمدينة.</li>
<li>قارن نسبة البناء والارتفاعات المعلنة بالمخطط المعتمد (إن وُجدت).</li>
<li>اسأل عن جهة الإدارة بعد التسليم وسجلها المنشور.</li>
<li>اطلب عقدًا نموذجيًا ومواصفات تشطيب مكتوبة قبل الدفع.</li>
<li>زُر الموقع في ساعة الذروة وتأكد من حالة الطريق والخدمات المحيطة.</li>
</ol>
<h2>صفحات ذات صلة</h2>
<p><a href="/compounds/">دليل المشروعات</a> · <a href="/developers/${c.developer.slug}/">${c.developer.name}</a> · ${districtLink} · <a href="/prices/">أسعار العقارات</a> · <a href="/buying-guide/">دليل الشراء</a></p>
<p>مشروعات أخرى بنفس القالب: <a href="/compounds/${p1.slug}/">${p1.name}</a> · <a href="/compounds/${p2.slug}/">${p2.name}</a></p>`;

  const aside = `<aside class="action-card"><p>دليل المشروعات</p><a class="text-link" href="/compounds/">كل المشروعات ↖</a><a class="text-link" href="/developers/${c.developer.slug}/">المطوّر ↖</a><a class="text-link" href="/prices/">الأسعار ↖</a><a class="text-link" href="/buying-guide/">دليل الشراء ↖</a><a class="text-link" href="/districts/">الأحياء ↖</a></aside>`;

  const placeNode = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": `${url}#place`,
    "name": c.name,
    "description": `مشروع عقاري معلن في العبور الجديدة — ${c.status}.`,
    "containedInPlace": {
      "@type": "City",
      "name": "مدينة العبور الجديدة",
    },
  };

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
      "about": { "@id": `${url}#place` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "دليل المشروعات", "item": SITE + "/compounds/" },
        { "@type": "ListItem", "position": 3, "name": c.name, "item": url },
      ],
    },
    orgNode(),
    placeNode,
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li><li class="sep">›</li><li><a href="/compounds/">دليل المشروعات</a></li><li class="sep">›</li><li><span aria-current="page">${c.name}</span></li></ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ دليل المشروعات</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// فهرس /compounds/
// ---------------------------------------------------------------------------
function indexPage(chrome) {
  const url = `${SITE}/compounds/`;
  const title = "دليل مشروعات العبور الجديدة: بيانات منشورة ومصادر | دليل العبور";
  const description = "فهرس المشروعات السكنية والتجارية المعلنة في العبور الجديدة مع المطوّر والحي والحالة والمصدر. لا تقديرات ولا درجات وهمية.";
  const h1 = "دليل مشروعات العبور الجديدة";

  const rows = COMPOUNDS.map((c) => {
    const district = c.district ? c.district.name : "غير منشور";
    return `<tr><td><a href="/compounds/${c.slug}/"><strong>${c.name}</strong></a></td><td><a href="/developers/${c.developer.slug}/">${c.developer.name}</a></td><td>${district}</td><td>${c.status}</td><td>${c.source}</td></tr>`;
  }).join("");

  const body = `
<h2>جدول المشروعات المنشورة</h2>
<div class="table-wrap"><table><thead><tr><th>المشروع</th><th>المطوّر</th><th>الحي / الموقع</th><th>الحالة</th><th>المصدر</th></tr></thead><tbody>${rows}</tbody></table></div>
<p><small>الجدول يجمع ما هو معلن فقط. أي مشروع ليس له مصدر منشور يُدرج «غير منشور» حتى يصل تصحيح موثّق.</small></p>
<h2>كيف تقرأ هذا الدليل</h2>
<p>كل صفحة مشروع تربط ثلاثة عقدة: المشروع → المطوّر → الحي. لا نُضيف درجات أو تقييمات وهمية؛ نعرض البيانات المنشورة ونترك ما هو ناقص بوضوح. قبل أي قرار، راجع صفحة المطوّر وصفحة الحي وزُر الموقع ميدانيًا.</p>
<h2>موضوعات ذات صلة</h2>
<p><a href="/developers/">دليل المطورين</a> · <a href="/districts/">دليل الأحياء</a> · <a href="/prices/">أسعار العقارات</a> · <a href="/investment/">الاستثمار العقاري</a> · <a href="/buying-guide/">دليل الشراء</a></p>`;

  const aside = `<aside class="action-card"><p>مسارات ذات صلة</p><a class="text-link" href="/developers/">المطورون ↖</a><a class="text-link" href="/districts/">الأحياء ↖</a><a class="text-link" href="/prices/">الأسعار ↖</a><a class="text-link" href="/buying-guide/">دليل الشراء ↖</a></aside>`;

  const itemList = COMPOUNDS.map((c, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": c.name,
    "item": `${SITE}/compounds/${c.slug}/`,
  }));

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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "دليل المشروعات", "item": url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "مشروعات العبور الجديدة المنشورة",
      "itemListElement": itemList,
    },
    orgNode(),
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">دليل المشروعات</span></li></ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ دليل المشروعات</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// إعادة بناء sitemap
// ---------------------------------------------------------------------------
const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "أبريل": "04", "ابريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};
const SITEMAP_EXCLUDE = new Set(["/404/", "/search/", "/dining-guide/", "/shopping-guide/", "/health-guide/"]);

function listPageFiles() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "index.html") out.push(full);
    }
  };
  walk(clientDir);
  return out;
}
function slugOf(file) {
  const rel = path.relative(clientDir, file).replace(/\\/g, "/");
  return rel === "index.html" ? "/" : "/" + rel.replace(/\/index\.html$/, "") + "/";
}
function pageLastmod(html) {
  const m = html.match(/آخر تحديث: ([\u0600-\u06FF]+) (\d{4})/);
  if (!m) return DEFAULT_LASTMOD;
  const mm = AR_MONTHS[m[1]];
  return mm ? `${m[2]}-${mm}` : DEFAULT_LASTMOD;
}
function rebuildSitemap() {
  const entries = [];
  for (const f of listPageFiles()) {
    const slug = slugOf(f);
    if (SITEMAP_EXCLUDE.has(slug)) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(clientDir, "public", "sitemap.xml"), xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (شاملة صفحات المشروعات)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  fs.mkdirSync(path.join(clientDir, "compounds"), { recursive: true });
  fs.writeFileSync(path.join(clientDir, "compounds", "index.html"), indexPage(chrome));
  rep("index", "/compounds/ أُنشئت");

  for (const c of COMPOUNDS) {
    const file = path.join(clientDir, "compounds", c.slug, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, compoundPage(chrome, c));
    rep("page", `/compounds/${c.slug}/ أُنشئت (${c.name})`);
  }

  rebuildSitemap();

  console.log("=== تقرير المرحلة الثانية: صفحات المشروعات (2.3) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
