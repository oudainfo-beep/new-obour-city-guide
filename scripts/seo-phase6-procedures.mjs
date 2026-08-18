/**
 * seo-phase6-procedures.mjs
 * المرحلة السادسة (6.3): دليل الإجراءات الحكومية في العبور والعبور الجديدة.
 *
 * ينشئ:
 *   - client/procedures/index.html (فهرس الأدلة)
 *   - client/procedures/<slug>/index.html لكل إجراء
 *
 * المبادئ:
 *   - idempotent: الصفحات تُعاد كتابتها بالكامل؛ رابط القائمة محمي بفحص.
 *   - مصادر رسمية فقط: صندوق الإسكان الاجتماعي والتمويل العقاري (mff.gov.eg)
 *     وهيئة المجتمعات العمرانية الجديدة / جهاز العبور الجديدة (newcities.gov.eg).
 *   - أي خطوة أو رسوم أو مدة غير منشورة رسميًا = «تحقق من جهاز المدينة مباشرة».
 *   - لا أرقام أو اختلاقات: كل إجراء يُصاغ كإطار عام مع روابط للمصدر الرسمي.
 *   - كل دليل: خطوات مرقمة + بلوك سؤال←إجابة + FAQPage + BreadcrumbList.
 *
 * ملاحظة الوصول: حاولنا التحقق من الروابط الرسمية أثناء التطوير (أغسطس 2026)
 * فكانت mff.gov.eg غير متاحة (خطأ 500 / شهادة منتهية) و newcities.gov.eg
 * غير مستجيبة من نقطة الوصول الحالية. لذلك نذكر الروابط كمصادر رسمية معلنة
 * ونطلب التحقق المباشر قبل أي إجراء عملي.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";
const ACCESSED_AT = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const SOURCES = {
  mff: {
    name: "صندوق الإسكان الاجتماعي والتمويل العقاري",
    url: "https://mff.gov.eg",
    note: "موقع الصندوق الرسمي",
  },
  newcities: {
    name: "هيئة المجتمعات العمرانية الجديدة — جهاز العبور الجديدة",
    url: "https://www.newcities.gov.eg",
    note: "الموقع الرسمي لهيئة المجتمعات العمرانية الجديدة",
  },
  obourContact: {
    name: "جهاز مدينة العبور الجديدة (بيانات الاتصال المنشورة)",
    url: "https://www.newcities.gov.eg/english/contact_us",
    note: "صفحة بيانات الاتصال بهيئة المجتمعات العمرانية",
  },
};

const PROCEDURES = [
  {
    slug: "announcement-14-priority",
    title: "الاستعلام عن أولوية الإعلان الرابع عشر",
    description: "خطوات الاستعلام عن أولوية الإعلان الرابع عشر في العبور الجديدة من المصادر الرسمية، مع تنبيه التحقق المباشر.",
    steps: [
      "تأكد من تسجيل بياناتك في الإعلان الرابع عشر عبر البوابة الرسمية لصندوق الإسكان الاجتماعي والتمويل العقاري.",
      "أدخل الرقم القومي في بوابة الاستعلام عن الأولويات (إن كانت متاحة) أو تواصل مع فرع جهاز العبور الجديدة.",
      "راجع الرسائل النصية أو البريد الإلكتروني المسجَّلين عند التقديم؛ غالبًا ما تُرسل نتائج الأولوية عبرها.",
      "إذا ظهر لك رقم أولوية، احتفظ بلقطة شاشة أو طباعة؛ هذا الإثبات مطلوب لاحقًا عند استلام التخصيص.",
      "لم تظهر الأولوية أو وجدت تناقضًا؟ اذهب لجهاز العبور الجديدة شخصيًا مع بطاقة الرقم القومي الأصلية وإيصال التقديم.",
    ],
    qa: {
      q: "ماذا أفعل إذا لم تظهر أولويتي في الإعلان الرابع عشر؟",
      a: "اذهب إلى جهاز العبور الجديدة مع الرقم القودي وإيصال التقديم، واطلب مراجعة حالة الطلب مباشرة. لا تعتمد على بيانات غير رسمية.",
    },
    faq: [
      { q: "هل يمكن الاستعلام عن الأولوية بالاسم فقط؟", a: "الاستعلام يحتاج عادةً إلى الرقم القومي؛ تحقق من المتطلبات الرسمية في بوابة الصندوق أو جهاز المدينة." },
      { q: "كم مدة ظهور نتيجة الأولوية بعد غلق التقديم؟", a: "المدد غير منشورة بثبات؛ تابع الإعلانات الرسمية أو اتصل بجهاز العبور الجديدة." },
      { q: "هل الأولوية تضمن الحصول على وحدة؟", a: "الأولوية تدخلك في قائمة التخصيص، لكن التسليم يعتمد على توفر الوحدات والاستيفاء المستندي." },
    ],
    sourceKey: "mff",
  },
  {
    slug: "unit-swap",
    title: "تبديل الدور أو الوحدة",
    description: "إجراء تبديل الدور أو الوحدة في مشروعات العبور الجديدة: الشروط العامة والخطوات الرسمية والتحقق المباشر.",
    steps: [
      "تأكد أن الوحدتان (الأصلية والبديلة) في نفس المدينة ونفس النوع (اجتماعي/متوسط/أخرى)؛ التبديل عادةً لا ي跨 المدن.",
      "اذهب إلى جهاز العبور الجديدة أو فرع الصندوق المختص واطلب نموذج طلب تبديل موقَّع من الطرفين.",
      "قدّم المستندات المطلوبة: صور بطاقات الرقم القومي للطرفين، وإيصالات التخصيص، وموافقة الطرف المقابل.",
      "اسأل عن أي رسوم إدارية منشورة في الإعلان أو اللائحة؛ إذا لم تكن منشورة، اطلب ورقة رسمية بالمبلغ.",
      "انتظر الموافقة الرسمية والتخصيص الجديد؛ لا تتخلى عن الوحدة الأصلية قبل استلام قرار التبديل المكتوب.",
    ],
    qa: {
      q: "هل يمكن تبديل الوحدة مع شخص في مدينة أخرى؟",
      a: "القاعدة العامة: التبديل يتم داخل نفس المدينة ونفس النوع. أي استثناء يجب أن يكون بقرار رسمي من جهاز المدينة.",
    },
    faq: [
      { q: "هل يُشترط حضور الطرفين؟", a: "نعم، عادةً يُوقع الطرفان على طلب التبديل؛ تحقق من النموذج الرسمي لدى جهاز العبور الجديدة." },
      { q: "هل هناك رسوم على التبديل؟", a: "الرسوم غير منشورة بثبات في المصادر المتاحة؛ اطلب ورقة رسمية بالمبلغ قبل الدفع." },
      { q: "كم تستغرق إجراءات التبديل؟", a: "المدة غير منشورة رسميًا؛ تابع جهاز العبور الجديدة مباشرة بعد تقديم الطلب." },
    ],
    sourceKey: "newcities",
  },
  {
    slug: "change-financier",
    title: "تغيير جهة التمويل العقاري",
    description: "كيف تُغيّر جهة التمويل العقاري بعد التخصيص في العبور الجديدة، مع خطوات التحقق من البنوك المعتمدة لدى الصندوق.",
    steps: [
      "راجع العقد المبدئي للتعرف على شروط تغيير جهة التمويل أو التزامك ببنك معين.",
      "تواصل مع البنك الجديد للحصول على موافقة مبدئية بشرط استيفاء المستندات المطلوبة.",
      "قدّم للبنك الجديد المستندات المالية والوظيفية المطلوبة (مثلاً: إثبات دخل، كشف حساب، تعهد جهة العمل).",
      "بعد موافقة البنك الجديد، قدّم طلب تغيير جهة التمويل إلى جهاز العبور الجديدة أو الصندوق مع المستندات.",
      "انتظر إصدار خطاب تغيير الجهة وتحديث العقد؛ لا تُلغي التعامل مع البنك القديم قبل استلام الموافقة الرسمية.",
    ],
    qa: {
      q: "هل يجوز تغيير البنك بعد توقيع العقد النهائي؟",
      a: "يعتمد على نص العقد والموافقة الرسمية. بعض المشروعات تلزمك ببنك محدد؛ أي تغيير يحتاج خطابًا رسميًا.",
    },
    faq: [
      { q: "ما هي البنوك المعتمدة للتمويل العقاري؟", a: "قائمة البنوك المعتمدة تُنشر عبر صندوق الإسكان الاجتماعي والتمويل العقاري؛ تحقق منها قبل اختيار البنك." },
      { q: "هل يُشترط راتب محدد للحصول على التمويل؟", a: "كل بنك يحدد شروط الدخل والتحويل؛ اطلب الشروط المنشورة من البنك المعتمد." },
      { q: "هل تغيير البنك يؤثر على أولوية التخصيص؟", a: "التخصيص ثابت طالما استكملت التزاماتك المالية؛ لكن التوقيت يعتمد على سرعة البنك الجديد." },
    ],
    sourceKey: "mff",
  },
  {
    slug: "handover-utilities",
    title: "استلام الوحدة ودفع المرافق",
    description: "خطوات استلام الوحدة السكنية في العبور الجديدة وسداد مستحقات المرافق، مع تنبيه بضرورة التحقق من الجهاز الرسمي.",
    steps: [
      "انتظر إخطار التخصيص والاستلام الرسمي من جهاز العبور الجديدة أو جهاز التعاملات العقارية المختص.",
      "حدد موعد المعاينة واستلام الوحدة؛ حضورك شخصيًا (أو وكيل شرعي) إلزامي عادةً.",
      "أثناء المعاينة، افحص الوحدة مع مندوب الجهاز، وسجّل أي ملاحظات في محضر استلام موقَّع من الطرفين.",
      "اطلب بيان المستحقات المطلوب سدادها: رسوم المرافق (كهرباء، مياه، غاز) وأي مستحقات أخرى، واطلب ورقة رسمية بها.",
      "سدد المستحقات في جهة السداد المعلنة واحتفظ بإيصالات الدفع؛ استلم المفاتيح والمستندات بعد استكمال السداد.",
    ],
    qa: {
      q: "هل يجب دفع رسوم المرافق قبل استلام المفاتيح؟",
      a: "في معظم الإجراءات الرسمية، يُشترط سداد مستحقات المرافق أولاً. اطلب بيانًا رسميًا بالمبالغ قبل الدفع.",
    },
    faq: [
      { q: "ما هي الرسوم المطلوبة عند الاستلام؟", a: "تختلف حسب نوع الوحدة والإعلان؛ أي رقم غير منشور رسميًا يجب التحقق منه لدى جهاز العبور الجديدة." },
      { q: "ماذا أفعل إذا وجدت عيوبًا في الوحدة؟", a: "سجّل الملاحظات في محضر الاستلام واطلب إصلاحها قبل التوقيع النهائي." },
      { q: "هل يمكن استلام الوحدة بوكالة؟", a: "نعم، مع توكيل رسمي موثَّق؛ تحقق من صيغة التوكيل المطلوبة لدى جهاز المدينة." },
    ],
    sourceKey: "newcities",
  },
  {
    slug: "contract-registration",
    title: "استلام العقد والتسجيل",
    description: "دليل استلام العقد النهائي وتسجيله في العبور الجديدة، مع خطوات التوقيع والسداد والتسجيل في الشهر العقاري.",
    steps: [
      "بعد استلام الوحدة أو التخصيص النهائي، حدد موعد توقيع العقد النهائي مع جهاز العبور الجديدة.",
      "اقرأ العقد كاملاً قبل التوقيع، وراجع: اسم المالك، بيانات الوحدة، الجدولة الزمنية للسداد، وشروط التمويل.",
      "سدد الدفعة المقدمة والأقساط الأولى حسب الجدولة المحددة في العقد واحتفظ بإيصالات رسمية.",
      "اطلب صورة معتمدة من العقد بعد توقيعه، وتأكد من وجود ختم الجهاز والتوقيعات الرسمية.",
      "سجّل العقد في مكتب الشهر العقاري المختص لحماية حقوقك؛ استلم صورة مسجلة مختومة.",
    ],
    qa: {
      q: "هل يكفي توقيع العقد مع جهاز المدينة دون تسجيله؟",
      a: "التسجيل في الشهر العقاري ضروري لحماية حقوقك. العقد الموقع مع الجهاز لا يغني عن التسجيل الرسمي.",
    },
    faq: [
      { q: "كم نسخة من العقد أحتاج؟", a: "تختلف حسب الإجراءات؛ احتفظ بنسخة معتمدة لديك، وأخرى للبنك إن وُجد تمويل، وأخرى للتسجيل." },
      { q: "هل يمكن تسجيل العقد إلكترونيًا؟", a: "تحقق من خدمات الشهر العقاري الإلكتروني؛ بعض الإجراءات تتطلب حضورًا شخصيًا." },
      { q: "متى يبدأ سريان العقد؟", a: "تاريخ السريان يُحدد في نص العقد؛ راجع البند الخاص بالتزامات الطرفين والسداد." },
    ],
    sourceKey: "newcities",
  },
];

// ---------------------------------------------------------------------------
// استعارة الهيكل من about-us
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

function pageShell(chrome, { title, description, url, h1, tag, breadcrumbItems, body, extraSchemas = [] }) {
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
      "itemListElement": breadcrumbItems.map((it, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": it.name,
        "item": it.item,
      })),
    },
    orgNode(),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas: [...schemas, ...extraSchemas] });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${breadcrumbItems
    .map((it, i) => {
      if (i === breadcrumbItems.length - 1) {
        return `<li><span aria-current="page">${it.name}</span></li>`;
      }
      return `<li><a href="${it.item}">${it.name}</a></li><li class="sep">›</li>`;
    })
    .join("")}</ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap">${body}</div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

function sourceBlock(key) {
  const s = SOURCES[key];
  return `<div class="action-card" style="margin-top:1.5rem">
    <p><strong>المصدر الرسمي:</strong> ${s.name}</p>
    <p style="font-size:.85rem;color:#607067">${s.note} · تاريخ الاطلاع: ${ACCESSED_AT}</p>
    <a class="text-link" href="${s.url}" target="_blank" rel="nofollow noopener">زيارة المصدر ↗</a>
    <a class="text-link" href="${SOURCES.obourContact.url}" target="_blank" rel="nofollow noopener">بيانات جهاز العبور ↗</a>
  </div>`;
}

function procedurePage(chrome, proc) {
  const url = `${SITE}/procedures/${proc.slug}/`;
  const title = `${proc.title} | دليل إجراءات العبور الجديدة`;
  const h1 = proc.title;

  const stepsList = proc.steps.map((s, i) => `<li><strong>الخطوة ${i + 1}:</strong> ${s}</li>`).join("");
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": proc.qa.q,
        "acceptedAnswer": { "@type": "Answer", "text": proc.qa.a },
      },
      ...proc.faq.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    ],
  };

  const body = `
<p><strong>تنبيه:</strong> هذا الدليل يُقدّم الإطار العام للإجراء فقط. أي رقم أو رسوم أو مدة أو مستند غير منشور رسميًا في المصدر المذكور يجب التحقق منه مباشرة لدى جهاز العبور الجديدة أو صندوق الإسكان الاجتماعي والتمويل العقاري قبل اتخاذ أي خطوة.</p>
<h2>خطوات الإجراء</h2>
<ol>${stepsList}</ol>
<h2>سؤال وإجابة</h2>
<div class="qa-block" style="background:#fbfaf4;border:1px solid #dbe3da;border-radius:8px;padding:1.1rem 1.2rem;margin:1rem 0">
  <p><strong>س:</strong> ${proc.qa.q}</p>
  <p><strong>ج:</strong> ${proc.qa.a}</p>
</div>
<h2>أسئلة شائعة</h2>
<dl>
  ${proc.faq.map((f) => `<dt><strong>س:</strong> ${f.q}</dt><dd><strong>ج:</strong> ${f.a}</dd>`).join("")}
</dl>
${sourceBlock(proc.sourceKey)}
<p><a href="/procedures/">كل أدلة الإجراءات</a> · <a href="/buying-guide/">دليل الشراء</a> · <a href="/contact/">تواصل معنا للتصحيح</a></p>
`;

  return pageShell(chrome, {
    title,
    description: proc.description,
    url,
    h1,
    tag: "إجراء حكومي",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "أدلة الإجراءات", item: SITE + "/procedures/" },
      { name: proc.title, item: url },
    ],
    body,
    extraSchemas: [faqSchema],
  });
}

function indexPage(chrome) {
  const url = `${SITE}/procedures/`;
  const title = "أدلة الإجراءات الحكومية في العبور والعبور الجديدة | دليل العبور";
  const description = "دليل إجراءات حكومية في العبور والعبور الجديدة: استعلام الأولوية، تبديل الوحدة، تغيير التمويل، استلام الوحدة، وتسجيل العقد — من مصادر رسمية مع التحقق المباشر.";
  const h1 = "أدلة الإجراءات الحكومية في العبور والعبور الجديدة";

  const list = PROCEDURES.map((p) => `<li><a href="/procedures/${p.slug}/">${p.title}</a><span> — ${p.description}</span></li>`).join("");

  const body = `
<p>هذه الصفحة تُجمّع الإجراءات الحكومية الشائعة في العبور الجديدة. كل دليل يعتمد على الإطار العام المنشور من هيئة المجتمعات العمرانية الجديدة وصندوق الإسكان الاجتماعي والتمويل العقاري. أي تفصيل غير مؤكد رسميًا مُصاغ كـ «تحقق من جهاز المدينة مباشرة».</p>
<h2>الأدلة المتاحة</h2>
<ul class="entity-list">${list}</ul>
<div class="action-card">
  <p><strong>مصادر رسمية</strong></p>
  <p style="font-size:.85rem;color:#607067">هيئة المجتمعات العمرانية الجديدة (newcities.gov.eg) · صندوق الإسكان الاجتماعي والتمويل العقاري (mff.gov.eg) · تاريخ الاطلاع: ${ACCESSED_AT}</p>
  <a class="text-link" href="${SOURCES.newcities.url}" target="_blank" rel="nofollow noopener">موقع الهيئة ↗</a>
  <a class="text-link" href="${SOURCES.mff.url}" target="_blank" rel="nofollow noopener">موقع الصندوق ↗</a>
</div>
`;

  return pageShell(chrome, {
    title,
    description,
    url,
    h1,
    tag: "دليل إجراءات",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "أدلة الإجراءات", item: url },
    ],
    body,
  });
}

// ---------------------------------------------------------------------------
// إضافة رابط /procedures/ في قائمة "الخدمات" (idempotent)
// ---------------------------------------------------------------------------
function addProceduresLinkToServicesMenu() {
  const marker = 'href="/procedures/">إجراءات حكومية';
  let touched = 0;
  let skipped = 0;

  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "index.html") {
        let html = fs.readFileSync(full, "utf8");
        if (html.includes(marker)) {
          skipped++;
          continue;
        }
        // Case 1: "الخدمات" is already a dropdown
        const dropRe = /(<div class="nav-item nav-has-drop"><span class="nav-top"[^>]*>الخدمات[\s\S]*?<div class="nav-drop">)(<a href="\/directory\/">دليل الخدمات<\/a>)/;
        let next = html.replace(dropRe, `$1<a href="/procedures/">إجراءات حكومية</a>$2`);
        if (next !== html) {
          html = next;
          fs.writeFileSync(full, html);
          touched++;
          continue;
        }
        // Case 2: "الخدمات" is a plain link — convert to dropdown
        const plainRe = /(<div class="nav-item"><a href="\/directory\/">الخدمات<\/a><\/div>)/;
        next = html.replace(plainRe, `<div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">الخدمات <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/directory/">دليل الخدمات</a><a href="/procedures/">إجراءات حكومية</a></div></div>`);
        if (next !== html) {
          html = next;
          fs.writeFileSync(full, html);
          touched++;
        }
      }
    }
  };
  walk(clientDir);
  rep("nav", `أُضيف رابط الإجراءات في ${touched} صفحة؛ تُخطّى ${skipped} صفحة موجودة مسبقًا.`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const dir = path.join(clientDir, "procedures");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), indexPage(chrome));
  rep("index", "أُنشئت /procedures/");

  for (const proc of PROCEDURES) {
    const p = path.join(dir, proc.slug);
    fs.mkdirSync(p, { recursive: true });
    fs.writeFileSync(path.join(p, "index.html"), procedurePage(chrome, proc));
    rep("page", `أُنشئت /procedures/${proc.slug}/`);
  }

  addProceduresLinkToServicesMenu();

  console.log("=== تقرير المرحلة السادسة: دليل الإجراءات الحكومية (6.3) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
