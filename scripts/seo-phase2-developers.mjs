/**
 * seo-phase2-developers.mjs
 * المرحلة الثانية (2.1): صفحات بروفايل للمطورين الـ13 بقالب موحّد صارم.
 *
 * يعمل بعد render-static.mjs وبعد seo-phase1-postprocess.mjs وقبل vite build:
 *   node scripts/render-static.mjs && node scripts/seo-phase1-postprocess.mjs \
 *     && node scripts/seo-phase2-developers.mjs && npx vite build
 *
 * المبادئ الملزمة (الخطة الموحدة v2 — محور 2.1 وPhase 4):
 *  - التماثل هو الحماية: نفس القالب والحقول ونوع الرابط لكل مطور.
 *  - لا حقائق مخترعة: كل حقل مأخوذ من صفحة /developers/ المنشورة أو موسوم «غير منشور».
 *  - رابط خارجي واحد nofollow لكل مطور (الموقع الرسمي إن وُجد).
 *  - لا AggregateRating ولا Review schema (مرفوضة بإجماع المراجعات).
 *
 * السكربت idempotent: الصفحات تُعاد كتابتها بالكامل كل مرة، وحقن الروابط في
 * /developers/ محمي بفحص وجود الرابط.
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
// البيانات — مصدرها الوحيد: صفحة /developers/ المنشورة (مراجعة أغسطس 2026)
// المعايير الخمسة بالترتيب: تسليم · إدارة · ملاءة · شفافية · كثافة
// ---------------------------------------------------------------------------
const CRITERIA = ["سابقة الأعمال المسلّمة", "إدارة ما بعد التسليم", "الملاءة المالية", "شفافية التعاقد", "البناء والكثافة"];
const COMMON_GAP = "لا ينشر أي مطوّر في المدينتين — بما فيهم عوده — عقدًا نموذجيًا ولا مواصفات تشطيب تفصيلية؛ هذه فجوة مشتركة عند الجميع.";

const DEVELOPERS = [
  // ---- الستة المقيَّمون في الجدول الرئيسي ----
  {
    slug: "alashraaf", name: "الأشراف للتطوير العقاري", domain: "https://alashraaf.com/",
    scores: [4.5, 4.1, 4.8, 4.4, 4.7], total: "4.5",
    published: ["أكبر رصيد أراضٍ منشور في العبور، وشراكات معلنة مع TotalEnergies وIHG، ورأس مال مصرّح به 100 مليون جنيه."],
    note: "تتصدر الأشراف الترتيب بفارق بسيط بفضل حجم الأراضي والشراكات المعلنة؛ الناقص: لا تُنشر أعداد وحدات مسلّمة ولا مواصفات تشطيب ولا عقد نموذجي.",
  },
  {
    slug: "ouda", name: "عوده للتطوير العقاري", domain: "https://ouda-developments.com/",
    scores: [4.6, 4.5, 4.5, 4.2, 4.3], total: "4.4",
    published: [
      "قائمة أسعار معلنة.",
      "نسبة بناء وارتفاعات منشورة (مشروع كناري في الحي 25 — نسبة بناء 25%).",
      "شريك تشغيل بسجل منشور: برافو لإدارة المرافق والتشغيل (15 مشروعًا حكوميًا منذ 1991، بحسب البيانات المنشورة).",
      "بحسب موقع الشركة: أكثر من 1,000 وحدة مسلّمة، ومشروعات مفهرسة إضافية (سولانا، سندس، سفاري).",
    ],
    note: "تحتل عوده المركز الثاني بمجموع 4.4/5؛ الأشراف تسبقها بمجموع 4.5/5 بفارق بسيط بفضل أكبر رصيد أراضٍ منشور في العبور والشراكات المعلنة.",
  },
  {
    slug: "alsafwa", name: "الصفوة للتطوير العمراني", domain: "https://sud.com.eg/",
    scores: [4.5, 2, 4.4, 2.8, 2.7], total: "3.3",
    published: ["الأوضح بين المطورين في توثيق التسليم: عدد وحدات وتاريخ محدد لمشروع واحد معلن."],
    note: null,
  },
  {
    slug: "elmoltqa", name: "الملتقى للتطوير العقاري", domain: "https://elmoltqa.com/",
    scores: [3.6, 2, 1.8, 3.4, 4.5], total: "3.1",
    published: ["الأعلى بين الستة في معيار الكثافة (4.5) بنسبة بناء ومساحات خضراء معلنة لمشروع بعينه."],
    note: null,
  },
  {
    slug: "valero", name: "فاليرو للتطوير العقاري", domain: "https://valerodevelopments.com/",
    scores: [2, 4.3, 2.6, 4, 2.2], total: "3.0",
    published: ["أعلى درجاتها في إدارة ما بعد التسليم (4.3) وشفافية التعاقد (4.0) ضمن البيانات المنشورة."],
    note: null,
  },
  {
    slug: "kayan", name: "كيان للتطوير العقاري", domain: "https://kayandev.com/",
    scores: [2.6, 2, 1.8, 3.6, 3.8], total: "2.8",
    published: ["أعلى درجاتها في الكثافة (3.8) وشفافية التعاقد (3.6) ضمن البيانات المنشورة."],
    note: null,
  },
  // ---- السبعة «قيد الاستكمال» ----
  {
    slug: "mrs", name: "MRS Development", domain: "https://mrsdevelopment.com/",
    pending: true, projects: "فيالي ريزيدنس — العبور الجديدة",
    sourceNote: "موقع رسمي منشور",
  },
  {
    slug: "metwadee", name: "متواضع جروب", domain: "https://www.metwadeegroup.com/index_ar.php",
    pending: true, projects: "ذا مارس · مول جدة · اوبو مول",
    sourceNote: "موقع رسمي منشور",
  },
  {
    slug: "mazaya", name: "مزايا للتطوير العقاري", domain: "https://mazaya-development.com/",
    pending: true, projects: "Town Ten — عرابي الجديدة/العبور الجديدة",
    sourceNote: "موقع رسمي منشور",
  },
  {
    slug: "eagle", name: "إيجل جروب للتطوير العقاري", domain: null,
    pending: true, projects: "جلوري جاردنز — العبور الجديدة",
    sourceNote: "لا يوجد موقع رسمي ظاهر — المصدر مصادر صحفية ووسيطة",
  },
  {
    slug: "foryou", name: "فور يو للتطوير العقاري", domain: null,
    pending: true, projects: "أو كارديا — أمام الحي الثامن",
    sourceNote: "لا يوجد موقع رسمي ظاهر — المصدر مصادر صحفية ووسيطة",
  },
  {
    slug: "alraei", name: "الراعي للتطوير العقاري", domain: null,
    pending: true, projects: "River Park — الجولدن سكوير",
    sourceNote: "لا يوجد موقع رسمي ظاهر — المصدر مصادر صحفية ووسيطة",
  },
  {
    slug: "ebdaa", name: "إبداع للتطوير العقاري", domain: "https://ebdaa-developments.com/",
    pending: true, projects: "جولف سيتي العبور ومجتمعاته",
    sourceNote: "موقع رسمي منشور — إبداع إحدى شركات عودة للتطوير العقاري، وشريكة المهندسون المصريون في جولف سيتي العبور",
  },
];

const BY_SLUG = Object.fromEntries(DEVELOPERS.map((d) => [d.slug, d]));

// ---------------------------------------------------------------------------
// قالب الصفحة: يستعير هيكل الموقع (head/header/footer) من صفحة ناشر مبنية
// بالفعل بواسطة المرحلة الأولى — يضمن تطابق الهيكل بلا نسخ يدوي.
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
  // نظيران جانبيان بشكل دوري ثابت — تماثل الروابط للجميع
  const i = DEVELOPERS.findIndex((d) => d.slug === slug);
  return [DEVELOPERS[(i + 1) % DEVELOPERS.length], DEVELOPERS[(i + 2) % DEVELOPERS.length]];
}

function scoresTable(d) {
  const rows = d.scores.map((s, i) => `<tr><td>${CRITERIA[i]}</td><td><strong>${s}</strong><small>/5</small></td></tr>`).join("");
  return `<div class="table-wrap"><table><thead><tr><th>المعيار</th><th>الدرجة من البيانات المنشورة</th></tr></thead><tbody>${rows}<tr><td><b>المجموع</b></td><td><strong>${d.total}<small>/5</small></strong></td></tr></tbody></table></div>
<p><small>الدرجة إرشادية ومبنية على البيانات المنشورة المتاحة وقت المراجعة (أغسطس 2026). الدرجة تقيس حجم ما يُنشر ويمكن التحقق منه — لا جودة الشركة. التفاصيل: <a href="/methodology/">منهجية التقييم</a>.</small></p>`;
}

function pendingBlock(d) {
  return `<div class="table-wrap"><table><tbody>
<tr><td>الحالة</td><td><strong>قيد الاستكمال</strong> — لم تُنشر بيانات كافية بعدُ لتطبيق المعايير الخمسة</td></tr>
<tr><td>مشروعات معلنة</td><td>${d.projects}</td></tr>
<tr><td>المصدر</td><td>${d.sourceNote}</td></tr>
</tbody></table></div>
<p>«قيد الاستكمال» ليست درجة سلبية؛ تعني أن الدليل العلني غير كافٍ للمقارنة الدقيقة. أي شركة ترسل بياناتها المنشورة القابلة للفحص تدخل الجدول الرئيسي في <a href="/developers/">دليل المطورين</a> بنفس المعايير المطبقة على الجميع.</p>`;
}

function developerPage(chrome, d) {
  const url = `${SITE}/developers/${d.slug}/`;
  const title = `${d.name} في العبور والعبور الجديدة: البيانات المنشورة | دليل العبور`;
  const description = d.pending
    ? `${d.name} في العبور والعبور الجديدة — ${d.projects}. الحالة: قيد الاستكمال وفق منهجية التحقق المنشورة.`
    : `درجات ${d.name} في المعايير الخمسة من البيانات المنشورة، وما هو منشور وما هو ناقص، وكيف تتحقق بنفسك.`;
  const h1 = `${d.name} في العبور والعبور الجديدة`;
  const [p1, p2] = peersOf(d.slug);

  const officialLink = d.domain
    ? `<p>الموقع الرسمي: <a href="${d.domain}" target="_blank" rel="nofollow noopener">${d.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗</a> <small>(رابط خارجي nofollow مثل كل المطورين)</small></p>`
    : `<p>لا يوجد موقع رسمي ظاهر وقت المراجعة — اعتمدنا مصادر صحفية ووسيطة، ويُرجى التحقق الميداني قبل أي قرار.</p>`;

  const publishedList = d.pending
    ? `<ul><li>مشروعات معلنة: ${d.projects}.</li><li>نوع المصدر: ${d.sourceNote}.</li></ul>`
    : `<ul>${d.published.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const missingList = d.pending
    ? `<ul>${CRITERIA.map((c) => `<li>${c}: بيانات منشورة غير كافية.</li>`).join("")}</ul>`
    : `<ul><li>${COMMON_GAP}</li></ul>`;

  const body = `
<h2>الدرجة من البيانات المنشورة</h2>
${d.pending ? pendingBlock(d) : scoresTable(d)}
${d.note ? `<p>${d.note}</p>` : ""}
<h2>ما هو منشور وقابل للفحص</h2>
${publishedList}
<h2>ما هو ناقص عند الجميع</h2>
${missingList}
<h2>كيف تتحقق بنفسك قبل التعاقد</h2>
<ol>
<li><strong>سابقة الأعمال المسلّمة:</strong> اطلب وحدات قائمة يمكن زيارتها، لا نماذج عرض فقط.</li>
<li><strong>إدارة ما بعد التسليم:</strong> اسأل عن جهة الإدارة باسمها وسجل تشغيلها المنشور.</li>
<li><strong>الملاءة المالية:</strong> تحقق من الشراكات أو التمويل المعلن من مصدر مستقل.</li>
<li><strong>شفافية التعاقد:</strong> اطلب نسخة من العقد النموذجي ومواصفات التشطيب مكتوبة قبل الحجز.</li>
<li><strong>البناء والكثافة:</strong> قارن نسبة البناء والارتفاعات المعلنة بالمخطط الرسمي للحي.</li>
</ol>
${officialLink}
<h2>صفحات ذات صلة</h2>
<p><a href="/developers/">دليل المطورين — الجدول الكامل</a> · <a href="/methodology/">منهجية التقييم الخمسة</a> · <a href="/prices/">أسعار العقارات في العبور الجديدة</a> · <a href="/buying-guide/">دليل الشراء خطوة بخطوة</a></p>
<p>مطورون آخرون بنفس القالب: <a href="/developers/${p1.slug}/">${p1.name}</a> · <a href="/developers/${p2.slug}/">${p2.name}</a></p>`;

  const aside = `<aside class="action-card"><p>دليل المطورين</p><a class="text-link" href="/developers/">الجدول الكامل ↖</a><a class="text-link" href="/methodology/">منهجية التقييم ↖</a><a class="text-link" href="/disclosure/">الإفصاح والشفافية ↖</a><a class="text-link" href="/corrections/">اطلب تصحيح بيانات ↖</a><a class="text-link" href="/prices/">الأسعار ↖</a><a class="text-link" href="/districts/">الأحياء والمناطق ↖</a></aside>`;

  const devNode = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#developer`,
    "name": d.name,
    ...(d.domain ? { "url": d.domain } : {}),
    "description": `مطوّر عقاري له مشروعات معلنة في العبور/العبور الجديدة. ${d.pending ? "الحالة: قيد الاستكمال." : "مقيَّم في دليل المطورين وفق خمسة معايير منشورة."}`,
  };
  const schemas = [
    { "@context": "https://schema.org", "@type": "WebPage", "name": h1, "url": url, "inLanguage": "ar-EG",
      "datePublished": DEFAULT_LASTMOD, "dateModified": DEFAULT_LASTMOD,
      "publisher": { "@id": SITE + "/#org" }, "about": { "@id": `${url}#developer` } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": "دليل المطورين", "item": SITE + "/developers/" },
      { "@type": "ListItem", "position": 3, "name": d.name, "item": url },
    ]},
    orgNode(),
    devNode,
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li><li class="sep">›</li><li><a href="/developers/">دليل المطورين</a></li><li class="sep">›</li><li><span aria-current="page">${d.name}</span></li></ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ دليل المطورين</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// حقن روابط البروفايلات في صفحة /developers/ (idempotent)
// ---------------------------------------------------------------------------
function linkDevelopersIndex() {
  const file = path.join(clientDir, "developers", "index.html");
  let html = fs.readFileSync(file, "utf8");
  let n = 0;

  // 1) صفوف الجدول الستة: الاسم نفسه يصبح رابطًا داخليًا للبروفايل
  for (const d of DEVELOPERS.filter((x) => !x.pending)) {
    if (html.includes(`/developers/${d.slug}/`)) continue;
    const re = new RegExp(`<td><b>${d.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</b>`);
    const next = html.replace(re, `<td><b><a href="/developers/${d.slug}/">${d.name}</a></b>`);
    if (next !== html) { html = next; n++; }
  }

  // 2) بطاقات «قيد الاستكمال» السبع: إضافة رابط داخلي بجانب المصدر الخارجي
  for (const d of DEVELOPERS.filter((x) => x.pending)) {
    if (html.includes(`/developers/${d.slug}/`)) continue;
    const esc = d.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(<article class="dir-item"[^>]*>\\s*<h4>(?:(?!</h4>)[\\s\\S])*${esc}(?:(?!</article>)[\\s\\S])*?<small>[^<]*</small>)`);
    const next = html.replace(re, `$1 <a href="/developers/${d.slug}/">صفحة المطور في الدليل</a>`);
    if (next !== html) { html = next; n++; }
  }

  if (n) {
    fs.writeFileSync(file, html);
    rep("index-links", `/developers/: أُضيفت ${n} روابط بروفايل داخلية`);
  } else {
    rep("index-links", "/developers/: روابط البروفايلات موجودة بالفعل");
  }
}

// ---------------------------------------------------------------------------
// إعادة بناء sitemap بعد إضافة الصفحات (نفس منطق المرحلة الأولى)
// ---------------------------------------------------------------------------
const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "أبريل": "04", "ابريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};
const SITEMAP_EXCLUDE = new Set(["/404/", "/search/", "/restaurants/", "/shopping/", "/health/"]);

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
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (شاملة بروفايلات المطورين)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome(); // يتطلب أن تكون المرحلة الأولى قد ركّبت صفحات الناشر
  for (const d of DEVELOPERS) {
    const file = path.join(clientDir, "developers", d.slug, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, developerPage(chrome, d));
    rep("page", `/developers/${d.slug}/ أُنشئت (${d.pending ? "قيد الاستكمال" : "مقيَّم " + d.total + "/5"})`);
  }
  linkDevelopersIndex();
  rebuildSitemap();

  console.log("=== تقرير المرحلة الثانية: صفحات المطورين (2.1) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
