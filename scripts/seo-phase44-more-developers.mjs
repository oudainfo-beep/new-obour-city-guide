// seo-phase44-more-developers.mjs
// المرحلة 44 — إضافة 11 صفحة مطوّر «قيد الاستكمال» (الدفعتان الأولى والثانية)
// وبطاقاتهم في /developers/ + تحديث sitemap. idempotent: آمن لإعادة التشغيل.
// يعمل بعد seo-authority-compounds (مصدر صفحة القالب mrs) وقبل فهرس البحث phase24.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const SITE = "https://obourguide.com";
const LASTMOD = "2026-08";

const CRITERIA = ["سابقة الأعمال المسلّمة", "إدارة ما بعد التسليم", "الملاءة المالية", "شفافية التعاقد", "البناء والكثافة"];

// الدفعة الأولى (8)
const DEVS1 = [
  { slug: "rock", name: "روك للتطوير العقاري (Rock Developments)", domain: "https://rock-developments.com/",
    projects: "روك فيل — الحي الخامس، العبور (مشروع قائم بمراحل مسلّمة) · روك فيل بلازا",
    source_note: "موقع رسمي منشور",
    extra: "بحسب الموقع الرسمي والتغطية الصحفية: الذراع العقارية لمجموعة البطل للاستثمار، وروك فيل مجتمع فيلات على 50,000 م² يضم 101 فيلا جاهزة في الحي الخامس." },
  { slug: "turath", name: "تراث للتطوير العقاري (Turath Developments)", domain: null,
    projects: "فيلات الحي الخامس (بدأ التسليم فعليًا — إعلان المطور يوليو 2025) · تراث بارك — 31 فدانًا على محور الخط العاشر",
    source_note: "لا يوجد موقع رسمي ظاهر — المصدر إعلانات رسمية للمطور ومصادر وسيطة", extra: null },
  { slug: "brevan", name: "بريفان للتطوير العقاري (Brevan Developments)", domain: "https://brevaninvestment.com/",
    projects: "ليك هاوس — العبور الجديدة (9.5 فدان، 19 مبنى، 480 وحدة معلنة) · بريفان 90 مول — العبور الجديدة",
    source_note: "موقع رسمي منشور",
    extra: "بحسب تغطية Daily News Egypt (يونيو 2025): استثمارات معلنة نحو 2.5 مليار ج.م في ليك هاوس وتسليم أولى الوحدات معلن في يونيو 2028." },
  { slug: "reflect", name: "ريفليكت للتطوير العقاري (Reflect Developments)", domain: null,
    projects: "مومنت كوميونيتي — محور الخط العاشر (28 فدانًا) · O Jade — الحي السابع · انفينيتي مول · سيلكت مول · فيرست مول 1 و2 · فيلفيت مول — العبور",
    source_note: "الموقع الرسمي قيد التحديث وقت المراجعة — المصدر مصادر صحفية ووسيطة (DeedGate)",
    extra: "بحسب DeedGate: تعمل بهويتها الحالية منذ نحو 2020 وخبرة مؤسسيها في سوق العبور منذ 2005، وتصرّح بثمانية مشروعات خلال ثلاث سنوات (يونيو 2026)." },
  { slug: "redin", name: "ريد إن للتطوير العقاري (RED IN Developments)", domain: "https://redindevelopments.com/",
    projects: "جويا ريزيدنس · زون مول · بلس مول — العبور الجديدة",
    source_note: "موقع رسمي منشور", extra: null },
  { slug: "oud", name: "الشرقيون للتنمية العمرانية (OUD)", domain: "https://ouddevelopments.com/",
    projects: "هليوبوليس هيلز — منطقة الفيلات، العبور (18.25 فدانًا، نحو 170 فيلا بحسب البيانات المنشورة)",
    source_note: "موقع رسمي منشور",
    extra: "شركة قائمة منذ 1994 ضمن مجموعة الشرقيون (Oriental Weavers) — وهي كيان مختلف تمامًا عن «عوده للتطوير العقاري» المقيَّمة في الجدول الرئيسي." },
  { slug: "murtaqa", name: "مرتقى للتطوير العقاري (Murtaqa Development)", domain: null,
    projects: "كمبوند مرتقى — مدخل العبور على طريق إسماعيلية (210 أفدنة، 1,000 فيلا، تسليم معلن 2029)",
    source_note: "لا يوجد موقع رسمي ظاهر — المصدر مصادر وسيطة (DeedGate)", extra: null },
  { slug: "happyhome", name: "هابي هوم للتطوير العقاري (Happy Home Developments)", domain: null,
    projects: "فلو هايتس — الحي الثالث، العبور (مشروع سكني معلن على 22 فدانًا)",
    source_note: "لا يوجد موقع رسمي ظاهر — المصدر تغطية Invest-Gate (ديسمبر 2024)", extra: null },
];

// الدفعة الثانية (3)
const DEVS2 = [
  { slug: "rg", name: "RG للتطوير العقاري (RG Developments)", domain: "https://rgdevelopmentseg.com/",
    projects: "ميريسا — العبور الجديدة (8 أفدنة بجوار كارفور وبيت الوطن والحي الثامن) · مول معالم · مول مارك",
    source_note: "موقع رسمي منشور",
    extra: "بحسب الموقع الرسمي: شركة تعمل منذ 2016 برئاسة رفعت الدبع وقيادة تنفيذية لمارك ماهر، وميريسا يضم شققًا 114–204 م² ومولًا تجاريًا داخليًا." },
  { slug: "alfath", name: "الفتح جروب (AlFath Group)", domain: null,
    projects: "جازيل ريزيدنس — الحي 14، العبور الجديدة · نوفا ريزيدنس العبور · فيرست إيست مول العبور",
    source_note: "لا يوجد موقع رسمي ظاهر — المصدر مصادر وسيطة (DeedGate ومنصات عقارية)",
    extra: "بحسب المنصات العقارية: خبرة معلنة تتجاوز 35 عامًا وأكثر من 300 مشروع في مصر والخليج، وجازيل ريزيدنس بتسليم معلن 2029." },
  { slug: "avamina", name: "آفا مينا جروب (Ava Mina Group)", domain: null,
    projects: "أورو العبور — الحي السادس (28 فدانًا، نحو 200 فيلا وستريب مول)",
    source_note: "لا يوجد موقع رسمي ظاهر — المصدر عقارماب وبروبرتي فايندر وتغطية صحفية",
    extra: "بحسب عقارماب: المشروع شراكة بين آفا مينا (قائمة منذ 1994) والشمس للإسكان والتنمية (شركة مساهمة قائمة منذ 1946)." },
];

// ---------- تحميل الهيكل من صفحة بروفايل قائمة ----------
const donorPath = path.join(clientDir, "developers", "mrs", "index.html");
if (!fs.existsSync(donorPath)) { console.warn("[phase44] donor page missing — skipped"); process.exit(0); }
const donor = fs.readFileSync(donorPath, "utf8");
const head0 = donor.match(/<head>[\s\S]*?<\/head>/)[0];
const header0 = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
const footer0 = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];

const orgNode = () => ({ "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
  name: "دليل العبور والعبور الجديدة", url: SITE + "/",
  logo: "https://obourguide.com/brand/logo.png", foundingDate: "2026",
  publishingPrinciples: "https://obourguide.com/editorial-policy/" });

function buildHead(title, desc, url, schemas) {
  let h = head0;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const ld = schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

const peersOf = (list, slug) => {
  const i = list.findIndex(d => d.slug === slug);
  return [list[(i + 1) % list.length], list[(i + 2) % list.length]];
};

const pendingBlock = d => `<div class="table-wrap"><table><tbody>
<tr><td>الحالة</td><td><strong>قيد الاستكمال</strong> — لم تُنشر بيانات كافية بعدُ لتطبيق المعايير الخمسة</td></tr>
<tr><td>مشروعات معلنة</td><td>${d.projects}</td></tr>
<tr><td>المصدر</td><td>${d.source_note}</td></tr>
</tbody></table></div>
<p>«قيد الاستكمال» ليست درجة سلبية؛ تعني أن الدليل العلني غير كافٍ للمقارنة الدقيقة. أي شركة ترسل بياناتها المنشورة القابلة للفحص تدخل الجدول الرئيسي في <a href="/developers/">دليل المطورين</a> بنفس المعايير المطبقة على الجميع.</p>`;

function page(list, d) {
  const url = `${SITE}/developers/${d.slug}/`;
  const title = `${d.name} في العبور والعبور الجديدة: البيانات المنشورة | دليل العبور`;
  const desc = `${d.name} في العبور والعبور الجديدة — ${d.projects}. الحالة: قيد الاستكمال وفق منهجية التحقق المنشورة.`;
  const h1 = `${d.name} في العبور والعبور الجديدة`;
  const [p1, p2] = peersOf(list, d.slug);
  const official = d.domain
    ? `<p>الموقع الرسمي: <a href="${d.domain}" target="_blank" rel="nofollow noopener">${d.domain.replace("https://", "").replace(/\/$/, "")} ↗</a> <small>(رابط خارجي nofollow مثل كل المطورين)</small></p>`
    : '<p>لا يوجد موقع رسمي ظاهر وقت المراجعة — اعتمدنا مصادر صحفية ووسيطة، ويُرجى التحقق الميداني قبل أي قرار.</p>';
  const pubItems = [`مشروعات معلنة: ${d.projects}.`, `نوع المصدر: ${d.source_note}.`];
  if (d.extra) pubItems.push(d.extra);
  const published = "<ul>" + pubItems.map(x => `<li>${x}</li>`).join("") + "</ul>";
  const missing = "<ul>" + CRITERIA.map(c => `<li>${c}: بيانات منشورة غير كافية.</li>`).join("") + "</ul>";
  const body = `
<h2>الدرجة من البيانات المنشورة</h2>
${pendingBlock(d)}
<h2>ما هو منشور وقابل للفحص</h2>
${published}
<h2>ما هو ناقص عند الجميع</h2>
${missing}
<h2>كيف تتحقق بنفسك قبل التعاقد</h2>
<ol>
<li><strong>سابقة الأعمال المسلّمة:</strong> اطلب وحدات قائمة يمكن زيارتها، لا نماذج عرض فقط.</li>
<li><strong>إدارة ما بعد التسليم:</strong> اسأل عن جهة الإدارة باسمها وسجل تشغيلها المنشور.</li>
<li><strong>الملاءة المالية:</strong> تحقق من الشراكات أو التمويل المعلن من مصدر مستقل.</li>
<li><strong>شفافية التعاقد:</strong> اطلب نسخة من العقد النموذجي ومواصفات التشطيب مكتوبة قبل الحجز.</li>
<li><strong>البناء والكثافة:</strong> قارن نسبة البناء والارتفاعات المعلنة بالمخطط الرسمي للحي.</li>
</ol>
${official}
<h2>صفحات ذات صلة</h2>
<p><a href="/developers/">دليل المطورين — الجدول الكامل</a> · <a href="/methodology/">منهجية التقييم الخمسة</a> · <a href="/prices/">أسعار العقارات في العبور الجديدة</a> · <a href="/buying-guide/">دليل الشراء خطوة بخطوة</a></p>
<p>مطورون آخرون بنفس القالب: <a href="/developers/${p1.slug}/">${p1.name}</a> · <a href="/developers/${p2.slug}/">${p2.name}</a></p>`;
  const aside = '<aside class="action-card"><p>دليل المطورين</p><a class="text-link" href="/developers/">الجدول الكامل ↖</a>'
    + '<a class="text-link" href="/methodology/">منهجية التقييم ↖</a><a class="text-link" href="/disclosure/">الإفصاح والشفافية ↖</a>'
    + '<a class="text-link" href="/corrections/">اطلب تصحيح بيانات ↖</a><a href="/prices/">الأسعار ↖</a>'
    + '<a href="/districts/">الأحياء والمناطق ↖</a></aside>';
  const devNode = { "@context": "https://schema.org", "@type": "Organization", "@id": `${url}#developer`,
    name: d.name, ...(d.domain ? { url: d.domain } : {}),
    description: "مطوّر عقاري له مشروعات معلنة في العبور/العبور الجديدة. الحالة: قيد الاستكمال." };
  const schemas = [
    { "@context": "https://schema.org", "@type": "WebPage", name: h1, url, inLanguage: "ar-EG",
      datePublished: LASTMOD, dateModified: LASTMOD,
      publisher: { "@id": SITE + "/#org" }, about: { "@id": `${url}#developer` } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "دليل المطورين", item: SITE + "/developers/" },
      { "@type": "ListItem", position: 3, name: d.name, item: url }] },
    orgNode(), devNode,
  ];
  const head = buildHead(title, desc, url, schemas);
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li>`
    + `<li class="sep">›</li><li><a href="/developers/">دليل المطورين</a></li><li class="sep">›</li>`
    + `<li><span aria-current="page">${d.name}</span></li></ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout">`
    + `<div class="hero-copy-block"><span class="tag">⌖ دليل المطورين</span><h1>${h1}</h1><p>${desc}</p></div></div></section>`
    + `<section class="section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${header0}${breadcrumb}${main}${footer0}</body></html>`;
}

// ---------- 1) إنشاء الصفحات ----------
let created = 0;
for (const [list, d] of [...DEVS1.map(d => [DEVS1, d]), ...DEVS2.map(d => [DEVS2, d])]) {
  const out = path.join(clientDir, "developers", d.slug, "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page(list, d));
  created++;
  console.log(`[phase44] page /developers/${d.slug}/`);
}

// ---------- 2) بطاقات في /developers/ ----------
const idxPath = path.join(clientDir, "developers", "index.html");
let idx = fs.readFileSync(idxPath, "utf8");
if (!idx.includes("/developers/rock/")) {
  const cards = [];
  let n = 8;
  for (const d of [...DEVS1, ...DEVS2]) {
    const h4 = d.domain
      ? `<h4><a href="${d.domain}" target="_blank" rel="nofollow noopener">${d.name}</a></h4>`
      : `<h4>${d.name}</h4>`;
    cards.push(`<article class="dir-item" id="business-${n}">${h4}<p class="dir-addr">${d.projects}</p>`
      + `<small>${d.source_note}</small> <a href="/developers/${d.slug}/">صفحة المطور في الدليل</a></article>`);
    n++;
  }
  const anchor = '<article class="dir-item" id="business-7">';
  const i = idx.indexOf(anchor);
  if (i === -1) { console.warn("[phase44] business-7 anchor not found — cards skipped"); }
  else {
    const j = idx.indexOf("</article>", i) + "</article>".length;
    idx = idx.slice(0, j) + cards.join("") + idx.slice(j);
    fs.writeFileSync(idxPath, idx);
    console.log(`[phase44] index: أُضيفت ${cards.length} بطاقات (business-8..${n - 1})`);
  }
} else {
  console.log("[phase44] index: البطاقات موجودة — تخطى");
}

// ---------- 3) sitemap ----------
const smPath = path.join(publicDir, "sitemap.xml");
if (fs.existsSync(smPath)) {
  let sm = fs.readFileSync(smPath, "utf8");
  if (!sm.includes("/developers/rock/")) {
    const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    const old = Object.fromEntries([...sm.matchAll(/<loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod>/g)].map(m => [m[1], m[2]]));
    const newUrls = [...DEVS1, ...DEVS2].map(d => `${SITE}/developers/${d.slug}/`);
    const all = [...new Set([...locs, ...newUrls])].sort((a, b) => (a !== SITE + "/") - (b !== SITE + "/") || a.localeCompare(b));
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + all.map(u => `  <url><loc>${u}</loc><lastmod>${old[u] || LASTMOD}</lastmod></url>`).join("\n")
      + "\n</urlset>\n";
    fs.writeFileSync(smPath, sm);
    console.log(`[phase44] sitemap: ${locs.length} -> ${all.length} صفحة`);
  } else {
    console.log("[phase44] sitemap: موجودة — تخطى");
  }
} else {
  console.warn("[phase44] sitemap.xml غير موجود — تخطى");
}

// ---------- 4) ربط مقال «أفضل 10 مطورين في مدينة العبور» بالصفحات المحورية (idempotent) ----------
const BEST_DEV = "/best-developers-obour/";
const BEST_DEV_MARKER = 'data-best-dev-link="true"';
const bestDevBlock = `<section class="paper section" ${BEST_DEV_MARKER}><div class="wrap"><div class="related">
<a href="${BEST_DEV}">أفضل 10 مطورين في مدينة العبور — ترتيب تحريري بالدرجات ↖</a>
</div></div></section>\n`;

// 4.1 الرئيسية: شريحة ضمن hero-chips
{
  const homePath = path.join(clientDir, "index.html");
  if (fs.existsSync(homePath)) {
    let home = fs.readFileSync(homePath, "utf8");
    if (!home.includes(BEST_DEV)) {
      const m = home.match(/<div class="hero-chips"[^>]*>/);
      if (m) {
        const i = home.indexOf("</div>", m.index);
        if (i !== -1) {
          home = home.slice(0, i) + `<a href="${BEST_DEV}">أفضل 10 مطورين</a>` + home.slice(i);
          fs.writeFileSync(homePath, home);
          console.log("[phase44] home: أُضيفت شريحة أفضل 10 مطورين إلى hero-chips");
        }
      }
    }
  }
}

// 4.2 صفحات محورية: بلوك روابط قبل نهاية main
const hubTargets = [
  "developers/index.html",
  "prices/index.html",
  "buying-guide/index.html",
  "compounds/index.html",
  "investment/index.html",
  "districts/index.html",
  "new-obour/index.html",
  "old-obour/index.html",
  "obour-city/index.html",
  "new-obour-districts/index.html",
  "best-compounds-obour/index.html",
  "best-compounds-new-obour/index.html",
];
for (const rel of hubTargets) {
  const fp = path.join(clientDir, rel);
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, "utf8");
  if (html.includes(BEST_DEV_MARKER) || !html.includes("</main>")) continue;
  html = html.replace("</main>", bestDevBlock + "</main>");
  fs.writeFileSync(fp, html);
  console.log(`[phase44] ${rel}: رابط أفضل 10 مطورين`);
}

// ملاحظة: فهرس البحث يلتقط الصفحات الجديدة تلقائيًا في phase24 (مسح نظام الملفات).
console.log(`[phase44] done — ${created} صفحة مطوّر`);
