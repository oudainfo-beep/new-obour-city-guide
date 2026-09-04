/**
 * seo-phase10-city-hubs.mjs
 * المرحلة العاشرة: صفحتي hub لـ «العبور الجديدة» و«مدينة العبور».
 *
 * تنشئ:
 *   /new-obour/ · /obour-city/
 * بمحتوى أصلي، روابط داخلية، وBreadcrumbList + WebPage schema.
 * لا تُعيد بناء sitemap — تبقى مهمة آخر سكربت في السلسلة.
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

function buildHead(head, { title, description, url }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  h = h.replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="ar_EG">`);
  return h;
}

function pageShell(chrome, { title, description, url, h1, tag, breadcrumbItems, body }) {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: h1,
      url,
      inLanguage: "ar-EG",
      datePublished: DEFAULT_LASTMOD,
      dateModified: DEFAULT_LASTMOD,
      publisher: { "@id": SITE + "/#org" },
      description,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.item,
      })),
    },
    orgNode(),
  ];
  const head = buildHead(chrome.head, { title, description, url });
  const breadcrumb = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><ol>${breadcrumbItems
    .map((it, i) => {
      if (i === breadcrumbItems.length - 1) {
        return `<li><span aria-current="page">${it.name}</span></li>`;
      }
      return `<li><a href="${it.item}">${it.name}</a></li><li class="sep">›</li>`;
    })
    .join("")}</ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap content-grid"><article>${body}</article><aside class="action-card"><p>أدلة ذات صلة</p><a class="text-link" href="/about/">عن المدينة ↖</a><a class="text-link" href="/obour-vs-obour-new/">الفرق بين المدينتين ↖</a><a class="text-link" href="/directory/">دليل الخدمات ↖</a></aside></div></section></main>`;
  return `<!doctype html>${head.replace(/<head>/, `<html lang="ar" dir="rtl"><head>`).replace(/<\/head>/, `</head><body>`)}${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

function newObourPage(chrome) {
  const url = `${SITE}/new-obour/`;
  const title = "العبور الجديدة: دليل السكن والشراء 2026 | دليل العبور";
  const description = "دليل عملي للعبور الجديدة: الأحياء، المطوّرون، أسعار العقارات، المواصلات، والأخطاء الشائعة قبل الشراء — بمصادر منشورة قابلة للتحقق.";
  const h1 = "العبور الجديدة: دليل السكن والشراء";
  const body = `
<p>العبور الجديدة مدينة مخططة منفصلة عن مدينة العبور القائمة، وليست مجرد امتداد طبيعي لها. أُنشئت بقرار جمهوري عام 2016 وتتبع هيئة المجتمعات العمرانية الجديدة، وتبلغ المساحة الإجمالية للتخطيط نحو 59 ألف فدان. لكن الرقم الكبير لا يعني أن كل نقطة متساوية في مرحلة التنفيذ؛ بعض المناطق جاهزة تقريبًا للسكن، وبعضها ما زال يبني شبكة الطرق والمرافق الأساسية.</p>

<h2>كيف تقرأ خريطة الأحياء؟</h2>
<p>الأحياء في العبور الجديدة تنقسم إلى نطاقات: الأحياء المرقمة من 1 إلى 9، وحي 24 (بيت الوطن)، وحي 25 (الإسكان الفاخر)، والحي المتميز. كل نطاق يختلف في مرحلة التنفيذ، قربه من المحاور الرئيسية، وتوافر الخدمات اليومية. لا تكفي مقارنة الأحياء بالاسم فقط؛ اسأل عن حالة الشارع، توقيت توصيل المياه والكهرباء، وقرب المدارس والصيدليات.</p>

<ul>
  <li><a href="/districts/">تصفّح الأحياء الـ12</a> — موجز لكل حي وما يناسبه.</li>
  <li><a href="/compare/district-1-vs-district-5/">مقارنة: الحي الأول مقابل الحي الخامس</a></li>
</ul>

<h2>المطوّرون والمشروعات</h2>
<p>يوجد في العبور الجديدة عشرات المشروعات السكنية والتجارية. الدليل يقيّم المطوّرين بنفس المعايير المنشورة على الجميع، ويربط كل مشروع بمطوّره والحي الذي يقع فيه. كن حذرًا من الإعلانات التي تعتمد على "قرب الخدمات" دون تحديد اسم الخدمة أو مسارها الفعلي.</p>

<ul>
  <li><a href="/developers/">دليل المطوّرين</a> — بيانات منشورة وتقييم محايد.</li>
  <li><a href="/compounds/">المشروعات السكنية</a> — كناري، سولانا، سندس، سفاري، فيالي ريزيدنس، وغيرها.</li>
</ul>

<h2>المواصلات والوصول</h2>
<p>يربط العبور الجديدة بطريق القاهرة–إسماعيلية الصحراوي جنوبًا، وطريق القاهرة–بلبيس الصحراوي شمالًا، مع محاور تربطها بالدائري الإقليمي والدائري الأوسطي. كما يمر بها مسار القطار الكهربائي الخفيف LRT ضمن المحطات المعلنة. لكن القرب الجغرافي من محور لا يساوي راحة يومية؛ قِس الرحلة في وقت الذروة من باب منزلك الفعلي.</p>

<ul>
  <li><a href="/transport/">المواصلات والوصول</a></li>
  <li><a href="/lrt-obour/">القطار الكهربائي الخفيف LRT</a></li>
  <li><a href="/travel-times/">أزمنة الرحلات</a></li>
</ul>

<h2>قبل أي قرار شراء</h2>
<ol>
  <li>حدّد هدفك الزمني: سكن فوري، شراء مبكر، أم استثمار متوسط الأجل؟</li>
  <li>قس الرحلة اليومية إلى العمل، المدرسة، وأقرب مستشفى طوارئ.</li>
  <li>تحقق من نسبة البناء المعلنة، مساحة الوحدة، والتشطيب الفعلي.</li>
  <li>اقرأ <a href="/mistakes/">الأخطاء الشائعة</a> و<a href="/buying-guide/">دليل الشراء</a>.</li>
</ol>

<h2>العبور الجديدة مقابل العبور القائمة</h2>
<p>العبور القائمة أقدم وأكثر نضجًا في الخدمات اليومية، بينما العبور الجديدة تقدم تخطيطًا أحدث ومساحات أوسع. لا يوجد خيار أفضل بشكل مطلق؛ يوجد خيار أنسب لهدفك وميزانيتك ومدى قبولك لانتظار اكتمال المرافق. اقرأ المقارنة التفصيلية قبل الالتزام بأي وحدة.</p>

<p><a href="/obour-vs-obour-new/">مقارنة شاملة: العبور مقابل العبور الجديدة →</a></p>
`;
  return pageShell(chrome, {
    title, description, url, h1,
    tag: "العبور الجديدة",
    breadcrumbItems: [{ name: "الرئيسية", item: SITE + "/" }, { name: "العبور الجديدة", item: url }],
    body,
  });
}

function obourCityPage(chrome) {
  const url = `${SITE}/obour-city/`;
  const title = "مدينة العبور: دليل الخدمات والحياة اليومية | دليل العبور";
  const description = "دليل عملي لمدينة العبور القائمة: المطاعم، المستشفيات، المدارس، الصيدليات، المحلات، والخدمات اليومية — بعناوين وأرقام ومصادر منشورة.";
  const h1 = "مدينة العبور: دليل الخدمات والحياة اليومية";
  const body = `
<p>مدينة العبور القائمة — غرب النطاق الجديد — هي المدينة الناضجة التي يستخدمها سكان العبور الجديدة اليوم لقضاء احتياجاتهم اليومية. تمتد على مساحة أصغر وأقدم، وتتميز بشبكة خدمات أكثر استقرارًا: مستشفيات، مدارس، مولات، مطاعم، صيدليات، ومحلات متنوعة.</p>

<h2>الخدمات اليومية</h2>
<p>إذا كنت تعيش في العبور الجديدة أو تخطط للانتقال إليها، فإن معظم خدماتك اليومية الفورية ستكون في مدينة العبور القائمة أو في جولف سيتي وحي الشباب. المسافة قصيرة نسبيًا لكنها تتطلب سيارة في معظم الأحيان، خصوصًا في ساعات الذروة أو مع أطفال صغار.</p>

<ul>
  <li><a href="/restaurants/">مطاعم وكافيهات العبور</a> — أكثر من 300 مدخل.</li>
  <li><a href="/shopping/">التسوق والمحلات</a> — سوبرماركت، مولات، أثاث، إلكترونيات.</li>
  <li><a href="/pharmacies/">الصيدليات</a> — 42 موقعًا مع عناوين وأرقام.</li>
  <li><a href="/hospitals/">المستشفيات والمراكز الطبية</a></li>
</ul>

<h2>التعليم في مدينة العبور</h2>
<p>تضم مدينة العبور القائمة مدارس حكومية ورياض أطفال ومدارس لغات ومدارس دولية ومدارس نيل مصرية. هذا التنوع يجعلها وجهة للعديد من أسر العبور الجديدة، خصوصًا في المراحل الدراسية الأولى. لكن المقاعد والرسوم والمواعيد تتغير سنويًا، لذا تحقق مباشرة من المدرسة قبل التقديم.</p>

<ul>
  <li><a href="/schools/">دليل مدارس العبور</a></li>
  <li><a href="/education-guide/">دليل التعليم الشامل</a></li>
  <li><a href="/school-fees/">تكاليف المدارس</a></li>
</ul>

<h2>الصحة والطوارئ</h2>
<p>تتركز المستشفيات الكبرى والعيادات المتخصصة في مدينة العبور القائمة على المحاور الرئيسية. إذا كنت تسكن في العبور الجديدة، فاحسب زمن الوصول في الليل وليس على الخريطة. بعض العيادات والصيدليات تفتح 24 ساعة، لكن التغطية غير موزعة بالتساوي.</p>

<ul>
  <li><a href="/clinics/">العيادات والمعامل والأشعة</a></li>
  <li><a href="/emergency/">أرقام الطوارئ</a></li>
  <li><a href="/health/">دليل الصحة</a></li>
</ul>

<h2>النقل بين المدينتين</h2>
<p>يربط المدينتين محاور رئيسية ووسائل نقل محلية. في ساعات الذروة، قد تزداد الرحلة بضع دقائق بسبب الكثافة عند المداخل والدوارات. إذا كان عملك أو مدرسة أطفالك في مدينة العبور القائمة، فاختبر المسار في الصباح والمساء لمدة يومين قبل اتخاذ قرار السكن.</p>

<p><a href="/transport/">تفاصيل المواصلات والوصول →</a> · <a href="/obour-vs-obour-new/">الفرق بين المدينتين →</a></p>

<h2>نصيحة عملية</h2>
<p>لا تعتمد على وصف "قريب من الخدمات" في إعلان عقاري. اطلب أسماء محددة: أقرب صيدلية، أقرب مستشفى طوارئ، أقرب مدرسة، وأقرب سوبرماركت. ثم قِس المسافة من باب المشروع لا من حدود المدينة. هذا الفحص البسيط يجنبك مفاجآت بعد الانتقال.</p>
`;
  return pageShell(chrome, {
    title, description, url, h1,
    tag: "مدينة العبور",
    breadcrumbItems: [{ name: "الرئيسية", item: SITE + "/" }, { name: "مدينة العبور", item: url }],
    body,
  });
}

function addHubLinksToExistingPages() {
  let touched = 0;

  // 1) صفحة /obour-vs-obour-new/ — إضافة إلى aside action-card
  const compareFile = path.join(clientDir, "obour-vs-obour-new", "index.html");
  if (fs.existsSync(compareFile)) {
    let html = fs.readFileSync(compareFile, "utf8");
    const links = [
      ["/new-obour/", "تفاصيل العبور الجديدة"],
      ["/obour-city/", "تفاصيل مدينة العبور"],
    ];
    const existing = new Set((html.match(/href="([^"]+)"/g) || []).map((x) => x.replace(/href="|"/g, "").replace(/\/$/, "")));
    const missing = links.filter(([href]) => !existing.has(href.replace(/\/$/, "")));
    if (missing.length) {
      const asideMatch = html.match(/<aside class="action-card">([\s\S]*?)<\/aside>/);
      if (asideMatch) {
        const items = missing.map(([href, text]) => `<a class="text-link" href="${href}">${text} ↖</a>`).join("");
        html = html.replace(asideMatch[0], asideMatch[0].replace("</aside>", `${items}</aside>`));
        fs.writeFileSync(compareFile, html);
        touched++;
      }
    }
  }

  // 2) صفحة /about/ — إضافة قسم قبل "مصادر للقراءة والتحقق"
  const aboutFile = path.join(clientDir, "about", "index.html");
  if (fs.existsSync(aboutFile)) {
    let html = fs.readFileSync(aboutFile, "utf8");
    const marker = "<!-- phase10-about-hubs -->";
    if (!html.includes(marker) && html.includes('<h2>مصادر للقراءة والتحقق</h2>')) {
      const section = `<section class="paper section"><div class="wrap"><h2>أدلة تفصيلية للمدينتين</h2><p>لقراءة أعمق في كل مدينة على حدة — موقعها، خدماتها، وما يهم المشتري أو المستأجر — راجع الدليلين التفصيليين:</p><ul><li><a href="/new-obour/">دليل العبور الجديدة: الأحياء والمطوّرون والمواصلات</a></li><li><a href="/obour-city/">دليل مدينة العبور: الخدمات والحياة اليومية</a></li></ul></section>${marker}`;
      html = html.replace('<section class="sources"><div class="wrap"><h2>مصادر للقراءة والتحقق</h2>', `${section}<section class="sources"><div class="wrap"><h2>مصادر للقراءة والتحقق</h2>`);
      fs.writeFileSync(aboutFile, html);
      touched++;
    }
  }

  rep("hub-links", `أُضيفت روابط للصفحتين الجديدتين في ${touched} صفحة قائمة.`);
}

function main() {
  const chrome = loadChrome();
  const pages = [
    { slug: "new-obour/index", builder: newObourPage },
    { slug: "obour-city/index", builder: obourCityPage },
  ];
  for (const p of pages) {
    const file = path.join(clientDir, ...p.slug.split("/")) + ".html";
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, p.builder(chrome));
    rep("page", `/${p.slug.replace("/index", "")}/ أُنشئت`);
  }
  addHubLinksToExistingPages();

  console.log("=== تقرير المرحلة العاشرة: صفحات hub المدن ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
