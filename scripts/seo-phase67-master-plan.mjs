/**
 * seo-phase67-master-plan.mjs — مقال مرجعي: خريطة العبور الجديدة الرسمية (المخطط الاستراتيجي).
 *
 * يشرح الوثيقة الرسمية (وزارة الإسكان/NUCA) وكيفية قراءتها، وما تكشفه عن
 * بنية المدينة الجديدة — مع الصورة المحسّنة وروابط تحميل PNG وPDF.
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
function buildHead(head, { title, description, url, schemas, ogImage }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  if (ogImage) h = h.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${ogImage}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

const SLUG = "new-obour-master-plan";
const url = `${SITE}/${SLUG}/`;
const IMG = `${SITE}/infographics/new-obour-master-plan-official.webp`;
const title = "خريطة العبور الجديدة الرسمية: المخطط الاستراتيجي بالأحياء والمناطق | دليل العبور";
const description = "خريطة العبور الجديدة الرسمية (المخطط الاستراتيجي الصادر عن وزارة الإسكان — هيئة المجتمعات العمرانية): استعمالات الأراضي والأحياء والمحاور والمنطقة الخدمية المركزية — مع تحميل نسخة عالية الجودة PNG وPDF.";
const h1 = "خريطة العبور الجديدة الرسمية: المخطط الاستراتيجي الكامل";

const FAQ = [
  { q: "فين ألاقي خريطة العبور الجديدة الرسمية؟",
    a: "على هذه الصفحة: نسخة عالية الجودة من المخطط الاستراتيجي الصادر عن وزارة الإسكان والمرافق والمجتمعات العمرانية (هيئة المجتمعات العمرانية الجديدة — الإدارة المخططة الاستراتيجية والتفصيلية)، للتحميل صورة وPDF. والنسخة الأحدث دائمًا من جهاز المدينة أو موقع الهيئة." },
  { q: "ما الفرق بين المخطط الاستراتيجي والخريطة التفاعلية؟",
    a: "المخطط الاستراتيجي وثيقة رسمية تحدد استعمالات الأراضي والأحياء والمحاور المخططة للمدينة — أي «ماذا سيُبنى أين» بقوة التخطيط الرسمي. أما خريطتنا التفاعلية فتعرض الخدمات القائمة اليوم (مدارس ومستشفيات ومحلات) بإحداثياتها. الأولى للمستقبل المخطط، والثانية للحاضر الفعلي." },
  { q: "الحي 24 والحي 25 موجودان على المخطط؟",
    a: "نعم — منطقة بيت الوطن (الحي 24) والحي 25 (جاردن سيتي العبور) ظاهران في نسيج المدينة على المخطط، وتتوسطهما المنطقة الخدمية المركزية العملاقة بحدائقها ومولاتها وحزامها الأخضر. لكل منهما صفحة تفصيلية في دليلنا." },
  { q: "كيف أتحقق من استعمال قطعة أرض على المخطط؟",
    a: "ثلاث خطوات: حدد موقع القطعة على الخريطة (من المحاور الرئيسية والأحياء المرقمة)، وطابق لونها مع مفتاح استعمالات الأراضي، ثم أكّد رسميًا من جهاز المدينة قبل التعاقد — فالتحديثات التفصيلية تصدر أولًا بأول." },
  { q: "هل المخطط الاستراتيجي يتغير؟",
    a: "الإطار العام مستقر (المحاور والاستعمالات الكبرى)، لكن التفاصيل تُحدَّث بتعديلات تصدر عن الهيئة. لذلك تعامل مع الخريطة كمرجع تخطيطي قوي، وأكّد الحالة التفصيلية لأي قطعة من جهاز المدينة قبل الشراء." },
];

function main() {
  const chrome = loadChrome();
  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY, image: [IMG],
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: { "@type": "Thing", name: "المخطط الاستراتيجي لمدينة العبور الجديدة" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "العبور الجديدة", item: SITE + "/new-obour-districts/" },
      { "@type": "ListItem", position: 3, name: "المخطط الاستراتيجي", item: url } ] },
    { "@context": "https://schema.org", "@type": "ImageObject", contentUrl: IMG,
      name: "المخطط الاستراتيجي لمدينة العبور الجديدة — وزارة الإسكان والمرافق والمجتمعات العمرانية",
      description: "خريطة استعمالات الأراضي والأحياء والمحاور لمدينة العبور الجديدة — هيئة المجتمعات العمرانية الجديدة",
      width: 1977, height: 1398 },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({
      "@type": "Question", name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() } })) },
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas, ogImage: IMG });
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/new-obour-districts/">العبور الجديدة</a></li><li class="sep">›</li><li><span aria-current="page">المخطط الاستراتيجي</span></li></ol></div></nav>`;
  const faqHtml = FAQ.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("");

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ وثيقة رسمية · مخطط استراتيجي</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="67">
<p>قبل أن تشتري مترًا واحدًا في العبور الجديدة، توجد وثيقة واحدة يجب أن تراها: <strong>المخطط الاستراتيجي للمدينة</strong> — الخريطة الرسمية الصادرة عن <strong>وزارة الإسكان والمرافق والمجتمعات العمرانية</strong> (هيئة المجتمعات العمرانية الجديدة — الإدارة المخططة الاستراتيجية والتفصيلية). هذه الخريطة هي دستور المدينة على الورق: ماذا سيُبنى أين، وأين ستسكن، وأين ستكون الخدمات والحدائق والمحاور — لعقود قادمة.</p>
<figure style="margin:1.5rem 0"><a href="${SITE}/infographics/new-obour-master-plan-official.png" target="_blank" rel="noopener"><img src="${IMG}" alt="خريطة العبور الجديدة الرسمية — المخطط الاستراتيجي لاستعمالات الأراضي والأحياء والمحاور (هيئة المجتمعات العمرانية الجديدة)" width="1977" height="1398" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px;border:1px solid #e3ddd0"></a><figcaption class="caption" style="text-align:center;margin-top:.5rem">المخطط الاستراتيجي لمدينة العبور الجديدة — انقر للنسخة كاملة الجودة · أُعيد تحسين وضوحها للنشر</figcaption></figure>
<p style="display:flex;gap:.6rem;flex-wrap:wrap"><a class="button" href="${SITE}/infographics/new-obour-master-plan-official.png" target="_blank" rel="noopener">⬇ تحميل PNG عالي الجودة</a><a class="button" href="${SITE}/downloads/new-obour-master-plan.pdf" target="_blank" rel="noopener">⬇ تحميل PDF للطباعة</a></p>
<h2>ما هي وثيقة «المخطط الاستراتيجي»؟</h2>
<p>كل مدينة جديدة في مصر تُبنى على وثيقة كهذه: تصدر عن هيئة المجتمعات العمرانية الجديدة وتحدد <strong>استعمالات الأراضي</strong> (سكني وتجاري وخدمي وترفيهي وزراعي)، و<strong>شبكة الطرق والمحاور</strong> بعروضها، و<strong>مواقع الخدمات العامة</strong> (تعليمية وصحية وإدارية وتجارية). هي المرجع الذي تُبنى عليه التراخيص والتخصيصات — ولهذا هي أصدق مصدر يجيبك عن سؤال: «الأرض اللي هشتريها حواليها إيه بعد عشر سنين؟»</p>
<h2>كيف تقرأ الخريطة — دليل المفتاح (الليجند)</h2>
<ul><li><strong>ألوان الاستعمالات:</strong> درجات الأصفر للمناطق السكنية بأنواعها، والبرتقالي والبني للمناطق التجارية والخدمية الكبرى ومراكز الخدمات، والأحمر المخطط للمناطق ذات الاستعمال الخاص، والبنفسجي للمناطق المميزة، والأخضر المنقط للمساحات الزراعية والأحزمة الخضراء.</li>
<li><strong>شبكة الطرق:</strong> الخطوط السوداء السميكة هي المحاور الرئيسية بعروضها المختلفة — يتصدرها <strong>الدائري الأوسطي</strong> الذي يخترق المدينة ويربطها بطريقي السويس والإسماعيلية.</li>
<li><strong>جدول الخدمات المرقّم:</strong> في أسفل المفتاح قائمة مرقمة بمواقع الخدمات العامة — تعليمية وصحية وتجارية وإدارية — بمواضعها على الخريطة.</li></ul>
<h2>ماذا تكشف الخريطة عن العبور الجديدة؟</h2>
<h3>مدينة تُبنى حول محور، لا حول نفسها</h3>
<p>العمود الفقري للمخطط هو <strong>الدائري الأوسطي</strong> — يخترق المدينة ويربطها بالإقليمي (عبر محور R2) وبطريقي السويس والإسماعيلية. لهذا كانت أحياء مثل <a href="/district-25-new-obour/">الحي 25</a> و<a href="/district-24-new-obour/">الحي 24</a> هي الأسرع نموًا: الأقرب للمحور الأهم.</p>
<h3>المنطقة الخدمية المركزية العملاقة</h3>
<p>في قلب النسيج بين الحي 24 (بيت الوطن) والحي 25 (جاردن سيتي العبور) يقع قلب الخدمات المخطط: مساحات خضراء شاسعة وحدائق مركزية بنوافير وممشى، ومناطق تجارية ومولات وبنوك ومستشفيات، يحيط بها حزام أخضر — القلب النابض الذي صُمم ليخدم الأحياء الشرقية كلها.</p>
<h3>أحزمة خضراء تحيط بالعمران</h3>
<p>المناطق المنقطة بالأخضر على أطراف المخطط ليست فراغًا — إنها الأحزمة الزراعية والخضراء التي تفصل العمران وتضبط توسعه، وتمنح المدينة هواءها الذي يميزها عن قلب القاهرة.</p>
<h3>بنية أحياء متدرجة</h3>
<p>من مناطق الإسكان المميز إلى عمارات الأحياء إلى مناطق بيت الوطن وسكن لكل المصريين (ومنها أحياء 15 و16) — المخطط يوزع أنماط السكن بوضوح، وهو ما يفسر تفاوت الأسعار من حي لحي اليوم.</p>
<h2>كيف تستخدم الخريطة قبل الشراء؟</h2>
<ol><li><strong>حدد قطعتك:</strong> اعثر على موقعها من المحاور الرئيسية ورقم الحي أو المنطقة.</li><li><strong>طابق اللون:</strong> لون القطعة في المفتاح يخبرك باستعمالها الرسمي — سكني محض أم مختلط.</li><li><strong>انظر للجوار:</strong> ما الذي يحيط بك مخططًا؟ حديقة أم محور أم منطقة خدمية؟ جوارك المستقبلي نصف قيمتك.</li><li><strong>أكّد رسميًا:</strong> اسأل جهاز المدينة عن الحالة التفصيلية الأحدث — التعديلات تصدر دوريًا.</li></ol>
<p class="caption">الخريطة منشورة هنا بعد تحسين وضوحها للقراءة الرقمية. الوثيقة الأم من هيئة المجتمعات العمرانية الجديدة — وللحالة التفصيلية الأحدث راجع جهاز مدينة العبور الجديدة.</p>
<h2>الأسئلة الشائعة</h2>
<div class="faq-block">${faqHtml}</div>
</article><aside class="action-card"><p>عندك نسخة أحدث من المخطط؟</p><a class="button" href="/corrections/">شاركنا بمصدر ↖</a><a class="text-link" href="/map/">الخريطة التفاعلية للخدمات ↖</a><a class="text-link" href="/new-obour-districts/">أحياء العبور الجديدة ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="/district-25-new-obour/">الحي 25 (جاردن سيتي العبور)</a></li><li><a href="/district-24-new-obour/">الحي 24 (بيت الوطن)</a></li><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li><li><a href="/map/">الخريطة التفاعلية</a></li><li><a href="/tracker/">متابعة العبور الجديدة</a></li><li><a href="/prices/">الأسعار</a></li><li><a href="/buying-guide/">دليل الشراء</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, SLUG);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log(`[phase67] /${SLUG}/ — المخطط الاستراتيجي للعبور الجديدة + PNG/PDF`);
}

main();
