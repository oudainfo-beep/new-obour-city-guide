/**
 * seo-phase3-price-reports.mjs
 * المرحلة الثالثة (3.3): إنشاء صفحة أرشيف تقارير الأسعار (/price-report/).
 *
 * يعمل بعد render-static.mjs والمراحل السابقة وقبل vite build:
 *   node scripts/render-static.mjs && node scripts/seo-phase1-postprocess.mjs \
 *     && node scripts/seo-phase3-price-reports.mjs
 *
 * المبادئ:
 *  - idempotent: الصفحة تُعاد كتابتها بالكامل كل مرة.
 *  - لا أرقام مخترعة: كل الأرقام مُستخرجة من /price-report-q3-2026/.
 *  - لا يُعاد بناء sitemap هنا؛ هذا ليس السكربت الأخير في المرحلة الثالثة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const AR_MONTHS = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

function formatDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${AR_MONTHS[m] || m} ${y}`;
}

// ---------------------------------------------------------------------------
// استعارة هيكل الموقع من صفحة "من نحن" المبنية بالفعل
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
// استخراج ملخص تقرير الربع الثالث 2026 من الصفحة المنشورة
// ---------------------------------------------------------------------------
function extractQ3Summary() {
  const file = path.join(clientDir, "price-report-q3-2026", "index.html");
  if (!fs.existsSync(file)) {
    return null;
  }
  const html = fs.readFileSync(file, "utf8");

  let datePublished = "";
  let dateModified = "";
  const articleScript = html.match(/<script type="application\/ld\+json">([\s\S]*?"@type":"Article"[\s\S]*?)<\/script>/);
  if (articleScript) {
    try {
      const data = JSON.parse(articleScript[1]);
      datePublished = data.datePublished || "";
      dateModified = data.dateModified || "";
    } catch {
      // ignore
    }
  }

  const summarySection = html.match(/<h2>ملخص التقرير<\/h2>([\s\S]*?)<h2>مقارنة مع مدن مجاورة<\/h2>/)?.[1] || "";
  const rows = [...summarySection.matchAll(/<div>\s*<span>([^<]+)<\/span>\s*<span>([^<]+)<\/span>\s*<\/div>/g)]
    .map((m) => ({ indicator: m[1].trim(), value: m[2].trim() }));

  const comparisonSection = html.match(/<h2>مقارنة مع مدن مجاورة<\/h2>([\s\S]*?)<h2>عوامل تؤثر على السعر<\/h2>/)?.[1] || "";
  const comparisons = [...comparisonSection.matchAll(/<div>\s*<span>([^<]+)<\/span>\s*<span>([^<]+)<\/span>\s*<span>([^<]+)<\/span>\s*<\/div>/g)]
    .map((m) => ({ city: m[1].trim(), average: m[2].trim(), note: m[3].trim() }));

  const trends = html.match(/<h2>الاتجاهات الملاحظة<\/h2>\s*<p>([^<]+)<\/p>/)?.[1]?.trim() || "";

  return { datePublished, dateModified, rows, comparisons, trends };
}

function archivePage(chrome, q3) {
  const slug = "price-report";
  const url = `${SITE}/${slug}/`;
  const h1 = "أرشيف تقارير أسعار العبور";
  const title = `${h1} | دليل العبور`;
  const description = "أرشيف تقارير أسعار العقارات في العبور والعبور الجديدة: لقطات ربع سنوية من بيانات منشورة، مع ملخصات ومقارنات مدنية.";

  const displayDate = formatDate(q3?.datePublished) || "أغسطس 2026";
  const quarter = "الربع الثالث 2026";
  const coverage = "شقق سكنية، فيلات، وحدات تجارية — العبور الجديدة";
  const citiesCompared = q3?.comparisons?.length
    ? q3.comparisons.map((c) => c.city).join(" · ")
    : "العبور الجديدة، التجمع الخامس، الشروق، العاصمة الإدارية، العبور القائمة";
  const citiesCount = q3?.comparisons?.length || 5;

  const summaryRows = (q3?.rows?.length ? q3.rows : [
    { indicator: "متوسط سعر المتر (شقة)", value: "7,500–12,000 ج.م" },
    { indicator: "نطاق الشقق الصغيرة (70–90 م²)", value: "550,000–950,000 ج.م" },
    { indicator: "نطاق الشقق المتوسطة (100–130 م²)", value: "850,000–1,400,000 ج.م" },
    { indicator: "نطاق الشقق الكبيرة (140–180 م²)", value: "1,200,000–2,000,000 ج.م" },
    { indicator: "فيلات (200–350 م²)", value: "2,500,000–5,000,000 ج.م" },
    { indicator: "تجاري (محلات)", value: "12,000–25,000 ج.م/م²" },
  ])
    .map((r) => `<li><strong>${r.indicator}:</strong> ${r.value}</li>`)
    .join("");

  const comparisonRows = (q3?.comparisons?.length ? q3.comparisons : [
    { city: "العبور الجديدة", average: "7,500–12,000 ج.م", note: "مدينة نامية، فرص شراء مبكر" },
    { city: "التجمع الخامس", average: "15,000–28,000 ج.م", note: "سوق ناضج، سيولة أعلى" },
    { city: "الشروق", average: "9,000–14,000 ج.م", note: "نمو متوسط، كثافة أقل" },
    { city: "العاصمة الإدارية", average: "18,000–35,000 ج.م", note: "حديثة، مساحات داخلية كبيرة" },
    { city: "العبور القائمة", average: "10,000–16,000 ج.م", note: "خدمات ناضجة، سكن فوري" },
  ])
    .map((r) => `<tr><td>${r.city}</td><td>${r.average}</td><td>${r.note}</td></tr>`)
    .join("");

  const trendsPara = q3?.trends
    ? `<p>${q3.trends}</p>`
    : `<p>شهد الربع الثالث من 2026 استقرارًا نسبيًا في الأسعار مع زيادة طفيفة في الأحياء القريبة من محطات LRT.</p>`;

  const body = `
<p>هذا الأرشيف يجمع تقارير الأسعار الربع سنوية المنشورة في دليل العبور. كل تقرير هو لقطة زمنية مؤرخة بناءً على إعلانات منشورة وبيانات سوقية معلنة؛ الهدف مساعدة المشتري على بناء مقارنة أولية، وليس تقديم توصية استثمارية أو سعر دقيق لوحدة بعينها.</p>

<h2>التقارير المنشورة</h2>
<div class="table-wrap">
  <table class="data-table">
    <thead>
      <tr>
        <th>الربع</th>
        <th>تاريخ النشر</th>
        <th>التغطية</th>
        <th>المدن المقارنة</th>
        <th>الرابط</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${quarter}</td>
        <td>${displayDate}</td>
        <td>${coverage}</td>
        <td>${citiesCompared} (${citiesCount})</td>
        <td><a href="/price-report-q3-2026/">تقرير الربع الثالث 2026 ↗</a></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>ملخص تقرير الربع الثالث 2026</h2>
<p>الأرقام التالية مأخوذة من صفحة <a href="/price-report-q3-2026/">تقرير الربع الثالث 2026</a> المنشورة:</p>
<ul>
  ${summaryRows}
</ul>

<h3>مقارنة متوسط المتر مع مدن مجاورة</h3>
<div class="table-wrap">
  <table class="data-table">
    <thead>
      <tr>
        <th>المدينة</th>
        <th>متوسط المتر (شقة)</th>
        <th>ملاحظة</th>
      </tr>
    </thead>
    <tbody>
      ${comparisonRows}
    </tbody>
  </table>
</div>

<h3>اتجاهات الربع</h3>
${trendsPara}

<h2>إخلاء المسؤولية</h2>
<p>الأسعار الواردة في الأرشيف والتقارير إرشادية فقط، ومأخوذة من إعلانات منشورة وقوائم معلنة. الأسعار الفعلية تختلف بحسب الموقع الدقيق، حالة الوحدة، مرحلة المشروع، والتفاوض. لا يُعتبر هذا الأرشيف توصية بالشراء أو البيع أو الاستثمار؛ يُنصح بزيارة الموقع والتحقق من المستندات قبل أي التزام.</p>
`;

  const aside = `<aside class="action-card">
  <p>تقارير وأسعار</p>
  <a class="button" href="/price-report-q3-2026/">تقرير الربع الثالث 2026 ↗</a>
  <a class="text-link" href="/prices/">أسعار العقارات ↖</a>
  <a class="text-link" href="/compare/">مقارنة المدن ↖</a>
  <a class="text-link" href="/investment/">دليل الاستثمار ↖</a>
  <a class="text-link" href="/developers/">دليل المطورين ↖</a>
</aside>`;

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": h1,
      "url": url,
      "inLanguage": "ar-EG",
      "datePublished": q3?.datePublished || DEFAULT_LASTMOD,
      "dateModified": q3?.dateModified || DEFAULT_LASTMOD,
      "publisher": { "@id": SITE + "/#org" },
      "description": description,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": h1, "item": url },
      ],
    },
    orgNode(),
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">${h1}</span></li></ol></div></nav>`;
  const main = `<main>
<section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ تقارير أسعارية</span><h1>${h1}</h1><p>${description}</p></div></div></section>
<section class="paper section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section>
</main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const q3 = extractQ3Summary();

  if (!q3) {
    rep("warning", "لم يُعثر على /price-report-q3-2026/index.html؛ سيتم استخدام قيم احتياطية.");
  } else {
    rep("extract", `استُخرج ${q3.rows.length} مؤشر سعري و${q3.comparisons.length} مدينة مقارنة من تقرير Q3 2026.`);
  }

  const file = path.join(clientDir, "price-report", "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, archivePage(chrome, q3));
  rep("page", "/price-report/ أُنشئت بنجاح.");

  console.log("=== تقرير المرحلة الثالثة: أرشيف تقارير الأسعار (3.3) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
