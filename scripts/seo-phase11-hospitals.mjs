/**
 * seo-phase11-hospitals.mjs
 * المرحلة 11: صفحات كيانات المستشفيات المفقودة.
 *
 * تنشئ صفحات فردية للمستشفيات المنشورة في بيانات الدليل وغير الموجودة بعد:
 *   /hospitals/iwan-psychiatric-hospital/
 *   /hospitals/al-obour-general-hospital/
 *   /hospitals/legislation-association-hospital/
 *   /hospitals/ain-shams-specialized-hospital/
 *   /hospitals/farid-habib-hospital/
 *   /hospitals/misr-el-amal-hospital/
 *
 * المبادئ:
 *   - idempotent: تُعاد كتابة الصفحات بالكامل كل run.
 *   - كل البيانات من بيانات الدليل المنشورة؛ ما لا يوجد يُترك «غير منشور».
 *   - لا تقييمات وهمية ولا AggregateRating.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(clientDir, "public", "data");
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

function breadcrumb(name, url) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "المستشفيات", item: SITE + "/hospitals/" },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };
}

function medicalSchema(entity, url) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: entity.name,
    url,
    address: {
      "@type": "PostalAddress",
      addressLocality: "مدينة العبور",
      addressRegion: "القليوبية",
      addressCountry: "EG",
      streetAddress: entity.address,
    },
    telephone: entity.phone && entity.phone !== "غير منشور" ? entity.phone : undefined,
  };
}

function buildTable(entity) {
  const rows = [
    ["الاسم", entity.name],
    ["العنوان", entity.address],
    ["الهاتف", entity.phone || "غير منشور"],
    ["المصدر", entity.source],
  ];
  return `<div class="table-wrap"><table><tbody>${rows
    .map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`)
    .join("")}</tbody></table></div>`;
}

function buildPage(chrome, e) {
  const url = `${SITE}/hospitals/${e.slug}/`;
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
    breadcrumb(e.h1, url),
    medicalSchema(e.entity, url),
    faqBlock(e.faq),
  ];
  const head = buildHead(chrome.head, { title: e.title, description: e.description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/hospitals/">المستشفيات</a><span>/</span><span>${e.h1}</span></div></nav>`;
  const faqHtml = `<div class="faq-block">${e.faq.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("")}</div>`;
  const main = `<main id="content"><section class="wrap"><h1>${e.h1}</h1><div class="lead"><p>${e.intro
    .replace(/\n\n/g, "</p><p>")}</p></div><h2>البيانات المنشورة</h2>${buildTable(e.entity)}<p class="caption">المصدر: ${e.entity.source}. تحقق من البيانات قبل الزيارة.</p><h2>أسئلة شائعة</h2>${faqHtml}<div class="action-card"><p>هل لديك تصحيح موثّق؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

function addIndexLink(slug, name) {
  const indexPath = path.join(clientDir, "hospitals", "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const marker = `href="/hospitals/${slug}/"`;
  if (html.includes(marker)) {
    rep("index", `/${slug}/ already linked from /hospitals/`);
    return;
  }
  html = html.replace(
    /(<article class="dir-item" id="business-1">)/,
    `<article class="dir-item" id="entity-${slug}"><h4><a href="/hospitals/${slug}/">${name}</a></h4></article>\n$1`
  );
  fs.writeFileSync(indexPath, html, "utf8");
  rep("index", `/${slug}/ linked from /hospitals/`);
}

// -----------------------------------------------------------------------------
// بيانات المستشفيات المنشورة في بيانات الدليل
// -----------------------------------------------------------------------------
const HOSPITALS = [
  {
    slug: "iwan-psychiatric-hospital",
    title: "مستشفى إيوان للطب النفسي العبور | عنوان وهاتف",
    h1: "مستشفى إيوان للطب النفسي — العبور",
    description: "بيانات منشورة عن مستشفى إيوان للطب النفسي في العبور: العنوان، الهاتف، والمصدر. تحقق من التخصصات قبل الزيارة.",
    entity: {
      name: "مستشفى إيوان للطب النفسي",
      address: "الحي السابع، مدينة العبور، القليوبية",
      phone: "01115550888",
      source: "يلو بيدجز مصر (Yellow.com.eg)",
    },
    intro: `مستشفى إيوان للطب النفسي هي منشأة صحية متخصصة في العبور تقدم خدمات الطب النفسي وعلاج الإدمان. العنوان المنشور يشير إلى موقعها في الحي السابع، مما يجعلها قريبة من النطاقات السكنية المركزية في المدينة.

لا يقدم الدليل توصية طبية أو تقييمًا للجودة. قبل الزيارة، اتصل للتأكد من العنوان والتخصصات المتاحة ومواعيد العيادات والطوارئ.`,
    faq: [
      { q: "أين تقع مستشفى إيوان للطب النفسي؟", a: "العنوان المنشور: الحي السابع، مدينة العبور، القليوبية. يُفضل التأكد بالهاتف قبل الزيارة." },
      { q: "ما هو تخصص المستشفى؟", a: "الاسم التجاري يشير إلى تخصص في الطب النفسي وعلاج الإدمان. تحقق مباشرة من الخدمات المتاحة." },
      { q: "كيف أتواصل مع المستشفى؟", a: "الهاتف المنشور: 01115550888. المصدر: يلو بيدجز مصر." },
    ],
  },
  {
    slug: "al-obour-general-hospital",
    title: "مستشفى العبور العام الجديد | عنوان ومصدر",
    h1: "مستشفى العبور العام (الجديد)",
    description: "بيانات منشورة عن مستشفى العبور العام الجديد في العبور: الموقع والمصدر. لا يوجد رقم هاتف موثوق منشور.",
    entity: {
      name: "مستشفى العبور العام (الجديد)",
      address: "شارع خط 10، بين الحي الثالث والثامن، مدينة العبور، القليوبية",
      phone: "غير منشور",
      source: "بوابة وزارة الإسكان / Sholex",
    },
    intro: `مستشفى العبور العام (الجديد) هو مستشفى حكومي يخدم سكان مدينة العبور والمناطق المحيطة. الموقع المنشور يقع على شارع خط 10 بين الحي الثالث والثامن، وهو موقع مركزي يسهل الوصول من عدة أحياء.

لم يُنشر رقم هاتف موثوق للمستشفى في المصادر المتاحة. يُفضل التحقق من الرقم عبر جهاز مدينة العبور أو وزارة الصحة قبل الزيارة.`,
    faq: [
      { q: "أين يقع مستشفى العبور العام الجديد؟", a: "العنوان المنشور: شارع خط 10، بين الحي الثالث والثامن، مدينة العبور، القليوبية." },
      { q: "هل يوجد رقم هاتف منشور للمستشفى؟", a: "لا. الرقم غير منشور في المصادر المتاحة. تحقق من جهاز المدينة أو وزارة الصحة." },
      { q: "ما نوع الخدمات التي تقدمها المستشفى؟", a: "كمستشفى عام، من المتوقع أن تقدم خدمات طبية عامة وطوارئ. تحقق مباشرة من التخصصات المتاحة." },
    ],
  },
  {
    slug: "legislation-association-hospital",
    title: "مستشفى جمعية الشريعة للحروق والأورام العبور | عنوان وهاتف",
    h1: "مستشفى جمعية الشريعة للحروق والأورام — العبور",
    description: "بيانات منشورة عن مستشفى جمعية الشريعة للحروق والأورام في العبور: العنوان، الهاتف، والمصدر.",
    entity: {
      name: "مستشفى جمعية الشريعة للحروق والأورام",
      address: "خط 5 يسار متفرع من الطريق الصحراوي مصر-الإسماعيلية، جمعية أحمد عرابي، مدينة العبور، القليوبية",
      phone: "01125660666",
      source: "يلو بيدجز مصر (Yellow.com.eg)",
    },
    intro: `مستشفى جمعية الشريعة للحروق والأورام هي منشأة صحية متخصصة في العبور تركز على علاج الحروق والأورام. الموقع المنشور يقع على خط 5 يسار المتفرع من الطريق الصحراوي مصر-الإسماعيلية ضمن جمعية أحمد عرابي.

لا يقدم الدليل توصية طبية أو تقييمًا للجودة. قبل الزيارة، اتصل للتأكد من العنوان والتخصصات المتاحة ومواعيد العيادات والطوارئ.`,
    faq: [
      { q: "أين تقع مستشفى جمعية الشريعة للحروق والأورام؟", a: "العنوان المنشور: خط 5 يسار متفرع من الطريق الصحراوي مصر-الإسماعيلية، جمعية أحمد عرابي، مدينة العبور." },
      { q: "ما هو تخصص المستشفى؟", a: "الاسم التجاري يشير إلى تخصص في علاج الحروق والأورام. تحقق مباشرة من الخدمات المتاحة." },
      { q: "كيف أتواصل مع المستشفى؟", a: "الهاتف المنشور: 01125660666. المصدر: يلو بيدجز مصر." },
    ],
  },
  {
    slug: "ain-shams-specialized-hospital",
    title: "مستشفى عين شمس التخصصي العبور | عنوان وهاتف",
    h1: "مستشفى عين شمس التخصصي — العبور",
    description: "بيانات منشورة عن مستشفى عين شمس التخصصي في العبور: العنوان، الهاتف، والمصدر. تحقق من التخصصات قبل الزيارة.",
    entity: {
      name: "مستشفى عين شمس التخصصي",
      address: "محلية 1، الحي الثاني، مدينة العبور، القليوبية",
      phone: "0244799014",
      source: "يلو بيدجز مصر (Yellow.com.eg)",
    },
    intro: `مستشفى عين شمس التخصصي هو مستشفى تابع لجامعة عين شمس يقدم خدمات صحية متخصصة في العبور. الموقع في الحي الثاني يجعله قريبًا من النطاقات السكنية المركزية في المدينة.

البيانات المنشورة تشمل هاتفًا للاستعلام. قبل الزيارة، اتصل للتأكد من مواعيد العيادات الخارجية، وقسم الطوارئ، والتخصصات المتاحة.`,
    faq: [
      { q: "أين يقع مستشفى عين شمس التخصصي؟", a: "العنوان المنشور: محلية 1، الحي الثاني، مدينة العبور، القليوبية." },
      { q: "ما هو هاتف المستشفى؟", a: "الرقم المنشور: 0244799014. المصدر: يلو بيدجز مصر." },
      { q: "هل المستشفى يعمل على مدار 24 ساعة؟", a: "تحقق مباشرة من مواعيد الطوارئ والعيادات الخارجية عبر الهاتف." },
    ],
  },
  {
    slug: "farid-habib-hospital",
    title: "مستشفى فريد حبيب العبور | عنوان وهاتف",
    h1: "مستشفى فريد حبيب — العبور",
    description: "بيانات منشورة عن مستشفى فريد حبيب في العبور: العنوان، الهاتف، والمصدر. تحقق من التخصصات قبل الزيارة.",
    entity: {
      name: "مستشفى فريد حبيب",
      address: "قطعة 5، بلوك 16081، الحي الخامس، مدينة العبور، القليوبية",
      phone: "0246142000",
      source: "يلو بيدجز مصر (Yellow.com.eg)",
    },
    intro: `مستشفى فريد حبيب هي منشأة صحية خاصة في العبور تقدم خدمات طبية متنوعة. الموقع في الحي الخامس يجعلها قريبة من النطاقات السكنية في تلك المنطقة.

لا يقدم الدليل توصية طبية أو تقييمًا للجودة. قبل الزيارة، اتصل للتأكد من العنوان والتخصصات المتاحة ومواعيد العيادات والطوارئ.`,
    faq: [
      { q: "أين تقع مستشفى فريد حبيب في العبور؟", a: "العنوان المنشور: قطعة 5، بلوك 16081، الحي الخامس، مدينة العبور، القليوبية." },
      { q: "ما هو هاتف المستشفى؟", a: "الرقم المنشور: 0246142000. المصدر: يلو بيدجز مصر." },
      { q: "ما التخصصات المتاحة في المستشفى؟", a: "تحقق مباشرة من التخصصات والعيادات المتاحة عبر الهاتف." },
    ],
  },
  {
    slug: "misr-el-amal-hospital",
    title: "مستشفى مصر الأمل العبور | عنوان وهاتف",
    h1: "مستشفى مصر الأمل — العبور",
    description: "بيانات منشورة عن مستشفى مصر الأمل في العبور: العنوان، الهاتف، والمصدر. تحقق من التخصصات قبل الزيارة.",
    entity: {
      name: "مستشفى مصر الأمل",
      address: "محلية 8، قطعة 78، الحي الأول، مدينة العبور، القليوبية",
      phone: "01022213599",
      source: "يلو بيدجز مصر (Yellow.com.eg)",
    },
    intro: `مستشفى مصر الأمل هي منشأة صحية في العبور تقدم خدمات طبية متنوعة. الموقع في الحي الأول يجعلها قريبة من الخدمات الرئيسية في المدينة.

لا يقدم الدليل توصية طبية أو تقييمًا للجودة. قبل الزيارة، اتصل للتأكد من العنوان والتخصصات المتاحة ومواعيد العيادات والطوارئ.`,
    faq: [
      { q: "أين تقع مستشفى مصر الأمل في العبور؟", a: "العنوان المنشور: محلية 8، قطعة 78، الحي الأول، مدينة العبور، القليوبية." },
      { q: "ما هو هاتف المستشفى؟", a: "الرقم المنشور: 01022213599. المصدر: يلو بيدجز مصر." },
      { q: "هل المستشفى تقبل تأمين صحي؟", a: "تحقق مباشرة من نظام التأمين والتخصصات المتاحة عبر الهاتف." },
    ],
  },
];

function main() {
  const chrome = loadChrome();
  for (const h of HOSPITALS) {
    const outDir = path.join(clientDir, "hospitals", h.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), buildPage(chrome, h), "utf8");
    rep("page", `/hospitals/${h.slug}/ created`);
    addIndexLink(h.slug, h.entity.name);
  }

  console.log("=== تقرير المرحلة 11: صفحات المستشفيات ===");
  for (const line of report) console.log(line);
}

main();
