/**
 * seo-phase55-trend-articles-20260905.mjs
 * المرحلة 55 — موجة التغطيات الرائجة (5 سبتمبر 2026):
 *  1) /rent-to-own-september-2026/ — طرح الإيجار التمليكي (20 سبتمبر) وفالي تاورز العبور الجديدة.
 *  2) /cbe-rate-sep-2026-property/ — سيناريوهات قرار البنك المركزي 24 سبتمبر وأثرها على العقار.
 *  3) /cityscape-egypt-2026-guide/ — دليل الزائر الجاد لسيتي سكيب مصر 2026 (30 سبتمبر–3 أكتوبر).
 * ومعها:
 *  - تحديث /rent-to-own-obour/ بمستجد الطرح (بدل إنشاء URL منافس — منعًا للتنافس الداخلي).
 *  - روابط داخلية من صفحات «أدلة ذات صلة» القريبة موضوعيًا.
 *  - حقن العناوين الجديدة في sitemap.xml وsearch-index.json (idempotent).
 *
 * كل المحتوى يفصل «الخبر» عن «قراءة الدليل»، ويعلن تاريخه بوضوح، ولا يدّعي مشاركة أي مطوّر بعينه في أي حدث.
 * idempotent بالكامل: آمن على إعادة التشغيل في كل build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const SITE = "https://obourguide.com";
const TODAY = "2026-09-05";
const TODAY_AR = "5 سبتمبر 2026";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

/* ------------------------------------------------------------------ */
/* chrome: الرأس/الترويسة/الذيل من صفحة مانحة (نفس أسلوب المرحلة 28)      */
/* ------------------------------------------------------------------ */
function loadChrome() {
  const donorPath = path.join(clientDir, "about-us", "index.html");
  const donor = fs.readFileSync(donorPath, "utf8");
  const head = donor.match(/<head>[\s\S]*?<\/head>/)[0];
  const header = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
  const footer = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];
  return { head, header, footer };
}

function buildHead(chromeHead, { title, description, url, schemas }) {
  let head = chromeHead;
  const safeReplace = (re, val, label) => {
    if (re.test(head)) head = head.replace(re, val);
    else rep("WARN", `head marker missing (${label}) — left as donor`);
  };
  safeReplace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, "title");
  safeReplace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, "description");
  safeReplace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, "canonical");
  safeReplace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`, "og:title");
  safeReplace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, "og:description");
  safeReplace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, "og:url");
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  if (/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/.test(head)) {
    head = head.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  } else {
    head = head.replace("</head>", `${ld}</head>`);
  }
  return head;
}

const orgSchema = {
  "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
  name: "دليل العبور والعبور الجديدة", url: SITE + "/", logo: SITE + "/brand/logo.png",
  foundingDate: "2026", publishingPrinciples: SITE + "/editorial-policy/",
};

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  };
}

function breadcrumbHtml(items) {
  const parts = [];
  items.forEach(([name, href], i) => {
    const last = i === items.length - 1;
    if (i) parts.push(`<li class="sep">›</li>`);
    parts.push(last ? `<li><span aria-current="page">${name}</span></li>` : `<li><a href="${href}">${name}</a></li>`);
  });
  return `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${parts.join("")}</ol></div></nav>`;
}

function pageShell(chrome, { title, description, slug, schemas, crumbs, heroTags, h1, lede, articleHtml, related, aside }) {
  const url = `${SITE}/${slug}/`;
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const hero = `<section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block">${heroTags.map((t, i) => `<span class="tag"${i ? ' style="margin-inline-start:.4rem"' : ""}>${t}</span>`).join("")}<h1>${h1}</h1><p>${lede}</p></div></div></section>`;
  const rel = related?.length
    ? `<section class="section" data-related="54"><div class="wrap"><h2>أدلة ذات صلة</h2><ul>${related.map(([href, a]) => `<li><a href="${href}">${a}</a></li>`).join("")}</ul></div></section>`
    : "";
  const asideHtml = aside || `<aside class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a><a class="text-link" href="/updates/">تحديثات الدليل ↖</a></aside>`;
  const main = `<main>${hero}<section class="section"><div class="wrap content-grid"><article>${articleHtml}</article>${asideHtml}</div></section>${rel}</main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml(crumbs)}${main}${chrome.footer}</body></html>`;
}

function faqHtml(faqs) {
  return `<h2>أسئلة شائعة</h2><div class="faq-block">${faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`;
}
function faqSchema(faqs) {
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })),
  };
}

/* ------------------------------------------------------------------ */
/* الصفحة 1 — طرح الإيجار التمليكي سبتمبر 2026                          */
/* ------------------------------------------------------------------ */
const RTO_FAQS = [
  ["هل العبور الجديدة ضمن طرح الإيجار التمليكي؟",
   "وفق تغطية Invest-Gate في 25 أغسطس 2026، تفقّد نائب رئيس هيئة المجتمعات العمرانية للتنمية والإنشاء مشروع فالي تاورز في العبور الجديدة كأحد المواقع المقرر طرحها بنظام الإيجار التمليكي. التفاصيل الملزمة — عدد الوحدات بالمدينة والأسعار — تصدر مع الإعلان الرسمي وكراسة الشروط."],
  ["ما الشروط العامة المعلنة للتقديم؟",
   "حسب التصريحات المنشورة: السن من 21 إلى 45 عامًا، أهلية قانونية كاملة للتعاقد، وعدم امتلاك المتقدم أو زوجته أو أولاده القصر وحدة سكنية أو قطعة أرض سابقة سواء مدعومة أو غير مدعومة. التخصيص بقرعة علنية، و5% من الوحدات للأشخاص ذوي الإعاقة، ومدة الإيجار التمليكي 20 عامًا من الاستلام. حدود الدخل والإيجارات تُعلن في كراسة الشروط."],
  ["متى يصدر الإعلان الرسمي وكراسة الشروط؟",
   "نقلت صحف قومية عن وزارة الإسكان أن الطرح الرسمي يبدأ 20 سبتمبر 2026، على أن تصدر كراسة الشروط بتفاصيل المدن والوحدات والإيجارات وحدود الدخل قبل الطرح. المصدر الوحيد الملزم هو الإعلان الرسمي للوزارة وهيئة المجتمعات العمرانية — ونحدّث هذه الصفحة فور صدوره."],
];

const PAGE_RTO = {
  slug: "rent-to-own-september-2026",
  title: "طرح الإيجار التمليكي سبتمبر 2026: فالي تاورز العبور الجديدة والشروط | دليل العبور",
  description: "ما تأكد حتى 5 سبتمبر 2026 عن طرح الإيجار التمليكي: 5 آلاف وحدة في نحو 25 مدينة جديدة بينها فالي تاورز بالعبور الجديدة، الشروط العامة، وكيف تستعد قبل الإعلان الرسمي المنتظر 20 سبتمبر.",
  h1: "طرح الإيجار التمليكي — سبتمبر 2026: العبور الجديدة على الخريطة",
  lede: "أول طرح حكومي بنظام الإيجار التمليكي يقترب، والعبور الجديدة بين مواقعه المعلنة. هذا التقرير يفصل المؤكد عن المتوقع، ويضع خطوات الاستعداد قبل 20 سبتمبر — بمصادر منشورة وتاريخ واضح.",
  heroTags: ["⌖ مستجد رسمي", `✓ بتاريخ ${TODAY_AR}`],
  crumbs: [["الرئيسية", "/"], ["أخبار المدينة", "/news/"], ["طرح الإيجار التمليكي سبتمبر 2026", "/rent-to-own-september-2026/"]],
  related: [
    ["/rent-to-own-obour/", "الإيجار المنتهي بالتملك في العبور — الدليل الكامل"],
    ["/social-housing-obour/", "الإسكان الاجتماعي في العبور"],
    ["/sakan-misr-obour/", "سكن مصر في العبور"],
    ["/mortgage-vs-rent-obour/", "الشراء أم الإيجار؟ الحساب الصادق"],
    ["/new-projects-watch/", "رصد المشروعات الجديدة"],
  ],
  article: `
<p><small>نُشر: ${TODAY_AR} · يُحدَّث فور صدور الإعلان الرسمي وكراسة الشروط.</small></p>
<p>تستعد وزارة الإسكان والمرافق والمجتمعات العمرانية لطرح أول حزمة وحدات بنظام <strong>الإيجار التمليكي</strong> — تسكن الوحدة بإيجار شهري يُحسب جزء منه في ثمن التمليك على مدى عشرين عامًا. والأهم لمتابعي العبور: مشروع <strong>فالي تاورز في العبور الجديدة</strong> ظهر ضمن المواقع المعلنة استعدادًا للطرح.</p>

<h2>المؤكد حتى الآن — الخبر</h2>
<ul>
<li>الوزارة تجهّز نحو <strong>5 آلاف وحدة سكنية جاهزة</strong> بنظام الإيجار التمليكي عبر هيئة المجتمعات العمرانية الجديدة، موزعة على نحو <strong>25 مدينة جديدة</strong>، بمدة تصل إلى 20 عامًا من تاريخ الاستلام، وتخصيص بقرعة علنية بين المستوفين للشروط — وفق تصريحات منشورة مطلع أغسطس 2026.</li>
<li>الشروط العامة المعلنة: السن بين 21 و45 عامًا، الأهلية القانونية للتعاقد، وعدم امتلاك المتقدم أو زوجته أو أولاده القصر وحدة أو أرضًا سكنية سابقة (مدعومة أو غير مدعومة). ويُخصَّص 5% من الوحدات للأشخاص ذوي الإعاقة. حدود الدخل وقيم الإيجار ورسوم الصيانة تُعلن في كراسة الشروط.</li>
<li>بالتوازي، يجهّز صندوق الإسكان الاجتماعي ودعم التمويل العقاري نحو <strong>15 ألف وحدة بنظام الإيجار العادي</strong> (وليس التمليكي)، بإيجار شهري لا يتجاوز 25% من دخل المتقدم ويغطي الصندوق الفارق كدعم سكني.</li>
<li>محليًا: تفقّد نائب رئيس هيئة المجتمعات العمرانية للتنمية والإنشاء مشروع <strong>فالي تاورز في العبور الجديدة</strong> — أحد مواقع الإيجار التمليكي — لمراجعة جودة التشطيب والمرافق والخدمات قبل الطرح (25 أغسطس 2026).</li>
<li>نقلت صحف قومية عن الوزارة أن <strong>الطرح الرسمي يبدأ 20 سبتمبر 2026</strong>. بعض العناوين خلط بين مساري «التمليكي» و«الإيجار العادي» — هما برنامجان منفصلان بجهتين مختلفتين كما وضحنا أعلاه.</li>
</ul>

<h2>قراءة الدليل — ماذا يعني الطرح للعبور الجديدة؟</h2>
<p><em>هذا القسم تحليل تحريري وليس خبرًا رسميًا.</em></p>
<ul>
<li><strong>أول حضور للمدينة في نظام إسكان جديد كليًا:</strong> دخول فالي تاورز ضمن الطرح يضع العبور الجديدة على خريطة المتقدمين الباحثين عن سكن ميسّر شرق القاهرة — وهي إشارة اعتراف رسمية بجاهزية وحدات المدينة ومرافقها.</li>
<li><strong>توقّع ضغط تقديم مرتفع:</strong> المعروض محدود (آلاف الوحدات على مستوى الجمهورية) والتخصيص بقرعة — لا تبنِ خطط سكنك على «ضمان الفوز»، واجعل الطرح أحد مساراتك لا مسارك الوحيد.</li>
<li><strong>الأثر الأقرب على السوق هو الوعي لا السعر:</strong> حجم الطرح ضئيل قياسًا بتداولات السوق الحرة، لكنه يجذب زيارات وبحثًا واهتمامًا جديدًا بالمدينة وخدماتها — وهو ما ينعكس تدريجيًا على الطلب لا على الأسعار الفورية.</li>
<li><strong>اقرأ «ما يُحسم من القسط» قبل الحماس:</strong> قيمة أي عقد إيجار تمليكي تكمن في النسبة المحتسبة من كل قسط نحو الثمن النهائي وبند الانسحاب — وهما ما ستحسمه كراسة الشروط.</li>
</ul>

<h2>الإيجار التمليكي أم بدائل السوق؟</h2>
<div class="table-wrap"><table><thead><tr><th>المسار</th><th>يميزه</th><th>انتبه لـ</th></tr></thead><tbody>
<tr><td><strong>إيجار تمليكي حكومي (الطرح الجديد)</strong></td><td>سكن فوري بلا مقدم كبير، جهة رسمية، مدة 20 عامًا</td><td>قرعة علنية ومعروض محدود — وكراسة الشروط تحسم التفاصيل</td></tr>
<tr><td><strong><a href="/installments-obour/">تقسيط من مطوّر</a></strong></td><td>اختيار أوسع للموقع والمساحة وملكية عقدية أسرع</td><td>إجمالي أعلى من الكاش — قارن سجل التسليم أولًا</td></tr>
<tr><td><strong><a href="/mortgage-finance-obour/">تمويل عقاري بنكي</a></strong></td><td>ملكية وتسجيل مبكران</td><td>فائدة مرتفعة حاليًا وشروط ائتمانية أصعب</td></tr>
<tr><td><strong><a href="/rent/">إيجار عادي</a></strong></td><td>مرونة كاملة بلا التزام طويل</td><td>لا يتراكم نحو ملكية — راجع <a href="/tenant-rights-obour/">حقوقك كمستأجر</a></td></tr>
</tbody></table></div>
<p>للمقارنة التفصيلية بين النظام والتقسيط العادي اقرأ دليلنا: <a href="/rent-to-own-obour/">الإيجار المنتهي بالتملك في العبور</a>.</p>

<h2>كيف تستعد قبل 20 سبتمبر؟</h2>
<ol>
<li><strong>تابع القنوات الرسمية فقط:</strong> موقع وزارة الإسكان وهيئة المجتمعات العمرانية وصندوق الإسكان الاجتماعي — وتجاهل أي «حجز مسبق» أو وسيط يطلب مقابلًا.</li>
<li><strong>جهّز مستنداتك مبكرًا:</strong> بطاقة رقم قومي سارية، إثبات دخل، وما تطلبه كراسة الشروط فور صدورها.</li>
<li><strong>راجع أهليتك الآن:</strong> السن (21–45)، وعدم امتلاك وحدة أو أرض سابقة لك أو لزوجتك أو أولادك القصر.</li>
<li><strong>اقرأ كراسة الشروط بعناية فور صدورها:</strong> الإيجار الشهري، النسبة المحتسبة للتمليك، رسوم الصيانة، بند الانسحاب، وتوقيت تسجيل الملكية.</li>
<li><strong>قارن بالسوق الموازي قبل الالتزام:</strong> اطلع على <a href="/prices/">أسعار العقارات في العبور</a> و<a href="/rent/">دليل الإيجار</a> و<a href="/new-projects-watch/">رصد المشروعات الجديدة</a> — فقد تكون وحدات السوق الحرة أنسب لاحتياجك وموعدك.</li>
</ol>

<h2>مصادر هذا التقرير</h2>
<ul>
<li><a href="https://invest-gate.me/news/housing-minister-reviews-readiness-of-housing-units-to-be-offered-under-rental-and-rent-to-own-systems/" rel="noopener nofollow" target="_blank">Invest-Gate — الوزيرة تراجع جاهزية وحدات الإيجار والإيجار التمليكي (25 أغسطس 2026)</a></li>
<li><a href="https://www.dailynewsegypt.com/2026/08/01/egypt-to-launch-5000-rent-to-own-housing-units-in-25-new-cities/" rel="noopener nofollow" target="_blank">Daily News Egypt — 5 آلاف وحدة إيجار تمليكي في 25 مدينة (1 أغسطس 2026)</a></li>
<li>الإعلان الرسمي الملزم يصدر عن وزارة الإسكان والمرافق والمجتمعات العمرانية وهيئة المجتمعات العمرانية الجديدة — وتُحدَّث هذه الصفحة فور صدوره مع كراسة الشروط.</li>
</ul>
${faqHtml(RTO_FAQS)}`,
  extraSchemas: (url) => [
    {
      "@context": "https://schema.org", "@type": "NewsArticle",
      headline: "طرح الإيجار التمليكي — سبتمبر 2026: العبور الجديدة على الخريطة",
      url, inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" },
      description: "ما تأكد حتى 5 سبتمبر 2026 عن طرح الإيجار التمليكي: 5 آلاف وحدة في نحو 25 مدينة جديدة بينها فالي تاورز بالعبور الجديدة، الشروط العامة، وخطوات الاستعداد قبل 20 سبتمبر.",
      mainEntityOfPage: url,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* الصفحة 2 — قرار البنك المركزي 24 سبتمبر وأثره على العقار             */
/* ------------------------------------------------------------------ */
const CBE_FAQS = [
  ["هل أنتظر قرار البنك المركزي قبل شراء شقة؟",
   "القرار وحده نادرًا ما يغيّر الأسعار بين يوم وليلة؛ الأثر الحقيقي يأتي عبر مسارين أبطأ: فائدة التمويل البنكي وشهية المطورين للتسعير. إن وجدت وحدة مناسبة بسعر وشروط جيدة اليوم، فانتظار «ربع نقطة» هنا أو هناك قد يكلفك الوحدة نفسها — لكن متابعة القرار تساعدك على توقيت التفاوض والتمويل."],
  ["إذا خفّض المركزي الفائدة، هل ينخفض تقسيط المطورين؟",
   "ليس تلقائيًا ولا فورًا. أنظمة تقسيط المطورين تسعّر بمنطق السوق العقاري لا بفائدة البنك مباشرة. الخفض المستمر على مدى أشهر قد يوسع قاعدة المشترين المؤهلين بنكيًا فيزيد الطلب — وهو أثر قد يرفع الأسعار لا يخفضها. الفارق يظهر أولًا في عروض التمويل البنكي ومبادرات التمويل العقاري."],
  ["ما علاقة سعر الدولار بسعر الشقة في العبور؟",
   "عبر قناة التكلفة أساسًا: جزء معتبر من مدخلات البناء (حديد، ألومنيوم، أجهزة، تشطيبات) مرتبط بالعملة، فانزلاق الجنيه يرفع تكلفة الإنشاء ويدفع المطورين لإعادة التسعير في الإطلاقات الجديدة. لهذا يُقرأ سعر الصرف كمؤشر مبكر لاتجاه أسعار الوحدات الجديدة قبل أن يظهر في الإعلانات."],
];

const PAGE_CBE = {
  slug: "cbe-rate-sep-2026-property",
  title: "قرار الفائدة 24 سبتمبر 2026: 3 سيناريوهات وأثرها على العقار | دليل العبور",
  description: "البنك المركزي يجتمع 24 سبتمبر بعد تثبيت الفائدة عند 19% لخمسة اجتماعات وتسارع التضخم إلى 14.9% وانزلاق الجنيه قرب 51 للدولار. ثلاثة سيناريوهات وأثر كل منها على التمويل والتقسيط وأسعار العبور.",
  h1: "قرار الفائدة في 24 سبتمبر: خريطة السيناريوهات لمشتري العقار",
  lede: "بين تضخم يعاود الصعود وجنيه ينزلق، يجتمع البنك المركزي في 24 سبتمبر. بدل متابعة الخبر لحظتها، جهّز قرارك مسبقًا: ثلاثة سيناريوهات، وأثر كل منها على التمويل البنكي وتقسيط المطورين وأسعار العبور.",
  heroTags: ["⌖ تحليل اقتصادي", `✓ بتاريخ ${TODAY_AR}`],
  crumbs: [["الرئيسية", "/"], ["الاستثمار العقاري", "/investment/"], ["قرار الفائدة سبتمبر 2026", "/cbe-rate-sep-2026-property/"]],
  related: [
    ["/mortgage-finance-obour/", "التمويل العقاري في العبور"],
    ["/investment/", "الاستثمار في العبور الجديدة"],
    ["/price-forecast-obour/", "توقعات الأسعار في العبور"],
    ["/prices/", "أسعار العقارات في العبور"],
    ["/mortgage-vs-rent-obour/", "الشراء أم الإيجار؟"],
  ],
  article: `
<p><small>نُشر: ${TODAY_AR} · يُحدَّث فور صدور قرار لجنة السياسة النقدية في 24 سبتمبر 2026.</small></p>
<p>تجتمع لجنة السياسة النقدية بالبنك المركزي المصري في <strong>24 سبتمبر 2026</strong> لمراجعة أسعار الفائدة، وسط أرقام صعبة على الجبهتين: تضخم عاد للصعود وجنيه ينزلق. لمتتبع العقار، السؤال العملي ليس «ماذا سيقررون؟» بل «ماذا أفعل في كل حالة؟» — هذه خريطة مسبقة للسيناريوهات الثلاثة.</p>

<h2>أين نقف قبل الاجتماع؟ — الخبر بالأرقام</h2>
<ul>
<li><strong>الفائدة 19% للإيداع</strong> بعد التثبيت في اجتماع أغسطس — الخامس على التوالي — في وقف مؤقت لدورة التيسير التي بدأت العام الماضي (كانت 27.25% في ذروتها مارس 2024).</li>
<li><strong>التضخم الحضري 14.9% في يوليو 2026</strong> صعودًا من 14.3% في يونيو — أول تسارع في أربعة أشهر، مع قفزة تضخم الغذاء إلى 8%، وإن جاء أقل من توقعات السوق (15.1%).</li>
<li><strong>الجنيه عند 50.95 للدولار</strong> (4 سبتمبر 2026) — فقد نحو 2.3% في شهر و4.9% في عام، تحت ضغط تكلفة واردات الوقود والتوترات الإقليمية.</li>
<li><strong>فائدة التمويل العقاري الاستهلاكي ما زالت فوق 24%</strong> لدى معظم البنوك — لهذا يظل تقسيط المطورين (مقدم 5–10% وجداول تصل لعشر سنوات) هو قناة الشراء المهيمنة في المدن الجديدة.</li>
<li>التوقعات السائدة لدى المحللين: <strong>تثبيت حتى نهاية 2026</strong> ثم استئناف الخفض في الربع الأول 2027 مع عودة التضخم نحو المستهدف (7% ±2%) في النصف الثاني من 2027.</li>
</ul>

<h2>ثلاثة سيناريوهات لقرار 24 سبتمبر</h2>
<div class="table-wrap"><table><thead><tr><th>السيناريو</th><th>إشارة السوق</th><th>الأثر العقاري المتوقع</th><th>تصرفك كمشتري</th></tr></thead><tbody>
<tr><td><strong>تثبيت عند 19% (الأرجح)</strong></td><td>استمرار «الانتظار الحذر» حتى يتراجع التضخم</td><td>لا تغيير فوري: فائدة البنوك تبقى مرتفعة، وتقسيط المطورين يظل القناة الأرخص نسبيًا</td><td>قارن إجمالي التقسيط بفائدة البنك على مدى المدة كاملة — لا القسط الشهري وحده</td></tr>
<tr><td><strong>خفض مفاجئ</strong></td><td>ثقة بانحسار التضخم ودعم للنشاط</td><td>تحسن تدريجي في عروض التمويل البنكي خلال أشهر؛ اتساع قاعدة المشترين قد يشدّ الطلب ويدعم الأسعار</td><td>إن كنت جاهزًا ماليًا، التحرك المبكر يسبق موجة الطلب لا يلحقها</td></tr>
<tr><td><strong>رفع احترازي</strong></td><td>أولوية قصوى لوقف انزلاق الجنيه والتضخم</td><td>ضغط إضافي على التمويل البنكي؛ المطورون يعوّضون بتسهيلات سداد أطول لجذب المشترين</td><td>فرصة تفاوض: شروط سداد أطول وخصومات دفعات عند المطورين</td></tr>
</tbody></table></div>

<h2>قراءة الدليل — ماذا يعني ذلك لسوق العبور؟</h2>
<p><em>هذا القسم تحليل تحريري وليس توصية استثمارية.</em></p>
<ul>
<li><strong>التقسيط المباشر يبقى ملك اللعبة:</strong> ما دامت فائدة البنوك فوق 24%، يحتفظ المطورون بقوة تفاوضية في التسعير — ومعيار المقارنة الصحيح هو «إجمالي المدفوع» لا «قيمة القسط».</li>
<li><strong>العقار كمخزن قيمة تحت الاختبار:</strong> مع تضخم قرب 15% وانزلاق متواصل للجنيه، يستمر تدفق المدخرات نحو الأصول الحقيقية — عقارات وذهبًا — وهو ما يدعم الطلب على الوحدات الجاهزة في المدن ذات الخدمات الناضجة.</li>
<li><strong>سعر الصرف هو المؤشر المبكر:</strong> استمرار انزلاق الجنيه يرفع تكلفة مدخلات البناء المستوردة، ويظهر أثره في أسعار الإطلاقات الجديدة قبل السوق الثانوية — راقبه بين اجتماعين لا عند الاجتماع فقط.</li>
<li><strong>تاريخان لا تاريخ واحد:</strong> بيانات تضخم أغسطس تصدر قبيل الاجتماع (متوقع حول 10 سبتمبر) — مفاجأة فيها قد تقلب سيناريو 24 سبتمبر نفسه. سنحدّث هذا التحليل بالرقم فور صدوره ثم بالقرار.</li>
</ul>

<h2>قبل أن تبني قرارك على الفائدة</h2>
<p>قرار المركزي متغيّر واحد ضمن معادلة الشراء. الأثقل وزنًا يبقى: سجل تسليم المطوّر، إجمالي تكلفة التمويل على مدى المدة، وموقع الوحدة وخدماتها الفعلية. استخدم <a href="/developers/">مقارنة المطورين على المعايير المنشورة</a> و<a href="/mortgage-finance-obour/">دليل التمويل العقاري</a> و<a href="/buying-guide/">دليل الشراء خطوة بخطوة</a> قبل أي التزام.</p>

<h2>مصادر هذا التقرير</h2>
<ul>
<li><a href="https://tradingeconomics.com/egypt/interest-rate" rel="noopener nofollow" target="_blank">Trading Economics — سعر الفائدة في مصر (قرار أغسطس 2026 والتوقعات)</a></li>
<li><a href="https://tradingeconomics.com/egypt/inflation-cpi" rel="noopener nofollow" target="_blank">Trading Economics / CAPMAS — التضخم الحضري 14.9% في يوليو 2026</a></li>
<li><a href="https://tradingeconomics.com/egypt/currency" rel="noopener nofollow" target="_blank">Trading Economics — سعر صرف الجنيه (4 سبتمبر 2026)</a></li>
<li>البيان الملزم يصدر عن البنك المركزي المصري يوم الاجتماع — ويُحدَّث هذا التحليل فور صدوره.</li>
</ul>
${faqHtml(CBE_FAQS)}`,
  extraSchemas: (url) => [
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: "قرار الفائدة في 24 سبتمبر: خريطة السيناريوهات لمشتري العقار",
      url, inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" },
      description: "البنك المركزي يجتمع 24 سبتمبر بعد تثبيت الفائدة عند 19% لخمسة اجتماعات وتسارع التضخم إلى 14.9%. ثلاثة سيناريوهات وأثر كل منها على التمويل والتقسيط وأسعار العبور.",
      mainEntityOfPage: url,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* الصفحة 3 — سيتي سكيب مصر 2026                                        */
/* ------------------------------------------------------------------ */
const CS_FAQS = [
  ["متى وأين يقام سيتي سكيب مصر 2026؟",
   "من 30 سبتمبر إلى 3 أكتوبر 2026 في مركز مصر للمعارض الدولية (EIEC) على محور المشير طنطاوي شرق القاهرة — النسخة الخامسة عشرة من المعرض، بمشاركة أكثر من 80 مطورًا وأكثر من 1,000 مشروع وفق الموقع الرسمي."],
  ["هل عروض المعرض أرخص فعلًا؟",
   "كثير من العارضين يقدمون خصومات أو تسهيلات سداد حصرية لأيام المعرض — لكن «الخصم» يُحسب من قائمة أسعار المطور نفسها. القاعدة: احسب صافي سعر المتر بعد الخصم، وقارنه بسعر السوق خارج المعرض لنفس المشروع أو مشروع مماثل، واطلب العرض مكتوبًا بكل شروطه قبل أي دفع."],
  ["هل توجد مشروعات من العبور والعبور الجديدة في المعرض؟",
   "المعرض يجذب عادةً مطورين نشطين في شرق القاهرة والمدن الجديدة المحيطة، والقائمة الرسمية للعارضين تُنشر على موقع سيتي سكيب وتتحدث قبل الافتتاح. لا ننسب مشاركة لأي مطور دون إعلان رسمي — راجع قائمة العارضين، ثم قارن ما يخص العبور عبر دليل المطورين ورصد المشروعات على موقعنا."],
];

const PAGE_CS = {
  slug: "cityscape-egypt-2026-guide",
  title: "سيتي سكيب مصر 2026 (30 سبتمبر–3 أكتوبر): دليل الزائر الجاد | دليل العبور",
  description: "سيتي سكيب مصر 2026 في مركز مصر للمعارض الدولية: 80+ مطورًا و1,000+ مشروع وعروض حصرية. كيف تقارن العروض بمعايير قابلة للتحقق قبل أي حجز — وأين تقف مشروعات العبور والعبور الجديدة.",
  h1: "سيتي سكيب مصر 2026: قارن العروض قبل أن تحجز",
  lede: "أكبر معرض عقاري في مصر يفتح أبوابه نهاية سبتمبر بعروض «حصرية لأيام المعرض». بين 80+ مطورًا و1,000+ مشروع، الفارق ليس في كثرة العروض بل في طريقة مقارنتها — هذا دليل الزائر الجاد.",
  heroTags: ["⌖ فعاليات السوق", `✓ بتاريخ ${TODAY_AR}`],
  crumbs: [["الرئيسية", "/"], ["أخبار المدينة", "/news/"], ["سيتي سكيب مصر 2026", "/cityscape-egypt-2026-guide/"]],
  related: [
    ["/developers/", "مقارنة المطورين على المعايير المنشورة"],
    ["/developers-directory/", "دليل كل شركات التطوير"],
    ["/new-projects-watch/", "رصد المشروعات الجديدة"],
    ["/buying-guide/", "دليل الشراء خطوة بخطوة"],
    ["/mistakes/", "أخطاء شائعة عند الشراء"],
  ],
  article: `
<p><small>نُشر: ${TODAY_AR} · يُحدَّث خلال أيام المعرض (30 سبتمبر–3 أكتوبر 2026) بالمستجدات الموثقة.</small></p>
<p>في نهاية سبتمبر يتحول مركز مصر للمعارض الدولية إلى سوق عقاري مكثف: <strong>سيتي سكيب مصر 2026</strong> يجمع كبار المطورين وإطلاقاتهم الجديدة وعروضهم الخاصة في مكان واحد. لمن يتابع العبور والعبور الجديدة، المعرض فرصة نادرة لمقارنة مطوري المنطقة جنبًا إلى جنب — بشرط ألا تحجز تحت ضغط الأضواء.</p>

<h2>الثابت عن النسخة الخامسة عشرة — الخبر</h2>
<ul>
<li><strong>الموعد:</strong> 30 سبتمبر – 3 أكتوبر 2026. <strong>المكان:</strong> مركز مصر للمعارض الدولية (EIEC)، محور المشير طنطاوي، شرق القاهرة.</li>
<li><strong>الحجم المعلن:</strong> أكثر من 80 مطورًا وأكثر من 1,000 مشروع معروض، وعشرات الآلاف من الزوار في النسخ السابقة — أكبر تجمع سنوي للقطاع في مصر.</li>
<li><strong>نمط العروض:</strong> خصومات أسعار، تسهيلات سداد ممتدة، وإطلاقات حصرية التوقيت — كثير منها مشروط بالحجز خلال أيام المعرض.</li>
</ul>

<h2>لماذا يهمّ متابع العبور والعبور الجديدة؟</h2>
<ul>
<li><strong>قرب المكان:</strong> مقر المعرض على محور المشير طنطاوي — شرق القاهرة — أي في محيط العبور الأوسع، لا في أقصى غرب المدينة كبعض الفعاليات.</li>
<li><strong>مقارنة في يوم واحد:</strong> بدل أسابيع من زيارات مكاتب المبيعات، تقف أمام مطوري العبور والمدن المجاورة في ساعات — قارن <a href="/compare/">مواقع المدن المتقاربة</a> مسبقًا لتعرف أسئلتك.</li>
<li><strong>نافذة على الإطلاقات:</strong> المشاريع الجديدة تُعلن عادة في المعرض — تابع أولًا بأول عبر <a href="/new-projects-watch/">رصد المشروعات الجديدة</a> حيث نوثق ما يخص العبور فقط.</li>
</ul>

<h2>كيف تقارن عرضين في المعرض؟ — جدول المعايير</h2>
<div class="table-wrap"><table><thead><tr><th>المعيار</th><th>كيف تتحقق منه في الجناح</th></tr></thead><tbody>
<tr><td><strong>صافي سعر المتر</strong></td><td>احسبه بنفسك: السعر بعد الخصم ÷ المساحة — وقارنه بسعر المشروع خارج المعرض</td></tr>
<tr><td><strong>إجمالي المدفوع</strong></td><td>المقدم + كل الأقساط + رسوم الصيانة والنادي والجراج — لا القسط الشهري وحده</td></tr>
<tr><td><strong>سنوات السداد الحقيقية</strong></td><td>مدة أطول تعني إجمالي أعلى غالبًا — اطلب جدول السداد كاملًا مكتوبًا</td></tr>
<tr><td><strong>تاريخ التسليم والتعويض</strong></td><td>بند التسليم في العقد وتعويض التأخير — لا الوعد الشفهي في الجناح</td></tr>
<tr><td><strong>سجل التسليم الفعلي</strong></td><td>هل يمكنك زيارة مشروع مسلَّم للمطور نفسه الآن؟ قارن عبر <a href="/developers/">معاييرنا المنشورة</a></td></tr>
<tr><td><strong>الكثافة ونسبة البناء</strong></td><td>اسأل عن نسبة البناء والارتفاعات — اقرأ <a href="/methodology/">منهجيتنا</a> قبل المعرض لتعرف لماذا تهم</td></tr>
</tbody></table></div>

<h2>أسئلة تسألها في الجناح قبل أي توقيع</h2>
<ol>
<li>هل العرض ساري خارج المعرض وبنفس الشروط؟ وما المستند الذي يثبت الخصم؟</li>
<li>ما إجمالي المدفوع حتى الاستلام شاملاً كل الرسوم — مكتوبًا؟</li>
<li>هل يمكن زيارة مشروع مسلَّم للمطور الآن؟ ومن جهة الإدارة بعد التسليم؟</li>
<li>متى يُسجَّل العقد فعليًا وما حالة الأرض والتراخيص؟</li>
</ol>

<h2>قراءة الدليل — بعد المعرض</h2>
<p><em>هذا القسم تحليل تحريري.</em></p>
<ul>
<li><strong>«العرض ينتهي اليوم» أداة ضغط لا معيار شراء:</strong> وثّق العرض مكتوبًا وغادر — القرار الصحيح يصمد 48 ساعة من المراجعة الهادئة.</li>
<li><strong>المعرض يقيس «حرارة السوق» لا قيمة مشروع بعينه:</strong> كثافة الإطلاقات والعروض تقول إن المعروض يتسع — وهي بيئة تفاوض جيدة للمشتري المنظم.</li>
<li><strong>ارجع للمصادر قبل الحجز:</strong> <a href="/buying-guide/">دليل الشراء خطوة بخطوة</a>، و<a href="/mistakes/">الأخطاء الشائعة</a>، و<a href="/developers-directory/">دليل كل شركات التطوير</a> — كلها مجانية وتسبق أي شيك.</li>
</ul>

<h2>مصادر هذا التقرير</h2>
<ul>
<li><a href="https://www.cityscape-events.com/egypt/" rel="noopener nofollow" target="_blank">الموقع الرسمي لسيتي سكيب مصر — المواعيد والمكان وأعداد العارضين</a></li>
<li>قائمة العارضين النهائية تُنشر على الموقع الرسمي قبل الافتتاح — ولا ننسب مشاركة لأي مطور دون إعلان رسمي.</li>
</ul>
${faqHtml(CS_FAQS)}`,
  extraSchemas: (url) => [
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: "سيتي سكيب مصر 2026: قارن العروض قبل أن تحجز",
      url, inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" },
      description: "سيتي سكيب مصر 2026 في مركز مصر للمعارض الدولية: 80+ مطورًا و1,000+ مشروع. كيف تقارن العروض بمعايير قابلة للتحقق قبل أي حجز.",
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org", "@type": "Event",
      name: "سيتي سكيب مصر 2026 — Cityscape Egypt",
      startDate: "2026-09-30", endDate: "2026-10-03", eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place", name: "مركز مصر للمعارض الدولية (EIEC)",
        address: { "@type": "PostalAddress", streetAddress: "محور المشير طنطاوي", addressLocality: "القاهرة الجديدة", addressRegion: "القاهرة", addressCountry: "EG" },
      },
      url: "https://www.cityscape-events.com/egypt/",
      description: "أكبر معرض عقاري في مصر — النسخة 15 بمشاركة 80+ مطورًا و1,000+ مشروع.",
    },
  ],
};

const PAGES = [PAGE_RTO, PAGE_CBE, PAGE_CS];

/* ------------------------------------------------------------------ */
/* كتابة الصفحات الجديدة                                                */
/* ------------------------------------------------------------------ */
function writePages(chrome) {
  for (const def of PAGES) {
    const url = `${SITE}/${def.slug}/`;
    const schemas = [
      orgSchema,
      ...def.extraSchemas(url),
      breadcrumbSchema(def.crumbs.map(([name, href]) => [name, href.startsWith("http") ? href : `${SITE}${href}`])),
      faqSchema(def === PAGE_RTO ? RTO_FAQS : def === PAGE_CBE ? CBE_FAQS : CS_FAQS),
    ];
    const html = pageShell(chrome, {
      title: def.title, description: def.description, slug: def.slug, schemas,
      crumbs: def.crumbs, heroTags: def.heroTags, h1: def.h1, lede: def.lede,
      articleHtml: def.article, related: def.related,
    });
    const outDir = path.join(clientDir, def.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
    rep("OK", `wrote /${def.slug}/ (${html.length} bytes)`);
  }
}

/* ------------------------------------------------------------------ */
/* تحديث /rent-to-own-obour/ — مستجد الطرح (بدل URL منافس)               */
/* ------------------------------------------------------------------ */
function patchRentToOwnPage() {
  const file = path.join(clientDir, "rent-to-own-obour", "index.html");
  if (!fs.existsSync(file)) { rep("WARN", "rent-to-own-obour page not found — skipped"); return; }
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("/rent-to-own-september-2026/")) { rep("SKIP", "rent-to-own-obour already updated"); return; }

  const updateNote = `<p><strong>مستجد — سبتمبر 2026:</strong> وزارة الإسكان تستعد لطرح نحو 5 آلاف وحدة بنظام الإيجار التمليكي في نحو 25 مدينة جديدة، وأُعلن تفقّد مشروع <strong>فالي تاورز في العبور الجديدة</strong> ضمن مواقع الطرح، مع ترقب الإعلان الرسمي في 20 سبتمبر. التفاصيل والشروط وخطوات الاستعداد في تغطيتنا: <a href="/rent-to-own-september-2026/">طرح الإيجار التمليكي — سبتمبر 2026</a>.</p>`;

  let changed = 0;
  // 1) بطاقة المستجد بعد فقرة التنبيه التحريري
  const anchor = /<h2>كيف يعمل النظام؟<\/h2>/;
  if (anchor.test(html)) { html = html.replace(anchor, `${updateNote}\n<h2>كيف يعمل النظام؟</h2>`); changed++; }
  else rep("WARN", "intro anchor not found in rent-to-own-obour");
  // 2) وسم المراجعة في البطل
  if (html.includes("✓ مراجَع · أغسطس 2026")) { html = html.replace("✓ مراجَع · أغسطس 2026", "✓ مراجَع · سبتمبر 2026"); changed++; }
  // 3) dateModified في مخطط Article
  if (html.includes(`"datePublished":"2026-08-28","dateModified":"2026-08-28"`)) {
    html = html.replace(`"datePublished":"2026-08-28","dateModified":"2026-08-28"`, `"datePublished":"2026-08-28","dateModified":"${TODAY}"`); changed++;
  }
  // 4) الوصف (meta + og)
  const newDesc = "دليل الإيجار المنتهي بالتملك في العبور: كيف يعمل النظام، مشروع فالي تاورز ضمن طرح سبتمبر 2026، شروط الحجز العامة، ومقارنته بالتقسيط العادي — بمصادر منشورة.";
  if (/<meta name="description" content="[^"]*">/.test(html)) { html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${newDesc}">`); changed++; }
  if (/<meta property="og:description" content="[^"]*">/.test(html)) { html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${newDesc}">`); changed++; }

  if (changed) { fs.writeFileSync(file, html, "utf8"); rep("OK", `rent-to-own-obour updated (${changed} patches)`); }
}

/* ------------------------------------------------------------------ */
/* روابط «أدلة ذات صلة» من الصفحات القريبة                              */
/* ------------------------------------------------------------------ */
const RELATED_ADDS = [
  ["social-housing-obour", "/rent-to-own-september-2026/", "طرح الإيجار التمليكي — سبتمبر 2026"],
  ["sakan-misr-obour", "/rent-to-own-september-2026/", "طرح الإيجار التمليكي — سبتمبر 2026"],
  ["mortgage-finance-obour", "/cbe-rate-sep-2026-property/", "قرار الفائدة 24 سبتمبر وأثره على العقار"],
  ["investment", "/cbe-rate-sep-2026-property/", "قرار الفائدة 24 سبتمبر وأثره على العقار"],
];

function addRelatedLinks() {
  // صفحات تستخدم «أدلة ذات صلة» أو «موضوعات ذات صلة» — نلتقط أيًّا منهما
  const re = /(<h2>(?:أدلة|موضوعات) ذات صلة<\/h2>\s*<ul[^>]*>)([\s\S]*?)(<\/ul>)/;
  for (const [slug, href, anchor] of RELATED_ADDS) {
    const file = path.join(clientDir, slug, "index.html");
    if (!fs.existsSync(file)) { rep("WARN", `/${slug}/ missing — related link skipped`); continue; }
    let html = fs.readFileSync(file, "utf8");
    if (html.includes(href)) { rep("SKIP", `/${slug}/ already links ${href}`); continue; }
    if (re.test(html)) {
      html = html.replace(re, (m, open, items, close) => `${open}${items}<li><a href="${href}">${anchor}</a></li>${close}`);
      fs.writeFileSync(file, html, "utf8");
      rep("OK", `related link added on /${slug}/ → ${href}`);
    } else {
      rep("WARN", `related-guides block not found on /${slug}/`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* sitemap.xml + search-index.json                                      */
/* ------------------------------------------------------------------ */
function patchSitemap() {
  const file = path.join(publicDir, "sitemap.xml");
  if (!fs.existsSync(file)) { rep("WARN", "sitemap.xml not found — skipped"); return; }
  let xml = fs.readFileSync(file, "utf8");
  let added = 0;
  for (const def of PAGES) {
    const loc = `${SITE}/${def.slug}/`;
    if (xml.includes(`<loc>${loc}</loc>`)) continue;
    xml = xml.replace("</urlset>", `<url><loc>${loc}</loc><lastmod>${TODAY}</lastmod></url>\n</urlset>`);
    added++;
  }
  // تحديث lastmod لصفحة الإيجار المنتهي بالتملك
  const rtoLoc = `${SITE}/rent-to-own-obour/`;
  const rtoRe = new RegExp(`(<loc>${rtoLoc.replace(/[/.]/g, "\\$&")}</loc><lastmod>)[^<]*(</lastmod>)`);
  const hadRto = rtoRe.test(xml);
  if (hadRto) xml = xml.replace(rtoRe, `$1${TODAY}$2`);
  if (added || hadRto) fs.writeFileSync(file, xml, "utf8");
  rep("OK", `sitemap.xml: ${added} new URLs, rent-to-own-obour lastmod=${TODAY}`);
}

function patchSearchIndex() {
  const file = path.join(publicDir, "search-index.json");
  if (!fs.existsSync(file)) { rep("WARN", "search-index.json not found — skipped"); return; }
  let data;
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { rep("WARN", `search-index parse failed: ${e.message}`); return; }
  const seen = new Set(data.map((x) => x.u));
  let added = 0;
  for (const def of PAGES) {
    const u = `/${def.slug}/`;
    if (seen.has(u)) continue;
    data.push({ n: def.h1, d: def.description, u, k: "صفحة" });
    added++;
  }
  if (added) fs.writeFileSync(file, JSON.stringify(data), "utf8");
  rep("OK", `search-index.json: ${added} entries added`);
}

/* ------------------------------------------------------------------ */
function main() {
  try {
    const chrome = loadChrome();
    writePages(chrome);
  } catch (e) {
    rep("WARN", `page build skipped: ${e.message}`);
  }
  try { patchRentToOwnPage(); } catch (e) { rep("WARN", `rent-to-own patch failed: ${e.message}`); }
  try { addRelatedLinks(); } catch (e) { rep("WARN", `related links failed: ${e.message}`); }
  try { patchSitemap(); } catch (e) { rep("WARN", `sitemap patch failed: ${e.message}`); }
  try { patchSearchIndex(); } catch (e) { rep("WARN", `search-index patch failed: ${e.message}`); }
  console.log("Phase 55 trend articles (2026-09-05) done");
  console.log(report.join("\n"));
}

main();
