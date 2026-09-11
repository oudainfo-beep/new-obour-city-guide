/**
 * seo-phase68-dwg-download.mjs — صفحة هبوط «خريطة العبور الجديدة dwg».
 *
 * كلمة بحث قوية لفئة المهندسين: خريطة العبور dwg / مخطط العبور الجديدة أوتوكاد.
 * صفحة تحميل مرجعية: DWG + DXF مضغوط + PDF + PNG، بيانات الملف، طرق الفتح
 * المجانية، ومعاينة — مع سكيمة Article + FAQPage + DigitalDocument.
 * الصفحة تُعاد كتابتها كل build — idempotent بالكتابة الكاملة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-09-10";

function loadChrome() {
  const donor = fs.readFileSync(path.join(clientDir, "about-us", "index.html"), "utf8");
  return {
    head: donor.match(/<head>[\s\S]*?<\/head>/)[0],
    header: donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1],
    footer: donor.match(/<\/main>([\s\S]*?)<\/body>/)[1],
  };
}
function orgNode() {
  return { "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
    name: "دليل العبور والعبور الجديدة", url: SITE + "/", logo: SITE + "/brand/logo.png",
    foundingDate: "2026", publishingPrinciples: SITE + "/editorial-policy/" };
}
function buildHead(head, { title, description, url, schemas, ogImage }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  if (ogImage) h = h.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${ogImage}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

const SLUG = "new-obour-map-dwg";
const url = `${SITE}/${SLUG}/`;
const IMG = `${SITE}/infographics/new-obour-master-plan-official.webp`;
const title = "خريطة العبور الجديدة dwg: تحميل المخطط الكامل أوتوكاد مجانًا | دليل العبور";
const description = "تحميل خريطة العبور والعبور الجديدة dwg — المخطط التفصيلي الكامل بصيغة أوتوكاد (كل الأحياء 1-29 بحدود القطع) + نسخة DXF وPDF وPNG. ملف كاد رسمي مجاني للمهندسين والمكاتب.";
const h1 = "خريطة العبور الجديدة dwg — المخطط الكامل بصيغة أوتوكاد";

const FAQ = [
  { q: "أحمل خريطة العبور الجديدة dwg من فين؟",
    a: "من هذه الصفحة مباشرة — زر «تحميل DWG» بالأعلى. الملف هو المخطط التفصيلي الكامل للعبور والعبور الجديدة بصيغة AutoCAD 2010 (AC1024) بحجم 71 ميجابايت، فيه كل الأحياء 1-29 بحدود القطع والشوارع والاستعمالات." },
  { q: "معنديش أوتوكاد — أفتح ملف DWG إزاي ببلاش؟",
    a: "بثلاث طرق مجانية: ODA Viewer (مستعرض رسمي مجاني من Open Design Alliance)، أو حمّل نسخة DXF المضغوطة من نفس الصفحة وافتحها في LibreCAD أو QGIS المجانيين، أو ارفع الملف على مستعرضات الويب. ولو محتاج صورة للعرض فقط — نسختنا PNG وPDF جاهزة." },
  { q: "إيه الفرق بين DWG وDXF في التحميل ده؟",
    a: "الـ DWG هو الملف الأصلي الكامل (يفتح في AutoCAD وODA Viewer)، والـ DXF نسخة تبادل مضغوطة (zip بحجم 58 ميجا) تفتحها البرامج المفتوحة مثل LibreCAD وQGIS — نفس المحتوى الهندسي للمخطط." },
  { q: "الخريطة فيها الأحياء كلها فعلًا؟",
    a: "نعم — المخطط التفصيلي يغطي العبور الجديدة كاملة بأحيائها 1-29 (ومنها الحي 24 بيت الوطن والحي 25 جاردن سيتي) بحدود القطع والشوارع والمحاور واستعمالات الأراضي، مع إمكانية التقريب حتى مستوى القطعة الواحدة." },
  { q: "استخدام الخريطة مسموح بإيه؟",
    a: "الملف مخطط رسمي صادر عن جهة التخطيط المختصة — ننشره للاطلاع والاستخدام المهني والبحثي مع ذكر المصدر. للاستخدام في مستندات رسمية أو تراخيص: راجع جهاز مدينة العبور الجديدة للنسخة المعتمدة الأحدث." },
];

function main() {
  const chrome = loadChrome();
  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY, image: [IMG],
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: { "@type": "Thing", name: "خريطة العبور الجديدة بصيغة dwg — المخطط التفصيلي أوتوكاد" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "العبور الجديدة", item: SITE + "/new-obour-districts/" },
      { "@type": "ListItem", position: 3, name: "خريطة dwg", item: url } ] },
    { "@context": "https://schema.org", "@type": "DigitalDocument", name: "المخطط التفصيلي الكامل — العبور والعبور الجديدة",
      url: "https://github.com/oudainfo-beep/new-obour-city-guide/releases/download/map-files/obour-new-obour-master-plan.dwg", fileFormat: "application/acad",
      contentSize: "74 MB", inLanguage: "ar-EG",
      description: "خريطة العبور والعبور الجديدة بصيغة أوتوكاد dwg — كل الأحياء 1-29 بحدود القطع والشوارع واستعمالات الأراضي",
      publisher: { "@id": SITE + "/#org" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({
      "@type": "Question", name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() } })) },
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas, ogImage: IMG });
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/new-obour-districts/">العبور الجديدة</a></li><li class="sep">›</li><li><span aria-current="page">خريطة dwg</span></li></ol></div></nav>`;
  const faqHtml = FAQ.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("");

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ملفات كاد · للمهندسين</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="68">
<p>تبحث عن <strong>خريطة العبور الجديدة dwg</strong> أو مخطط العبور بصيغة أوتوكاد؟ وصلت للمكان الصح — نوفر <strong>المخطط التفصيلي الكامل</strong> للعبور والعبور الجديدة للتحميل المجاني: كل الأحياء <strong>1-29</strong> بحدود القطع والشوارع والمحاور واستعمالات الأراضي، بجودة التقريب حتى مستوى القطعة الواحدة.</p>
<div class="action-card" style="margin:1rem 0"><p><strong>التحميل المباشر:</strong></p><p style="display:flex;gap:.6rem;flex-wrap:wrap"><a class="button" href="https://github.com/oudainfo-beep/new-obour-city-guide/releases/download/map-files/obour-new-obour-master-plan.dwg">⬇ DWG — المخطط الكامل (71 ميجا)</a><a class="button" href="https://github.com/oudainfo-beep/new-obour-city-guide/releases/download/map-files/obour-new-obour-master-plan-dxf.zip">⬇ DXF مضغوط (58 ميجا)</a><a class="button" href="${SITE}/downloads/new-obour-master-plan.pdf">⬇ PDF للطباعة</a><a class="button" href="${SITE}/infographics/new-obour-master-plan-official.png" target="_blank" rel="noopener">⬇ PNG عالي الجودة</a></p></div>
<h2>بيانات الملف</h2>
<div class="table-wrap"><table><tbody><tr><td><strong>الصيغة</strong></td><td>DWG — AutoCAD 2010 (AC1024) + نسخة DXF مضغوطة</td></tr><tr><td><strong>الحجم</strong></td><td>DWG: 71 ميجابايت · DXF مضغوط: 58 ميجابايت</td></tr><tr><td><strong>التغطية</strong></td><td>العبور + العبور الجديدة كاملة — الأحياء 1-29</td></tr><tr><td><strong>المحتوى</strong></td><td>حدود الأحياء والقطع، الشوارع والمحاور (ومنها الدائري الأوسطي وR2)، استعمالات الأراضي، التسميات</td></tr><tr><td><strong>الاستخدام</strong></td><td>مهني وبحثي مع ذكر المصدر — للاعتماد الرسمي راجع جهاز المدينة</td></tr></tbody></table></div>
<h2>معاينة المخطط</h2>
<figure style="margin:1.5rem 0"><a href="${SITE}/infographics/new-obour-master-plan-official.png" target="_blank" rel="noopener"><img src="${IMG}" alt="معاينة خريطة العبور الجديدة dwg — المخطط التفصيلي الكامل للأحياء واستعمالات الأراضي" width="1977" height="1398" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px;border:1px solid #e3ddd0"></a><figcaption class="caption" style="text-align:center;margin-top:.5rem">معاينة المخطط الاستراتيجي — ملف الـ DWG التفصيلي يحتوي مستوى أدق حتى حدود القطع</figcaption></figure>
<h2>تفتح الملف بإيه؟</h2>
<ul><li><strong>AutoCAD</strong> — مباشرة (الصيغة 2010 فأحدث).</li><li><strong>ODA Viewer</strong> — مستعرض مجاني رسمي من Open Design Alliance لمن لا يملك أوتوكاد.</li><li><strong>LibreCAD / QGIS</strong> — مجانيان ومفتوحا المصدر — استخدم نسخة DXF المضغوطة.</li><li><strong>للعرض السريع فقط:</strong> نسخة PNG عالية الجودة أو PDF جاهزان بالأعلى بلا أي برنامج.</li></ul>
<h2>خرائط جاهزة بجودة التقريب</h2>
<p>استخرجنا من الملف خرائط جاهزة لأهم الأحياء بجودة عالية وتسميات عربية واضحة — بلا برامج:</p>
<ul><li><a href="/district-25-new-obour/">خريطة الحي 25 (جاردن سيتي العبور)</a> — داخل صفحة الحي</li><li><a href="/district-24-new-obour/">خريطة الحي 24 (بيت الوطن)</a> — داخل صفحة الحي</li><li><a href="/new-obour-master-plan/">المخطط الاستراتيجي — شرح قراءة الخريطة</a></li></ul>
<h2>الأسئلة الشائعة</h2>
<div class="faq-block">${faqHtml}</div>
</article><aside class="action-card"><p>محتاج منطقة تانية؟</p><a class="button" href="/contact/">اطلب خريطة حي ↖</a><a class="text-link" href="/new-obour-master-plan/">شرح المخطط الاستراتيجي ↖</a><a class="text-link" href="/new-obour-districts/">أحياء العبور الجديدة ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="/new-obour-master-plan/">خريطة العبور الجديدة الرسمية — الشرح</a></li><li><a href="/district-25-new-obour/">الحي 25 (جاردن سيتي)</a></li><li><a href="/district-24-new-obour/">الحي 24 (بيت الوطن)</a></li><li><a href="/map/">الخريطة التفاعلية</a></li><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, SLUG);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log(`[phase68] /${SLUG}/ — صفحة تحميل خريطة العبور dwg`);
}

main();
