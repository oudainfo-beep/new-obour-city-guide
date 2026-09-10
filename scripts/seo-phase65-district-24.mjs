/**
 * seo-phase65-district-24.mjs — صفحة الحي 24 (حي بيت الوطن) في العبور الجديدة.
 *
 * تاني أرقى أحياء المدينة الجديدة بعد الحي 25 — بيت الوطن للمصريين المغتربين:
 * نفس موقع الجوار مع الأوسطي ومدينتي والشروق والعاصمة، بملكية وتخطيط مميزين.
 * الصفحة تُعاد كتابتها كل build — idempotent بالكتابة الكاملة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-09-08";

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

const SLUG = "district-24-new-obour";
const title = "الحي 24 في العبور الجديدة (حي بيت الوطن): تاني أرقى أحياء المدينة | دليل العبور";
const description = "الحي 24 بالعبور الجديدة (ويطلق عليه حي بيت الوطن للمصريين المغتربين): تاني أرقى أحياء المدينة بعد الحي 25 — الدائري الأوسطي على دقائق، قرب مدينتي والشروق والعاصمة، وكثافة منخفضة بملكية مميزة.";
const h1 = "الحي 24 في العبور الجديدة (حي بيت الوطن): تاني أرقى أحياء المدينة";
const url = `${SITE}/${SLUG}/`;

const FAQ = [
  { q: "حي بيت الوطن هو نفسه الحي 24؟",
    a: "نعم — الحي 24 في العبور الجديدة يُعرف بحي بيت الوطن لأنه منطقة مبادرة وزارة الإسكان للمصريين المغتربين (المقيمين بالخارج): أراضٍ سكنية مميزة خصصت لهم للبناء عليها. الاسمان لنفس الحي." },
  { q: "مين يقدر يشتري في بيت الوطن العبور الجديدة؟",
    a: "المبادرة موجهة للمصريين المقيمين بالخارج — أراضٍ مخصصة للبناء الذاتي بشروط تعلنها هيئة المجتمعات العمرانية. التوافر والشروط الحالية تتحقق من موقع الهيئة مباشرة، ووحدات التمليك الحر من المالكين تظهر على المنصات." },
  { q: "الحي 24 أرقى ولا الحي 25؟",
    a: "الحي 25 يتصدر القائمة (أرضي+4 وموقع متقدم)، والحي 24 الثاني مباشرة — نفس موقع الجوار مع الأوسطي ومدينتي والشروق، وبكثافة منخفضة وملكية مميزة من مبادرة بيت الوطن. الفارق بينهما أقرب للتفضيل الشخصي." },
  { q: "الحي 24 فيه خدمات دلوقتي؟",
    a: "في مرحلة نمو — خدماته الذاتية تكتمل مع زيادة السكان، لكن جيرانه الأكبر يغطونه: كارفور الشروق وكارفور العبور وخدمات مدينتي (أقل من 10 دقائق) والشروق الجارة. تابع الحالة الحية في صفحة المتابعة." },
  { q: "إيه المنطقة الخدمية المركزية اللي جنب الحي 24؟",
    a: "منطقة خدمية مركزية عملاقة تتوسط الحي 24 وجاره الحي 25: مساحات خضراء شاسعة وحدائق مركزية بنوافير وممشى، ومناطق تجارية ومولات وبنوك ومستشفيات، يحيط بها حزام أخضر — قلب الخدمات النابض للحيين معًا." },
  { q: "الحي 24 يناسب مين؟",
    a: "المغترب الذي يخطط لبيت العودة بموقع لا يضاهى في شرق القاهرة، والمشتري الذي يريد كثافة منخفضة ومواصلات ذهبية (الأوسطي ومدينتي والعاصمة) ويقبل انتظار اكتمال الخدمات — مع غطاء الجيران الكبار في الفترة الحالية." },
];

const REASONS = [
  ["بيت الوطن: حي صُمم للمغترب",
   "الحي 24 هو منطقة مبادرة وزارة الإسكان للمصريين المغتربين — أراضٍ سكنية مميزة خُصصت لمن عملوا بالخارج ليبنوا بيت العودة. النتيجة: مالك يبني ليسكن هو بنفسه — لا مضاربات سريعة — وحي بطابع عائلي مستقر."],
  ["نفس موقع الحي 25 الذهبي — بسعر أذكى",
   "الدائري الأوسطي على دقائق، ومدينتي على أقل من 10 دقائق، والشروق جارة، والعاصمة الإدارية عبر الأوسطي والإقليمي. كل مزايا موقع جاره الأشهر — بفرص شراء أوسع لأنه الأقل شهرة حتى الآن."],
  ["كثافة منخفضة وتخطيط حديث",
   "أحياء بيت الوطن تُخطط بمعايير المدن الجديدة: شوارع واسعة، كثافة أخف من العبور القديمة، ومساحات خضراء مخصصة — البنية التحتية حديثة من اليوم الأول."],
  ["بين كارفورين: الشروق والعبور",
   "مثل جاره تمامًا: كارفور الشروق وكارفور العبور يخدمانه فعليًا — التسوق الأسبوعي بالدقائق حتى تكتمل خدماته الذاتية."],
  ["المنطقة الخدمية المركزية العملاقة على حدوده",
   "يتوسط الحي 24 وجاره الحي 25 قلب خدمات عملاق: مساحات خضراء شاسعة وحدائق مركزية بنوافير وممشى، ومناطق تجارية ومولات وبنوك ومستشفيات، يحيط بها حزام أخضر — يعني ساكن بيت الوطن على خطوتين من كل ما يحتاجه يوميًا وأسبوعيًا."],
];

function main() {
  const chrome = loadChrome();
  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: { "@type": "Place", name: "الحي 24 (بيت الوطن)، مدينة العبور الجديدة، القليوبية" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "أحياء العبور الجديدة", item: SITE + "/new-obour-districts/" },
      { "@type": "ListItem", position: 3, name: "الحي 24 (بيت الوطن)", item: url } ] },
    { "@context": "https://schema.org", "@type": "Place", name: "الحي 24 (حي بيت الوطن) — العبور الجديدة",
      description: "حي بيت الوطن للمصريين المغتربين في مدينة العبور الجديدة — كثافة منخفضة قرب الدائري الأوسطي ومدينتي.",
      containedInPlace: { "@type": "City", name: "مدينة العبور الجديدة" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({
      "@type": "Question", name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() } })) },
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });

  const reasons = REASONS.map(([t, b]) => `<h3>${t}</h3><p>${b}</p>`).join("\n");
  const faqHtml = FAQ.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("");
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li><li class="sep">›</li><li><span aria-current="page">الحي 24 (بيت الوطن)</span></li></ol></div></nav>`;

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ العبور الجديدة · دليل الأحياء</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="65">
<p>إذا كان <a href="/district-25-new-obour/">الحي 25</a> هو أرقى أحياء العبور الجديدة، فإن <strong>الحي 24</strong> هو وصيفه المباشر — ويطلق عليه <strong>حي بيت الوطن</strong> (للمصريين المغتربين). حيٌّ يجمع نفس معادلة الموقع الذهبية مع ميزة إضافية: ملكية صُممت لمن يبني بيت عمره، لا لمن يضارب بسرعة.</p>
<h2>لماذا الحي 24؟ خمسة أسباب</h2>
${reasons}

<h2>خريطة الحي 24 بالتفصيل</h2>
<figure style="margin:1.5rem 0"><a href="/infographics/hay-24-district-map.webp" target="_blank" rel="noopener"><img src="/infographics/hay-24-district-map.webp" alt="خريطة الحي 24 (بيت الوطن) بالتفصيل من المخطط الرسمي للعبور الجديدة" width="1600" height="1600" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px;border:1px solid #e3ddd0"></a><figcaption class="caption" style="text-align:center;margin-top:.5rem">خريطة الحي 24 من المخطط التفصيلي الرسمي — انقر للتكبير · <a href="/downloads/obour-new-obour-master-plan.dwg">ملف الأوتوكاد الكامل DWG</a></figcaption></figure>
<h2>بيت الوطن باختصار</h2>
<p>مبادرة وزارة الإسكان المخصصة للمصريين المقيمين بالخارج: أراضٍ سكنية مميزة في المدن الجديدة تُخصص للمغتربين ليبنوا عليها — بشروط تعلنها هيئة المجتمعات العمرانية في مراحل متتابعة. الحي 24 هو حصة العبور الجديدة منها. شروط الحجز الحالية تُراجع من موقع الهيئة مباشرة، ووحدات التمليك الحر من المالكين تظهر على المنصات بين الحين والآخر.</p>
<h2>الخدمات اليوم: الصدق أولًا</h2>
<p>الحي في مرحلة نمو — خدماته الذاتية تكتمل تباعًا مع زيادة السكان. لكنه يستعير خدمات الكبار حاليًا: <strong>كارفور الشروق وكارفور العبور</strong> للتسوق، وخدمات <strong>مدينتي</strong> الناضجة (أقل من 10 دقائق)، ومدارس ومستشفيات <strong>الشروق</strong> الجارة. تابع الحالة الحية في <a href="/tracker/">متابعة العبور الجديدة</a>.</p>
<h2>الحي 24 × الحي 25 — بصراحة</h2>
<div class="table-wrap"><table><thead><tr><th></th><th>الحي 24 (بيت الوطن)</th><th>الحي 25 (جاردن سيتي)</th></tr></thead><tbody><tr><td>الترتيب المحلي</td><td>تاني أرقى الأحياء</td><td><strong>أرقى الأحياء</strong></td></tr><tr><td>الطابع</td><td>مغتربون يبنون بيت العودة</td><td>كثافة أخف (أرضي+4)</td></tr><tr><td>الموقع</td><td>الأوسطي ومدينتي والشروق على دقائق</td><td>نفس الموقع تقريبًا</td></tr><tr><td>المنطقة الخدمية المركزية</td><td colspan="2">منطقة عملاقة تتوسط الحيين: حدائق مركزية ونوافير وممشى ومولات وبنوك ومستشفيات وحزام أخضر</td></tr><tr><td>الشهرة والمعروض</td><td>أهدأ — فرص أوسع</td><td>أشهر — طلب أعلى</td></tr></tbody></table></div>
<p class="caption">الفارق بين الحيين أقرب للتفضيل الشخصي: من يريد الاسم الأشهر يتجه للـ 25، ومن يريد نفس الموقع بفرصة أذكى يدرس الـ 24 بجدية.</p>
<h2>الأسئلة الشائعة</h2>
<div class="faq-block">${faqHtml}</div>
</article><aside class="action-card"><p>تملك في الحي 24؟</p><a class="button" href="/corrections/">حدّثنا بمعلومة موثقة ↖</a><a class="text-link" href="/district-25-new-obour/">الحي 25 — الأول ↖</a><a class="text-link" href="/prices/">الأسعار الحالية ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="/district-25-new-obour/">الحي 25 (جاردن سيتي العبور)</a></li><li><a href="/beit-watan-obour/">مبادرة بيت الوطن — الدليل</a></li><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li><li><a href="/social-housing-obour/">سكن لكل المصريين</a></li><li><a href="/middle-ring-road-obour/">الدائري الأوسطي</a></li><li><a href="/tracker/">متابعة العبور الجديدة</a></li><li><a href="/buying-guide/">دليل الشراء</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, SLUG);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log(`[phase65] /${SLUG}/ — الحي 24 (بيت الوطن): تاني أرقى الأحياء`);
}

main();
