/**
 * seo-phase10d-comparisons.mjs
 * المرحلة 10d: صفحات مقارنة إضافية من البيانات المنشورة.
 *
 * تنشئ:
 *   /compare/district-3-vs-district-7/
 *   /compare/district-24-vs-district-25/
 *   /compare/sundus-vs-safari/
 *   /compare/glory-gardens-vs-golf-city/
 *
 * وتضيف روابط سياقية في /compare/ index (idempotent باستخدام marker).
 *
 * المبادئ:
 *   - idempotent: تُعاد كتابة الصفحات بالكامل كل run.
 *   - لا أرقام مخترعة؛ كل البيانات مأخوذة من الصفحات/البيانات المنشورة.
 *   - الفراغات تُملأ بـ «غير منشور» أو «تحقق من المطور».
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

// -----------------------------------------------------------------------------
// Chrome: استعارة الهيكل من صفحة من نحن
// -----------------------------------------------------------------------------
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
    name: "دليل العبور والعبور الجديدة",
    url: SITE + "/",
    logo: "https://obourguide.com/brand/logo.png",
    foundingDate: "2026",
    publishingPrinciples: SITE + "/editorial-policy/",
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

function faqBlock(questions) {
  const items = questions.map((q) => ({
    "@type": "Question",
    name: q.q,
    acceptedAnswer: { "@type": "Answer", text: q.a },
  }));
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items };
}

function breadcrumb(name, url) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "مقارنة المدن", item: SITE + "/compare/" },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };
}

function buildTable(rows) {
  const head = rows[0];
  const body = rows.slice(1);
  return `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function buildPage(chrome, page) {
  const url = `${SITE}/compare/${page.slug}/`;
  const schemas = [
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.h1,
      url,
      description: page.description,
      inLanguage: "ar-EG",
      datePublished: DEFAULT_LASTMOD,
      dateModified: DEFAULT_LASTMOD,
      publisher: { "@id": SITE + "/#org" },
    },
    breadcrumb(page.h1, url),
    faqBlock(page.faq),
  ];
  const head = buildHead(chrome.head, { title: page.title, description: page.description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/compare/">مقارنة المدن</a><span>/</span><span>${page.h1}</span></div></nav>`;
  const linksHtml = page.links.map((l) => `<a class="button" href="${l.url}">${l.text} ↖</a>`).join("");
  const faqHtml = `<div class="faq-block">${page.faq.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("")}</div>`;
  const main = `<main id="content"><section class="wrap"><h1>${page.h1}</h1><div class="lead"><p>${page.intro
    .replace(/\n\n/g, "</p><p>")}</p></div><h2>جدول المقارنة</h2>${buildTable(page.table)}<p class="caption">المقارنة تعتمد على بيانات منشورة ومنهجية تحقق عملي. لا تستخدم كبديل عن معاينة المشروع أو مراجعة العقد.</p><div class="action-card"><p>اقرأ الصفحات المختصة</p>${linksHtml}</div><h2>أسئلة شائعة</h2>${faqHtml}</section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

// -----------------------------------------------------------------------------
// بيانات المقارنات — مأخوذة من الصفحات والبيانات المنشورة
// -----------------------------------------------------------------------------
const PAGES = [
  {
    slug: "district-3-vs-district-7",
    title: "الحي الثالث vs الحي السابع في العبور الجديدة: مقارنة منهجية",
    h1: "الحي الثالث مقابل الحي السابع في العبور الجديدة",
    description:
      "مقارنة منهجية بين الحي الثالث والحي السابع في العبور الجديدة: النطاق، الخدمات، المدارس المنشورة، وما يجب معاينته قبل الشراء.",
    intro: `الحي الثالث والحي السابع يندرجان ضمن «الأحياء المرقّمة 1–9» في العبور الجديدة. البيانات المنشورة تصنّف هذا النطاق بأن مرحلته «خدمات قائمة» وأنه يناسب «انتقال أسرع وسكن عملي».

لكن التشابه العام لا يعني تطابق التفاصيل؛ كل حي يضم شوارع ومشاريع في حالات مختلفة. ما ورد أدناه يربطك بالصفحات المنشورة ويبيّن الفروق المنشورة فقط، دون اختلاق أرقام أو تفضيل حي على آخر.`,
    table: [
      ["المعيار", "الحي الثالث", "الحي السابع", "ما تتحقق منه"],
      ["النطاق", "الأحياء المرقّمة 1–9", "الأحياء المرقّمة 1–9", "الموقع الفعلي للمشروع داخل الحي"],
      ["المرحلة المنشورة", "خدمات قائمة", "خدمات قائمة", "حالة الشارع المحدد وليس الحي بأكمله"],
      ["الهدف المناسب", "انتقال أسرع وسكن عملي", "انتقال أسرع وسكن عملي", "هل يناسب جدولك الزمني؟"],
      ["مدرسة منشورة بالقرب", "المدرسة الرسمية الدولية بالعبور (IPS) — الحي الثالث قطعة 2", "المدرسة المصرية اليابانية بالعبور (EJS) — الحي السابع بعد كارفور العبور", "تحقق من المسافة من باب المشروع"],
      ["حالة الشوارع والمرافق", "تختلف حسب الشارع المحدد", "تختلف حسب الشارع المحدد", "زيارة ميدانية في وقت الذروة"],
      ["الإحداثيات الرسمية للحي", "غير منشور", "غير منشور", "مصادر هيئة المجتمعات العمرانية"],
    ],
    links: [
      { url: "/districts/district-3/", text: "دليل الحي الثالث" },
      { url: "/districts/district-7/", text: "دليل الحي السابع" },
      { url: "/schools/international-public-school-obour/", text: "المدرسة الرسمية الدولية" },
      { url: "/schools/egyptian-japanese-school-obour/", text: "المدرسة المصرية اليابانية" },
    ],
    faq: [
      {
        q: "أي الحيين أقرب للخدمات اليومية؟",
        a: "لا يوجد جواب مطلق. القرب يتحدد بالشارع المحدد لا بالحي بأكمله. قِس زمن الوصول من باب المشروع إلى أقرب صيدلية ومستشفى وسوبرماركت.",
      },
      {
        q: "هل يكفي اسم الحي للحكم على جودة السكن؟",
        a: "لا. داخل نفس النطاق 1–9 توجد شوارع متفاوتة في نضج المرافق. المعاينة الميدانية هي المعيار الوحيد الموثوق.",
      },
      {
        q: "ما هو غير منشور حاليًا عن الحيين؟",
        a: "حدود القطع والشوارع الداخلية، توزيع المشاريع السكنية حسب الشارع، والإحداثيات الجغرافية الرسمية. نترك هذه الحقول غير منشورة بدل اختلاق بيانات.",
      },
    ],
  },
  {
    slug: "district-24-vs-district-25",
    title: "حي 24 بيت الوطن vs حي 25 الإسكان الفاخر: مقارنة منهجية",
    h1: "حي 24 بيت الوطن مقابل حي 25 الإسكان الفاخر",
    description:
      "مقارنة منهجية بين حي 24 بيت الوطن وحي 25 الإسكان الفاخر في العبور الجديدة: المرحلة، الهدف، الخدمات، وما يجب التحقق منه قبل الشراء.",
    intro: `حي 24 (بيت الوطن) وحي 25 (الإسكان الفاخر) يمثلان نطاقين مختلفين في العبور الجديدة. الحي 24 في مرحلة «طرح وتوسع» ويستهدف الباحث عن أرض أو شراء مبكر، مع مناطق متصلة بمحور R2. الحي 25 في مرحلة «نمو متسارع»، قريب نسبيًا من الدائري الأوسطي، ويضم طروحات حديثة مثل مشروع كناري (عوده للتطوير العقاري) بنسبة بناء 25% بحسب البيانات المنشورة.

المقارنة أدناه لا تُفضّل حيًا على آخر؛ بل تُبيّن المعايير المنشورة التي تختلف حسب هدفك الزمني ومستوى المخاطرة الذي تقبله.`,
    table: [
      ["المعيار", "حي 24 · بيت الوطن", "حي 25 · الإسكان الفاخر", "ما تتحقق منه"],
      ["النطاق", "الحي 24 · بيت الوطن", "الحي 25 · الإسكان الفاخر", "الموقع الفعلي للقطعة أو المشروع"],
      ["المرحلة المنشورة", "طرح وتوسع", "نمو متسارع", "موعد توصيل المرافق المكتوب"],
      ["الهدف المناسب", "باحث عن أرض أو شراء مبكر", "سكن طويل الأجل أو استثمار متوسط الأجل", "مدى قبولك لانتظار اكتمال الخدمات"],
      ["المحور / الوصول المنشور", "مناطق متصلة بمحور R2", "قرب نسبي من الدائري الأوسطي", "قياس الرحلة في وقت الذروة"],
      ["مشروع معلن في النطاق", "غير منشور", "كناري (عوده للتطوير العقاري) — نسبة بناء 25%", "الموقع الدقيق داخل الحي"],
      ["حالة الخدمات", "تحتاج مراجعة دقيقة للموقع والمرافق وتوقيت التنفيذ", "افصل بين مرحلة التطوير والخدمات القائمة", "توفر المياه والكهرباء والصرف والطرق"],
      ["الإحداثيات الرسمية للحدود", "غير منشور", "غير منشور", "مصادر هيئة المجتمعات العمرانية"],
    ],
    links: [
      { url: "/districts/district-24-bet-el-watan/", text: "دليل حي 24 بيت الوطن" },
      { url: "/districts/district-25/", text: "دليل حي 25 الإسكان الفاخر" },
      { url: "/compounds/canary/", text: "صفحة كمبوند كناري" },
      { url: "/developers/ouda/", text: "بيانات مطور عوده" },
    ],
    faq: [
      {
        q: "أي الحيين أنسب للسكن الفوري؟",
        a: "لا يمكن الجزم من البيانات المنشورة. في كلتا الحالتين يجب التحقق من توفر المياه والكهرباء والصرف والطرق في الشارع المحدد، لا في الحي بأكمله.",
      },
      {
        q: "هل حي 25 أفضل استثمارًا من حي 24؟",
        a: "لا توجد توصية استثمارية هنا. الاختلاف في المرحلة والمحور لا يضمن عائدًا. احسب التكلفة الكلية، مخاطر التأخير، والسيولة قبل أي قرار.",
      },
      {
        q: "ما الفرق الجوهري بين بيت الوطن والإسكان الفاخر؟",
        a: "حي 24 بيت الوطن يُعرّف بالطرح والتوسع ويرتبط بمحور R2. حي 25 الإسكان الفاخر يُعرّف بالنمو المتسارع والقرب من الدائري الأوسطي. لكن التجربة الفعلية تختلف داخل كل حي.",
      },
    ],
  },
  {
    slug: "sundus-vs-safari",
    title: "سندس vs سفاري في العبور الجديدة: مقارنة منهجية",
    h1: "سندس مقابل سفاري في العبور الجديدة",
    description:
      "مقارنة منهجية بين كمبوند سندس وكمبوند سفاري في العبور الجديدة: المطور، البيانات المنشورة، والأسئلة التي يجب طرحها قبل الحجز.",
    intro: `سندس وسفاري مشروعان معلنان من «عوده للتطوير العقاري» في العبور الجديدة. الصفحات المنشورة لكل مشروع تتطابق في معظم الحقول: المطور واحد، الحي/الموقع غير منشور، الحالة «مشروع معلن»، والمصدر موقع عوده.

هذا التشابه لا يعني أن الوحدتين متشابهتان، بل يعني أن البيانات الكافية للمقارنة لم تنشر بعد. أدناه نستعرض ما هو منشور وما يجب التحقق منه قبل أي قرار.`,
    table: [
      ["المعيار", "سندس", "سفاري", "ما تتحقق منه"],
      ["المطور", "عوده للتطوير العقاري", "عوده للتطوير العقاري", "سابقة أعمال المطور والعقود النموذجية"],
      ["الحي / الموقع", "غير منشور", "غير منشور", "موقع القطعة على المخطط الرسمي"],
      ["الحالة", "مشروع معلن", "مشروع معلن", "نسبة الإنجاز الفعلية والزيارة الميدانية"],
      ["نسبة البناء المنشورة", "غير منشور", "غير منشور", "المخطط المعتمد والعقد"],
      ["رسوم الإدارة والصيانة", "غير منشورة", "غير منشورة", "طلب الرقم مكتوبًا في العقد"],
      ["المصدر", "موقع عوده للتطوير العقاري — مراجعة أغسطس 2026", "موقع عوده للتطوير العقاري — مراجعة أغسطس 2026", "التحقق من صفحة المشروع على الموقع الرسمي"],
      ["العلاقة التحريرية", "دليل العبور يرتبط بعلاقة مع مطوّر المشروع", "دليل العبور يرتبط بعلاقة مع مطوّر المشروع", "قراءة صفحة الإفصاح"],
    ],
    links: [
      { url: "/compounds/sundus/", text: "صفحة كمبوند سندس" },
      { url: "/compounds/safari/", text: "صفحة كمبوند سفاري" },
      { url: "/developers/ouda/", text: "بيانات مطور عوده" },
      { url: "/disclosure/", text: "صفحة الإفصاح والشفافية" },
    ],
    faq: [
      {
        q: "أي المشروعين أفضل؟",
        a: "لا يمكن تحديد ذلك من البيانات المنشورة. الاختيار يعتمد على موقع الوحدة الفعلي، التشطيب، نظام السداد، والعقد. زُر الموقع واطلب بيانات مكتوبة.",
      },
      {
        q: "لماذا الموقع غير منشور للمشروعين؟",
        a: "المطور لم ينشر حتى الآن الحي أو الموقع الدقيق لكل مشروع على صفحته. نترك الحقل «غير منشور» بدل تخمين أو اختلاق إحداثيات.",
      },
      {
        q: "هل وجود نفس المطور يعني نفس جودة التنفيذ؟",
        a: "لا بالضرورة. حتى داخل مشروعات شركة واحدة قد تختلف التجربة حسب الموقع والفريق المنفذ والتوقيت. راجع مشروعًا مُسلّمًا للشركة إن أمكن.",
      },
    ],
  },
  {
    slug: "glory-gardens-vs-golf-city",
    title: "جلوري جاردنز vs جولف سيتي في العبور الجديدة: مقارنة منهجية",
    h1: "جلوري جاردنز مقابل جولف سيتي",
    description:
      "مقارنة منهجية بين كمبوند جلوري جاردنز وكمبوند جولف سيتي: المطور، الموقع المنشور، المصدر، وما يجب التحقق منه قبل القرار.",
    intro: `جلوري جاردنز وجولف سيتي مشروعان معلنان في العبور الجديدة ومحيطها، لكنهما من مطورين مختلفين ومصادر مختلفة. جلوري جاردنز من «إيجل جروب للتطوير العقاري»، والموقع المنشور «العبور الجديدة» دون حي محدد، والمصادر صحفية ووسيطة لعدم وجود موقع رسمي ظاهر. جولف سيتي من «إبداع للتطوير العقاري»، والموقع المنشور «العبور ومجتمعاته»، والمصدر موقع إبداع الرسمي.

لا تكفي هذه البيانات لتفضيل مشروع على آخر؛ بل تُستخدم لتحديد الأسئلة التي يجب طرحها قبل أي التزام.`,
    table: [
      ["المعيار", "جلوري جاردنز", "جولف سيتي", "ما تتحقق منه"],
      ["المطور", "إيجل جروب للتطوير العقاري", "إبداع للتطوير العقاري", "سابقة الأعمال وجهة الإدارة بعد التسليم"],
      ["الموقع المنشور", "العبور الجديدة", "العبور ومجتمعاته", "العنوان الفعلي والحي الدقيق"],
      ["الحي / الموقع الدقيق", "غير منشور", "غير منشور", "موقع القطعة على المخطط الرسمي"],
      ["الحالة", "مشروع معلن", "مشروع معلن", "نسبة الإنجاز والزيارة الميدانية"],
      ["الموقع الرسمي / المصدر", "مصادر صحفية ووسيطة — لا يوجد موقع رسمي ظاهر", "موقع إبداع للتطوير العقاري الرسمي المنشور", "التحقق من المصدر قبل الاعتماد على أي بيان"],
      ["نسبة البناء المنشورة", "غير منشور", "غير منشور", "المخطط المعتمد والعقد"],
      ["رسوم الإدارة والصيانة", "غير منشورة", "غير منشورة", "طلب الرقم مكتوبًا في العقد"],
    ],
    links: [
      { url: "/compounds/glory-gardens/", text: "صفحة جلوري جاردنز" },
      { url: "/compounds/golf-city/", text: "صفحة جولف سيتي" },
      { url: "/developers/eagle/", text: "بيانات إيجل جروب" },
      { url: "/developers/ebdaa/", text: "بيانات إبداع للتطوير" },
    ],
    faq: [
      {
        q: "أي المشروعين أقرب للعبور الجديدة؟",
        a: "الموقع المنشور لجلوري جاردنز هو «العبور الجديدة»، ولجولف سيتي «العبور ومجتمعاته». لكن بدون موقع دقيق لا يمكن تحديد الأقرب لنقطة معينة. اطلب العنوان الفعلي.",
      },
      {
        q: "هل وجود موقع رسمي للمطور يضمن دقة بيانات المشروع؟",
        a: "لا. الموقع الرسمي يعني فقط أن المصدر مباشر. يجب التحقق من العقد النموذجي، موقع القطعة، وجهة الإدارة بشكل مستقل.",
      },
      {
        q: "ما هو غير منشور عن المشروعين؟",
        a: "الحي/الموقع الدقيق، الإحداثيات الجغرافية، نسبة البناء، رسوم الإدارة، والعقد النموذجي. نترك هذه الحقول غير منشورة بدل اختلاق بيانات.",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// إضافة روابط سياقية في /compare/ index (idempotent)
// -----------------------------------------------------------------------------
function addCompareIndexLinks() {
  const indexFile = path.join(clientDir, "compare", "index.html");
  if (!fs.existsSync(indexFile)) {
    rep("warn", "لم يُعثر على /compare/index.html؛ تم تخطي إضافة الروابط.");
    return;
  }
  const marker = "<!-- phase10d-comparisons-links -->";
  let html = fs.readFileSync(indexFile, "utf8");
  if (html.includes(marker)) {
    rep("index-links", "روابط /compare/ موجودة مسبقًا؛ تُخطّى.");
    return;
  }
  const newLinks = `
<p>مقارنات إضافية: <a href="/compare/district-3-vs-district-7/">الحي الثالث مقابل الحي السابع</a> · <a href="/compare/district-24-vs-district-25/">حي 24 بيت الوطن مقابل حي 25 الإسكان الفاخر</a> · <a href="/compare/sundus-vs-safari/">سندس مقابل سفاري</a> · <a href="/compare/glory-gardens-vs-golf-city/">جلوري جاردنز مقابل جولف سيتي</a>${marker}</p>`;
  // أضف بعد الفقرة الحالية لـ phase9-internal-links
  html = html.replace(
    /(<p>أدلة فرعية ذات صلة: [^<]*<a href="\/compare\/district-1-vs-district-5\/">[^<]*<\/a> · <a href="\/compare\/canary-vs-solana\/">[^<]*<\/a><\/p>)/,
    `$1${newLinks}`
  );
  fs.writeFileSync(indexFile, html);
  rep("index-links", "أُضيفت روابط للمقارنات الأربع الجديدة في /compare/ index.");
}

// -----------------------------------------------------------------------------
// التحقق: الروابط الداخلية وعدد الكلمات
// -----------------------------------------------------------------------------
function resolveInternalLink(href) {
  // تجاهل الروابط الخارجية والمراسي والهاتف/بريد
  if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }
  // تجاهل الأصول الثابتة المعروفة
  if (href.startsWith("/static/") || href.startsWith("/brand/") || href.startsWith("/images/")) {
    return null;
  }
  let p = href;
  // إزالة الـ query/hash
  p = p.split("?")[0].split("#")[0];
  // إضافة clientDir ومعالجة trailing slash
  const target = path.join(clientDir, p);
  if (p.endsWith("/")) {
    return path.join(target, "index.html");
  }
  // بدون trailing slash قد يكون ملفًا أو مجلدًا
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    return path.join(target, "index.html");
  }
  return target;
}

function verifyPage(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const slug = path.relative(clientDir, filePath).replace(/index\.html$/, "").replace(/\/$/, "");
  const url = `${SITE}/${slug}/`;

  // عدد الكلمات داخل <main>
  const mainMatch = html.match(/<main id="content">([\s\S]*?)<\/main>/);
  let wordCount = 0;
  if (mainMatch) {
    const text = mainMatch[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // للعربية: نفصل بالمسافات ثم نحسب الرموز العربية المنفصلة ككلمات
    const tokens = text.split(/\s+/).filter((t) => t.length > 0);
    // عدد الحروف العربية المتصلة كتقريب أدق للكلمات العربية
    const arabicWords = (text.match(/[\u0600-\u06FF]+/g) || []).length;
    wordCount = arabicWords || tokens.length;
  }

  // فحص الروابط الداخلية
  const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  const broken = [];
  for (const href of new Set(hrefs)) {
    const target = resolveInternalLink(href);
    if (!target) continue;
    if (!fs.existsSync(target)) {
      broken.push({ href, target: path.relative(root, target) });
    }
  }

  return { url, wordCount, broken };
}

function verify() {
  const results = [];
  for (const page of PAGES) {
    const file = path.join(clientDir, "compare", page.slug, "index.html");
    results.push(verifyPage(file));
  }
  rep("verify", "=== تقرير التحقق ===");
  for (const r of results) {
    rep("verify", `${r.url} — ${r.wordCount} كلمة — روابط مكسورة: ${r.broken.length}`);
    for (const b of r.broken) {
      rep("verify", `  ✗ ${b.href} → ${b.target}`);
    }
  }
}

// -----------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  for (const page of PAGES) {
    const outDir = path.join(clientDir, "compare", page.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), buildPage(chrome, page), "utf8");
    rep("page", `/${page.slug}/ أُنشئت`);
  }
  addCompareIndexLinks();
  verify();

  console.log("=== تقرير المرحلة 10d: صفحات المقارنات الإضافية ===");
  for (const line of report) console.log(line);
}

main();
