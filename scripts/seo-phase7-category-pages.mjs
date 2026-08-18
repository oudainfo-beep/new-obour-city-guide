/**
 * seo-phase7-category-pages.mjs
 * المرحلة 7 (أيام 8–15): صفحات تصنيفية محلية إضافية.
 *
 * ينشئ/يحدّث:
 *   /cafes/ — صفحة مستقلة لكافيهات ومقاهي العبور.
 *
 * ويضيف رابط /cafes/ في صفحة /directory/ بشكل idempotent.
 *
 * القواعد:
 *  - idempotent: الصفحة تُعاد كتابتها كل build، والرابط في /directory/ لا يُكرَّر.
 *  - لا حقائق مخترعة: الكيانات من data/directories/restaurants.json فقط.
 *  - نمط loadChrome من seo-phase2-developers.mjs.
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
    return `<tr><td>${i + 1}</td><td><strong>${it.n}</strong>${it.e ? `<br><small>${it.e}</small>` : ""}</td><td>${it.c}</td><td>${address}</td><td dir="ltr">${phone}</td></tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th>#</th><th>الاسم</th><th>التصنيف</th><th>العنوان</th><th>الهاتف</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
      { "@type": "ListItem", position: 2, name: "دليل الخدمات", item: SITE + "/directory/" },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };
}

const CAFE_CATEGORIES = ["شاي وقهوة", "كافيهات وكوفي شوب", "محلات عصير"];

const FAQ = [
  { q: "أي أحياء العبور فيها كافيهات أكثر؟", a: "الحي الأول والحي السابع يجمعان أكبر عدد من المقاهي والكافيهات المنشورة في الدليل." },
  { q: "هل يوجد كافيهات مناسبة للعمل في العبور؟", a: "بعض الكافيهات توفّر إنترنت ومساحات هادئة، لكن يُفضل الاستفسار مباشرة عن توفر الطاولات وسرعة الاتصال." },
  { q: "كيف أبلّغ عن عنوان أو هاتف خاطئ؟", a: "استخدم <a href='/corrections/'>صفحة التصحيح</a> مع ذكر رابط الصفحة والمعلومة الصحيحة لمراجعتها." },
];

function buildCafePage(chrome, items) {
  const url = `${SITE}/cafes/`;
  const title = "كافيهات العبور والعبور الجديدة: دليل العناوين والهواتف";
  const h1 = "كافيهات العبور والعبور الجديدة";
  const description = "دليل عملي بكافيهات ومحامص ومقاهي العبور والعبور الجديدة: عناوين، هواتف، ونصائح للاختيار حسب الحي.";
  const intro = `مقاهي العبور والعبور الجديدة تتنوع بين محامص تقليدية وكوفي شوب حديثة، لكن توزيعها غير متساوٍ بين الأحياء. الحي الأول يتركز فيه الجزء الأكبر من المقاهي القديمة، بينما تنتشر الكافيهات الأحدث بالقرب من المناطق السكنية الجديدة والكمبوندات.

هذه الصفحة تقتصر على البيانات المنشورة في دليل العبور. العنوان والهاتف مدرجان إن وُجدا؛ ما لم يُنشر يُترك «غير منشور». للمطاعم والوجبات السريعة راجع <a href='/restaurants/'>دليل المطاعم</a>، وللدليل العام راجع <a href='/dining-guide/'>دليل الأكل في العبور</a>.

ننصح بالاتصال قبل الزيارة، خاصة في الصباح الباكر أو أيام العطلات، لأن مواعيد عمل بعض المقاهي تتغير دون تحديث القوائم الإلكترونية.`;

  const schemas = [
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: h1,
      url,
      description,
      inLanguage: "ar-EG",
      datePublished: "2026-08",
      dateModified: "2026-08",
      publisher: { "@id": SITE + "/#org" },
    },
    breadcrumb(h1, url),
    faqBlock(FAQ),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumbHtml = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><a href="/">الرئيسية</a><span>/</span><a href="/directory/">دليل الخدمات</a><span>/</span><span>${h1}</span></div></nav>`;
  const main = `<main id="content"><section class="wrap"><h1>${h1}</h1><div class="lead"><p>${intro.replace(/\n\n/g, '</p><p>')}</p></div><h2>فهرس الكافيهات والمقاهي</h2><p>إجمالي المنشورات في هذا التصنيف: <strong>${items.length}</strong> مدخل. الجدول يعرض أول 30.</p>${table(items)}<h2>أسئلة شائعة</h2><div class="faq-block">${FAQ.map(q => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join('')}</div><div class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtml}${main}${chrome.footer}</body></html>`;
}

function addDirectoryLink() {
  const dirPath = path.join(clientDir, "directory", "index.html");
  let html = fs.readFileSync(dirPath, "utf8");
  const marker = 'href="/cafes/"';
  if (html.includes(marker)) {
    rep("SKIP", "/directory/ already links to /cafes/");
    return;
  }
  // Add a new card right after the restaurants card
  const cafeCard = `<a class="dir-hub-card" href="/cafes/"><small>05-b</small><b>الكافيهات والمقاهي</b><span>كافيهات ومحامص ومقاهي تقليدية في العبور والعبور الجديدة.</span><i>36 مدخلًا ↖</i></a>`;
  html = html.replace(
    /<a class="dir-hub-card" href="\/restaurants\/">/,
    `${cafeCard}\n<a class="dir-hub-card" href="/restaurants/">`
  );
  fs.writeFileSync(dirPath, html, "utf8");
  rep("OK", "added /cafes/ link to /directory/");
}

function main() {
  const chrome = loadChrome();
  const data = readData("restaurants");
  if (!data || !data.items) {
    rep("FAIL", "restaurants data not found");
    console.log(report.join("\n"));
    process.exit(1);
  }
  const cafes = data.items.filter((it) => CAFE_CATEGORIES.includes(it.c));
  const outDir = path.join(clientDir, "cafes");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), buildCafePage(chrome, cafes), "utf8");
  rep("OK", `cafes: ${cafes.length} items`);

  addDirectoryLink();

  console.log("Phase 7 category pages done");
  console.log(report.join("\n"));
}

main();
