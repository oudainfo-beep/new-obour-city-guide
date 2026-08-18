/**
 * seo-phase7-comparisons.mjs
 * صفحات مقارنة إضافية:
 *   /compare/district-1-vs-district-5/
 *   /compare/canary-vs-solana/
 *
 * idempotent: تُعاد كتابتها بالكامل كل build.
 * لا أرقام مخترعة — المقارنة منهجية تعتمد على ما هو منشور في صفحات الكيانات.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";

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

const PAGES = [
  {
    slug: "district-1-vs-district-5",
    title: "الحي الأول vs الحي الخامس في العبور الجديدة: مقارنة منهجية",
    h1: "الحي الأول مقابل الحي الخامس في العبور الجديدة",
    description: "مقارنة منهجية بين الحي الأول والحي الخامس في العبور الجديدة: الموقع، الخدمات، النضج، وما يجب معاينته بنفسك قبل الشراء.",
    intro: `لا يوجد حي أفضل بشكل مطلق في العبور الجديدة؛ الإجابة تعتمد على أولوياتك. الحي الأول يُعتبر من المراحل المبكرة وقد يحتوي على خدمات قائمة ومشاريع مُسلّمة جزئيًا. الحي الخامس يختلف في التخطيط والكثافة والمرحلة التنفيذية.

المقارنة أدناه لا تقدم أرقامًا غير منشورة؛ بل تساعدك على الأسئلة التي يجب طرحها عند المعاينة، مع روابط لصفحات الأحياء لمراجعتها مباشرة.`,
    table: [
      ["المعيار", "الحي الأول", "الحي الخامس", "ما تتحقق منه"],
      ["المرحلة التنفيذية", "مراحل متقدمة نسبيًا", "يعتمد على النطاق", "تاريخ التسليم الفعلي للمشروع المحدد"],
      ["الخدمات اليومية", "قد تكون متوفرة جزئيًا", "يختلف حسب النطاق", "زيارة ميدانية للسوبرماركت والصيدليات"],
      ["زمن الوصول", "يعتمد على الموقع داخل الحي", "يعتمد على الموقع داخل الحي", "قياس الرحلة في وقت الذروة"],
      ["الكثافة السكانية", "تختلف حسب المشروع", "تختلف حسب المشروع", "معاينة المساحات الخضراء ونسبة البناء"],
    ],
    links: [
      { url: "/districts/district-1/", text: "دليل الحي الأول" },
      { url: "/districts/district-5/", text: "دليل الحي الخامس" },
    ],
    faq: [
      { q: "أي الحيين أنسب للسكن الفوري؟", a: "السكن الفوري يعتمد على المشروع المحدد لا الحي بأكمله. راجع حالة التسليم الفعلية للمشروع وتوفر المرافق قبل القرار." },
      { q: "هل الخدمات متوفرة بالتساوي في الحيين؟", a: "لا. التوزيع يختلف داخل الحي نفسه. المعاينة الميدانية هي الطريقة الوحيدة للحكم على توفر الخدمات اليومية." },
      { q: "كيف أقارن بين مشروعين في حيين مختلفين؟", a: "استخدم معايير منشورة: نسبة البناء، موعد التسليم، رسوم الإدارة، المسافة لأقرب خدمات، وزمن الوصول في الذروة." },
    ],
  },
  {
    slug: "canary-vs-solana",
    title: "كناري vs سولانا في العبور الجديدة: مقارنة منهجية",
    h1: "كناري مقابل سولانا في العبور الجديدة",
    description: "مقارنة منهجية بين مشروعي كناري وسولانا في العبور الجديدة: الموقع، المطور، البيانات المنشورة، وما يجب التحقق منه.",
    intro: `كناري وسولانا مشروعان لشركة عوده للتطوير العقاري في العبور الجديدة. كلاهما يندرج تحت بيانات منشورة في دليل المطورين، لكن الاختيار بينهما يعتمد على تفاصيل الوحدة والموقع والتسليم لا على الاسم التجاري.

هذه المقارنة لا تُفضّل مشروعًا على آخر؛ بل تستعرض الأسئلة العملية التي يجب مراجعتها في كل مشروع، مع روابط لصفحات الكمبوندات والمطور.`,
    table: [
      ["المعيار", "كناري", "سولانا", "ما تتحقق منه"],
      ["الحي", "الحي 25", "موقع منشور في صفحة المشروع", "العنوان الفعلي والمدخل"],
      ["نسبة البناء المنشورة", "25%", "تحقق من البيانات المنشورة", "المواصفات الفعلية في العقد"],
      ["حالة التسليم", "تحقق من المطور", "تحقق من المطور", "تاريخ تسليم مكتوب"],
      ["المرافق والخدمات", "تحقق ميدانيًا", "تحقق ميدانيًا", "زيارة الموقع أو مشروع مُسلّم للشركة"],
      ["رسوم الإدارة", "غير منشورة", "غير منشورة", "طلب الرقم مكتوبًا في العقد"],
    ],
    links: [
      { url: "/compounds/canary/", text: "صفحة كمبوند كناري" },
      { url: "/compounds/solana/", text: "صفحة كمبوند سولانا" },
      { url: "/developers/ouda/", text: "بيانات مطور عوده" },
    ],
    faq: [
      { q: "أي المشروعين أقرب للخدمات؟", a: "القرب يعتمد على المدخل والمحور المستخدم. قِس زمن الوصول من باب المشروع إلى أقرب صيدلية ومستشفى ومدرسة." },
      { q: "هل نسبة البناء المنخفضة تعني كثافة أقل؟", a: "عادةً نعم، لكنها لا تكفي وحدها. اسأل عن ارتفاع المباني، المساحات الخضراء، ورسوم الإدارة." },
      { q: "كيف أتحقق من جدول التسليم؟", a: "اطلب بندًا مكتوبًا في العقد مع غرامة تأخير محددة، وزر مشروعًا مُسلّمًا للشركة لرؤية جودة التنفيذ." },
    ],
  },
];

function buildTable(rows) {
  const head = rows[0];
  const body = rows.slice(1);
  return `<div class="table-wrap"><table><thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
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
      datePublished: "2026-08",
      dateModified: "2026-08",
      publisher: { "@id": SITE + "/#org" },
    },
    breadcrumb(page.h1, url),
    faqBlock(page.faq),
  ];
  const head = buildHead(chrome.head, { title: page.title, description: page.description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/compare/">مقارنة المدن</a><span>/</span><span>${page.h1}</span></div></nav>`;
  const linksHtml = page.links.map(l => `<a class="button" href="${l.url}">${l.text} ↖</a>`).join('');
  const faqHtml = `<div class="faq-block">${page.faq.map(q => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join('')}</div>`;
  const main = `<main id="content"><section class="wrap"><h1>${page.h1}</h1><div class="lead"><p>${page.intro.replace(/\n\n/g, '</p><p>')}</p></div><h2>جدول المقارنة</h2>${buildTable(page.table)}<p class="caption">المقارنة تعتمد على بيانات منشورة ومنهجية تحقق عملي. لا تستخدم كبديل عن معاينة المشروع أو مراجعة العقد.</p><div class="action-card"><p>اقرأ الصفحات المختصة</p>${linksHtml}</div><h2>أسئلة شائعة</h2>${faqHtml}</section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

function main() {
  const chrome = loadChrome();
  for (const page of PAGES) {
    const outDir = path.join(clientDir, "compare", page.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), buildPage(chrome, page), "utf8");
    console.log(`[OK] /compare/${page.slug}/ created`);
  }
}

main();
