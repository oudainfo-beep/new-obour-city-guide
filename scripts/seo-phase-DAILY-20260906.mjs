/**
 * seo-phase-DAILY-20260906.mjs
 * المهمة اليومية (2026-09-06): 5 مقالات عربية جديدة.
 *
 * الصفحات (تدوير الفئات: تسوق / خدمات مهنية / تعليم / معيشة / عقارات):
 *   1) shoes-obour            — محلات الأحذية في العبور (قائمة موثقة: shopping.json «محلات أحذية»)
 *   2) interior-design-obour  — مكاتب التصميم الداخلي والديكور (قائمة موثقة: professional-services.json «تصميم داخلي»)
 *   3) training-centers-obour — مراكز التدريب والكورسات (قائمة موثقة: professional-services.json «مراكز تدريب»)
 *   4) bills-payment-obour    — سداد الفواتير: كهرباء ومياه وغاز وإنترنت — نثري إجرائي
 *   5) apartment-vs-villa-obour — شقة ولا فيلا في العبور؟ مقارنة صريحة — نثري
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
const TODAY = "2026-09-06";

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
// صفحات قوائم مبنية على بيانات الأدلة الموثقة (ثلاث صفحات)
// ---------------------------------------------------------------------------
const LISTICLES = [
  {
    slug: "shoes-obour", data: "shopping", cats: ["محلات أحذية"],
    h1: "محلات الأحذية في العبور", tag: "⌖ تسوق", parent: { name: "التسوق", path: "/shopping/" },
    title: "محلات الأحذية في العبور: الأسماء والعناوين | دليل العبور",
    description: "قائمة محلات الأحذية في مدينة العبور بالاسم والعنوان من الدليل الموثق: رجالي وحريمي وأطفال ورياضية، مع نصائح اختيار المقاس وأفضل أوقات الشراء والتخفيضات.",
    intro: "شراء حذاء جديد في العبور لا يعني بالضرورة مشوارًا للقاهرة؛ المدينة فيها تجمّع نشط من محلات الأحذية — رجالي وحريمي وأطفال ورياضية — يتركز أغلبها في سنترات الحي الأول وشارع الشباب ومولات الطريق الصحراوي. هذه القائمة من الدليل الموثق تجمع الأسماء المنشورة بالعناوين، مع نصائح الشراء الذكي التي توفر عليك رحلة الاستبدال.",
    tipsTitle: "قبل ما تشتري: نصائح المقاس والخامة",
    tips: [
      "جرّب الحذاء آخر النهار لا أوله — القدم تتورم قليلًا مع اليوم، والمقاس المريح مساءً هو المقاس الصحيح فعلًا.",
      "اقطع خطوات كافية داخل المحل على أرضية صلبة: الوقوف الثابت يخفي ما تكشفه عشر خطوات مشي.",
      "اسأل عن الخامة صراحة: جلد طبيعي أم صناعي؟ الفرق يظهر بعد شهرين في التشققات والرائحة، وفي السعر بالطبع.",
      "لأحذية الأطفال: اترك مساحة نمو بعرض إصبع خلف الكعب، وراجع <a href='/kids-clothing/'>دليل ملابس الأطفال</a> لباقي احتياجات الموسم الدراسي.",
      "احتفظ بالإيصال واسأل عن سياسة الاستبدال قبل الدفع — خاصة في الشراء أونلاين من صفحات المحلات.",
    ],
    extraHtml: `
<h2>أين تتركز محلات الأحذية في المدينة؟</h2>
<p>من واقع القائمة الموثقة: ثلاثة تجمعات رئيسية. سنترات الحي الأول (محلية 5 و6 على محور السادات) تضم العدد الأكبر وتغطي الفئات السعرية المتوسطة والاقتصادية، وشارع الشباب وحي الشباب يخدم المنطقة الجنوبية بمحلات متنوعة، بينما تتجمع العلامات الأشهر في <a href="/golf-city-mall/">جولف سيتي مول</a> على الطريق الصحراوي لمن يفضل التسوق المكيف والماركات. وقبل الخروج راجع <a href="/new-obour-malls/">دليل المولات</a> لاختيار وجهتك حسب حيّك.</p>
<h2>التوفير الذكي: التخفيضات والأوتليت</h2>
<p>دورة التخفيضات شبه ثابتة: نهاية كل موسم (يناير-فبراير ويوليو-أغسطس) تخرج المحلات تشكيلاتها القديمة بأسعار أقل بوضوح، ومحلات «آخر الموسم» والأوتليت تعمل على هذا الموديل طوال العام. ولأن العبور مدينة صناعية، بعض مصانع ومجمعات الأحذية بالمنطقة الصناعية تبيع للجمهور بأسعار الجملة أو قريبًا منها — اسأل في التجمعات الصناعية من القائمة إن كان البيع للأفراد متاحًا. للمقارنة الأوسع راجع <a href="/best-shoes-obour/">ترشيحات أفضل محلات الأحذية</a> و<a href="/friday-market/">سوق الجمعة</a> للصفقات الشعبية.</p>
<h2>بعد الشراء: العناية والإصلاح</h2>
<p>حذاء جيد يُصان يعيش أضعاف عمره: نظّف الجلد ولمّعه دوريًا، ولا تلبس الحذاء نفسه يومين متتاليين ليتنفس، وأصلح الكعب والنعل عند أول اهتراء بدل انتظار التلف الكامل. عناوين الإصلاح الموثقة في <a href="/shoe-repair-obour/">دليل إصلاح الأحذية</a>، وللباقة الكاملة من التسوق راجع <a href="/clothing-stores/">محلات الملابس</a> و<a href="/shopping-guide/">دليل التسوق</a>.</p>
`,
    faqQ: "فين أشتري أحذية في العبور؟",
    faqA: "أكبر تجمع في سنترات الحي الأول على محور السادات (محلية 5 و6) بفئات سعرية متوسطة واقتصادية، ثم شارع الشباب وحي الشباب جنوبًا، والعلامات الأشهر في مولات الطريق الصحراوي كجولف سيتي مول. القائمة الموثقة على هذه الصفحة تعرض الأسماء والعناوين — اختر الأقرب لحيّك واتصل قبل الزيارة للتأكد من المواعيد.",
  },
  {
    slug: "interior-design-obour", data: "professional-services", cats: ["تصميم داخلي"],
    h1: "مكاتب التصميم الداخلي والديكور في العبور", tag: "⌖ خدمات", parent: { name: "الخدمات المهنية", path: "/professional-services/" },
    title: "التصميم الداخلي في العبور: المكاتب الموثقة | دليل العبور",
    description: "قائمة مكاتب التصميم الداخلي والديكور في مدينة العبور بالاسم والعنوان من الدليل الموثق، مع اختيار المكتب وقراءة العرض الفني وحساب تكلفة التشطيب قبل التعاقد.",
    intro: "استلام الشقة على الطوب أجمل لحظة وأصعبها: أمامك عشرات القرارات من توزيع الكهرباء حتى لون الدهان، وكل خطأ يُدفع ثمنه مرتين. هنا يأتي دور مكتب التصميم الداخلي. هذه القائمة من الدليل الموثق تجمع مكاتب التصميم والديكور المنشورة في مدينة العبور بالاسم والعنوان، مع خريطة اختيار المكتب المناسب وقراءة عرضه قبل التوقيع.",
    tipsTitle: "كيف تختار مكتب التصميم المناسب",
    tips: [
      "اطلب معرض أعمال حقيقيًا: صور مشاريع منفذة — لا رندرات فقط — وإن أمكن زيارة شقة سابقة التشطيب للمكتب.",
      "اسأل من ينفذ: فريق المكتب نفسه أم مقاولون خارجيون؟ المسؤولية عند العيب تُحدَّد من هذه الإجابة.",
      "قارن ثلاثة عروض فنية ومالية لا عرضًا واحدًا — الفروق في البنود نفسها تكشف من يحسب بصدق.",
      "حدد نطاق التعاقد بدقة: تصميم فقط (رسومات ومخططات) أم تصميم وتنفيذ (تسليم مفتاح) أم إشراف هندسي على مقاولك؟",
      "كل بند مكتوب: المقايسة والخامات بالنوع والماركة والجداول الزمنية وشروط الدفع — «اتفقنا» الشفوية أغلى جملة في التشطيب.",
    ],
    extraHtml: `
<h2>ماذا يقدم لك المصمم الداخلي فعليًا؟</h2>
<p>القيمة الحقيقية ليست في اختيار الألوان بل في ثلاثة: توزيع ذكي للمساحة يكسبك أمتارًا وظيفية من الشقة نفسها، وتخطيط كهرباء وسباكة وإضاءة صحيح من أول مرة (تعديله بعد التشطيب يعني تكسيرًا)، وإدارة تسلسل التنفيذ بين الفنيين حتى لا يعيق بعضهم بعضًا. ومن له ميزانية محدودة يمكنه الاستعانة بالمصمم لمرحلة التصميم فقط ثم التنفيذ مع <a href="/painters-obour/">الدهانين</a> و<a href="/carpenters-obour/">النجارين</a> و<a href="/electricians-obour/">الكهربائيين</a> مباشرة بمخططات واضحة.</p>
<h2>كيف تقرأ العرض المالي للمكتب</h2>
<p>اعرض بنود المقايسة بندًا بند: سعر متر الدهانات والسيراميك والنقاشة، وتكلفة الأعمال الكهربائية والصحية بالنقطة، وخامات الأسقف المعلقة والمطابخ بالتفصيل — «سعر شامل للتشطيب» بلا مقايسة باب مفتوح للزيادات اللاحقة. قارن أسعار الخامات بنفسك في السوق عبر <a href="/paint-stores-obour/">محلات الدهانات</a> و<a href="/marble-ceramic-obour/">الرخام والسيراميك</a> و<a href="/lighting-stores-obour/">الإضاءة</a> لتعرف هامش المكتب بصدق. وراجع <a href="/after-purchase/">دليل ما بعد الشراء</a> لخطة التشطيب الكاملة خطوة خطوة.</p>
<h2>التشطيب مرحلة مراحل الشراء</h2>
<p>قرار التصميم يبدأ قبل استلام الشقة أصلًا: وحدة نصف تشطيب قد توفر عليك أعمال المحارة والكهرباء الأساسية، والتسليم الفاخر من مطور موثوق قد يغنيك عن المكتب كليًا. قارن خياراتك في <a href="/buying-guide/">دليل الشراء</a> و<a href="/choose-apartment/">اختيار الشقة</a>، واستكمل الفرش بعدها من <a href="/furniture-obour/">دليل الأثاث</a> و<a href="/kitchens-obour/">المطابخ</a> و<a href="/curtain-stores-obour/">الستائر</a> — وترشيحاتنا التحريرية في <a href="/best-interior-design-obour/">أفضل مكاتب التصميم الداخلي</a>.</p>
`,
    faqQ: "كم تكلفة التصميم الداخلي والتشطيب في العبور؟",
    faqA: "تتدرج بشكل واسع حسب مساحة الوحدة ومستوى التشطيب (اقتصادي أم متوسط أم فاخر) ونطاق التعاقد — تصميم فقط أم تنفيذ كامل — وتتحرك الأسعار مع خامات السوق. لا يوجد رقم عام صادق: اجمع ثلاثة عروض فنية ومالية بمقايسات مكتوبة من مكاتب القائمة الموثقة وقارن البند بالبند، واحتفظ بهامش احتياطي في ميزانيتك للمفاجآت المعتادة أثناء التنفيذ.",
  },
  {
    slug: "training-centers-obour", data: "professional-services", cats: ["مراكز تدريب"],
    h1: "مراكز التدريب والكورسات في العبور", tag: "⌖ تعليم", parent: { name: "دليل التعليم", path: "/education-guide/" },
    title: "مراكز التدريب في العبور: كورسات ومهارات | دليل العبور",
    description: "قائمة مراكز التدريب والكورسات في مدينة العبور بالاسم والعنوان من الدليل الموثق: لغات وبرمجة ومهارات فنية، ومعايير اختيار كورس يضيف لراتبك فعلًا لا شهادة شكلية.",
    intro: "سوق العمل لم يعد يسأل عن شهادتك الجامعية وحدها بل عما تجيده فعلًا: لغة، برنامج، حرفة، مهارة بيع. والعبور — بحكمها مدينة صناعية قبل كل شيء — فيها تنوع حقيقي في التدريب: مراكز لغات وبرمجة، وتدريب فني صناعي، وتنمية بشرية. هذه القائمة من الدليل الموثق تجمع المراكز المنشورة بالاسم والعنوان، مع معايير تفرق بين كورس يغيّر مسارك وشهادة تعلّق على الحائط.",
    tipsTitle: "معايير اختيار الكورس الذي يستحق فلوسك",
    tips: [
      "ابدأ من الوظيفة المستهدفة لا من إعلان المركز: اقرأ إعلانات <a href='/jobs-obour/'>الوظائف</a> في مجالك ولاحظ المهارات المطلوبة فعلًا، ثم اختر كورسًا يغطيها.",
      "اسأل عن المدرب بالاسم: خبرته العملية في السوق أهم من لافتة المركز — مدرب يعمل بالمهنة يعلّمك ما لا تقدمه المناهج.",
      "التطبيق العملي شرط: كورس بلا مشاريع وتدريب يدوي حقيقي يعطيك معلومات لا مهارة، والفرق يظهر في أول مقابلة عمل.",
      "اسأل خريجين سابقين عن النتيجة الفعلية: من حصل على عمل أو ترقية بعد الكورس؟ رأيهم أصدق من كتالوج المركز.",
      "قارن البدائل المجانية والمنخفضة أونلاين قبل الدفع — كثير من المحتوى النظري متاح مجانًا، فادفع فقط مقابل ما لا يقدمه الإنترنت: ممارسة وتصحيح وشبكة علاقات.",
    ],
    extraHtml: `
<h2>خريطة التدريب في المدينة: ماذا تتعلم وأين؟</h2>
<p>القائمة الموثقة تغطي طيفًا واسعًا: مراكز اللغات لمن يحتاج الإنجليزية وغيرها للعمل أو الدراسة — وخيارات أوسع في <a href="/language-centers-obour/">دليل مراكز اللغات</a> — وكورسات البرمجة والحاسب لدخول المجال الرقمي (تفاصيل أكثر في <a href="/computer-courses-obour/">دليل كورسات الكمبيوتر</a>)، والتدريب الفني الصناعي كاللحام الذي تطلبه مصانع <a href="/industrial-zone/">المنطقة الصناعية</a> باستمرار، وبرامج التنمية البشرية والإدارية لأصحاب الخبرة الباحثين عن ترقية.</p>
<h2>الكورس كاستثمار: احسب العائد قبل الاشتراك</h2>
<p>عامل رسوم الكورس كاستثمار لا كمصروف: ما المهارة التي سأخرج بها؟ وكم تضيف لدخلي خلال سنة؟ كورس لحام معتمد قد يفتح باب عمل في المصانع خلال أسابيع، وكورس برمجة جاد قد ينقلك لمسار رقمي كامل، بينما دورة تنمية بشرية عامة بلا هدف وظيفي محدد غالبًا لا تغير شيئًا. اكتب هدفك من الكورس بجملة واحدة قبل الاشتراك؛ إن لم تستطع، فأنت تشتري ترفيهًا تعليميًا لا استثمارًا. وترشيحاتنا التحريرية في <a href="/best-training-obour/">أفضل مراكز التدريب</a>.</p>
<h2>مسارات تعليمية موازية تكمل خطتك</h2>
<p>التدريب المهني ليس المسار الوحيد: الدروس والتقوية للطلاب في <a href="/private-lessons-obour/">دليل الدروس الخصوصية</a>، والتعليم المفتوح والمنح في <a href="/study-abroad-obour/">دليل الدراسة بالخارج</a>، ومهارات الحياة العملية كالإسعافات الأولية في <a href="/first-aid-courses-obour/">دليلها المخصص</a> — وكلها تُبنى على اختيار واضح الهدف كما في <a href="/education-guide/">دليل التعليم</a> الكامل.</p>
`,
    faqQ: "ما أفضل مراكز الكورسات في العبور؟",
    faqA: "لا يوجد «أفضل» مطلق بل أنسب لهدفك: حدد المهارة المطلوبة في الوظيفة المستهدفة أولًا، ثم قارن مراكز القائمة الموثقة على أربعة معايير — خبرة المدرب العملية، والتطبيق اليدوي داخل الكورس، ونتائج الخريجين السابقين، وقيمة الشهادة في سوق العمل. زر المركز واسأل عن محتوى آخر دورة فعليًا قبل دفع أي رسوم.",
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
