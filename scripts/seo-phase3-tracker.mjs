/**
 * seo-phase3-tracker.mjs
 * المرحلة الثالثة (3.2): صفحة متابعة أحداث العبور الجديدة.
 *
 * ينشئ:
 *   - data/tracker.json (مصفوفة فارغة — idempotent، لا يمسح البيانات إذا وُجدت)
 *   - data/tracker.schema.md (مخطط الحقول)
 *   - client/tracker/index.html (صفحة المتابعة)
 *   - يعيد بناء sitemap.xml لتشمل /tracker/
 *
 * المبادئ:
 *  - لا أحداث مُختلقة: الجدول يبدأ فارغًا ويُملأ لاحقًا من المصادر الرسمية.
 *  - كل رابط خارجي nofollow.
 *  - RTL بالعربية.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data");
const publicDir = path.join(clientDir, "public");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// ---------------------------------------------------------------------------
// بيانات ثابتة
// ---------------------------------------------------------------------------
const GOVERNMENT_SOURCES = [
  { label: "هيئة المجتمعات العمرانية الجديدة — مخطط مدينة العبور الجديدة", url: "https://lands.nuca.gov.eg/ar/ViewCity.aspx?ID=16" },
  { label: "الهيئة القومية للأنفاق — القطار الكهربائي الخفيف", url: "http://www.nat.gov.eg/LocationActivity.aspx?id=2085" },
  { label: "المقاولون العرب — مسار LRT ومحطاته", url: "https://www.arabcont.com/english/project-628" },
];

// ---------------------------------------------------------------------------
// قوالب مشتركة
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

// ---------------------------------------------------------------------------
// إنشاء ملفات البيانات
// ---------------------------------------------------------------------------
function ensureDataFiles() {
  fs.mkdirSync(dataDir, { recursive: true });

  const trackerPath = path.join(dataDir, "tracker.json");
  if (!fs.existsSync(trackerPath)) {
    fs.writeFileSync(trackerPath, "[]\n");
    rep("data", "أُنشئ data/tracker.json كمصفوفة فارغة");
  } else {
    rep("data", "data/tracker.json موجود مسبقًا — لم يُمسح");
  }

  const schemaPath = path.join(dataDir, "tracker.schema.md");
  if (!fs.existsSync(schemaPath)) {
    fs.writeFileSync(schemaPath, trackerSchemaMd());
    rep("data", "أُنشئ data/tracker.schema.md");
  } else {
    rep("data", "data/tracker.schema.md موجود مسبقًا");
  }
}

function trackerSchemaMd() {
  return `# مخطط بيانات متابعة أحداث العبور الجديدة

ملف \`data/tracker.json\` عبارة عن مصفوفة JSON (\`[]\`) تحتوي على أحداث مُوثَّقة من مصادر رسمية أو حكومية. لا يُدرج فيها أي حدث بدون رابط مصدر قابل للفحص.

## الحقول

| الحقل | النوع | الوصف |
|-------|------|-------|
| \`date\` | string (YYYY-MM-DD) | تاريخ الإعلان أو التنفيذ الفعلي للحدث. |
| \`category\` | string | إحدى: \`infrastructure\` (بنية تحتية)، \`project\` (مشروع عقاري/تنموي)، \`government\` (قرار/خدمة حكومية)، \`service\` (خدمة عامة). |
| \`title\` | string | نص موجز يصف الحدث (لا دعاية ولا تسويق). |
| \`source_url\` | string | رابط المصدر الرسمي أو الحكومي المنشور. |
| \`source_label\` | string | اسم الجهة أو الموقع المصدر. |
| \`status\` | string | \`confirmed\` (مؤكد من مصدر رسمي) أو \`pending\` (مُعلن ولم يكتمل التحقق). |
| \`notes\` | string (اختياري) | ملاحظات تحريرية قصيرة: حدود المعلومة أو ما يحتاج متابعة. |

## قواعد الإضافة

1. لا حدث بدون \`source_url\` صالح.
2. المصدر يفضَّل أن يكون جهة حكومية أو رسمية (NUCA، NAT، المقاولون العرب، بيانات رسمية منشورة).
3. لا تُدرج إعلانات تسويقية أو بيانات من وسيطة فقط.
4. \`status: confirmed\` تُستخدم فقط عندما يُثبت تنفيذ الحدث من مصدر رسمي.
`;
}

// ---------------------------------------------------------------------------
// بناء صفحة /tracker/
// ---------------------------------------------------------------------------
function trackerPage(chrome) {
  const url = `${SITE}/tracker/`;
  const title = "متابعة أحداث العبور الجديدة: مصادر رسمية فقط | دليل العبور";
  const description = "تتبّع الأحداث المؤكدة في العبور الجديدة من مصادر حكومية ورسمية منشورة. لا أحداث مُختلقة — الجدول يبدأ فارغًا ويُملأ بالمصادر.";
  const h1 = "متابعة أحداث العبور الجديدة";

  const sourcesList = GOVERNMENT_SOURCES
    .map((s) => `<li><a href="${s.url}" target="_blank" rel="nofollow noopener">${s.label} ↗</a></li>`)
    .join("");

  const body = `
<h2>كيف تُقرأ هذه الصفحة؟</h2>
<p>الجدول أدناه يضم فقط الأحداث المُوثَّقة بمصدر رسمي أو حكومي منشور يمكنك فحصه بنفسك. لا ندرج إعلانات تسويقية، ولا بيانات من وسيطة وحدها، ولا تواريخ غير مؤكدة. الهدف ليس ملء الفراغ، بل تمييز ما يُمكن الاعتماد عليه عند تقييم مرحلة المدينة.</p>

<h2>سجل الأحداث</h2>
<div class="tracker-table data-table" role="region" aria-labelledby="events-caption" tabindex="0">
  <div aria-hidden="true"><span>التاريخ</span><span>الفئة</span><span>الحدث</span><span>المصدر</span><span>الحالة</span></div>
  <div class="tracker-empty">لا توجد أحداث مُدرجة حاليًا. الجدول يُملأ من المصادر الرسمية فور توفر بيانات مؤكدة.</div>
</div>

<div class="action-card">
  <p>هل لديك حدث مُوثَّق؟</p>
  <p>أرسل لنا حدثًا مُعلنًا من مصدر رسمي عبر <a href="/contact/">صفحة التواصل</a> مع ذكر رابط المصدر. لا تُرسل إعلانات تسويقية أو بيانات بدون مصدر.</p>
  <a class="button" href="/contact/">اقترح حدثًا موثقًا ↖</a>
</div>

<h2>مصادر حكومية رسمية</h2>
<p>المصادر الأساسية التي تُراجع لإضافة أي حدث:</p>
<ul>
  ${sourcesList}
</ul>
<p><small>جميع الروابط الخارجية تُفتح في نافذة جديدة وتحمل <code>rel="nofollow noopener"</code> بشكل افتراضي.</small></p>
`;

  const aside = `<aside class="action-card"><p>متابعة العبور الجديدة</p><a class="text-link" href="/about/">عن المدينة ↖</a><a class="text-link" href="/districts/">الأحياء والمناطق ↖</a><a class="text-link" href="/transport/">المواصلات والوصول ↖</a><a class="text-link" href="/lrt-obour/">محطة العبور LRT ↖</a><a class="text-link" href="/future-developments/">التطورات المستقبلية ↖</a><a class="text-link" href="/contact/">تواصل معنا ↖</a></aside>`;

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
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "متابعة الأحداث", "item": url },
      ],
    },
    orgNode(),
  ];

  let head = buildHead(chrome.head, { title, description, url, schemas });
  const trackerStyle = `<style>.tracker-table.data-table>div{grid-template-columns:repeat(5,1fr)}.tracker-empty{grid-column:1/-1;text-align:center;color:#607067;padding:1.5rem .82rem}</style>`;
  head = head.replace("</head>", `${trackerStyle}</head>`);

  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">متابعة الأحداث</span></li></ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ متابعة موضوعية</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// إعادة بناء sitemap.xml (نفس تنسيق render-static.mjs)
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

function sitemapPriorityAndFreq(slug) {
  const isHome = slug === "/";
  const isPrices = slug === "/prices/";
  const isDevelopers = slug === "/developers/";
  const isTracker = slug === "/tracker/";
  const isSchool = slug.startsWith("/schools/");
  const isCompound = slug.startsWith("/compounds/");
  const isDistrict = slug.startsWith("/districts/");
  const isDirectory = [
    "/pharmacies/", "/hospitals/", "/clinics/", "/schools/", "/nurseries/",
    "/restaurants/", "/shopping/", "/home-services/", "/professional-services/",
    "/fitness/", "/automotive/", "/banks/", "/real-estate-offices/",
    "/entertainment/", "/government-services/", "/logistics/", "/hotels/",
  ].includes(slug);

  if (isHome) return { priority: "1.0", changefreq: "weekly" };
  if (isPrices || isDevelopers) return { priority: "0.9", changefreq: "monthly" };
  if (isTracker) return { priority: "0.7", changefreq: "monthly" };
  if (isDirectory) return { priority: "0.8", changefreq: "weekly" };
  if (isCompound || isDistrict) return { priority: "0.8", changefreq: "monthly" };
  if (isSchool) return { priority: "0.6", changefreq: "monthly" };
  return { priority: "0.7", changefreq: "monthly" };
}

function rebuildSitemap() {
  const entries = [];
  for (const f of listPageFiles()) {
    const slug = slugOf(f);
    if (SITEMAP_EXCLUDE.has(slug)) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")), ...sitemapPriorityAndFreq(slug) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (شاملة /tracker/)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  ensureDataFiles();

  const trackerDir = path.join(clientDir, "tracker");
  fs.mkdirSync(trackerDir, { recursive: true });
  fs.writeFileSync(path.join(trackerDir, "index.html"), trackerPage(chrome));
  rep("page", "أُنشئت /tracker/index.html");

  rebuildSitemap();

  console.log("=== تقرير المرحلة الثالثة: متابعة أحداث العبور الجديدة (3.2) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
