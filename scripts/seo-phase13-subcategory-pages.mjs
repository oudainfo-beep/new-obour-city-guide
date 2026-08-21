/**
 * seo-phase13-subcategory-pages.mjs
 * إنشاء ~50 صفحة تصنيفية غنية من بيانات الدليل.
 *
 * القواعد:
 *  - idempotent: لا يكرّر الروابط ولا يكتب فوق صفحة موجودة.
 *  - لا حقائق مخترعة: المحتوى مبني على data/directories/*.json فقط.
 *  - يعيد بناء sitemap في النهاية.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data", "directories");
const SITE = "https://obourguide.com";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);
const FORCE = process.argv.includes("--force");

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

function readData(name) {
  const p = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function table(items) {
  const rows = items.slice(0, 30).map((it, i) => {
    const phone = it.t || it.p || "غير منشور";
    const address = it.a || "غير منشور";
    return `<tr><td>${i + 1}</td><td><strong>${it.n}</strong>${it.e ? `<br><small>${it.e}</small>` : ""}</td><td>${address}</td><td dir="ltr">${phone}</td></tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th>#</th><th>الاسم</th><th>العنوان</th><th>الهاتف</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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

function breadcrumb(name, url, parentName, parentUrl) {
  const list = [
    { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name: "دليل الخدمات", item: SITE + "/directory/" },
  ];
  if (parentName) list.push({ "@type": "ListItem", position: 3, name: parentName, item: SITE + parentUrl });
  list.push({ "@type": "ListItem", position: parentName ? 4 : 3, name, item: url });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: list };
}

function makeSlug(input) {
  const map = {
    "شاي وقهوة": "tea-coffee",
    "محلات عصير": "juice-shops",
    "محامص": "roasters",
    "مطاعم": "restaurants-list",
    "عيادات بيطرية": "veterinary",
    "علاج طبيعي": "physiotherapy",
    "إطارات": "tires",
    "قطع غيار سيارات": "spare-parts",
    "مراكز خدمة سيارات": "service-centers",
    "ورش صيانة سيارات": "workshops",
    "تأجير سيارات وليموزين": "car-rental",
    "تكييف سيارات": "car-ac",
    "بنوك": "bank-branches",
    "تحويل أموال": "money-transfer",
    "كهربائيون": "electricians",
    "دراي كلين": "dry-cleaning",
    "مكافحة حشرات": "pest-control",
    "مقاولات وتشطيبات": "contractors",
    "ملابس": "clothing",
    "ملابس أطفال": "kids-clothing",
    "إلكترونيات": "electronics",
    "مطابخ": "kitchens",
    "عدد وأدوات بناء": "building-tools",
    "محلات موبايلات": "mobile-shops",
    "جيم": "gyms",
    "أندية رياضية": "sports-clubs",
    "سبا": "spas",
    "أندية": "clubs",
    "ملاهي وترفيه أطفال": "kids-entertainment",
    "مراكز تجارية": "commercial-centers",
    "أرقام طوارئ قومية": "emergency-numbers",
    "إطفاء وحريق": "fire-stations",
    "مكاتب بريد": "post-offices",
    "جهات حكومية": "government-offices",
    "حضانات": "daycare",
    "مراكز تدريب": "training-centers",
    "مراكز لغات": "language-centers",
    "محاسبون": "accountants",
    "إعلان": "advertising",
    "برمجيات وIT": "it-services",
    "تسويق رقمي": "digital-marketing",
    "طباعة وتصوير مستندات": "printing",
    "مهندسون": "engineers",
    "معماريون": "architects",
    "شركات عقارية": "real-estate-companies",
    "عقارات": "real-estate-ads",
    "كمبوندات": "compounds-marketing",
    "شحن سريع": "express-shipping",
    "نقل ولوجستيات": "transport-logistics",
    "فنادق": "hotels-list",
    "فنادق ومنتجعات": "hotels-resorts",
    "شرطة": "police",
    "مرور": "traffic",
  };
  return map[input] || input.replace(/\s+/g, "-").replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "").slice(0, 40);
}

// parent metadata
const PARENTS = {
  restaurants: { name: "المطاعم والكافيهات", url: "/restaurants/" },
  clinics: { name: "العيادات والمراكز الطبية", url: "/clinics/" },
  automotive: { name: "خدمات السيارات", url: "/automotive/" },
  banks: { name: "البنوك والصرافات", url: "/banks/" },
  "home-services": { name: "الخدمات المنزلية", url: "/home-services/" },
  shopping: { name: "التسوق والمحلات", url: "/shopping/" },
  fitness: { name: "اللياقة والتجميل", url: "/fitness/" },
  entertainment: { name: "الترفيه والأنشطة", url: "/entertainment/" },
  "government-services": { name: "الخدمات الحكومية والعامة", url: "/government-services/" },
  nurseries: { name: "الحضانات والمراكز التعليمية", url: "/nurseries/" },
  "professional-services": { name: "الخدمات المهنية", url: "/professional-services/" },
  "real-estate-offices": { name: "المكاتب والشركات العقارية", url: "/real-estate-offices/" },
  logistics: { name: "النقل والشحن", url: "/logistics/" },
  hotels: { name: "الفنادق والإقامة", url: "/hotels/" },
};

// page configs: data file, subcategory, optional custom slug/title
const PAGES = [
  // مطاعم
  { data: "restaurants", sub: "شاي وقهوة" },
  { data: "restaurants", sub: "محلات عصير" },
  { data: "restaurants", sub: "محامص" },
  { data: "restaurants", sub: "مطاعم", slug: "restaurants/restaurants-list", title: "مطاعم العبور والعبور الجديدة" },
  // عيادات
  { data: "clinics", sub: "عيادات بيطرية", title: "عيادات بيطرية في العبور والعبور الجديدة" },
  { data: "clinics", sub: "علاج طبيعي", title: "مراكز علاج طبيعي في العبور والعبور الجديدة" },
  // سيارات
  { data: "automotive", sub: "إطارات" },
  { data: "automotive", sub: "قطع غيار سيارات" },
  { data: "automotive", sub: "مراكز خدمة سيارات" },
  { data: "automotive", sub: "ورش صيانة سيارات" },
  { data: "automotive", sub: "تأجير سيارات وليموزين", title: "تأجير سيارات وليموزين في العبور والعبور الجديدة" },
  { data: "automotive", sub: "تكييف سيارات", title: "تكييف سيارات في العبور والعبور الجديدة" },
  // بنوك
  { data: "banks", sub: "بنوك", title: "فروع البنوك في العبور والعبور الجديدة" },
  { data: "banks", sub: "تحويل أموال", title: "شركات تحويل أموال في العبور والعبور الجديدة" },
  // خدمات منزلية
  { data: "home-services", sub: "كهربائيون" },
  { data: "home-services", sub: "دراي كلين" },
  { data: "home-services", sub: "مكافحة حشرات" },
  { data: "home-services", sub: "مقاولات وتشطيبات", title: "مقاولات وتشطيبات في العبور والعبور الجديدة" },
  // تسوق
  { data: "shopping", sub: "ملابس", title: "محلات ملابس في العبور والعبور الجديدة" },
  { data: "shopping", sub: "ملابس أطفال", title: "ملابس أطفال في العبور والعبور الجديدة" },
  { data: "shopping", sub: "إلكترونيات", title: "محلات إلكترونيات في العبور والعبور الجديدة" },
  { data: "shopping", sub: "مطابخ", title: "محلات مطابخ في العبور والعبور الجديدة" },
  { data: "shopping", sub: "عدد وأدوات بناء", title: "عدد وأدوات بناء في العبور والعبور الجديدة" },
  { data: "shopping", sub: "محلات موبايلات", title: "محلات موبايلات في العبور والعبور الجديدة" },
  // لياقة
  { data: "fitness", sub: "جيم", title: "جيم ونوادي رياضية في العبور والعبور الجديدة" },
  { data: "fitness", sub: "أندية رياضية", title: "أندية رياضية في العبور والعبور الجديدة" },
  { data: "fitness", sub: "سبا", title: "سبا ومراكز استرخاء في العبور والعبور الجديدة" },
  // ترفيه
  { data: "entertainment", sub: "أندية", title: "أندية في العبور والعبور الجديدة" },
  { data: "entertainment", sub: "ملاهي وترفيه أطفال", title: "ملاهي وترفيه أطفال في العبور والعبور الجديدة" },
  { data: "entertainment", sub: "مراكز تجارية", title: "مراكز تجارية في العبور والعبور الجديدة" },
  // حكومي
  { data: "government-services", sub: "أرقام طوارئ قومية", title: "أرقام الطوارئ القومية في العبور والعبور الجديدة" },
  { data: "government-services", sub: "إطفاء وحريق", title: "إطفاء ومطافئ العبور والعبور الجديدة" },
  { data: "government-services", sub: "مكاتب بريد", title: "مكاتب بريد العبور والعبور الجديدة" },
  { data: "government-services", sub: "جهات حكومية", title: "جهات حكومية في العبور والعبور الجديدة" },
  // حضانات
  { data: "nurseries", sub: "حضانات", title: "حضانات العبور والعبور الجديدة" },
  { data: "nurseries", sub: "مراكز تدريب", title: "مراكز تدريب في العبور والعبور الجديدة" },
  { data: "nurseries", sub: "مراكز لغات", title: "مراكز لغات في العبور والعبور الجديدة" },
  // خدمات مهنية
  { data: "professional-services", sub: "محاسبون", title: "محاسبون في العبور والعبور الجديدة" },
  { data: "professional-services", sub: "إعلان", title: "شركات إعلان في العبور والعبور الجديدة" },
  { data: "professional-services", sub: "برمجيات وIT", title: "شركات برمجيات وIT في العبور والعبور الجديدة" },
  { data: "professional-services", sub: "تسويق رقمي", title: "تسويق رقمي في العبور والعبور الجديدة" },
  { data: "professional-services", sub: "طباعة وتصوير مستندات", title: "طباعة وتصوير مستندات في العبور والعبور الجديدة" },
  { data: "professional-services", sub: "مهندسون", title: "مهندسون في العبور والعبور الجديدة" },
  { data: "professional-services", sub: "معماريون", title: "معماريون في العبور والعبور الجديدة" },
  // عقارات
  { data: "real-estate-offices", sub: "شركات عقارية", title: "شركات عقارية في العبور والعبور الجديدة" },
  { data: "real-estate-offices", sub: "عقارات", title: "مكاتب وإعلانات عقارية في العبور والعبور الجديدة" },
  { data: "real-estate-offices", sub: "كمبوندات", title: "تسويق كمبوندات في العبور والعبور الجديدة" },
  // شحن
  { data: "logistics", sub: "شحن سريع", title: "شركات شحن سريع في العبور والعبور الجديدة" },
  { data: "logistics", sub: "نقل ولوجستيات", title: "نقل ولوجستيات في العبور والعبور الجديدة" },
  // فنادق
  { data: "hotels", sub: "فنادق", title: "فنادق العبور والعبور الجديدة" },
];

function pageIntro({ h1, sub, parent, count }) {
  return `صفحة ${h1} تجمّع البيانات المنشورة في دليل العبور تحت تصنيف «${sub}» ضمن قسم ${parent.name}. الهدف ليس التوصية بمكان دون غيره، بل تقديم قائمة قابلة للفرز بالاسم والعنوان والهاتف — مع الإشارة إلى أن بعض الأماكن لا يُنشر عنها سوى الاسم، فتُترك بياناتها «غير منشور».

إجمالي المدخلات المنشورة في هذا التصنيف: <strong>${count}</strong>. الجدول أدناه يعرض أول 30 مدخلًا. إذا كنت تبحث عن تصنيفات مجاورة، راجع <a href="${parent.url}">${parent.name}</a> أو <a href="/directory/">دليل الخدمات</a>.`;
}

function pageFaq({ sub, count, parentName }) {
  return [
    { q: `كم عدد ${sub} المدرجة في دليل العبور؟`, a: `الصفحة تضم ${count} مدخلًا منشورًا تحت تصنيف ${sub}، مع العلم أن البيانات تُحدّث عند توفر مصادر موثقة.` },
    { q: `هل تغطي الصفحة العبور القديمة والعبور الجديدة؟`, a: "نعم؛ البيانات تأتي من دليل العبور الذي يشمل العبور والعبور الجديدة والمناطق المحيطة بها، حسب ما نُشر من عناوين." },
    { q: "كيف أُبلّغ عن خطأ في عنوان أو هاتف؟", a: "استخدم <a href='/corrections/'>صفحة التصحيح</a> مع ذكر رابط الصفحة والمعلومة الصحيحة لمراجعتها." },
  ];
}

function buildPage(chrome, cfg, items) {
  const parent = PARENTS[cfg.data];
  const sub = cfg.sub;
  const slug = cfg.slug || `${cfg.data}/${makeSlug(sub)}`;
  const url = `${SITE}/${slug}/`;
  const h1 = cfg.title || `${sub} في العبور والعبور الجديدة`;
  const title = `${h1}: عناوين وهواتف`;
  const description = `دليل ${sub} في العبور والعبور الجديدة: ${items.length} مدخل منشور بالعناوين والهواتف. بيانات قابلة للتحقق من مصادر الدليل.`;
  const intro = pageIntro({ h1, sub, parent, count: items.length });
  const faq = pageFaq({ sub, count: items.length, parentName: parent.name });

  const schemas = [
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1,
      url,
      description,
      inLanguage: "ar-EG",
      datePublished: "2026-08",
      dateModified: "2026-08",
      publisher: { "@id": SITE + "/#org" },
      about: sub,
    },
    breadcrumb(h1, url, parent.name, parent.url),
    faqSchema(faq),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/directory/">دليل الخدمات</a><span>/</span><a href="${parent.url}">${parent.name}</a><span>/</span><span>${h1}</span></div></nav>`;
  const main = `<main id="content"><section class="wrap"><h1>${h1}</h1><div class="lead"><p>${intro.replace(/\n\n/g, "</p><p>")}</p></div><h2>فهرس ${sub}</h2>${table(items)}<h2>أسئلة شائعة</h2><div class="faq-block">${faq.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("")}</div><div class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

function addDirectoryLinks(created) {
  const dirPath = path.join(clientDir, "directory", "index.html");
  let html = fs.readFileSync(dirPath, "utf8");
  const marker = "<!-- phase13-subcategory-links -->";
  if (html.includes(marker)) {
    rep("SKIP", "/directory/ subcategory links already injected");
    return;
  }
  const groups = {};
  for (const p of created) {
    if (!groups[p.data]) groups[p.data] = [];
    groups[p.data].push(p);
  }
  const links = Object.entries(groups).map(([data, pages]) => {
    const parent = PARENTS[data];
    const items = pages.map((p) => `<li><a href="/${p.slug}/">${p.h1.replace(" في العبور والعبور الجديدة", "")}</a> <small>(${p.count} مدخل)</small></li>`).join("");
    return `<div class="dir-subgroup"><h3><a href="${parent.url}">${parent.name}</a></h3><ul>${items}</ul></div>`;
  }).join("");
  const section = `<section class="wrap section" id="subcategory-index">${marker}<h2>تصنيفات فرعية إضافية</h2><p>صفحات تفصيلية داخل كل قسم، مبنية على بيانات الدليل.</p><div class="dir-subgroups">${links}</div></section>`;
  html = html.replace("</main>", `${section}</main>`);
  fs.writeFileSync(dirPath, html, "utf8");
  rep("OK", `injected subcategory links into /directory/ (${created.length} pages)`);
}

function rebuildSitemap() {
  const AR_MONTHS = {
    يناير: "01", فبراير: "02", مارس: "03", أبريل: "04", مايو: "05", يونيو: "06",
    يوليو: "07", أغسطس: "08", سبتمبر: "09", أكتوبر: "10", نوفمبر: "11", ديسمبر: "12",
  };
  const DEFAULT_LASTMOD = "2026-08";
  const EXCLUDE = new Set(["public/sitemap.xml", "public/404.html", "404"]);

  function listPageFiles() {
    const files = [];
    function walk(dir) {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        const rel = path.relative(clientDir, full).replace(/\\/g, "/");
        if (EXCLUDE.has(rel)) continue;
        if (ent.isDirectory()) walk(full);
        else if (ent.name === "index.html") files.push(full);
      }
    }
    walk(clientDir);
    return files;
  }
  function slugOf(f) {
    const rel = path.relative(clientDir, f).replace(/\\/g, "/").replace(/\/index\.html$/, "");
    return rel === "" ? "/" : "/" + rel + "/";
  }
  function pageLastmod(html) {
    const m = html.match(/آخر تحديث: ([\u0600-\u06FF]+) (\d{4})/);
    if (!m) return DEFAULT_LASTMOD;
    const mm = AR_MONTHS[m[1]];
    return mm ? `${m[2]}-${mm}` : DEFAULT_LASTMOD;
  }
  const entries = [];
  for (const f of listPageFiles()) {
    const slug = slugOf(f);
    if (EXCLUDE.has(slug.slice(1, -1))) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(clientDir, "public", "sitemap.xml"), xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة`);
}

function main() {
  const chrome = loadChrome();
  let created = [];
  for (const cfg of PAGES) {
    const data = readData(cfg.data);
    if (!data || !data.items) {
      rep("SKIP", `${cfg.data} data missing`);
      continue;
    }
    const items = data.items.filter((it) => it.c === cfg.sub);
    if (items.length === 0) {
      rep("SKIP", `${cfg.sub}: no items`);
      continue;
    }
    const slug = cfg.slug || `${cfg.data}/${makeSlug(cfg.sub)}`;
    const outDir = path.join(clientDir, slug);
    const outFile = path.join(outDir, "index.html");
    if (fs.existsSync(outFile) && !FORCE) {
      rep("SKIP", `/${slug}/ already exists`);
      continue;
    }
    fs.mkdirSync(outDir, { recursive: true });
    const html = buildPage(chrome, cfg, items);
    fs.writeFileSync(outFile, html, "utf8");
    const h1 = cfg.title || `${cfg.sub} في العبور والعبور الجديدة`;
    created.push({ data: cfg.data, slug, h1, count: items.length });
    rep("page", `/${slug}/ created (${items.length} items)`);
  }

  if (created.length) {
    addDirectoryLinks(created);
    rebuildSitemap();
  }

  console.log(`=== Phase 13 subcategory pages done: ${created.length} new pages ===`);
  console.log(report.join("\n"));
}

main();
