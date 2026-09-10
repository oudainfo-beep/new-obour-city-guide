/**
 * seo-phase64-district-25.mjs — صفحة الحي 25 في العبور الجديدة.
 *
 * لماذا يتصدر الحي 25 أحياء المدينة الجديدة: الدائري الأوسطي ومحور R2،
 * دقائق من مدينتي والشروق والعاصمة، ارتفاعات أرضي+4 فقط، كارفور الشروق
 * والعبور — وفي الختام المطورون وأبرزهم عوده (كناري).
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

const SLUG = "district-25-new-obour";
const title = "الحي 25 في العبور الجديدة (جاردن سيتي العبور): أرقى أحياء المدينة | دليل العبور";
const description = "الحي 25 بالعبور الجديدة (ويطلق عليه أيضًا حي جاردن سيتي العبور وحي البشوات وحي عوده): الدائري الأوسطي ومحور R2 على دقائق، أقل من 10 دقائق من مدينتي، قرب الشروق والعاصمة وكارفور، وارتفاعات أرضي+4 فقط.";
const h1 = "الحي 25 في العبور الجديدة: أرقى أحياء المدينة الجديدة";
const url = `${SITE}/${SLUG}/`;

const FAQ = [
  { q: "حي جاردن سيتي العبور هو نفسه الحي 25؟",
    a: "نعم — الحي 25 في العبور الجديدة يُعرف بين السكان بعدة أسماء: حي جاردن سيتي العبور، وحي البشوات، وحي عوده. كلها تشير لنفس الحي منخفض الكثافة (أرضي+4) قرب الدائري الأوسطي ومدينتي والشروق." },
  { q: "الحي 25 في العبور الجديدة فيه خدمات؟",
    a: "الحي 25 في مرحلة نمو متسارعة — خدماته الذاتية تكتمل تباعًا مع زيادة السكان. والميزة أنه لا ينتظر: كارفور الشروق وكارفور العبور وخدمات مدينتي والشروق على بُعد دقائق بالسيارة، فيحصل سكانه على كل احتياجاتهم اليومية من الجيران الأكبر سنًا." },
  { q: "الحي 25 بعيد عن مدينتي والعاصمة الإدارية؟",
    a: "بالعكس — من أقرب أحياء شرق القاهرة لهما: أقل من 10 دقائق من مدينتي عبر الدائري الأوسطي، ودقائق من العاصمة الإدارية عبر الأوسطي ثم الإقليمي (محور R2)، والشروق جارته المباشرة. هذا الموقع هو سر تفوقه." },
  { q: "ما ارتفاعات المباني في الحي 25؟",
    a: "أرضي + 4 أدوار فقط — أقل دور من باقي مناطق العبور (أرضي + 5). ارتفاع أقل يعني كثافة سكانية أخف وشوارع أهدأ وإطلالات مفتوحة وخصوصية أعلى — وهو ما يمنح الحي طابعه الراقي." },
  { q: "من أبرز المطورين العاملين في الحي 25؟",
    a: "من أبرزهم عوده للتطوير العقاري — صاحبة 1,065 وحدة مسلّمة وأكثر من 130 مبنى وقطعة أرض في العبور بأرقامها المنشورة — ومشروعها كناري: فيلات تاون هاوس فاخرة (5 غرف + حديقة خاصة) من إطلاقاتها في العبور الجديدة." },
  { q: "إيه المنطقة الخدمية المركزية اللي جنب الحي 25؟",
    a: "منطقة خدمية مركزية عملاقة تتوسط الحي 25 وجاره الحي 24: مساحات خضراء شاسعة وحدائق مركزية بنوافير وممشى، ومناطق تجارية ومولات وبنوك ومستشفيات، يحيط بها حزام أخضر — مصممة لتكون قلب الخدمات النابض للحيين معًا." },
  { q: "الحي 25 يناسب مين؟",
    a: "من يريد سكنًا جديدًا بمواصلات ذهبية نحو مدينتي والعاصمة والشروق، ويفضّل الكثافة المنخفضة (أرضي+4) على اكتمال الخدمات الفوري — مع علمه أن خدمات الكبار (كارفور الشروق والعبور ومدينتي) على دقائق. أما من يريد خدمات ناضجة تحت قدميه اليوم فأحياء العبور القديمة أنسب." },
];

const REASONS = [
  ["الدائري الأوسطي على دقائق",
   "شريان شرق القاهرة الجديد يمر بجوار الحي — يوصلك لطريق السويس والإسماعيلية والتجمع دون الدخول في زحام المحاور القديمة. من يسكن هنا يختصر يومه قبل أن يبدأ."],
  ["محور R2: الأوسطي × الإقليمي",
   "محور R2 الجديد يربط الدائري الأوسطي بالدائري الإقليمي مباشرة — فيصبح الحي نقطة تقاطع حقيقية: غربًا للتجمع والقاهرة، وشرقًا للعاصمة الإدارية وبدر والعاشر."],
  ["أقل من 10 دقائق من مدينتي",
   "مدينتي — أكبر مدن شرق القاهرة خدمةً وتجهيزًا — على أقل من 10 دقائق بالسيارة. مدارسها ومستشفياتها ومناطقها التجارية تعمل كامتداد يومي للحي."],
  ["الشروق جارة، والعاصمة جارة",
   "مدينة الشروق بخدماتها الناضجة على الحدود مباشرة، والعاصمة الإدارية الجديدة على دقائق عبر الأوسطي والإقليمي — موقع وسط بين ثلاث مدن كبرى لا يتكرر."],
  ["كارفور الشروق وكارفور العبور",
   "اثنان من أكبر هايبرماركت المنطقة يخدمان الحي فعليًا: كارفور الشروق وكارفور العبور — التسوق الأسبوعي الكامل محسوب بالدقائق لا بالمشاوير."],
  ["المنطقة الخدمية المركزية العملاقة على خطوتين",
   "بين الحي 25 وجاره الحي 24 تتوسط منطقة خدمية مركزية عملاقة: مساحات خضراء شاسعة وحدائق مركزية بنوافير وممشى، ومناطق تجارية ومولات وبنوك ومستشفيات، يحيط بها حزام أخضر — قلب خدمات نابض يخدم الحيين معًا ويرفع قيمتهما مع كل اكتمال."],
  ["ارتفاعات منخفضة: أرضي + 4 فقط",
   "بينما باقي العبور أرضي + 5 أدوار، الحي 25 أرضي + 4 فقط. دور واحد أقل يعني كثافة أخف وخصوصية أكبر وإطلالات مفتوحة — الطابع الراقي يبدأ من هنا."],
];

const DEV_BODY = `
<p>من أبرز المطورين العقاريين العاملين في الحي 25 والعبور الجديدة: <strong>عوده للتطوير العقاري</strong> — الشركة المصرية التي يقودها المهندس خالد عوده، بأرقامها المنشورة على موقعها الرسمي: <strong>1,065 وحدة مسلّمة</strong> (منها 1,056 سكنية) وأكثر من <strong>130 مبنى وقطعة أرض</strong> في العبور — سجل تسليم موثق في العبور الأم قبل الجديدة، وذراع إنشائية تعمل في المقاولات لا بالاسم فقط.</p>
<p><strong>وفي أبريل 2026 أصبحت عوده كيانًا مصريًا-سعوديًا:</strong> تحالف مع برافو السعودية (19 مشروعًا سياديًا بـ 1.75 مليار ريال) باستثمارات مستهدفة تتجاوز 50 مليار جنيه حتى 2029 — وأول مشاريع الكيان: مجتمع سكني متكامل على 15 فدانًا في العبور الجديدة بنسبة بنائية ≤25%. <a href="/ouda-bravo-partnership/">تغطية الشراكة الكاملة</a>.</p>
<h3>كناري — مشروع عوده بالمنطقة</h3>
<p>ومن أحدث إطلاقاتها مشروع <strong>كناري</strong>: فيلات تاون هاوس فاخرة (5 غرف نوم + حديقة خاصة) بتصميمات حديثة تناسب طابع الحي منخفض الكثافة — خيار من يبحث عن فيلا جاهزة في أرقى أحياء العبور الجديدة. التفاصيل في صفحة <a href="/compounds/canary/">كناري</a> بدليلنا، وقائمة <a href="/developers-directory/">كل شركات التطوير</a> للمقارنة.</p>
<p class="caption">قبل التعاقد مع أي مطور — كبيرًا كان أو صاعدًا — طبّق قواعد التحقق الخمس في <a href="/buying-guide/">دليل الشراء</a>: زر مشروعًا مسلّمًا واسأل سكانه.</p>`;

function main() {
  const chrome = loadChrome();
  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: { "@type": "Place", name: "الحي 25، مدينة العبور الجديدة، القليوبية" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "أحياء العبور الجديدة", item: SITE + "/new-obour-districts/" },
      { "@type": "ListItem", position: 3, name: "الحي 25", item: url } ] },
    { "@context": "https://schema.org", "@type": "Place", name: "الحي 25 — العبور الجديدة",
      description: "حي سكني منخفض الكثافة (أرضي+4) في مدينة العبور الجديدة، قرب الدائري الأوسطي ومدينتي والشروق.",
      containedInPlace: { "@type": "City", name: "مدينة العبور الجديدة" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({
      "@type": "Question", name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() } })) },
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });

  const reasons = REASONS.map(([t, b]) => `<h3>${t}</h3><p>${b}</p>`).join("\n");
  const faqHtml = FAQ.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("");
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li><li class="sep">›</li><li><span aria-current="page">الحي 25</span></li></ol></div></nav>`;

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ العبور الجديدة · دليل الأحياء</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="64">
<p>اسأل أي متابع لسوق شرق القاهرة عن أسرع أحياء العبور الجديدة جاذبية، وسيذكر <strong>الحي 25</strong> (ويطلق عليه السكان أيضًا: <strong>حي جاردن سيتي العبور</strong>، و<strong>حي البشوات</strong>، و<strong>حي عوده</strong>). ليس ادعاءً — بل معادلة موقع نادرة: حي منخفض الكثافة (أرضي + 4 أدوار فقط) يقف على مفترق ثلاث مدن كبرى: مدينتي والشروق والعاصمة الإدارية، وبين كارفورين من أكبر هايبرات المنطقة — وتتوسطه وجاره منطقة خدمية مركزية عملاقة بحدائق ومولات وبنوك ومستشفيات وحزام أخضر. هذه هي الأسباب بالتفصيل.</p>
<h2>لماذا الحي 25؟ ستة أسباب</h2>
${reasons}

<h2>خريطة الحي 25 بالتفصيل</h2>
<figure style="margin:1.5rem 0"><a href="/infographics/hay-25-district-map.webp" target="_blank" rel="noopener"><img src="/infographics/hay-25-district-map.webp" alt="خريطة الحي 25 (جاردن سيتي العبور) بالتفصيل من المخطط الرسمي للعبور الجديدة" width="1600" height="1600" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px;border:1px solid #e3ddd0"></a><figcaption class="caption" style="text-align:center;margin-top:.5rem">خريطة الحي 25 من المخطط التفصيلي الرسمي — انقر للتكبير · <a href="/downloads/obour-new-obour-master-plan.dwg">ملف الأوتوكاد الكامل DWG</a></figcaption></figure>
<h2>طابع السكن: كثافة أخف تعني حياة أهدأ</h2>
<p>قاعدة «أرضي + 4» لا تبدو فارقًا كبيرًا على الورق، لكنها على الأرض تعني: عمارات أقل في الشارع، جيران أقل في العقار، ظلال أقل على الشرفات، وانتظار أقصر لكل شيء. هذا هو الفارق بين حي «سكني كثيف» وحي «سكني راقٍ» — والحي 25 اختار الثاني.</p>
<h2>الخدمات اليوم: الصدق أولًا</h2>
<p>الحي في مرحلة نمو متسارعة — خدماته الذاتية تكتمل تباعًا مع زيادة السكان، وهذه طبيعة كل المدن الجديدة. لكنه الحي الوحيد تقريبًا الذي لا يدفع ثمن حداثته يوميًا: <strong>كارفور الشروق وكارفور العبور</strong> للتسوق، وخدمات <strong>مدينتي</strong> الناضجة (أقل من 10 دقائق)، ومدارس ومستشفيات <strong>الشروق</strong> الجارة — كلها تعمل كامتداد للحي حتى تكتمل خدماته الذاتية. تابع الحالة الحية في <a href="/tracker/">متابعة العبور الجديدة</a>.</p>
<h2>المطورون في الحي: وأبرزهم عوده</h2>
${DEV_BODY}
<h2>الحي 25 مقابل البدائل — نظرة سريعة</h2>
<div class="table-wrap"><table><thead><tr><th></th><th>الحي 25</th><th>باقي العبور الجديدة</th><th>العبور القديمة</th></tr></thead><tbody><tr><td>الارتفاعات</td><td><strong>أرضي + 4</strong></td><td>متنوعة</td><td>أرضي + 5</td></tr><tr><td>مدينتي</td><td><strong>&lt; 10 دقائق</strong></td><td>أبعد</td><td>أبعد</td></tr><tr><td>الدائري الأوسطي / R2</td><td><strong>على دقائق</strong></td><td>متفاوت</td><td>يحتاج وصلة</td></tr><tr><td>الخدمات الناضجة</td><td>عبر الجيران (كارفور × 2، مدينتي، الشروق)</td><td>تتكوّن</td><td><strong>ناضجة في المكان</strong></td></tr></tbody></table></div>
<h2>الأسئلة الشائعة</h2>
<div class="faq-block">${faqHtml}</div>
</article><aside class="action-card"><p>تسكن في الحي 25؟</p><a class="button" href="/corrections/">حدّثنا بمعلومة موثقة ↖</a><a class="text-link" href="/new-obour-districts/">كل أحياء العبور الجديدة ↖</a><a class="text-link" href="/prices/">الأسعار الحالية ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li><li><a href="/beit-watan-obour/">بيت الوطن (الحي 24)</a></li><li><a href="/compounds/canary/">كناري — عوده</a></li><li><a href="/carrefour-obour/">كارفور العبور</a></li><li><a href="/middle-ring-road-obour/">الدائري الأوسطي</a></li><li><a href="/tracker/">متابعة العبور الجديدة</a></li><li><a href="/prices/">الأسعار</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, SLUG);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log(`[phase64] /${SLUG}/ — الحي 25: أرقى أحياء العبور الجديدة`);
}

main();
