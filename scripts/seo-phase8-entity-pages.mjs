/**
 * seo-phase8-entity-pages.mjs
 * صفحات كيانات فردية مفقودة:
 *   /schools/st-joseph-school-obour/
 *   /hospitals/tabarak-childrens-hospital-obour/
 *   /hospitals/el-obour-hospital/
 *
 * idempotent: تُعاد كتابتها بالكامل كل build.
 * المصادر منشورة؛ لا أرقام ولا حقائق مخترعة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";

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

function faqBlock(questions) {
  const items = questions.map((q) => ({
    "@type": "Question",
    name: q.q,
    acceptedAnswer: { "@type": "Answer", text: q.a },
  }));
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items };
}

function breadcrumb(categoryName, categoryUrl, name, url) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: categoryName, item: categoryUrl },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };
}

const ENTITIES = [
  {
    slug: "st-joseph-school-obour",
    dir: "schools",
    category: { name: "المدارس", url: SITE + "/schools/" },
    title: "مدرسة القديس يوسف العبور | عنوان وهاتف وبيانات منشورة",
    h1: "مدرسة القديس يوسف — فرع العبور",
    description: "بيانات منشورة عن مدرسة القديس يوسف في العبور: العنوان، الهاتف، المراحل الدراسية، والمصدر. بدون تلميع أو تقييمات وهمية.",
    entity: {
      name: "مدرسة القديس يوسف — فرع العبور",
      address: "الحي الثاني، مدينة العبور، القليوبية",
      phone: "02-4478-0116",
      source: "Kids Directory",
      sourceUrl: "https://kidsdirectory.com.eg/ad/st-joseph-school/",
    },
    intro: `مدرسة القديس يوسف (St. Joseph School) فرع العبور هي واحدة من المدارس الخاصة العاملة في المدينة. البيانات المنشورة تشير إلى أنها تقع في الحي الثاني، وتقدم مراحل دراسية متنوعة تشمل الرياض الأطفال والتعليم الأساسي.

لا يقدم الدليل توصية بمدرسة بعينها؛ الهدف هو توفير بيانات اتصال موثوقة يمكن للأسرة التحقق منها مباشرة. قبل التقديم، نوصي بزيارة المدرسة والاستفسار عن: الرسوم الدراسية، نظام القبول، عدد الطلاب في الفصل، والمنهج المطبق.`,
    faq: [
      { q: "أين تقع مدرسة القديس يوسف في العبور؟", a: "العنوان المنشور: الحي الثاني، مدينة العبور، القليوبية. يُفضل التأكد بالهاتف قبل الزيارة." },
      { q: "ما مراحل مدرسة القديس يوسف العبور؟", a: "البيانات المنشورة تشير إلى وجود رياض أطفال وتعليم أساسي. تحقق مباشرة من المراحل المتاحة حاليًا." },
      { q: "كيف أتواصل مع المدرسة؟", a: "الهاتف المنشور: 02-4478-0116. المصدر: Kids Directory." },
    ],
  },
  {
    slug: "tabarak-childrens-hospital-obour",
    dir: "hospitals",
    category: { name: "المستشفيات", url: SITE + "/hospitals/" },
    title: "مستشفى تبارك للأطفال العبور | عنوان وهاتف ومصدر",
    h1: "مستشفى تبارك للأطفال — العبور",
    description: "بيانات منشورة عن مستشفى تبارك للأطفال في العبور: العنوان، الهاتف، والمصدر. تحقق من التخصصات والمواعيد قبل الزيارة.",
    entity: {
      name: "مستشفى تبارك للأطفال — العبور",
      address: "محلية 5، محور السادات، الحي الأول، مدينة العبور (داخل سنتر الحجاز، الدور 3)",
      phone: "غير منشور",
      source: "يلو بيدجز مصر",
      sourceUrl: "https://yellowpages.com.eg/en/profile/tabarak-children's-hospital/273700",
    },
    intro: `مستشفى تبارك للأطفال هي واحدة من المرافق الصحية المتخصصة في طب الأطفال داخل مدينة العبور. العنوان المنشور يشير إلى موقعها في الحي الأول بالقرب من محور السادات.

لا يقدم الدليل توصية طبية أو تقييمًا للجودة. قبل الزيارة، اتصل للتأكد من العنوان والتخصصات المتاحة ومواعيد العيادات والطوارئ.`,
    faq: [
      { q: "أين تقع مستشفى تبارك للأطفال في العبور؟", a: "العنوان المنشور: محلية 5، محور السادات، الحي الأول، داخل سنتر الحجاز، الدور 3." },
      { q: "هل المستشفى متخصصة في الأطفال فقط؟", a: "الاسم التجاري يشير إلى تخصص في طب الأطفال. تحقق مباشرة من التخصصات والعيادات المتاحة." },
      { q: "هل يوجد رقم هاتف منشور؟", a: "لم يُنشر رقم موثوق في المصادر المتاحة. يُفضل البحث عن رقم محدّث قبل الزيارة." },
    ],
  },
  {
    slug: "el-obour-hospital",
    dir: "hospitals",
    category: { name: "المستشفيات", url: SITE + "/hospitals/" },
    title: "مستشفى العبور التخصصي — جامعة عين شمس | عنوان وهاتف",
    h1: "مستشفى العبور التخصصي — جامعة عين شمس",
    description: "بيانات منشورة عن مستشفى العبور التخصصي التابع لجامعة عين شمس: العنوان، الهواتف، والمصدر الرسمي.",
    entity: {
      name: "مستشفى العبور التخصصي — جامعة عين شمس",
      address: "الحي الثاني، محلية 1، مدينة العبور، القليوبية",
      phone: "02-4479-9012 / 02-4479-9013 / 02-4479-9014 / 02-4479-9015 / 02-4479-9016",
      source: "140 اونلاين + جامعة عين شمس",
      sourceUrl: "https://www.140online.com/company.aspx?Lang=En&CompanyId=U2708200949356&Name=Ain%20Shams%20University%20Specialised%20Hospital%20El%20Obour",
    },
    intro: `مستشفى العبور التخصصي (Ain Shams University Specialized Hospital in El-Obour) هو مستشفى تابع لجامعة عين شمس يقدم خدمات صحية متخصصة لسكان العبور والمناطق المحيطة. الموقع في الحي الثاني يجعله قريبًا من النطاقات السكنية المركزية في المدينة.

البيانات المنشورة تشمل عدة هواتف للاستعلام. قبل الزيارة، اتصل للتأكد من مواعيد العيادات الخارجية، وقسم الطوارئ، والتخصصات المتاحة.`,
    faq: [
      { q: "أين يقع مستشفى العبور التخصصي؟", a: "العنوان المنشور: الحي الثاني، محلية 1، مدينة العبور، القليوبية." },
      { q: "ما هواتف المستشفى؟", a: "الأرقام المنشورة: 02-4479-9012 حتى 02-4479-9016. المصدر: 140 اونلاين." },
      { q: "هل المستشفى يعمل على مدار 24 ساعة؟", a: "تحقق مباشرة من مواعيد الطوارئ والعيادات الخارجية عبر الهاتف." },
    ],
  },
];

function buildTable(entity) {
  const rows = [
    ["الاسم", entity.name],
    ["العنوان", entity.address],
    ["الهاتف", entity.phone],
    ["المصدر", `<a href="${entity.sourceUrl}" target="_blank" rel="nofollow noopener noreferrer">${entity.sourceUrl}</a>`],
  ];
  return `<div class="table-wrap"><table><tbody>${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table></div>`;
}

function buildPage(chrome, e) {
  const url = `${SITE}/${e.dir}/${e.slug}/`;
  const schemas = [
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: e.h1,
      url,
      description: e.description,
      inLanguage: "ar-EG",
      datePublished: "2026-08",
      dateModified: "2026-08",
      publisher: { "@id": SITE + "/#org" },
    },
    breadcrumb(e.category.name, e.category.url, e.h1, url),
    faqBlock(e.faq),
  ];
  const head = buildHead(chrome.head, { title: e.title, description: e.description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/${e.dir}/">${e.category.name}</a><span>/</span><span>${e.h1}</span></div></nav>`;
  const faqHtml = `<div class="faq-block">${e.faq.map(q => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join('')}</div>`;
  const main = `<main id="content"><section class="wrap"><h1>${e.h1}</h1><div class="lead"><p>${e.intro.replace(/\n\n/g, '</p><p>')}</p></div><h2>البيانات المنشورة</h2>${buildTable(e.entity)}<p><small>المصدر: ${e.entity.source} — ${e.entity.sourceUrl}</small></p><h2>أسئلة شائعة</h2>${faqHtml}<div class="action-card"><p>هل لديك تصحيح موثّق؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

function addIndexLink(dir, slug, name) {
  const indexPath = path.join(clientDir, dir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const marker = `href="/${dir}/${slug}/"`;
  if (html.includes(marker)) {
    rep("SKIP", `/${dir}/ already links to ${slug}`);
    return;
  }
  // Find the first dir-item and insert a new one before it
  html = html.replace(
    /(<article class="dir-item" id="business-1">)/,
    `<article class="dir-item" id="entity-${slug}"><h4><a href="/${dir}/${slug}/">${name}</a></h4></article>\n$1`
  );
  fs.writeFileSync(indexPath, html, "utf8");
  rep("OK", `/${dir}/ linked to ${slug}`);
}

function main() {
  const chrome = loadChrome();
  for (const e of ENTITIES) {
    const outDir = path.join(clientDir, e.dir, e.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), buildPage(chrome, e), "utf8");
    rep("OK", `/${e.dir}/${e.slug}/ created`);
    addIndexLink(e.dir, e.slug, e.entity.name);
  }
  console.log("Phase 8.2 entity pages done");
  console.log(report.join("\n"));
}

main();
