/**
 * seo-phase2-districts.mjs
 * المرحلة الثانية (2.2): 12 صفحة حي تحت /districts/<slug>/ بقالب موحّد.
 *
 * يعمل بعد render-static.mjs وseo-phase1-postprocess.mjs وseo-phase2-developers.mjs
 * وقبل بقية سكربتات المرحلة الثانية:
 *   node scripts/render-static.mjs && node scripts/seo-phase1-postprocess.mjs \
 *     && node scripts/seo-phase2-developers.mjs && node scripts/seo-phase2-districts.mjs \
 *     && ... && npx vite build
 *
 * المبادئ الملزمة (الخطة الموحدة):
 *  - مصدر البيانات الوحيد: نص صفحة /districts/ المنشورة بعد render-static.
 *  - ما ليس منشورًا يُترك «غير منشور».
 *  - Place schema بلا إحداثيات مخترعة.
 *  - idempotent: الصفحات تُعاد كتابتها، وحقن الروابط في /districts/ محمي بالفحص.
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
// البيانات — مصدرها الوحيد: صفحة /districts/ المنشورة (مصفوفة القرار الأربعية)
// ---------------------------------------------------------------------------
const DISTRICTS = [
  {
    slug: "district-1",
    name: "الحي الأول",
    display: "1",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي الأول بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-2",
    name: "الحي الثاني",
    display: "2",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي الثاني بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-3",
    name: "الحي الثالث",
    display: "3",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي الثالث بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-4",
    name: "الحي الرابع",
    display: "4",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي الرابع بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-5",
    name: "الحي الخامس",
    display: "5",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي الخامس بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-6",
    name: "الحي السادس",
    display: "6",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي السادس بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-7",
    name: "الحي السابع",
    display: "7",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي السابع بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-8",
    name: "الحي الثامن",
    display: "8",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي الثامن بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-9",
    name: "الحي التاسع",
    display: "9",
    group: "الأحياء المرقّمة 1–9",
    phase: "خدمات قائمة",
    target: "انتقال أسرع وسكن عملي",
    services: "تنوع واسع في المنتج والحالة؛ زيارة الموقع تقود المقارنة أكثر من اسم الحي وحده.",
    note: "البيانات المنشورة عن الحي التاسع بالذات محدودة؛ ما ورد هنا يندرج تحليليًا ضمن النطاق 1–9 المذكور في الصفحة المنشورة.",
  },
  {
    slug: "district-24-bet-el-watan",
    name: "الحي 24 · بيت الوطن",
    display: "24",
    group: "الحي 24 · بيت الوطن",
    phase: "طرح وتوسع",
    target: "باحث عن أرض أو شراء مبكر",
    services: "مناطق متصلة بمحور R2 وتحتاج مراجعة دقيقة للموقع والمرافق وتوقيت التنفيذ.",
    note: null,
  },
  {
    slug: "district-25",
    name: "الحي 25 · الإسكان الفاخر",
    display: "25",
    group: "الحي 25 · الإسكان الفاخر",
    phase: "نمو متسارع",
    target: "سكن طويل الأجل أو استثمار متوسط الأجل",
    services: "قرب نسبي من الدائري الأوسطي وطروحات حديثة؛ افصل بين مرحلة التطوير والخدمات القائمة عند المقارنة.",
    note: "من المشاريع المعلنة في النطاق: مشروع كناري (عوده للتطوير العقاري) — نسبة بناء 25% بحسب البيانات المنشورة.",
  },
  {
    slug: "el-momtaz",
    name: "الحي المتميز",
    display: "م",
    group: "الحي المتميز",
    phase: "قائم نسبيًا",
    target: "سكن هادئ بمساحات أكبر",
    services: "خيارات أكثر نضجًا للباحث عن مجتمع سكني منظم؛ السعر يتغير حسب الشارع والحالة والتشطيب.",
    note: null,
  },
];

const BY_SLUG = Object.fromEntries(DISTRICTS.map((d) => [d.slug, d]));

// ---------------------------------------------------------------------------
// Chrome — استعارة الهيكل من صفحة ناشر مبنية (نفس نمط المرحلة 2.1)
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
  const i = DISTRICTS.findIndex((d) => d.slug === slug);
  return [DISTRICTS[(i + 1) % DISTRICTS.length], DISTRICTS[(i + 2) % DISTRICTS.length]];
}

function dataTable(d) {
  return `<div class="table-wrap"><table><thead><tr><th>البند</th><th>الوصف المنشور</th></tr></thead><tbody>
<tr><td>النطاق</td><td><strong>${d.group}</strong></td></tr>
<tr><td>المرحلة</td><td>${d.phase}</td></tr>
<tr><td>نوع الهدف المناسب</td><td>${d.target}</td></tr>
<tr><td>حالة الخدمات</td><td>${d.services}</td></tr>
</tbody></table></div>`;
}

function selfAssessment() {
  return `<h2>كيف تقيّم هذا الحي بنفسك</h2>
<ol>
<li><strong>الشارع الجاهز:</strong> هل الرصف والإضاءة والأرصفة قائمة في الشارع المحدد، لا عند البوابة فقط؟</li>
<li><strong>المرافق الأساسية:</strong> هل المياه والكهرباء والصرف متصلان بالقطعة أو المبنى المعلن؟</li>
<li><strong>توقيت التنفيذ:</strong> إذا كان الشراء مبكرًا، ما الموعد المكتوب لتسليم المرافق وليس الوحدات فقط؟</li>
<li><strong>نقطة الدخول:</strong> كيف تصل من المحور الرئيسي إلى الشارع المحدد في ساعة الذروة؟</li>
<li><strong>الاستخدامات المجاورة:</strong> ما الذي يُخطط له بجانب الموقع وهل يؤثر في الهدوء أو الاتجاه؟</li>
</ol>`;
}

function districtPage(chrome, d) {
  const url = `${SITE}/districts/${d.slug}/`;
  const title = `${d.name} في العبور الجديدة: الموقع والخدمات والأسعار | دليل العبور`;
  const description = `دليل ${d.name} في العبور الجديدة: المرحلة، حالة الخدمات، نوع الهدف المناسب، وكيف تقيّم الحي بنفسك قبل المعاينة.`;
  const h1 = `${d.name} في العبور الجديدة: الموقع والخدمات والأسعار`;
  const [p1, p2] = peersOf(d.slug);

  const publishedBlock = d.note
    ? `<p>${d.note}</p>`
    : "";

  const missingBlock = `<h2>ما هو غير منشور حاليًا</h2>
<ul>
<li>حدود القطع والشوارع الداخلية داخل ${d.name}.</li>
<li>توزيع المشاريع السكنية حسب الشارع داخل الحي.</li>
<li>الإحداثيات الجغرافية الرسمية للحي.</li>
</ul>
<p>نترك هذه الحقول «غير منشور» بدل اختلاق بيانات؛ يمكنك التحقق منها ميدانيًا أو عبر مصادر هيئة المجتمعات العمرانية الجديدة.</p>`;

  const crossLinks = d.slug === "district-25"
    ? `<p><a href="/prices/">أسعار العقارات في العبور الجديدة</a> · <a href="/developers/">دليل المطورين</a> · <a href="/developers/ouda/">عوده للتطوير العقاري</a> · <a href="/buying-guide/">دليل الشراء خطوة بخطوة</a></p>`
    : `<p><a href="/prices/">أسعار العقارات في العبور الجديدة</a> · <a href="/developers/">دليل المطورين</a> · <a href="/buying-guide/">دليل الشراء خطوة بخطوة</a></p>`;

  const body = `
<h2>ملخص الحي من البيانات المنشورة</h2>
${dataTable(d)}
${publishedBlock}
${selfAssessment()}
${missingBlock}
<h2>صفحات ذات صلة</h2>
<p><a href="/districts/">دليل الأحياء والمناطق</a> · ${crossLinks}</p>
<p>أحياء أخرى بنفس القالب: <a href="/districts/${p1.slug}/">${p1.name}</a> · <a href="/districts/${p2.slug}/">${p2.name}</a></p>`;

  const aside = `<aside class="action-card"><p>دليل الأحياء</p><a class="text-link" href="/districts/">الأحياء والمناطق ↖</a><a class="text-link" href="/prices/">الأسعار ↖</a><a class="text-link" href="/developers/">المطورون ↖</a><a class="text-link" href="/buying-guide/">دليل الشراء ↖</a><a class="text-link" href="/methodology/">منهجية التقييم ↖</a></aside>`;

  const placeNode = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": `${url}#place`,
    "name": d.name,
    "description": d.services,
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
        { "@type": "ListItem", "position": 2, "name": "الأحياء والمناطق", "item": SITE + "/districts/" },
        { "@type": "ListItem", "position": 3, "name": d.name, "item": url },
      ],
    },
    orgNode(),
    placeNode,
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li><li class="sep">›</li><li><a href="/districts/">الأحياء والمناطق</a></li><li class="sep">›</li><li><span aria-current="page">${d.name}</span></li></ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ الأحياء والمناطق</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// حقن روابط الصفحات الجديدة في بطاقات مصفوفة /districts/ (idempotent)
// ---------------------------------------------------------------------------
function linkDistrictsIndex() {
  const file = path.join(clientDir, "districts", "index.html");
  let html = fs.readFileSync(file, "utf8");
  const groupLinks = {
    "الحي 24 · بيت الوطن": ["/districts/district-24-bet-el-watan/"],
    "الحي 25 · الإسكان الفاخر": ["/districts/district-25/"],
    "الحي المتميز": ["/districts/el-momtaz/"],
    "الأحياء المرقّمة": DISTRICTS.filter((d) => d.slug.startsWith("district-") && !d.slug.includes("24") && !d.slug.includes("25"))
      .map((d) => ({ url: `/districts/${d.slug}/`, label: d.name })),
  };

  let n = 0;
  for (const [label, links] of Object.entries(groupLinks)) {
    const marker = `data-district-links="${label}"`;
    if (html.includes(marker)) continue;
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(<article>[^<]*<b>[^<]*</b><small>[^<]*</small><h2>${esc}</h2>.*?)(</article>)`);
    const linkList = `<div class="district-page-links" ${marker}><strong>صفحات الحي:</strong> ${links
      .map((l) => typeof l === "string" ? `<a href="${l}">صفحة الحي</a>` : `<a href="${l.url}">${l.label}</a>`)
      .join(" · ")}</div>`;
    const next = html.replace(re, `$1${linkList}$2`);
    if (next !== html) {
      html = next;
      n++;
      rep("index-links", `/districts/: أُضيفت روابط لـ «${label}»`);
    }
  }

  if (n) {
    fs.writeFileSync(file, html);
  } else {
    rep("index-links", "/districts/: روابط الأحياء موجودة بالفعل");
  }
}

// ---------------------------------------------------------------------------
// إعادة بناء sitemap (نفس منطق المرحلة الأولى)
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
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (شاملة صفحات الأحياء)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  for (const d of DISTRICTS) {
    const file = path.join(clientDir, "districts", d.slug, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, districtPage(chrome, d));
    rep("page", `/districts/${d.slug}/ أُنشئت (${d.name})`);
  }
  linkDistrictsIndex();
  rebuildSitemap();

  console.log("=== تقرير المرحلة الثانية: صفحات الأحياء (2.2) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
