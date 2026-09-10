/**
 * seo-phase69-ouda-bravo.mjs — خبر: شراكة برافو السعودية وإبداع عبر «عوده».
 *
 * حسب الإعلان الرسمي على موقع برافو (21 أبريل 2026): دخول برافو مصر عبر
 * التحالف مع إبداع في كيان «عوده للتطوير العقاري» — 50 مليار جنيه حتى 2029،
 * وأول مشروع مجتمع سكني متكامل على 15 فدانًا في العبور الجديدة.
 * الصفحة تُعاد كتابتها كل build — idempotent بالكتابة الكاملة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-09-10";

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

const SLUG = "ouda-bravo-partnership";
const url = `${SITE}/${SLUG}/`;
const title = "برافو السعودية وإبداع يطلقان «عوده للتطوير العقاري»: 50 مليار جنيه وأول مشروع بالعبور الجديدة | دليل العبور";
const description = "حسب الإعلان الرسمي: برافو السعودية (خبرة 40+ عامًا في المشروعات السيادية) تدخل مصر بالتحالف مع إبداع عبر كيان «عوده للتطوير العقاري» — استثمارات تتجاوز 50 مليار جنيه حتى 2029، وأول مشروع مجتمع سكني متكامل على 15 فدانًا في العبور الجديدة.";
const h1 = "برافو السعودية وإبداع يطلقان «عوده للتطوير العقاري» في مصر — وأول مشروع في العبور الجديدة";

const FAQ = [
  { q: "ما هي شراكة برافو وعوده؟",
    a: "تحالف استراتيجي أُعلن في 21 أبريل 2026: دخول شركة برافو السعودية (إدارة مرافق ومقاولات منذ 1991) السوق المصرية عبر شراكة مع إبداع للتطوير العقاري، أسّسا معًا كيان «عوده للتطوير العقاري» — باستثمارات مستهدفة تتجاوز 50 مليار جنيه بين 2026 و2029 في مشاريع سكنية وتجارية." },
  { q: "ما أول مشروع للكيان الجديد في العبور الجديدة؟",
    a: "مجتمع سكني متكامل على 15 فدانًا في مدينة العبور الجديدة بنسبة بنائية لا تتجاوز 25% — مساحات خضراء وخدمات واسعة تشمل مناطق عمل مشترك (co-working) ومناطق ترفيهية وتكنولوجية ومركز أعمال، مع إمكانية تخصيص تصميم الوحدات حسب احتياج العميل." },
  { q: "من هي شركة برافو السعودية؟",
    a: "شركة سعودية تعمل منذ 1991 في المقاولات وإدارة المرافق والتشغيل والصيانة — نفذت وأدارت 19 مشروعًا حكوميًا سياديًا بقيمة تتجاوز 1.75 مليار ريال خلال خمس سنوات، بمحفظة تشمل وزارات الدفاع والداخلية والعدل والرياضة والحرس الوطني والصناعة والثروة المعدنية وأندية رياضية كبرى." },
  { q: "ما علاقة إبداع بعوده؟",
    a: "إبداع للتطوير العقاري إحدى شركات عوده والشريك المعلن في مشروع جولف سيتي بالعبور مع المهندسون المصريون — وهي الطرف المصري في التحالف الجديد مع برافو السعودية الذي أسس كيان عوده للتطوير العقاري بصيغته الحالية." },
  { q: "ماذا تعني الشراكة لمدينة العبور الجديدة؟",
    a: "أكبر استثمار عقاري معلن في المدينة حتى الآن: كيان بظهر سعودي سيادي الخبرة يختار العبور الجديدة مقرًا لأول مشاريعه — إشارة ثقة قوية في مستقبل المدينة وأحيائها الجديدة (24 و25) التي يتوسطها قلب خدمات عملاق مخطط." },
];

function main() {
  const chrome = loadChrome();
  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "NewsArticle", headline: h1, url, description,
      inLanguage: "ar-EG", datePublished: "2026-04-21", dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: [ { "@type": "Organization", name: "عوده للتطوير العقاري" }, { "@type": "Organization", name: "برافو السعودية" }, { "@type": "City", name: "مدينة العبور الجديدة" } ],
      isBasedOn: "https://www.bravo.sa/news/c9a86111-ec59-455d-a528-01af6caf5922" },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "أخبار المدينة", item: SITE + "/news/" },
      { "@type": "ListItem", position: 3, name: "شراكة برافو وعوده", item: url } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({
      "@type": "Question", name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() } })) },
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/news/">أخبار المدينة</a></li><li class="sep">›</li><li><span aria-current="page">شراكة برافو وعوده</span></li></ol></div></nav>`;
  const faqHtml = FAQ.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("");

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ خبر موثق · 21 أبريل 2026</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="69">
<p>في واحد من أكبر إعلانات السوق العقاري المصري هذا العام، أعلنت <strong>برافو السعودية</strong> دخولها الرسمي السوق المصرية عبر تحالف استراتيجي مع <strong>إبداع للتطوير العقاري</strong>، تأسس على إثره كيان <strong>«عوده للتطوير العقاري»</strong> — باستثمارات مستهدفة <strong>تتجاوز 50 مليار جنيه بين 2026 و2029</strong>، وأول المشاريع: <strong>مجتمع سكني متكامل في العبور الجديدة</strong>. الخبر أعلنه المهندس سعد المالكي رئيس مجلس إدارة برافو على الموقع الرسمي للشركة، وتناقلته أكثر من أربعين صحيفة وموقعًا مصريًا.</p>
<h2>الأرقام الأساسية في الإعلان</h2>
<div class="table-wrap"><table><tbody><tr><td><strong>الكيان الجديد</strong></td><td>عوده للتطوير العقاري — تحالف برافو السعودية × إبداع للتطوير العقاري</td></tr><tr><td><strong>الاستثمارات المستهدفة</strong></td><td>أكثر من 50 مليار جنيه (2026–2029) في مشاريع سكنية وتجارية</td></tr><tr><td><strong>أول مشروع</strong></td><td>مجتمع سكني متكامل على 15 فدانًا في العبور الجديدة — نسبة بنائية ≤ 25%</td></tr><tr><td><strong>سجل برافو</strong></td><td>خبرة تتجاوز 40 عامًا — 19 مشروعًا سياديًا بأكثر من 1.75 مليار ريال في 5 سنوات</td></tr><tr><td><strong>عملاء برافو السياديون</strong></td><td>وزارات الدفاع والداخلية والعدل والرياضة والحرس الوطني والصناعة والثروة المعدنية</td></tr></tbody></table></div>
<h2>أول مشروع: مجتمع متكامل على 15 فدانًا في العبور الجديدة</h2>
<p>المشروع الأول للكيان الجديد مجتمع سكني متكامل على مساحة 15 فدانًا في مدينة العبور الجديدة، بنسبة بنائية لا تتجاوز 25% — أي ثلاثة أرباع المساحة للحدائق والخدمات. ويقدم المشروع نموذج سكن حديث: مناطق عمل مشترك، ومناطق ترفيهية وتكنولوجية، ومركز أعمال — مع ميزة لافتة: <strong>إمكانية تخصيص تصميم الوحدة حسب احتياج العميل</strong>، في إطار مفهوم الشركة أن «العقار ليس مبنى بل منظومة متكاملة» تجمع التطوير الاحترافي والتشغيل الدقيق بعد التسليم.</p>
<h2>من هي برافو؟ الظهر السيادي السعودي</h2>
<p>برافو ليست اسمًا جديدًا في سوقها — شركة تعمل منذ 1991 في المقاولات وإدارة المرافق والتشغيل والصيانة والمشاريع المتخصصة والحراسات. خلال خمس سنوات نفذت وأدارت <strong>19 مشروعًا حكوميًا سياديًا</strong> بقيمة تتجاوز <strong>1.75 مليار ريال سعودي</strong>، بمحفظة عملاء تشمل وزارات الدفاع والداخلية والعدل والرياضة والحرس الوطني والصناعة والثروة المعدنية، إضافة لإدارة مرافق أندية رياضية كبرى. ويقول رئيسها المهندس سعد المالكي إن دخول مصر «ليس توسعًا جغرافيًا بل تحول استراتيجي» ينقل خبرة التشغيل السيادي إلى التطوير العقاري.</p>
<h2>ومن هي عوده بعد هذا التحالف؟</h2>
<p>عوده للتطوير العقاري — التي يقودها المهندس خالد عوده — كانت أصلًا أقوى مطور محلي في العبور بأرقامها المنشورة (1,065 وحدة مسلّمة و130+ مبنى وقطعة بالمدينة، ومشاريع جولف سيتي وكناري وسفاري). التحالف مع برافو ينقلها إلى فئة أخرى: <strong>كيان مصري-سعودي بخبرة مشروعات سيادية</strong> يجمع الذراع الإنشائية المحلية بمنظومة تشغيل وإدارة مرافق عالمية — وهو بالضبط ما يبحث عنه المشتري: مطور يسلّم ثم يشغّل ويحافظ على القيمة بعد التسليم.</p>
<h2>ماذا يعني هذا للعبور الجديدة؟</h2>
<p>ثلاث رسائل للسوق: <strong>أولًا</strong>، أكبر استثمار عقاري معلن في المدينة حتى اليوم يقع هنا لا في أي مدينة أخرى — تصويت ثقة دولي في مستقبل العبور الجديدة. <strong>ثانيًا</strong>، المشروع بنسبة بنائية 25% فقط — ما يتوافق تمامًا مع طابع الأحياء الجديدة منخفضة الكثافة (الحي 24 بيت الوطن والحي 25 جاردن سيتي) ومع قلب الخدمات العملاق المخطط بينهما. <strong>ثالثًا</strong>، خبرة برافو في إدارة المرافق تعني أن «ما بعد البيع» — نقطة ضعف كثير من المشاريع المصرية — جزء من الحمض النووي للكيان من اليوم الأول.</p>
<h2>المصدر</h2>
<ul><li>الإعلان الرسمي على موقع برافو (21 أبريل 2026): bravo.sa — تصريحات المهندس سعد المالكي (رئيس مجلس إدارة برافو) والمهندس خالد عوده (رئيس مجلس إدارة عوده للتطوير العقاري).</li><li>تغطية أكثر من 40 صحيفة وموقعًا مصريًا للإعلان بحسب الموقع الرسمي.</li></ul>
<p class="caption">تفاصيل المشروع الأول (الموقع الدقيق، الأسعار، مواعيد الطرح) لم تُعلن بعد — سنحدّث هذه الصفحة فور إعلانها عبر مصادرها الرسمية.</p>
<h2>الأسئلة الشائعة</h2>
<div class="faq-block">${faqHtml}</div>
</article><aside class="action-card"><p>معلومة موثقة عن المشروع؟</p><a class="button" href="/corrections/">راسلنا بمصدر ↖</a><a class="text-link" href="/developers-directory/">دليل شركات التطوير ↖</a><a class="text-link" href="/district-25-new-obour/">الحي 25 — أرقى الأحياء ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="/district-25-new-obour/">الحي 25 (جاردن سيتي العبور)</a></li><li><a href="/district-24-new-obour/">الحي 24 (بيت الوطن)</a></li><li><a href="/compounds/canary/">كناري — عوده</a></li><li><a href="/best-developer-by-city/">أفضل شركة عقارية في كل مدينة</a></li><li><a href="/developers-directory/">دليل شركات التطوير</a></li><li><a href="/tracker/">متابعة العبور الجديدة</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, SLUG);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log(`[phase69] /${SLUG}/ — خبر شراكة برافو × عوده (50 مليار)`);
}

main();
