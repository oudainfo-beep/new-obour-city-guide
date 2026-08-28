/**
 * seo-phase27-market-reports.mjs
 * المرحلة 27 — تقارير السوق الخارجية: صفحتان موثقتان بالمصادر (2026-08-28).
 *
 * عربي (13): villas-for-sale-obour, installments-obour, golf-city-obour,
 *   quest-obour, obour-pros-cons, district-1, postal-code, transport-from-cairo,
 *   infinity-mall, supermarkets, language-schools, hospital-24-hours, food-delivery
 * إنجليزي (7): en/property-investment, en/apartments-for-sale, en/cost-of-living,
 *   en/commuting-to-cairo, en/obour-city-mall, en/international-schools,
 *   en/24-hour-pharmacies
 *
 * القواعد: idempotent، لا حقائق مخترعة (نطاقات + تنبيه تحقق)،
 * نمط loadChrome/buildHead من المرحلة 7 و21، صفحات EN بنمط المرحلة 16.
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
    .map((it, i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${it.name}</span>` : `<a href="${it.path}">${it.name}</a>`}</li>`)
    .join('<li class="sep">›</li>');
  return `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${lis}</ol></div></nav>`;
}

function breadcrumbHtmlEn(items) {
  const lis = items
    .map((it, i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${it.name}</span>` : `<a href="${it.path}">${it.name}</a>`}</li>`)
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
const EN = (o) => (chrome) => pageShellEn(chrome, o);
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
// 1) /market-reports-obour/ — كيف تقرأ التقارير الخارجية أسعار العبور؟
// ---------------------------------------------------------------------------
addPage("market-reports-obour", AR({
  url: `${SITE}/market-reports-obour/`,
  title: "العبور في التقارير العقارية العالمية: ماذا قالت عن الأسعار؟",
  description: "حصاد تغطية التقارير العقارية العالمية والمحلية لأسعار العبور والعبور الجديدة (2025–2026): أرقام Global Property Guide وRealting وغيرها بالمصادر والتواريخ — وكيف تقرؤها بجانب بياناتنا المحلية.",
  h1: "العبور في التقارير العقارية: قراءة موثقة بالمصادر",
  tag: "⌖ أسعار وتقارير",
  crumbs: [
    { name: "الرئيسية", path: "/", url: SITE + "/" },
    { name: "الأسعار", path: "/prices/", url: SITE + "/prices/" },
    { name: "التقارير الخارجية", path: "/market-reports-obour/", url: `${SITE}/market-reports-obour/` },
  ],
  body: `
<p>عندما تبحث عن أسعار العقارات في العبور ستجد أرقامًا متباينة بين المواقع العالمية والمحلية — وأحيانًا تبدو متناقضة. هذه الصفحة تجمع ما نشرته أبرز التقارير الخارجية عن المدينة خلال 2025–2026 <strong>بالمصدر والتاريخ</strong>، وتشرح لماذا تختلف الأرقام، وكيف تقرأها بجانب <a href="/price-report-q3-2026/">تقريرنا المحلي الربع سنوي</a>.</p>
<p>قاعدتنا التحريرية ثابتة هنا: كل رقم منسوب لمصدره المنشور، والروابط الخارجية متاحة لتفحصها بنفسك.</p>

<h2>ماذا قالت التقارير العالمية عن العبور؟</h2>
<div class="table-wrap"><table><thead><tr><th>المصدر</th><th>تاريخ البيانات</th><th>الرقم عن العبور</th></tr></thead><tbody>
<tr><td><strong>Global Property Guide</strong> — تحليل السوق المصري (<a href="https://www.globalpropertyguide.com/middle-east/egypt/price-history" rel="noopener">المصدر</a>)</td><td>ديسمبر 2025</td><td>متوسط الشقق في العبور ≈ <strong>21,900 ج.م/م²</strong> والفيلات ≈ 50,100 ج.م/م² ضمن جدول القاهرة الكبرى</td></tr>
<tr><td><strong>Realting</strong> — تحليلات السوق (<a href="https://realting.com/news/egyptian-real-estate-market-analytics" rel="noopener">المصدر</a>)</td><td>يناير 2026</td><td>العبور: 21,900 ج.م/م² للشقق بنمو سنوي <strong>+39.9%</strong>، والفيلات +109.3% خلال 12 شهرًا</td></tr>
<tr><td><strong>Sands of Wealth</strong> — دليل أفضل مناطق الشراء (<a href="https://sandsofwealth.com/blogs/news/egypt-which-area" rel="noopener">المصدر</a>)</td><td>أبريل 2026</td><td>يصنف العبور والشروق ضمن المناطق «الأقل سعرًا القابلة للاستثمار» بنطاق 15,000–25,000 ج.م/م² — أقل 40–60% من مناطق القاهرة الأولى</td></tr>
</tbody></table></div>

<h2>لماذا تختلف هذه الأرقام عن تقريرنا المحلي؟</h2>
<p>تقريرنا الربع سنوي المحدّث يرصد 16,000–22,000 ج.م/م² للعبور القائمة (بمتوسط عروض ≈21,500 متوافق مع المنصات العالمية) و7,500–12,000 للعبور الجديدة. وبعد تحديث أغسطس 2026 أصبح نطاقنا يحتضن الرقم العالمي — لكن الفروق المنهجية بين المصادر تبقى مهمة للفهم:</p>
<ul>
<li><strong>أسعار العرض مقابل أسعار التنفيذ</strong> — المنصات الدولية تعتمد إعلانات البيع المعلنة التي تُطلب عادة أعلى من أسعار الصفقات الفعلية.</li>
<li><strong>اختلاف العينة</strong> — إعلانات المنصات العالمية تتركز في الكمبوندات والمشاريع الأعلى سعرًا، بينما العبور مدينة واسعة بتنوع كبير بين <a href="/districts/">أحيائها</a>.</li>
<li><strong>توقيت الالتقاط</strong> — في سوق يتحرك شهريًا، فارق ربعين كافٍ ليغيّر المتوسطات.</li>
<li><strong>تحديث البيانات</strong> — بعض الجداول الدولية تُحدَّث دوريًا وقد تعكس لقطة أقدم.</li>
</ul>
<p>القاعدة العملية: استخدم التقارير العالمية لقراءة <strong>الاتجاه ومقارنة المدن</strong>، واستخدم بياناتنا المحلية ومعاينتك الميدانية لتقدير <strong>السعر الفعلي للتفاوض</strong>.</p>

<h2>نقاط الاتفاق بين كل المصادر</h2>
<ul>
<li>العبور أقل سعرًا بوضوح من التجمع الخامس والقاهرة الجديدة — فارق يقاس بالعشرات في المئة.</li>
<li>النمو السنوي قوي: Realting ترصد +39.9% للشقق خلال 12 شهرًا — اتجاه صاعد يتفق مع ملاحظتنا المحلية عن ضغط الطلب.</li>
<li>الفيلات تنمو أسرع من الشقق (+109% حسب Realting) — شح المعروض يلعب دورًا؛ راجع <a href="/villas-for-sale-obour/">دليل الفيلات</a>.</li>
<li>البنية التحتية وعلى رأسها <a href="/lrt-obour/">LRT</a> عامل تسعير مؤكد في كل القراءات.</li>
</ul>

<h2>كيف تستخدم هذه الصفحة؟</h2>
<p>عندما تصادف رقمًا عن أسعار العبور في أي موقع: تحقق من تاريخه ومصدر عينته، وقارنه بـ<a href="/prices/">صفحة الأسعار</a> المحدثة لدينا، ثم اختبره بثلاثة إعلانات حقيقية حالية. وإن كنت تقارن الاستثمار بين المدن، راجع <a href="/compare/">مقارنة المدن</a> و<a href="/investment/">دليل الاستثمار</a>.</p>
`,
  faq: [
    { q: "ما متوسط سعر المتر في العبور حسب التقارير العالمية؟", a: "وفق Global Property Guide (ديسمبر 2025) نحو 21,900 ج.م/م² للشقق و50,100 للفيلات، وتؤكد Realting (يناير 2026) الرقم نفسه للشقق مع نمو سنوي +39.9%. هذه أسعار إعلانات معلنة تميل للأعلى من أسعار التنفيذ الفعلية — قارنها بتقريرنا المحلي الربع سنوي ومعاينتك الميدانية قبل التفاوض." },
    { q: "هل أسعار العقارات في العبور ترتفع؟", a: "كل المصادر تتفق على الاتجاه الصاعد: Realting ترصد +39.9% سنويًا للشقق و+109% للفيلات حتى يناير 2026، وملاحظتنا المحلية في الربع الثالث 2026 تؤكد استقرارًا نسبيًا مع ارتفاع طفيف قرب محطات LRT. في سوق تضخمي، راقب الاتجاه عبر الأرباع لا النقطة الواحدة." },
    { q: "أيهما أصدق: المنصات العالمية أم الدليل المحلي؟", a: "كلاهما يجيب سؤالًا مختلفًا: المنصات العالمية أدق في الاتجاهات ومقارنة المدن لكنها تعرض أسعار العرض المعلنة، والدليل المحلي أقرب لأسعار التفاوض الفعلية بين الأحياء. القارئ الذكي يستخدم الاثنين: اتجاه من العالميين، ورقم تفاوض من المحليين — ثم يختبر بإعلانات حقيقية حالية." },
  ],
}));

// ---------------------------------------------------------------------------
// 2) /new-projects-watch/ — مشروعات جديدة تحت الرصد
// ---------------------------------------------------------------------------
addPage("new-projects-watch", AR({
  url: `${SITE}/new-projects-watch/`,
  title: "مشروعات جديدة في العبور والعبور الجديدة: رصد موثق | دليل العبور",
  description: "رصد موثق للمشروعات العقارية المعلنة في العبور والعبور الجديدة: فلو هايتس، مرتقى، السلام، والاستثمارات الحكومية — كل مشروع بمصدره المنشور وتنبيهات التحقق قبل الحجز.",
  h1: "مشروعات العبور الجديدة تحت الرصد",
  tag: "⌖ كمبوندات ومشروعات",
  crumbs: [
    { name: "الرئيسية", path: "/", url: SITE + "/" },
    { name: "العبور الجديدة", path: "/new-obour/", url: SITE + "/new-obour/" },
    { name: "مشروعات تحت الرصد", path: "/new-projects-watch/", url: `${SITE}/new-projects-watch/` },
  ],
  body: `
<p>تتسارع الإعلانات عن مشروعات جديدة في العبور والعبور الجديدة — وبين مشروع جاد وإعلان تسويقي مبكر، يحتاج المشتري رصدًا موثقًا بالمصادر. هذه الصفحة تجمع أبرز ما نُشر عن مشروعات المدينة <strong>بمصدره وتاريخه</strong>، وتُحدَّث مع كل إعلان جديد موثق.</p>
<p>تنبيه تحريري مضاعف: معلومات هذه الصفحة من مصادر صحفية ومنصات عقارية منشورة — وهي ليست تأكيدًا منا على جدية أي مشروع. قبل أي حجز، طبّق <a href="/quest-obour/">أسئلة التحقق الخمسة</a> واطلب المستندات من المطور مباشرة.</p>

<h2>أبرز المشروعات المعلنة — بالمصدر</h2>
<div class="table-wrap"><table><thead><tr><th>المشروع</th><th>ما نُشر عنه</th><th>المصدر</th></tr></thead><tbody>
<tr><td><strong>فلو هايتس (Flow Heights)</strong> — الحي الثالث، العبور</td><td>مشروع سكني على 22 فدانًا بتصميمات حديثة وخدمات متكاملة من Happy Home Developments</td><td><a href="https://invest-gate.me/tag/developments/" rel="noopener">Invest-Gate</a> — ديسمبر 2024</td></tr>
<tr><td><strong>كمبوند مرتقى (Murtaqa)</strong> — مدخل العبور على طريق إسماعيلية</td><td>مجتمع فيلات منفصلة منخفض الكثافة على 210 أفدنة؛ 1,000 فيلا فقط بأسعار تبدأ من 20 مليون ج.م، مقدم 10% وتقسيط حتى 8 سنوات، تسليم معلن 2029</td><td><a href="https://deedgate.com/en/projects/compound-murtaqa/" rel="noopener">DeedGate</a> — ملف المشروع المنشور</td></tr>
<tr><td><strong>مشروع السلام</strong> — العبور الجديدة</td><td>أراضٍ مخصصة للبناء والاستثمار بمساحات 209–500 م² وسعر متر معلن تقريبًا 4,000–4,500 ج.م حسب الموقع</td><td><a href="https://almaleka.org/en/projects/al-salam-project-a-distinguished-real-estate-investment-in-new-obour-city/" rel="noopener">صفحة المشروع المنشورة</a></td></tr>
</tbody></table></div>

<h2>الاستثمار الحكومي: الرقم الأكبر خلف المشروعات</h2>
<p>خلف الإعلانات الخاصة يقف رقم حكومي وثّقته <a href="https://invest-gate.me/news/el-gazzar-chairs-meeting-at-obour-city-authority-headquarters-to-monitor-progress-of-projects/" rel="noopener">Invest-Gate</a> (أكتوبر 2023) نقلاً عن وزارة الإسكان: استثمارات العبور من 2014 بلغت <strong>11.39 مليار ج.م</strong> — ثلاثة أضعاف ما أُنفق في 32 عامًا السابقة مجتمعة (3.5 مليار) — بخطة سنوية تجاوزت 760 مليون ج.م في 2023/2024. هذا الإنفاق على البنية التحتية هو الجذر الحقيقي لموجة المشروعات الخاصة الحالية، وهو ما نرصده أثره في <a href="/price-forecast-obour/">اتجاهات الأسعار</a>.</p>

<h2>كيف تقرأ أي إعلان مشروع جديد؟</h2>
<ol>
<li><strong>الوثائق قبل الدعاية</strong> — تخصيص الأرض والترخيص مكتوبين؛ راجع <a href="/building-permits/">دليل التراخيص</a>.</li>
<li><strong>سجل المطور</strong> — مشاريع سُلمت فعلًا تفوق سنوات الخبرة المعلنة؛ قارن بمنهجية <a href="/developers/">دليل المطورين</a>.</li>
<li><strong>بند التأخير</strong> — تاريخ تسليم في العقد مع تعويض واضح، لا «2029 تقريبًا» في الإعلان.</li>
<li><strong>السعر مقابل السوق</strong> — قارن بـ<a href="/prices/">متوسطات المدينة</a> و<a href="/new-obour-real-estate/">دليل عقارات العبور الجديدة</a> قبل الحسم.</li>
<li><strong>زيارة الموقع</strong> — ماكيت المبيعات لا يُسكن؛ الموقع الفعلي صباحًا ومساءً هو التقييم الحقيقي.</li>
</ol>

<h2>الخلاصة</h2>
<p>موجة مشروعات العبور حقيقية ومدعومة باستثمار حكومي موثق — لكن كل مشروع يُقيَّم بوثائقه لا بإعلانه. تابع هذه الصفحة للرصد المحدث، وراجع <a href="/best-compounds-new-obour/">كمبوندات العبور الجديدة</a> القائمة للمقارنة، وصحّح أو أضِف عبر <a href="/corrections/">صفحة التصحيح</a> بمصدر منشور.</p>
`,
  faq: [
    { q: "ما أحدث المشروعات العقارية المعلنة في العبور؟", a: "من أبرز المرصود بمصادر منشورة: فلو هايتس بالحي الثالث (22 فدانًا، Happy Home Developments، Invest-Gate ديسمبر 2024)، وكمبوند مرتقى للفيلات على 210 أفدنة بأسعار من 20 مليون ج.م وتسليم معلن 2029 (DeedGate)، ومشروع السلام للأراضي بالعبور الجديدة (4,000–4,500 ج.م/م²). تحقق من كل مشروع بمستنداته من المطور مباشرة قبل أي حجز." },
    { q: "هل الاستثمار في مشروعات العبور الجديدة واعد؟", a: "المؤشرات الموثقة داعمة: استثمارات حكومية 11.39 مليار ج.م في المدينة من 2014 (ثلاثة أضعاف 32 عامًا سابقة) ونمو سنوي مرتفع للأسعار في المنصات الدولية. لكن كل مشروع يُقاس منفردًا: وثائق الأرض والترخيص، سجل التسليم الفعلي للمطور، وبند تعويض التأخير — هذه الثلاثة قبل أي حماس دعائي." },
    { q: "كيف أتحقق من جدية مشروع معلن في العبور؟", a: "خمس خطوات ثابتة: اطلب صورة تخصيص الأرض والترخيص كتابة، وابحث عن مشاريع المطور المُسلمة فعلًا واسأل سكانها، واشترط تاريخ تسليم وتعويضًا واضحًا في العقد، وقارن السعر بمتوسطات المدينة المنشورة، وزر الموقع بنفسك صباحًا ومساءً. أسئلة التحقق الكاملة في دليلنا لتقييم المشروعات الحديثة." },
  ],
}));

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  for (const { relDir, builder } of PAGES) {
    writePage(relDir, builder(chrome));
  }
  injectHubLink("prices", "/market-reports-obour/",
    `<section class="wrap"><p>قراءة جديدة: <a href="/market-reports-obour/">العبور في التقارير العقارية العالمية — قراءة موثقة بالمصادر</a>.</p></section>`);
  injectHubLink("new-obour", "/new-projects-watch/",
    `<section class="wrap"><p>رصد جديد: <a href="/new-projects-watch/">مشروعات العبور الجديدة تحت الرصد — بالمصادر المنشورة</a>.</p></section>`);
  injectHubLink("developers", "/new-projects-watch/",
    `<section class="wrap"><p>رصد جديد: <a href="/new-projects-watch/">أحدث المشروعات المعلنة في العبور — بالمصادر</a>.</p></section>`);
  console.log(`Phase 27 done: ${PAGES.length} pages`);
  console.log(report.join("\n"));
}

main();
