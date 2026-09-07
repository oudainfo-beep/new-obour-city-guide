/**
 * seo-phase-DAILY-20260907.mjs
 * المهمة اليومية (2026-09-07): 5 مقالات عربية جديدة.
 *
 * الصفحات (تدوير الفئات: صحة / تعليم / عقارات / معيشة / تسوق):
 *   1) medical-supplies-obour — محلات المستلزمات الطبية (قائمة موثقة: clinics.json «مستلزمات طبية»)
 *   2) academies-obour        — الأكاديميات ومراكز التدريب المتخصصة (قائمة موثقة: nurseries.json «أكاديميات ومراكز تدريب متخصصة»)
 *   3) negotiate-price-obour  — كيف تفاوض على سعر العقار — نثري إرشادي
 *   4) work-from-home-obour   — العمل من المنزل في العبور — نثري معيشي
 *   5) baby-products-obour    — مستلزمات الأطفال الرضع — نثري شرائي
 *
 * القواعد: idempotent، لا حقائق مخترعة (نطاقات + تنبيه تحقق + «غير منشور»)،
 * نمط loadChrome/buildHead من about-us كما في seo-phase24-ar-wave2-20260828.mjs،
 * JSON-LD: WebPage + FAQPage + BreadcrumbList + Organization، عربي lang=rtl،
 * عنوان <60 حرفًا، وصف 150-160 حرفًا (يُفحص ويُسجَّل في التقرير)، FAQ ≥3،
 * روابط داخلية لمسارات حقيقية، وبطاقة تصحيح /corrections/ في القالب.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-09-07";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

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

function faqSchema(questions) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };
}

function faqHtml(questions) {
  return `<div class="faq-block">${questions
    .map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`)
    .join("")}</div>`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function breadcrumbHtmlAr(items) {
  const lis = items
    .map((it, i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${it.name}</span>` : `<a href="${it.path}">${it.name}</a>`}</li>`)
    .join('<li class="sep">›</li>');
  return `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${lis}</ol></div></nav>`;
}

function webPageSchema({ h1, url, description }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: h1,
    url,
    description,
    inLanguage: "ar-EG",
    datePublished: TODAY,
    dateModified: TODAY,
    publisher: { "@id": SITE + "/#org" },
  };
}

function pageShellAr(chrome, { url, title, description, h1, tag, crumbs, body, faq }) {
  const schemas = [
    orgNode(),
    webPageSchema({ h1, url, description }),
    breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url }))),
    faqSchema(faq),
  ];
  // بوابة الجودة: عنوان <60 ووصف 150-160 (يُسجَّل في التقرير لكل صفحة)
  const tLen = [...title].length;
  const dLen = [...description].length;
  rep(
    tLen < 60 && dLen >= 150 && dLen <= 160 ? "META" : "META-CHECK",
    `title=${tLen}ch desc=${dLen}ch — ${url}`,
  );
  if (faq.length < 3) rep("FAQ-CHECK", `${url} has only ${faq.length} questions`);
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}<h2>أسئلة شائعة</h2>${faqHtml(faq)}</article><aside class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a><a class="text-link" href="/updates/">تحديثات الدليل ↖</a></aside></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtmlAr(crumbs)}${main}${chrome.footer}</body></html>`;
}

function writePage(relDir, html) {
  const outDir = path.join(clientDir, relDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  rep("OK", `wrote /${relDir}/ (${Math.round(html.length / 1024)}KB)`);
}

function injectHubLink(relFile, href, blockHtml) {
  const p = path.join(clientDir, relFile, "index.html");
  if (!fs.existsSync(p)) {
    rep("SKIP", `hub ${relFile} not found`);
    return;
  }
  let html = fs.readFileSync(p, "utf8");
  if (html.includes(`href="${href}"`)) {
    rep("SKIP", `${relFile} already links to ${href}`);
    return;
  }
  if (!html.includes("</main>")) {
    rep("SKIP", `${relFile} has no </main> marker`);
    return;
  }
  html = html.replace("</main>", `${blockHtml}</main>`);
  fs.writeFileSync(p, html, "utf8");
  rep("OK", `linked ${href} from /${relFile}/`);
}

const AR = (o) => (chrome) => pageShellAr(chrome, o);
const PAGES = [];
function addPage(relDir, builder) {
  PAGES.push({ relDir, builder });
}

// قراءة بيانات الأدلة الموثقة (نمط المرحلة 7): لا كيانات مخترعة
const dataDir = path.join(root, "data", "directories");
function readData(name) {
  const p = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function dataTable(items, note) {
  const rows = items.slice(0, 30).map((it, i) => {
    const phone = it.t || it.p || "غير منشور";
    const address = it.a || "غير منشور";
    return `<tr><td>${i + 1}</td><td><strong>${it.n}</strong>${it.e ? `<br><small>${it.e}</small>` : ""}</td><td>${it.c || "—"}</td><td>${address}</td><td dir="ltr">${phone}</td></tr>`;
  }).join("");
  return `<p>${note}</p><div class="table-wrap"><table><thead><tr><th>#</th><th>الاسم</th><th>التصنيف</th><th>العنوان</th><th>الهاتف</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ---------------------------------------------------------------------------
// صفحات قوائم مبنية على بيانات الأدلة الموثقة (صفحتان: صحة + تعليم)
// ---------------------------------------------------------------------------
const LISTICLES = [
  {
    slug: "medical-supplies-obour", data: "clinics", cats: ["مستلزمات طبية"],
    h1: "محلات المستلزمات الطبية في العبور", tag: "⌖ صحة", parent: { name: "العيادات والمراكز الطبية", path: "/clinics/" },
    title: "المستلزمات الطبية في العبور: المحلات الموثقة | دليل العبور",
    description: "قائمة محلات المستلزمات والأجهزة الطبية في مدينة العبور من الدليل الموثق بالأسماء والعناوين، مع دليل شراء الأجهزة المنزلية ونصائح الضمان والمعايرة قبل الدفع.",
    intro: "كرسي متحرك لوالدك بعد العملية، جهاز قياس ضغط يُراجَع كل صباح، كانيولا وشاش ومستهلكات تمريض لا تنتظر شحنة أونلاين بعد يومين — احتياجات المستلزمات الطبية تأتي غالبًا في توقيت لا يحتمل التأجيل. هذه القائمة من الدليل الموثق تجمع محلات المستلزمات والأجهزة الطبية المنشورة في مدينة العبور بالاسم والعنوان، مع دليل شراء عملي يحميك من جهاز بلا ضمان أو قراءة غير مضبوطة.",
    tipsTitle: "قبل ما تشتري: خمس قواعد للأجهزة الطبية المنزلية",
    tips: [
      "اطلب فاتورة رسمية وبطاقة ضمان مختومة بالتواريخ — جهاز طبي بلا ضمان مخاطرة لا توفير.",
      "الأجهزة القياسية (ضغط وسكر وحرارة) تحتاج معايرة دورية؛ اسأل البائع عن أقرب مركز معايرة أو وكيل معتمد.",
      "قارن سعر الجهاز بأسعار الوكيل الرسمي على الإنترنت قبل الشراء — الفارق الكبير في الاتجاهين علامة استفهام.",
      "للمستهلكات (قفازات وشاش وكانيولات): راجع تاريخ الصلاحية على العبوة نفسها لا على الكرتونة الخارجية فقط.",
      "للأجهزة الكبيرة (كراسي متحركة وأسرة طبية): جرّب بنفسك — الوزن والاتزان وسهولة الطي لا تُقيَّم من الصور.",
    ],
    extraHtml: `
<h2>ماذا تجد في محلات المستلزمات الطبية؟</h2>
<p>تتدرج البضاعة من المستهلكات اليومية — شاش وقطن وقفازات وكحول ولاصق طبي — إلى أجهزة القياس المنزلية كأجهزة الضغط والسكر والترمومترات وبخاخات الاستنشاق، ثم المعدات الأثقل: كراسي متحركة وعكازات وأسرة طبية منزلية وأجهزة توليد الأكسجين ومرتبات هوائية لمرضى طول الفراش. وليست كل محل يخزن كل شيء؛ اتصل بالمحلات في القائمة الموثقة واسأل عن القطعة المطلوبة قبل التحرك، خاصة للمعدات الكبيرة التي تُجلَب أحيانًا بالطلب. ومن يحتاج تمريضًا منزليًا مع المستلزمات فعناوين <a href="/home-nursing-obour/">التمريض المنزلي</a> في دليلها المخصص.</p>
<h2>جهازك الأول: الضغط والسكر بلا حيرة</h2>
<p>جهاز قياس الضغط المنزلي الأشهر هو الزئبقي بديله الرقمي الأوتوماتيكي — ولكبار السن ومستخدمي المنزل عمومًا الرقمي أسهل وأقل عرضة لخطأ القراءة الذاتية، بشرط اختيار مقاس الكفة المناسب لمحيط الذراع. أجهزة السكر تتشابه في دقتها المعتمدة وتختلف في سعر الشرائط — وهنا الفخ: الجهاز الرخيص بشرائط غالية يكلفك أكثر في عام واحد من جهاز أغلى بشرائط معقولة. احسب تكلفة الشريط الشهرية قبل سعر الجهاز. وأي قراءة منزلية تظل مؤشرًا لا تشخيصًا؛ التأكيد عند الطبيب وفي <a href="/labs-radiology/">معامل التحاليل</a>.</p>
<h2>مصادرك الأخرى داخل المدينة</h2>
<p>بين زيارتين لمحل المستلزمات، كثير من الاحتياجات الخفيفة متاح في <a href="/pharmacies/">الصيدليات</a> — من مستلزمات الجروح إلى أجهزة الحرارة — وبعضها يعمل حتى وقت متأخر كما في <a href="/pharmacies-24-hours/">دليل الصيدليات المناوبة</a>. وعند حاجة ماسة ليلية فقسم الطوارئ في أقرب <a href="/hospitals/">مستشفى</a> هو المرجع، مع <a href="/emergency/">أرقام الطوارئ</a> محفوظة في هاتف كل فرد بالأسرة.</p>
`,
    faqQ: "فين أشتري مستلزمات طبية في العبور؟",
    faqA: "القائمة الموثقة على هذه الصفحة تجمع محلات المستلزمات والأجهزة الطبية المنشورة بالمدينة بالاسم والعنوان — اتصل قبل الزيارة واسأل عن القطعة المطلوبة وتوفرها وسعرها. وللمستهلكات الخفيفة العاجلة تغطيك الصيدليات القريبة منك، وللمعدات الكبيرة كالكراسي المتحركة اسأل عن الطلب والتوصيل إن لم تكن معروضة.",
  },
  {
    slug: "academies-obour", data: "nurseries", cats: ["أكاديميات ومراكز تدريب متخصصة"],
    h1: "الأكاديميات ومراكز التدريب المتخصصة في العبور", tag: "⌖ تعليم", parent: { name: "التعليم", path: "/education-guide/" },
    title: "الأكاديميات المتخصصة في العبور: القائمة | دليل العبور",
    description: "قائمة الأكاديميات ومراكز التدريب المتخصصة في مدينة العبور من الدليل الموثق بالأسماء والعناوين: تدريب تقني ومهني وتنمية بشرية، ومعايير الاختيار قبل دفع الرسوم.",
    intro: "بين مركز يعلّم اللحام بمعايير صناعية، وآخر يدرب على البرمجة والنظم، وثالث يقدم التنمية البشرية واللغات — التدريب المتخصص في العبور أوسع مما يتخيل كثير من سكانها. هذه القائمة من الدليل الموثق تجمع الأكاديميات ومراكز التدريب المتخصصة المنشورة في المدينة بالاسم والعنوان، مع معايير اختيار تفصل بين شهادة تفتح باب عمل وشهادة تعلّق على الحائط فقط.",
    tipsTitle: "كيف تختار الأكاديمية المناسبة لهدفك",
    tips: [
      "ابدأ من سوق العمل لا من إعلان المركز: ما المهارة المطلوبة في الوظيفة المستهدفة فعلًا؟ ثم ابحث عمن يدربها.",
      "اسأل عن التطبيق العملي: نسبة التدريب اليدوي إلى المحاضرات النظرية هي الفارق الحقيقي بين المراكز.",
      "تحقق من اعتماد الشهادة: جهة إصدارها واسمها عند أصحاب العمل أهم من لونها وإطارها.",
      "اطلب التواصل مع خريجين سابقين أو الاطلاع على نماذج أعمالهم — مركز واثق لا يتهرب من هذا الطلب.",
      "زر المقر بنفسك: المعامل والأجهزة والورش التي ستراها في جولة خمس دقائق تخبرك أكثر من أي بروشور.",
    ],
    extraHtml: `
<h2>التدريب التقني والمهني: ذراع المدينة الصناعية</h2>
<p>العبور مدينة صناعية قبل كل شيء، وسوقها يكافئ المهارة الفنية الموثقة: لحام وتشغيل ماكينات وصيانة نظم وبرمجة وتقنية. مراكز القائمة الموثقة تضم نماذج من هذا النوع — كمراكز اللحام المتخصصة وتدريب النظم والتقنية — وبعضها يقع داخل المنطقة الصناعية نفسها أو قريبًا منها، ما يعني تدريبًا قريبًا من بيئة العمل الحقيقية. لمن يفكر في المسار الصناعي أصلًا، راجع <a href="/industrial-companies/">دليل الشركات الصناعية</a> لتعرف أي التخصصات يطلبها سوق المدينة، و<a href="/jobs-obour/">دليل الوظائف</a> للفرص المتاحة بعد التأهيل.</p>
<h2>التنمية البشرية والمهارات الشخصية</h2>
<p>النوع الثاني في القائمة يركز على المهارات الناعمة: لغات وتنمية بشرية ومهارات تواصل وإعداد مدربين. هذا المسار يناسب من يبني مساره الإداري أو يحتاج لغة لترقية أو منحة. قيّم هذه المراكز بمعيارين: خبرة المدرب العملية خارج قاعة التدريب، ومتابعة ما بعد الكورس — المادة العلمية صارت متاحة مجانًا على الإنترنت، وما تدفعه حقًا هو التغذية الراجعة والممارسة. ولمسار اللغات المدرسي الأوسع راجع <a href="/language-centers-obour/">مراكز اللغات</a>، وللتدريب العام <a href="/training-centers-obour/">مراكز التدريب والكورسات</a>.</p>
<h2>بدائل ومسارات مكملة</h2>
<p>التدريب المتخصص ليس الطريق الوحيد للمهارة: <a href="/computer-courses-obour/">كورسات الكمبيوتر</a> للأساسيات الرقمية، و<a href="/driving-schools-obour/">مدارس القيادة</a> لرخصة توسع فرص العمل، و<a href="/first-aid-courses-obour/">الإسعافات الأولية</a> لمهارة تنقذ وتضيف لسيرتك. وللشباب الجامعي، الجمع بين كورس متخصص ودراستك في <a href="/universities-near-obour/">الجامعات القريبة</a> يصنع ميزة تنافسية واضحة عند التخرج — ومن يفكر في منحة خارجية يبدأ من <a href="/study-abroad-obour/">دليل الدراسة بالخارج</a>.</p>
`,
    faqQ: "إيه أفضل أكاديمية تدريب في العبور؟",
    faqA: "لا توجد «أفضل» مطلقة بل أنسب لتخصصك وهدفك: حدد المهارة المطلوبة في سوق العمل أولًا، ثم قارن مراكز القائمة الموثقة على أربعة معايير — التطبيق العملي داخل التدريب، وخبرة المدرب، واعتماد الشهادة وقيمتها عند أصحاب العمل، ونتائج الخريجين السابقين. زر المقر واسأل عن محتوى آخر دورة فعليًا قبل دفع أي رسوم.",
  },
];

for (const L of LISTICLES) {
  addPage(L.slug, AR({
    url: `${SITE}/${L.slug}/`,
    title: L.title,
    description: L.description,
    h1: L.h1,
    tag: L.tag,
    crumbs: [
      { name: "الرئيسية", path: "/", url: SITE + "/" },
      { name: L.parent.name, path: L.parent.path, url: SITE + L.parent.path },
      { name: L.h1, path: `/${L.slug}/`, url: `${SITE}/${L.slug}/` },
    ],
    body: `
<p>${L.intro}</p>
<p>تنبيه تحريري: البيانات هنا من الدليل الموثق بالمصادر المنشورة — العنوان والهاتف مدرجان إن وُجدا، وما لم يُنشر يُترك «غير منشور». تحقق هاتفيًا قبل الزيارة، وصحّح أي معلومة عبر <a href="/corrections/">صفحة التصحيح</a>.</p>
<div data-listicle="${L.slug}"></div>
<h2>${L.tipsTitle}</h2>
<ul>${L.tips.map((t) => `<li>${t}</li>`).join("")}</ul>
${L.extraHtml || ""}
<h2>الخلاصة</h2>
<p>هذه القائمة تُحدَّث مع كل تحديث موثق للدليل. وجدت خطأ أو جهة تستحق الإضافة؟ شاركنا عبر <a href="/corrections/">صفحة التصحيح</a> — وللصورة الكاملة للقطاع راجع <a href="${L.parent.path}">${L.parent.name}</a> و<a href="/directory/">دليل الخدمات</a>.</p>
`,
    faq: [
      { q: L.faqQ, a: L.faqA },
      { q: `كيف أجد أقرب ${L.h1} لحيّي؟`, a: "القائمة الموثقة على هذه الصفحة مرتبة بالأسماء والعناوين — حدد الأقرب لحيّك من العنوان، واتصل لتأكيد المواعيد والخدمة قبل الزيارة. ثبّت موقعك على خريطة العبور على موقعنا لقياس المسافة الفعلية." },
      { q: "ماذا أفعل إذا وجدت معلومة قديمة في القائمة؟", a: "أخبرنا عبر صفحة التصحيح مع ذكر الجهة والمعلومة الصحيحة ومصدرها إن وُجد. التصحيحات الموثقة تُراجع وتُحدَّث القائمة معها — هكذا يظل الدليل دقيقًا للجميع." },
    ],
  }));
}
