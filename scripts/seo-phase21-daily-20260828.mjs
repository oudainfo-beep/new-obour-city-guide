/**
 * seo-phase21-daily-20260828.mjs
 * المرحلة 21 — المقالات اليومية (2026-08-28): 5 مقالات SEO جديدة.
 *
 * ينشئ:
 *   /dar-misr-obour/          — دار مصر في العبور: المراحل والتقديم (AR)
 *   /middle-ring-road-obour/  — الدائري الأوسطي وعلاقته بالعبور (AR)
 *   /friday-market/           — سوق الجمعة في العبور (AR)
 *   /en/nurseries/            — Nurseries in Obour City (EN)
 *   /en/postal-code/          — Obour City Postal Code guide (EN)
 *
 * القواعد:
 *  - idempotent: الصفحات تُعاد كتابتها كل build، وروابط الصفحات المحورية لا تُكرَّر.
 *  - لا حقائق مخترعة: الأرقام المتغيرة تُذكر كنطاقات مع تنبيه التحقق،
 *    والأماكن العامة توصَف وصفًا عامًا دون اختلاق أرقام هواتف أو مواعيد رسمية.
 *  - نمط loadChrome من seo-phase7-category-pages.mjs، وصفحات EN على نمط
 *    seo-phase16-en-new-pages.mjs (lang="en" dir="ltr" + hreflang).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-08-28";

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

function buildHead(head, { title, description, url, schemas, hreflang }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  if (hreflang) {
    const links = hreflang.map((x) => `<link rel="alternate" hreflang="${x.lang}" href="${x.href}">`).join("");
    if (!h.includes(`hreflang="${hreflang[0].lang}"`)) {
      h = h.replace("</head>", links + "</head>");
    }
  }
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
    .map((it, i) => {
      const isLast = i === items.length - 1;
      const body = isLast ? `<span aria-current="page">${it.name}</span>` : `<a href="${it.path}">${it.name}</a>`;
      return `<li>${body}</li>`;
    })
    .join('<li class="sep">›</li>');
  return `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${lis}</ol></div></nav>`;
}

function breadcrumbHtmlEn(items) {
  const lis = items
    .map((it, i) => {
      const isLast = i === items.length - 1;
      const body = isLast ? `<span aria-current="page">${it.name}</span>` : `<a href="${it.path}">${it.name}</a>`;
      return `<li>${body}</li>`;
    })
    .join('<li class="sep">›</li>');
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><ol>${lis}</ol></div></nav>`;
}

function webPageSchema({ h1, url, description, lang }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: h1,
    url,
    description,
    inLanguage: lang,
    datePublished: TODAY,
    dateModified: TODAY,
    publisher: { "@id": SITE + "/#org" },
  };
}

function pageShellAr(chrome, { url, title, description, h1, tag, crumbs, body, faq }) {
  const schemas = [
    orgNode(),
    webPageSchema({ h1, url, description, lang: "ar-EG" }),
    breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url }))),
    faqSchema(faq),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}<h2>أسئلة شائعة</h2>${faqHtml(faq)}</article><aside class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a><a class="text-link" href="/updates/">تحديثات الدليل ↖</a></aside></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtmlAr(crumbs)}${main}${chrome.footer}</body></html>`;
}

function pageShellEn(chrome, { url, arUrl, title, description, h1, tag, crumbs, body, faq }) {
  const schemas = [
    orgNode(),
    webPageSchema({ h1, url, description, lang: "en" }),
    breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url }))),
    faqSchema(faq),
  ];
  const hreflang = [
    { lang: "en", href: url },
    { lang: "ar", href: arUrl },
    { lang: "x-default", href: arUrl },
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas, hreflang });
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}<h2>Frequently asked questions</h2>${faqHtml(faq)}</article><aside class="action-card"><p>Spotted an error or have a verified addition?</p><a class="button" href="/corrections/">Suggest a correction ↖</a><a class="text-link" href="/en/">English home ↖</a></aside></div></section></main>`;
  return `<!doctype html><html lang="en" dir="ltr">${head}<body>${chrome.header}${breadcrumbHtmlEn(crumbs)}${main}${chrome.footer}</body></html>`;
}

function writePage(relDir, html) {
  const outDir = path.join(clientDir, relDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  rep("OK", `wrote /${relDir}/ (${Math.round(html.length / 1024)}KB)`);
}

/** Adds an inbound link block before </main> of a hub page, idempotently. */
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

// ---------------------------------------------------------------------------
// 1) /dar-misr-obour/ — دار مصر في العبور (AR — Real Estate)
// ---------------------------------------------------------------------------
const DAR_MISR_FAQ = [
  {
    q: "هل يوجد مشروع دار مصر في مدينة العبور؟",
    a: "نعم، وُجهت مراحل من مبادرة دار مصر التابعة لهيئة المجتمعات العمرانية الجديدة إلى مدينة العبور ضمن مدن عدة. توافر الوحدات يتغير مع كل إعلان رسمي، لذا تحقق من إعلانات هيئة المجتمعات العمرانية أو بنك التعمير والإسكان قبل اتخاذ قرار.",
  },
  {
    q: "كيف أتقدم لحجز وحدة في دار مصر العبور؟",
    a: "التقديم يتم عادة عبر الإعلان الرسمي: شراء كراسة الشروط أو تحميلها إلكترونيًا، سداد مبلغ جدية الحجز في الحساب المحدد بالإعلان، ثم استيفاء المستندات وانتظار نتيجة التخصيص. الخطوات الدقيقة تختلف من إعلان لآخر — راجع كراسة الشروط الحالية.",
  },
  {
    q: "ما الفرق بين دار مصر وسكن مصر في العبور؟",
    a: "سكن مصر موجّه للإسكان المتوسط بأسعار مدعومة نسبيًا وشروط دخل محددة، بينما دار مصر يستهدف شريحة أعلى قليلًا بتشطيبات أفضل ومساحات أكبر عادة. كلاهما تابع لهيئة المجتمعات العمرانية، ولكل إعلان شروطه الخاصة.",
  },
  {
    q: "هل أسعار دار مصر العبور ثابتة؟",
    a: "لا. الأسعار تُعلن مع كل طرح وتتغير بتغير المرحلة والموقع وسياسات السداد. أي سعر تقرأه خارج الإعلان الرسمي الحالي قد يكون قديمًا — اعتمد دائمًا على كراسة الشروط الأحدث وتحقق من الرقم بنفسك.",
  },
];

const DAR_MISR_BODY = `
<p>إذا كنت تبحث عن شقة في مدينة العبور بضمان حكومي وتشطيب جيد دون أسعار الكمبوندات الخاصة، فمشروع <strong>دار مصر</strong> من الخيارات التي تظهر في بحثك باستمرار. هذا الدليل يشرح ما هو المشروع، وأين تتركز وحداته في العبور، وكيف يتم التقديم خطوة بخطوة، وما الذي يجب أن تتحقق منه قبل دفع أي مبالغ — لأن تفاصيل كل طرح تتغير مع الإعلان الرسمي.</p>
<p>هذا المقال موجّه لمن يقارن بين الإسكان الحكومي المتوسط والكمبوندات الخاصة في العبور، وليس إعلانًا رسميًا. الأرقام والمواعيد المذكورة هنا استرشادية، والمرجع النهائي دائمًا هو كراسة الشروط الصادرة عن الجهة المعلنة.</p>

<h2>ما مشروع دار مصر؟</h2>
<p>دار مصر مبادرة إسكان متوسط أطلقتها وزارة الإسكان ممثلة في <strong>هيئة المجتمعات العمرانية الجديدة</strong>، وتستهدف شريحة الدخل المتوسط بوحدات كاملة التشطيب في مناطق منظمة داخل المدن الجديدة والقائمة. بدأ المشروع في عدة مدن ثم توسّع على مراحل، ومنها مراحل وُجهت إلى مدينة العبور.</p>
<p>الفكرة الأساسية: وحدات جاهزة أو شبه جاهزة بمساحات تتناسب مع الأسر، في عمارات ذات كثافة معتدلة، وبجوار خدمات قائمة بالفعل — وهو ما يميز العبور تحديدًا لأنها مدينة قائمة بها مدارس وأسواق ومواصلات تعمل منذ سنوات، على عكس المدن التي تبدأ من الصفر.</p>

<h2>أين تتركز وحدات دار مصر في العبور؟</h2>
<p>تتوزع مراحل دار مصر عادة في مناطق التوسع الحديثة بالمدينة وبالقرب من المجاورات السكنية المنظمة، بما يبقيها قريبة من محاور الحركة الرئيسية مثل <a href="/roads/">طريق مصر إسماعيلية الصحراوي</a> وشبكة الطرق الداخلية. قبل الحجز، تحقق من كراسة الشروط من ثلاث نقاط:</p>
<ul>
<li><strong>الموقع الدقيق للعمارات</strong> — اطلب تحديد المنطقة والمجاورة بالاسم وزرها بنفسك في أوقات مختلفة من اليوم.</li>
<li><strong>القرب من الخدمات</strong> — قارن الموقع بخريطة <a href="/districts/">أحياء العبور</a> وقربه من المدارس والمواصلات والأسواق.</li>
<li><strong>حالة التنفيذ</strong> — هل الوحدات جاهزة للتسليم الفوري أم تحت التنفيذ بجدول زمني؟ هذا يغيّر قرارك بالكامل.</li>
</ul>

<h2>خطوات التقديم عمليًا</h2>
<p>تختلف التفاصيل من إعلان إلى آخر، لكن الإطار العام للتقديم في مشروعات هيئة المجتمعات العمرانية يمر عادة بهذه الخطوات:</p>
<ol>
<li><strong>متابعة الإعلان الرسمي</strong> — تُنشر الطروحات عبر موقع هيئة المجتمعات العمرانية الجديدة أو بنك التعمير والإسكان حسب الإعلان.</li>
<li><strong>الحصول على كراسة الشروط</strong> — إلكترونيًا أو من فروع البنك المعلنة، وقراءتها كاملة قبل أي دفع.</li>
<li><strong>سداد جدية الحجز</strong> — في الحساب البنكي المحدد بالإعلان فقط، والاحتفاظ بكل الإيصالات.</li>
<li><strong>تجهيز المستندات</strong> — بطاقة الرقم القومي وإثبات الدخل وما تطلبه الكراسة من أوراق.</li>
<li><strong>انتظار التخصيص</strong> — ثم استكمال الأقساط أو السداد وفق نظام الطرح (نقدي أو تمويل عقاري).</li>
</ol>
<p>تنبيه مهم: لا تدفع أي مبالغ لوسطاء خارج القنوات الرسمية. كل خطوات الحجز تتم بينك وبين الجهة المعلنة أو البنك مباشرة.</p>

<h2>دار مصر مقابل البدائل في العبور</h2>
<div class="table-wrap"><table><thead><tr><th>الخيار</th><th>الجهة</th><th>الشريحة</th><th>التشطيب</th><th>ملاحظات</th></tr></thead><tbody>
<tr><td><strong>دار مصر</strong></td><td>هيئة المجتمعات العمرانية</td><td>دخل متوسط وأعلى قليلًا</td><td>كامل عادة</td><td>تخصيص بالحجز وفق كراسة شروط لكل طرح</td></tr>
<tr><td><strong>سكن مصر</strong></td><td>هيئة المجتمعات العمرانية</td><td>دخل متوسط بشروط محددة</td><td>كامل عادة</td><td>شروط أولوية وأسقف دخل حسب الإعلان</td></tr>
<tr><td><strong>كمبوندات خاصة</strong></td><td>مطورون من <a href="/developers/">دليل المطورين</a></td><td>شرائح متعددة</td><td>نصف تشطيب أو كامل</td><td>أسعار السوق وأنظمة تقسيط خاصة بكل مطور</td></tr>
<tr><td><strong>شقق الأحياء القائمة</strong></td><td>ملاك وسوق إعادة البيع</td><td>متنوعة</td><td>حسب الحالة</td><td>راجع <a href="/prices/">صفحة أسعار العقارات</a> قبل المفاوضة</td></tr>
</tbody></table></div>

<h2>أخطاء شائعة عند حجز وحدة حكومية</h2>
<ul>
<li><strong>الاعتماد على أرقام قديمة</strong> — أسعار ومواعيد الطروحات تتغير؛ لا تبنِ قرارك على منشور قديم.</li>
<li><strong>تخطي قراءة كراسة الشروط</strong> — غرامات التأخير ونظام الأقساط وشروط التنازل كلها في الكراسة.</li>
<li><strong>إهمال زيارة الموقع</strong> — صورة الإعلان لا تغني عن زيارة ميدانية في الصباح والمساء.</li>
<li><strong>الخلط بين المشروعات</strong> — تأكد أن الإعلان يخص العبور وليس مدينة أخرى تحت نفس المبادرة.</li>
</ul>
<p>لتفاصيل أكثر عن أخطاء الشراء عمومًا راجع <a href="/mistakes/">دليل الأخطاء الشائعة</a>، ولخطوات الشراء الكاملة في العبور راجع <a href="/buying-guide/">دليل الشراء</a>.</p>

<h2>الخلاصة</h2>
<p>دار مصر في العبور خيار عملي لمن يريد وحدة حكومية متوسطة بتشطيب جيد داخل مدينة قائمة الخدمات. القاعدة الذهبية: الإعلان الرسمي وكراسة الشروط هما المصدر الوحيد للأرقام والمواعيد، وأي معلومة أخرى — بما فيها هذا المقال — مجرد إطار يساعدك على السؤال الصحيح. قارن البدائل في <a href="/best-compounds-obour/">دليل أفضل الكمبوندات</a> قبل اتخاذ القرار النهائي.</p>
`;

function buildDarMisrPage(chrome) {
  const url = `${SITE}/dar-misr-obour/`;
  return pageShellAr(chrome, {
    url,
    title: "دار مصر العبور: الموقع والمراحل وخطوات التقديم | دليل العبور",
    description: "دليل عملي لمشروع دار مصر في مدينة العبور: أين تقع الوحدات، كيف تتقدم خطوة بخطوة، ومقارنة مع سكن مصر والكمبوندات — مع تنبيهات التحقق من كل إعلان رسمي.",
    h1: "دار مصر في مدينة العبور: الدليل العملي",
    tag: "⌖ إسكان وشراء",
    crumbs: [
      { name: "الرئيسية", path: "/", url: SITE + "/" },
      { name: "دليل الشراء", path: "/buying-guide/", url: SITE + "/buying-guide/" },
      { name: "دار مصر العبور", path: "/dar-misr-obour/", url },
    ],
    body: DAR_MISR_BODY,
    faq: DAR_MISR_FAQ,
  });
}

// ---------------------------------------------------------------------------
// 2) /middle-ring-road-obour/ — الدائري الأوسطي والعبور (AR — Transport)
// ---------------------------------------------------------------------------
const RING_ROAD_FAQ = [
  {
    q: "هل الطريق الدائري الأوسطي يمر بالقرب من مدينة العبور؟",
    a: "نعم، يمر الدائري الأوسطي بالمنطقة الشرقية للقاهرة الكبرى ويتقاطع مع المحاور الصحراوية القريبة من العبور والعبور الجديدة، ما جعله مدخلًا مهمًا للوصول إلى المدينة من الاتجاهات المختلفة.",
  },
  {
    q: "كيف أصل من العبور إلى القاهرة عبر الدائري الأوسطي؟",
    a: "المسار المعتاد هو الخروج على طريق مصر إسماعيلية الصحراوي ثم الاتصال بالدائري الأوسطي أو الدائري الإقليمي حسب وجهتك. استخدم تطبيق خرائط محدثًا وقت السفر لأن التحويلات وأعمال التطوير تتغير باستمرار.",
  },
  {
    q: "ما الفرق بين الدائري الأوسطي والدائري الإقليمي؟",
    a: "الدائري الأوسطي يربط شرق القاهرة بغربها عبر محيط أقرب للمدينة، بينما الدائري الإقليمي طريق أكبر يلف حول القاهرة الكبرى بالكامل ويربط المحافظات والطرق الصحراوية الرئيسية ببعضها.",
  },
  {
    q: "هل توجد رسوم على الطريق الدائري الأوسطي؟",
    a: "سياسات الرسوم على الطرق السريعة في مصر تخضع لقرارات رسمية وتتغير. تحقق من اللافتات عند البوابات أو من البيانات الرسمية لوزارة النقل قبل اعتماد ميزانية يومية للانتقال.",
  },
];

const RING_ROAD_BODY = `
<p>السؤال الذي يسأله كل من ينتقل للسكن في العبور أو العبور الجديدة: كيف أتحرك منها وإليها بسرعة؟ الإجابة الحديثة تمر بشكل كبير عبر <strong>الطريق الدائري الأوسطي</strong>. هذا الدليل يشرح ما هو الطريق، وكيف يخدم سكان العبور تحديدًا، وما المسارات العملية للوصول إلى قلب القاهرة والمدن الجديدة المجاورة.</p>
<p>المقال موجّه للسكان الجدد والمقبلين على الشراء في العبور، ويعتمد على الوصف العام للشبكة — التحويلات المرورية وحالة المحاور تتغير باستمرار، فتحقق من تطبيق الخرائط وقت السفر الفعلي.</p>

<h2>ما الطريق الدائري الأوسطي؟</h2>
<p>الدائري الأوسطي طريق سريع حيوي ضمن شبكة الطرق القومية في مصر، صُمم ليربط شرق القاهرة الكبرى بغربها دون الدخول إلى المناطق المزدحمة في قلب العاصمة. يتقاطع مع عدد من الطرق الصحراوية الرئيسية، ومنها المحاور القريبة من مدينتي العبور والعبور الجديدة، ما منح المنطقة مدخلًا سريعًا لم يكن متاحًا بنفس الكفاءة قبل افتتاحه.</p>
<p>قبل هذه الشبكة، كان الوصول إلى العبور يعتمد بشكل شبه كامل على <a href="/roads/">طريق مصر إسماعيلية الصحراوي</a> وحده، وما يعنيه ذلك من زحام عند نقاط الالتقاط والخروج. تعدد المداخل اليوم يوزّع الحركة ويقلل زمن الرحلة في أوقات كثيرة من اليوم.</p>

<h2>كيف يخدم الدائري الأوسطي سكان العبور؟</h2>
<ul>
<li><strong>الوصول إلى التجمع والقاهرة الجديدة</strong> — مسارات أقصر عبر المحاور الشرقية بدلًا من المرور بوسط المدينة.</li>
<li><strong>الاتجاه الغربي</strong> — الوصول إلى الجيزة ومدن 6 أكتوبر والشيخ زايد دون اختراق القاهرة.</li>
<li><strong>خدمة العبور الجديدة</strong> — المدينة الجديدة تستفيد مباشرة من قرب المحاور الجديدة لمواقعها على الطرق الصحراوية، وهو عامل مهم عند مقارنة <a href="/obour-vs-obour-new/">العبور القائمة بالعبور الجديدة</a>.</li>
<li><strong>الرحلات بين المحافظات</strong> — الاتصال بالدائري الإقليمي يفتح مسارات للإسماعيلية والسويس والدلتا دون دخول القاهرة.</li>
</ul>

<h2>مسارات عملية شائعة</h2>
<div class="table-wrap"><table><thead><tr><th>الوجهة</th><th>المسار المعتاد من العبور</th><th>ملاحظات</th></tr></thead><tbody>
<tr><td>وسط القاهرة</td><td>طريق مصر إسماعيلية ثم محاور الدخول الداخلية</td><td>يتأثر بذروة الصباح؛ قارن بالقطار الكهربائي في <a href="/lrt-obour/">دليل LRT</a></td></tr>
<tr><td>التجمع والقاهرة الجديدة</td><td>المحاور الشرقية المتصلة بالدائري الأوسطي</td><td>غالبًا أسرع خارج أوقات الذروة</td></tr>
<tr><td>6 أكتوبر والشيخ زايد</td><td>الدائري الأوسطي غربًا</td><td>يوفر المرور بوسط البلد</td></tr>
<tr><td>الإسماعيلية وبورسعيد</td><td>طريق مصر إسماعيلية الصحراوي مباشرة</td><td>المسار التقليدي الأقصر</td></tr>
</tbody></table></div>
<p>أزمنة الرحلات تتغير بالساعة واليوم وأعمال الطرق — راجع <a href="/travel-times/">صفحة أزمنة الوصول</a> للتقديرات المنشورة، وتحقق من تطبيق الخرائط قبل الخروج.</p>

<h2>نصائح يومية للسائقين من العبور</h2>
<ul>
<li><strong>اختبر مسارك في أيام مختلفة</strong> قبل الاستقرار على طريق يومي ثابت — الفارق بين يوم وآخر قد يكون كبيرًا.</li>
<li><strong>انتبه للتحويلات</strong> — أعمال تطوير الطرق القومية مستمرة، واللافتات المؤقتة تسبق التحويلة بمسافة قصيرة أحيانًا.</li>
<li><strong>قارن السيارة بالنقل العام</strong> — لبعض الوجهات يكون <a href="/transport/">دليل المواصلات</a> أرخص وأسرع من القيادة اليومية.</li>
<li><strong>لا تعتمد على معلومة قديمة عن الرسوم أو المخارج</strong> — القرارات الرسمية تتغير، والتحقق لمرة واحدة يوفر مفاجآت يومية.</li>
</ul>

<h2>الخلاصة</h2>
<p>الدائري الأوسطي حوّل العبور من مدينة بطريق شبه وحيد إلى نقطة اتصال بشبكة محاور كاملة، وهذا من أهم عوامل جاذبيتها السكنية الحالية. اختبر مساراتك بنفسك، وقارنها بخيارات النقل العام، وراجع <a href="/map/">خريطة العبور</a> لتثبيت الصورة الذهنية للمداخل والمخارج قبل اتخاذ قرار السكن أو تغيير الروتين اليومي.</p>
`;

function buildRingRoadPage(chrome) {
  const url = `${SITE}/middle-ring-road-obour/`;
  return pageShellAr(chrome, {
    url,
    title: "الدائري الأوسطي والعبور: المسارات والمخارج ونصائح السفر | دليل العبور",
    description: "كيف يخدم الطريق الدائري الأوسطي سكان العبور والعبور الجديدة؟ مسارات عملية إلى القاهرة والتجمع وأكتوبر، ونصائح يومية للسائقين — مع تنبيهات التحقق من التحويلات والرسوم.",
    h1: "الطريق الدائري الأوسطي ومدينة العبور",
    tag: "⌖ مواصلات ووصول",
    crumbs: [
      { name: "الرئيسية", path: "/", url: SITE + "/" },
      { name: "المواصلات", path: "/transport/", url: SITE + "/transport/" },
      { name: "الدائري الأوسطي", path: "/middle-ring-road-obour/", url },
    ],
    body: RING_ROAD_BODY,
    faq: RING_ROAD_FAQ,
  });
}

// ---------------------------------------------------------------------------
// 3) /friday-market/ — سوق الجمعة في العبور (AR — Shopping)
// ---------------------------------------------------------------------------
const FRIDAY_MARKET_FAQ = [
  {
    q: "أين يقام سوق الجمعة في العبور؟",
    a: "يُعرف سوق الجمعة بأنه سوق شعبي كبير يقام في منطقة العبور الجديدة. النطاق الدقيق للسوق ومداخله قد يتغيران مع تنظيم المنطقة، لذا اسأل محليًا أو تحقق من إرشادات جهاز المدينة قبل الزيارة الأولى.",
  },
  {
    q: "ما مواعيد سوق الجمعة في العبور؟",
    a: "يقام السوق يوم الجمعة من الصباح الباكر ويشتد نشاطه قبل الظهيرة، وقد يمتد نشاط جزئي لأيام أخرى. المواعيد الفعلية تتأثر بالمواسم والتنظيم — الذهاب مبكرًا يمنحك أفضل تشكيلة وأقل زحامًا.",
  },
  {
    q: "ماذا أجد في سوق الجمعة بالعبور؟",
    a: "تشكيلة واسعة من السلع الشعبية: ملابس وأحذية وأدوات منزلية وأجهزة مستعملة وقطع غيار ومستلزمات متنوعة، بجانب باعة الخضار والمواد الغذائية. التشكيلة تتغير كل أسبوع بحسب الباعة المشاركين.",
  },
  {
    q: "هل الأسعار في سوق الجمعة أرخص فعلًا؟",
    a: "غالبًا نعم للسلع الشعبية والمستعملة، لكن الفارق يعتمد على مهارتك في الفصال وفحص المنتج. قارن السعر ببدائله في المحلات أو المنصات الإلكترونية قبل الشراء، خاصة في الأجهزة والمستعمل.",
  },
];

const FRIDAY_MARKET_BODY = `
<p>سوق الجمعة في العبور من التجارب الشرائية التي يعرفها أهل المدينة جيدًا: سوق شعبي ضخم يجمع الباعة والمشترين من العبور والمدن المجاورة، وتجد فيه تقريبًا كل ما يخطر ببالك من السلع. هذا الدليل يشرح ما ستجده هناك، وكيف تستعد للزيارة، وأخطاء يقع فيها الزائر لأول مرة.</p>
<p>تنبيه تحريري مهم: السوق الشعبي كائن حي يتغير أسبوعيًا. المواعيد والتنظيم والنطاق قد تتبدل مع قرارات جهاز المدينة والمواسم، فاعتبر هذا الدليل إطارًا عمليًا وتحقق محليًا قبل زيارة تبني عليها التزامًا كبيرًا.</p>

<h2>ما سوق الجمعة في العبور؟</h2>
<p>هو السوق الشعبي الأسبوعي الأشهر في المنطقة، ويُقام في نطاق <a href="/new-obour/">العبور الجديدة</a> ويستقطب زائرين من القليوبية والقاهرة والشرقية. الفكرة بسيطة: مئات الباعة يعرضون سلعًا شعبية جديدة ومستعملة بأسعار تنافس المحلات، في مساحة مفتوحة تتحول كل جمعة إلى ما يشبه مدينة صغيرة.</p>
<p>على عكس <a href="/malls/">مولات العبور</a> أو <a href="/shopping/">دليل التسوق</a> المنظم، التجربة هنا شعبية بالكامل: مساومة، وفحص ذاتي للبضاعة، واكتشافات غير متوقعة في كل زيارة.</p>

<h2>ماذا ستجد داخل السوق؟</h2>
<ul>
<li><strong>ملابس وأحذية</strong> — تشكيلات جديدة شعبية وأحيانًا قطع مستعملة بحالة جيدة.</li>
<li><strong>أدوات منزلية وأثاث مستعمل</strong> — من الأطباق إلى قطع الأثاث الصغيرة.</li>
<li><strong>أجهزة وإلكترونيات مستعملة</strong> — هواتف وأجهزة كهربائية؛ الفحص قبل الشراء واجب هنا.</li>
<li><strong>قطع غيار وعدد</strong> — قسم معروف للعدد اليدوية وقطع غيار السيارات والدراجات.</li>
<li><strong>خضار وفاكهة ومواد غذائية</strong> — باعة جملة وتجزئة بأسعار تنافسية غالبًا.</li>
</ul>

<h2>كيف تستعد للزيارة الأولى؟</h2>
<ol>
<li><strong>اذهب مبكرًا</strong> — الصباح الباكر يعني تشكيلة أكمل وزحامًا أقل ومساحة أفضل للفصال.</li>
<li><strong>احمل كاش بفئات صغيرة</strong> — التعامل نقدي غالبًا، والفئات الصغيرة تسهّل المساومة.</li>
<li><strong>افحص قبل الدفع</strong> — لا يوجد استرجاع في السوق الشعبي؛ جرّب الجهاز وافحص القطعة بعناية.</li>
<li><strong>اتفق على نقطة لقاء</strong> — السوق مزدحم؛ لو ذهبت مع عائلتك حدد نقطة تجمع واضحة.</li>
<li><strong>انتبه لمتعلقاتك</strong> — كما في أي سوق مزدحم، احتفظ بالهاتف والمحفظة في جيوب آمنة.</li>
</ol>

<h2>قواعد الفصال الذكي</h2>
<ul>
<li>اسأل عن السعر في أكثر من فرز قبل شراء نفس الصنف — الفوارق داخل السوق نفسه قد تكون ملحوظة.</li>
<li>ابدأ بسعر أقل من المعروض بما يناسب السلعة، ولا تظهر اندفاعًا واضحًا لقطعة تعجبك.</li>
<li>الشراء بكمية من نفس البائع يمنحك مساحة تفاوض أفضل، خاصة في الخضار والمستلزمات المنزلية.</li>
<li>إذا لم يعجبك السعر، انسحب بهدوء — في أغلب الحالات ستسمع عرضًا أفضل قبل أن تبتعد.</li>
</ul>

<h2>الخلاصة</h2>
<p>سوق الجمعة تجربة شرائية أسبوعية لا تُنسى لسكان العبور: أسعار شعبية، وتشكيلة تتجدد، وروح السوق المصرية الأصيلة. اذهب مبكرًا، افحص جيدًا، وفاصِل بابتسامة — وإن اكتشفت تغييرًا موثقًا في الموقع أو المواعيد، شاركنا عبر <a href="/corrections/">صفحة التصحيح</a> ليستفيد غيرك. وللتسوق المنظم راجع <a href="/directory/">دليل خدمات العبور</a> الكامل.</p>
`;

function buildFridayMarketPage(chrome) {
  const url = `${SITE}/friday-market/`;
  return pageShellAr(chrome, {
    url,
    title: "سوق الجمعة في العبور: ماذا ستجد وكيف تشتري بذكاء | دليل العبور",
    description: "دليل زيارة سوق الجمعة في العبور: أنواع السلع، نصائح الاستعداد والفصال، وأخطاء الزائر الأول — مع تنبيه للتحقق من المواعيد والتنظيم محليًا قبل الزيارة.",
    h1: "سوق الجمعة في العبور: دليل الزائر العملي",
    tag: "⌖ تسوق وأسواق",
    crumbs: [
      { name: "الرئيسية", path: "/", url: SITE + "/" },
      { name: "التسوق", path: "/shopping/", url: SITE + "/shopping/" },
      { name: "سوق الجمعة", path: "/friday-market/", url },
    ],
    body: FRIDAY_MARKET_BODY,
    faq: FRIDAY_MARKET_FAQ,
  });
}

// ---------------------------------------------------------------------------
// 4) /en/nurseries/ — Nurseries in Obour City (EN — Education)
// ---------------------------------------------------------------------------
const NURSERIES_EN_FAQ = [
  {
    q: "What age do nurseries in Obour City accept?",
    a: "Most nurseries in Obour accept children from around 3-4 months up to 4 years, covering the stage before kindergarten (KG1). Exact age brackets differ per nursery, so confirm the accepted range and class division directly before registering.",
  },
  {
    q: "How much are nursery fees in Obour City?",
    a: "Fees vary widely by area, language track, and hours. Local Arabic nurseries are usually the most affordable, while bilingual and international-style nurseries cost more. Treat any quoted figure as time-limited and confirm current fees directly with each nursery.",
  },
  {
    q: "Are there English or bilingual nurseries in Obour?",
    a: "Yes. Alongside Arabic nurseries, Obour has nurseries offering English or bilingual programs, and some school-affiliated nurseries feed into language schools in the city. Ask specifically about daily English exposure, not just the marketing label.",
  },
  {
    q: "What should I check before choosing a nursery in Obour?",
    a: "Visit in person and check: hygiene and safety, child-to-caregiver ratio, daily routine and meals, communication with parents, pickup policy, and proximity to your district. A 20-minute visit tells you more than any brochure.",
  },
];

const NURSERIES_EN_BODY = `
<p>Finding the right nursery is one of the first real decisions parents face after moving to Obour City. This guide explains how the nursery landscape in Obour is structured, what realistic fee and age expectations look like, and the exact checklist to use on your visits — so you choose based on evidence, not brochures.</p>
<p>One editorial note before we start: nursery fees, capacity, and licensing details change frequently in Egypt. Every number in this guide is directional, not a quote — always confirm current figures directly with the nursery itself.</p>

<h2>How nurseries in Obour are organized</h2>
<p>Obour's nursery scene splits into three broad types. First, <strong>local Arabic nurseries</strong> (known in Arabic as <em>hadana</em>, حضانة) spread across the numbered districts, usually the most affordable option and the closest to residential blocks. Second, <strong>bilingual and English-track nurseries</strong> that add daily English exposure and sometimes Montessori-style activities. Third, <strong>school-affiliated nurseries</strong> that act as feeders into the city's language schools — useful if you already know which school track you want.</p>
<p>Location matters more than branding here: a nursery two streets away in your district beats a famous name across the city, because you will make this trip twice a day, every day. Cross-check options against the <a href="/en/districts/">districts guide</a> to keep the commute short.</p>

<h2>Ages, hours, and what a typical day looks like</h2>
<p>Most nurseries in Obour accept children from around 3-4 months of age up to the pre-KG stage at roughly 4 years. A standard day runs from morning drop-off to early-to-mid afternoon, with extended hours at some nurseries for working parents — confirm the exact pickup window and late-pickup policy before registering, because this is where daily friction usually appears.</p>
<p>Typical daily elements include supervised play, meals or snacks (ask whether food is provided or sent from home), nap time for the younger groups, and basic early-learning activities. In bilingual nurseries, ask how many hours per day are actually conducted in English — the answer separates real bilingual programs from marketing labels.</p>

<h2>Fees: what to expect</h2>
<p>Nursery fees in Obour vary widely by district, language track, and hours, and they change from year to year. Local Arabic nurseries sit at the affordable end; bilingual and school-affiliated options cost more; registration, uniform, and bus fees are often separate line items that parents forget to ask about. For the broader education budget picture, see the <a href="/school-fees/">school fees guide</a> (Arabic) and the <a href="/en/schools/">English schools guide</a>.</p>

<h2>The visit checklist</h2>
<ol>
<li><strong>Hygiene and safety</strong> — clean floors, covered sockets, secured stairs, and a clear sign-in/sign-out rule at the door.</li>
<li><strong>Child-to-caregiver ratio</strong> — ask for the actual number per room, not the average across the nursery.</li>
<li><strong>Daily communication</strong> — do parents get a report, photos, or an app update? Silence is a red flag.</li>
<li><strong>Meals and allergies</strong> — who prepares the food, and how are allergies handled in writing?</li>
<li><strong>Sick-child policy</strong> — clear rules protect your child as much as others.</li>
<li><strong>Staff stability</strong> — high caregiver turnover is hard on toddlers; ask how long the core team has been there.</li>
</ol>

<h2>Common mistakes parents make in Obour</h2>
<ul>
<li><strong>Choosing on fees alone</strong> — the cheapest option with a long daily commute costs more in time and stress.</li>
<li><strong>Skipping the unannounced visit</strong> — visit once by appointment, then pass by once without one if they allow it.</li>
<li><strong>Ignoring the KG pathway</strong> — if you want a specific school later, ask whether the nursery feeds into it; competition for <a href="/en/schools/">school places in Obour</a> starts earlier than most parents expect.</li>
<li><strong>Not checking the Arabic directory</strong> — the <a href="/nurseries/">Arabic nurseries directory</a> carries the fuller local list; use it even if your Arabic is basic, with a translation tool.</li>
</ul>

<h2>Bottom line</h2>
<p>Start with your district, shortlist three nurseries, visit all three with the checklist above, and verify every fee and policy directly. The right nursery in Obour is usually the closest good one — not the most advertised one. For verified corrections or additions to our listings, use the <a href="/corrections/">corrections page</a>.</p>
`;

function buildNurseriesEnPage(chrome) {
  const url = `${SITE}/en/nurseries/`;
  return pageShellEn(chrome, {
    url,
    arUrl: `${SITE}/nurseries/`,
    title: "Nurseries in Obour City: Fees, Ages & How to Choose | Obour Guide",
    description: "A practical parent guide to nurseries in Obour City: types, age ranges, realistic fee expectations, and the exact visit checklist to use before registering your child.",
    h1: "Nurseries in Obour City: A Parent's Guide",
    tag: "⌖ Education & Family",
    crumbs: [
      { name: "Home", path: "/en/", url: SITE + "/en/" },
      { name: "Schools", path: "/en/schools/", url: SITE + "/en/schools/" },
      { name: "Nurseries", path: "/en/nurseries/", url },
    ],
    body: NURSERIES_EN_BODY,
    faq: NURSERIES_EN_FAQ,
  });
}

// ---------------------------------------------------------------------------
// 5) /en/postal-code/ — Obour City postal code (EN — Practical guide)
// ---------------------------------------------------------------------------
const POSTAL_EN_FAQ = [
  {
    q: "What is the postal code of Obour City, Egypt?",
    a: "Obour City in Qalyubia Governorate is commonly served by the postal code 11828. Postal boundaries occasionally differ between adjacent districts, so confirm the exact code for your street with Egypt Post before official paperwork.",
  },
  {
    q: "Is Obour City in Cairo or Qalyubia?",
    a: "Administratively, Obour City belongs to Qalyubia Governorate, not Cairo, even though it sits directly on the Cairo-Ismailia Desert Road and functions as part of Greater Cairo's eastern urban area. This matters for paperwork and addresses.",
  },
  {
    q: "Do couriers in Egypt actually use postal codes?",
    a: "Most private couriers rely on phone numbers and landmark-based addresses rather than postal codes. The postal code matters mainly for official documents, bank forms, government services, and international shipments.",
  },
  {
    q: "How do I verify an Egyptian postal code officially?",
    a: "Use Egypt Post's official code lookup or ask at your local post office with your full street address. Codes can change or split as districts grow, so a two-minute check prevents rejected forms later.",
  },
];

const POSTAL_EN_BODY = `
<p>If you are filling in a bank form, ordering an international shipment, or registering an address in Egypt, you will eventually hit the same question: what is the postal code of Obour City? This short guide gives you the answer, explains how Egyptian postal codes work, and shows you how to verify your exact street's code officially.</p>

<h2>The quick answer</h2>
<p>Obour City — administratively part of <strong>Qalyubia Governorate</strong> — is commonly served by the postal code <strong>11828</strong>. Because Obour contains numbered districts and borders the newer New Obour development, treat this as the city's general code and verify your specific street with Egypt Post before using it on binding documents.</p>

<h2>How Egyptian postal codes work</h2>
<p>Egypt uses a <strong>five-digit</strong> postal code system managed by Egypt Post. The digits route mail from regional sorting down to the local post office level, which is why two neighboring areas can share or split codes depending on which office serves them. Greater Cairo's eastern cities — including Obour — fall within the 11xxx range, which covers much of Cairo and the surrounding Qalyubia urban belt.</p>
<p>For everyday life inside Egypt, you will notice that private couriers rarely ask for the code at all; they run on phone numbers, landmarks, and live map pins. The postal code becomes genuinely important in three situations: <strong>official and banking paperwork</strong>, <strong>government services</strong>, and <strong>international mail and online orders</strong> that validate the field automatically.</p>

<h2>Writing an Obour address correctly</h2>
<p>A complete address for mail or forms typically looks like this:</p>
<ul>
<li>Building number, street name, and district (e.g. 1st District / الحي الأول)</li>
<li>Obour City (مدينة العبور)</li>
<li>Qalyubia Governorate (محافظة القليوبية)</li>
<li>Postal code: 11828 — Egypt</li>
</ul>
<p>Include both the district name and a landmark when dealing with couriers; include the postal code when dealing with institutions. If you are still learning the city's layout, the <a href="/en/districts/">districts guide</a> and the <a href="/map/">city map</a> will help you pin your exact location.</p>

<h2>How to verify your exact code</h2>
<ol>
<li>Check Egypt Post's official postal-code lookup service online with your full address.</li>
<li>Or ask at the nearest post office branch — staff can confirm the code for your street in a minute.</li>
<li>If a form rejects the code, do not guess a neighbor's code; verify first, because a wrong code can delay official mail.</li>
</ol>

<h2>Bottom line</h2>
<p>For most purposes, Obour City's postal code is <strong>11828</strong>, under Qalyubia Governorate. Verify your street's code with Egypt Post for official paperwork, and use landmarks plus a phone number for couriers. Settling in? Continue with the <a href="/en/living-guide/">Obour living guide</a> for utilities, transport, and daily services.</p>
`;

function buildPostalEnPage(chrome) {
  const url = `${SITE}/en/postal-code/`;
  return pageShellEn(chrome, {
    url,
    arUrl: `${SITE}/government-services/`,
    title: "Obour City Postal Code (11828): Verify & Use It Right | Obour Guide",
    description: "The postal code for Obour City, Qalyubia is 11828. Learn how Egyptian postal codes work, how to write a full Obour address, and how to verify your street's code officially with Egypt Post.",
    h1: "Obour City Postal Code: The Practical Guide",
    tag: "⌖ Practical Guides",
    crumbs: [
      { name: "Home", path: "/en/", url: SITE + "/en/" },
      { name: "Living Guide", path: "/en/living-guide/", url: SITE + "/en/living-guide/" },
      { name: "Postal Code", path: "/en/postal-code/", url },
    ],
    body: POSTAL_EN_BODY,
    faq: POSTAL_EN_FAQ,
  });
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();

  writePage("dar-misr-obour", buildDarMisrPage(chrome));
  writePage("middle-ring-road-obour", buildRingRoadPage(chrome));
  writePage("friday-market", buildFridayMarketPage(chrome));
  writePage(path.join("en", "nurseries"), buildNurseriesEnPage(chrome));
  writePage(path.join("en", "postal-code"), buildPostalEnPage(chrome));

  // Inbound links from hub pages (idempotent)
  injectHubLink("buying-guide", "/dar-misr-obour/",
    `<section class="wrap"><p>دليل جديد: <a href="/dar-misr-obour/">دار مصر في مدينة العبور — الموقع والمراحل وخطوات التقديم</a>.</p></section>`);
  injectHubLink("transport", "/middle-ring-road-obour/",
    `<section class="wrap"><p>دليل جديد: <a href="/middle-ring-road-obour/">الطريق الدائري الأوسطي ومدينة العبور — المسارات والمخارج</a>.</p></section>`);
  injectHubLink("shopping", "/friday-market/",
    `<section class="wrap"><p>دليل جديد: <a href="/friday-market/">سوق الجمعة في العبور — دليل الزائر العملي</a>.</p></section>`);
  injectHubLink(path.join("en", "schools"), "/en/nurseries/",
    `<section class="wrap"><p>New guide: <a href="/en/nurseries/">Nurseries in Obour City — fees, ages, and how to choose</a>.</p></section>`);
  injectHubLink(path.join("en", "living-guide"), "/en/postal-code/",
    `<section class="wrap"><p>New guide: <a href="/en/postal-code/">Obour City postal code — verify and use it correctly</a>.</p></section>`);

  console.log("Phase 21 daily articles (2026-08-28) done");
  console.log(report.join("\n"));
}

main();
