/**
 * seo-phase72-district-13-14.mjs — مقال مخصص للحي 13 والحي 14 في العبور الجديدة.
 *
 * الزاوية: الحيان يقعان في نطاق «إسكان اجتماعي (منخفض التكاليف)» على المخطط
 * الاستراتيجي (المنطقة المخططة بخطوط والمكتوب عليها «منطقة ٢٦٥٠ فدان»)،
 * ويضمان مشروع «سكن لكل المصريين» — مع المقارنة بالحي 25 (الحزام الراقي).
 * كل رقم هنا مؤرخ ومنسوب لمصدره المنشور.
 *
 * تكتب الصفحة كاملة كل build (idempotent)، وتضيف رابطًا واحدًا إليها في صفحة
 * الإسكان الاجتماعي بعلامة data-link="72" حتى لا يتكرر.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const PUBLISHED = "2026-09-16";
const MODIFIED = "2026-09-16";

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
function buildHead(head, { title, description, url, schemas, image }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  if (image) h = h.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${image}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

const SLUG = "district-13-14-new-obour";
const title = "الحي 13 والحي 14 في العبور الجديدة: الإسكان الاجتماعي منخفض التكاليف | دليل العبور";
const description = "الحيان 13 و14 بالعبور الجديدة في نطاق «إسكان اجتماعي (منخفض التكاليف)» بالمخطط الرسمي، ويضمان مشروع «سكن لكل المصريين». المتر من نحو 21,000 جنيه مقابل 29,000 في الحي 25.";
const h1 = "الحي 13 والحي 14 في العبور الجديدة: منطقة الإسكان الاجتماعي منخفض التكاليف";
const url = `${SITE}/${SLUG}/`;
const MAP_IMG = "/infographics/hay-13-14-master-plan-social-housing.webp";
const PEER = "/district-25-new-obour/";

const SRC = {
  masrawy2021: "https://www.masrawy.com/news/news_egypt/details/2021/6/26/2046302/%D9%86%D8%B3%D8%A8%D8%A9-%D8%A7%D9%84%D8%AA%D9%86%D9%81%D9%8A%D8%B0-60-%D9%85%D8%B3%D8%A4%D9%88%D9%84%D9%88-%D8%A7%D9%84%D8%A5%D8%B3%D9%83%D8%A7%D9%86-%D9%8A%D8%AA%D9%81%D9%82%D8%AF%D9%88%D9%86-%D8%B4%D9%82%D9%82-%D8%B3%D9%83%D9%86-%D9%84%D9%83%D9%84-%D8%A7%D9%84%D9%85%D8%B5%D8%B1%D9%8A%D9%8A%D9%86-%D8%A8%D9%85%D8%AF%D9%8A%D9%86%D8%A9-%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1-%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9",
  ahram2021: "https://gate.ahram.org.eg/News/3073537.aspx",
  youm7_2025: "https://www.youm7.com/story/2025/1/29/%D8%B3%D9%83%D9%86-%D9%84%D9%83%D9%84-%D8%A7%D9%84%D9%85%D8%B5%D8%B1%D9%8A%D9%8A%D9%86-%D8%B1%D8%A6%D9%8A%D8%B3-%D9%85%D8%AF%D9%8A%D9%86%D8%A9-%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1-%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9-%D8%A7%D9%84%D9%85%D8%B4%D8%B1%D9%88%D8%B9-%D8%A8%D9%87-638/6861048",
  cairo24_2026: "https://www.cairo24.com/2378357",
  dostor2026: "https://www.dostor.org/5434286",
  dostor2025: "https://www.dostor.org/5301627",
  masrawy2026: "https://www.masrawy.com/news/realestate-news/details/2026/7/20/3020293/%D8%A8%D8%A7%D9%84%D9%85%D9%88%D8%A7%D8%B9%D9%8A%D8%AF-%D8%A7%D9%84%D8%A5%D8%B3%D9%83%D8%A7%D9%86-%D8%AA%D8%A8%D8%AF%D8%A3-%D8%AA%D8%B3%D9%84%D9%8A%D9%85-%D9%88%D8%AD%D8%AF%D8%A7%D8%AA-%D9%81%D8%A7%D9%84%D9%8A-%D8%AA%D8%A7%D9%88%D8%B1%D8%B2-%D8%A5%D9%8A%D8%B3%D8%AA-%D8%A8%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1-%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9",
};
const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener nofollow">${text}</a>`;

const FACTS = [
  ["806 عمارات · 19,344 وحدة", "«سكن لكل المصريين» لمنخفضي الدخل، بنسبة تنفيذ 60% وقتها", "الحيان 13 و14 على الطريق الدائري الأوسطي", ext(SRC.masrawy2021, "مصراوي، 26 يونيو 2021")],
  ["806 عمارات · 19,344 وحدة", "المشروع نفسه بتكلفة استثمارية 4.9 مليار جنيه", "الحيان 13 و14", ext(SRC.ahram2021, "بوابة الأهرام، 23 أكتوبر 2021")],
  ["638 عمارة · 15,312 وحدة", "وحدات إسكان اجتماعي ضمن «سكن لكل المصريين»", "«منطقة 2600 فدان»", ext(SRC.youm7_2025, "اليوم السابع، 29 يناير 2025")],
  ["698 عمارة · 16,752 وحدة", "وصفه جهاز المدينة بأنه «من الأحياء السكنية ذات الكثافة العالية»", "الحي 14 وحده", `${ext(SRC.cairo24_2026, "القاهرة 24")} و${ext(SRC.dostor2026, "الدستور")}، 25 فبراير 2026`],
  ["مركز شباب على 10,000 م²", "حمّاما سباحة وملعبان خماسيان ومبنى اجتماعي، واكتمل تنفيذه", "الحي 14", "المصدران السابقان، 25 فبراير 2026"],
  ["166 وحدة في 7 عمارات", "«فالي تاورز إيست» ضمن مبادرة «بيتك في مصر»، وتسليمها من 9 أغسطس إلى 10 سبتمبر 2026", "منطقة عمارات اللؤلؤة بالحي 14", ext(SRC.masrawy2026, "جهاز المدينة عبر مصراوي، 20 يوليو 2026")],
];

const COMPARE_ROWS = [
  ["الفئة", "«إسكان اجتماعي (منخفض التكاليف)»", "إسكان فاخر — حي الكمبوندات (وجاره الحي 24: بيت الوطن)"],
  ["سعر المتر يبدأ من (سبتمبر 2026)", "<strong>نحو 21,000 جنيه</strong>", "نحو 29,000 جنيه"],
  ["نوع المنتج", "عمارات الإسكان الاجتماعي بنماذج 75 و90 م²", "كمبوندات خاصة منخفضة الكثافة"],
  ["الكثافة", "عالية (الحي 14 وحده 698 عمارة)", "منخفضة (نسبة بناء 25% في كناري)"],
  ["طريقة الشراء الأساسية", "طروحات رسمية بشروط دخل، أو إعادة بيع بشروط الجهة المخصِّصة", "شراء مباشر من المطور أو إعادة بيع"],
];

const FAQ = [
  { q: "الحي 13 والحي 14 في العبور الجديدة إسكان إيه؟",
    a: "إسكان اجتماعي. على المخطط الاستراتيجي للمدينة يقع الحيان في نطاق «إسكان اجتماعي (منخفض التكاليف)»، ويضمان مشروع «سكن لكل المصريين» لمنخفضي الدخل، وهو مشروع ضمن مبادرة رئيس الجمهورية." },
  { q: "سعر المتر في الحي 14 العبور الجديدة كام؟",
    a: "يبدأ من نحو 21,000 جنيه للمتر (سبتمبر 2026)، والسعر تقريبي ويختلف حسب الدور والواجهة وحالة الوحدة. للمقارنة: الحي 25 يبدأ من نحو 29,000 جنيه للمتر." },
  { q: "الحي 14 فيه كام عمارة؟",
    a: "بحسب رئيس جهاز مدينة العبور الجديدة (فبراير 2026)، يضم الحي 14 وحده 698 عمارة بإجمالي 16,752 وحدة سكنية، ويصفه الجهاز بأنه من الأحياء السكنية ذات الكثافة العالية." },
  { q: "مساحات شقق الحي 13 والحي 14 كام؟",
    a: "أشهر نماذج مشروع «سكن لكل المصريين» في الحيين هما 75 م² و90 م²، وتختلف قيمة الوحدة داخل النموذج الواحد حسب الدور والواجهة والعمارة." },
  { q: "ينفع أشتري شقة إسكان اجتماعي إعادة بيع في الحي 13 أو 14؟",
    a: "قبل أي عربون، تأكد من الجهة المخصِّصة (صندوق الإسكان الاجتماعي ودعم التمويل العقاري أو الجهاز) من شروط التنازل وإعادة البيع المنصوص عليها في عقد الوحدة، ومن سداد الأقساط، ومن أن البائع هو المخصَّص له فعلًا. شقق الدعم لها شروط تصرف يحددها العقد، والشراء خارجها مخاطرة قانونية." },
  { q: "إيه الفرق بين الحي 14 والحي 25؟",
    a: "الحي 14 في نطاق «إسكان اجتماعي (منخفض التكاليف)» بكثافة عالية ونماذج 75 و90 م²، ويبدأ المتر فيه من نحو 21,000 جنيه. أما الحي 25 ففي حزام الإسكان الفاخر (مع جاره الحي 24 «بيت الوطن») بكمبوندات منخفضة الكثافة، ويبدأ المتر فيه من نحو 29,000 جنيه." },
  { q: "منطقة 2650 فدان في العبور الجديدة فين؟",
    a: "على المخطط الاستراتيجي، هي المنطقة المخططة بخطوط «إسكان اجتماعي (منخفض التكاليف)» في شمال غرب المدينة، داخل انحناءة الدائري الأوسطي قرب طريق القاهرة–بلبيس. ويشار في الأخبار الرسمية إلى «منطقة 2600 فدان» بوصفها منطقة مشروع الإسكان الاجتماعي، وفيها أيضًا المقر الجديد لجهاز المدينة." },
  { q: "فالي تاورز إيست في أنهي حي؟",
    a: "في الحي 14، تحديدًا بمنطقة عمارات اللؤلؤة، بحسب إعلان جهاز مدينة العبور الجديدة: 166 وحدة في 7 عمارات ضمن مبادرة «بيتك في مصر»." },
];

function priceBars() {
  const bar = (label, value, pct, color) =>
    `<div style="margin:.55rem 0"><div style="display:flex;justify-content:space-between;gap:1rem;font-weight:600"><span>${label}</span><span>${value}</span></div>` +
    `<div style="height:14px;border-radius:999px;background:#e7e0d2;overflow:hidden" aria-hidden="true"><div style="width:${pct}%;height:100%;border-radius:999px;background:${color}"></div></div></div>`;
  return `<figure style="margin:1.25rem 0;padding:1rem 1.1rem;border:1px solid #e3ddd0;border-radius:14px;background:#fff">` +
    `<figcaption style="font-family:'Noto Kufi Arabic',sans-serif;font-weight:700;margin-bottom:.35rem">سعر المتر يبدأ من — سبتمبر 2026 (تقريبي)</figcaption>` +
    bar("الحيان 13 و14 — إسكان اجتماعي", "نحو 21,000 جنيه", 72, "#6f6a12") +
    bar("الحي 25 — إسكان فاخر (كمبوندات)", "نحو 29,000 جنيه", 100, "#c2671c") +
    `<p class="caption" style="margin:.4rem 0 0">المتر في الحيين 13 و14 أرخص بنحو 8,000 جنيه من الحي 25، أي أقل بقرابة 28%.</p></figure>`;
}

function injectLink() {
  // رابط واحد من دليل الإسكان الاجتماعي إلى هذا المقال (مرة واحدة فقط)
  const p = path.join(clientDir, "social-housing-obour", "index.html");
  if (!fs.existsSync(p)) return "social-housing: missing";
  let html = fs.readFileSync(p, "utf8");
  if (html.includes('data-link="72"')) return "social-housing: already linked";
  const block = `<p data-link="72"><strong>أين يقع الإسكان الاجتماعي في العبور الجديدة؟</strong> أكبر تجمع له في <a href="/${SLUG}/">الحي 13 والحي 14</a>، داخل نطاق «إسكان اجتماعي (منخفض التكاليف)» على المخطط الرسمي، ويضمان مشروع «سكن لكل المصريين».</p>`;
  const anchor = "<h2>الخلاصة</h2>";
  if (!html.includes(anchor)) return "social-housing: no anchor";
  html = html.replace(anchor, block + anchor);
  fs.writeFileSync(p, html, "utf8");
  return "social-housing: link added";
}

function patchIndexes() {
  // sitemap.xml + search-index.json — إضافة الصفحة مرة واحدة (نمط المرحلة 55)
  const out = [];
  const sm = path.join(clientDir, "public", "sitemap.xml");
  if (fs.existsSync(sm)) {
    let xml = fs.readFileSync(sm, "utf8");
    if (!xml.includes(`<loc>${url}</loc>`)) {
      xml = xml.replace("</urlset>", `<url><loc>${url}</loc><lastmod>${MODIFIED}</lastmod></url>\n</urlset>`);
      fs.writeFileSync(sm, xml, "utf8");
      out.push("sitemap +1");
    } else out.push("sitemap ok");
  }
  const si = path.join(clientDir, "public", "search-index.json");
  if (fs.existsSync(si)) {
    try {
      const data = JSON.parse(fs.readFileSync(si, "utf8"));
      if (!data.some((x) => x.u === `/${SLUG}/`)) {
        data.push({ n: h1, d: description, u: `/${SLUG}/`, k: "صفحة" });
        fs.writeFileSync(si, JSON.stringify(data), "utf8");
        out.push("search +1");
      } else out.push("search ok");
    } catch (e) { out.push(`search-index skipped: ${e.message}`); }
  }
  return out.join(", ");
}

function main() {
  const chrome = loadChrome();
  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: h1, url, description,
      image: SITE + MAP_IMG,
      inLanguage: "ar-EG", datePublished: PUBLISHED, dateModified: MODIFIED,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: [
        { "@type": "Place", name: "الحي 13، مدينة العبور الجديدة، القليوبية" },
        { "@type": "Place", name: "الحي 14، مدينة العبور الجديدة، القليوبية" },
      ],
      mentions: [{ "@type": "Place", name: "الحي 25 — العبور الجديدة", url: SITE + PEER }],
      citation: Object.values(SRC) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "أحياء العبور الجديدة", item: SITE + "/new-obour-districts/" },
      { "@type": "ListItem", position: 3, name: "الحي 13 والحي 14", item: url } ] },
    { "@context": "https://schema.org", "@type": "Place", name: "الحي 14 — العبور الجديدة",
      description: "حي سكني عالي الكثافة في مدينة العبور الجديدة ضمن نطاق الإسكان الاجتماعي (منخفض التكاليف)، يضم 698 عمارة و16,752 وحدة سكنية بحسب جهاز المدينة (فبراير 2026).",
      containedInPlace: { "@type": "City", name: "مدينة العبور الجديدة" } },
    { "@context": "https://schema.org", "@type": "Place", name: "الحي 13 — العبور الجديدة",
      description: "حي سكني في مدينة العبور الجديدة ضمن نطاق الإسكان الاجتماعي (منخفض التكاليف) على الطريق الدائري الأوسطي.",
      containedInPlace: { "@type": "City", name: "مدينة العبور الجديدة" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({
      "@type": "Question", name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() } })) },
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas, image: SITE + MAP_IMG });

  const faqHtml = FAQ.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("");
  const factsTable = `<div class="table-wrap"><table><thead><tr><th>الرقم</th><th>البند</th><th>النطاق</th><th>المصدر والتاريخ</th></tr></thead><tbody>${
    FACTS.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const compare = `<div class="table-wrap"><table style="min-width:0"><thead><tr><th></th><th>الحيان 13 و14</th><th>الحي 25</th></tr></thead><tbody>${
    COMPARE_ROWS.map(([k, a, b]) => `<tr><td>${k}</td><td>${a}</td><td>${b}</td></tr>`).join("")}</tbody></table></div>`;
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li><li class="sep">›</li><li><span aria-current="page">الحي 13 والحي 14</span></li></ol></div></nav>`;

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ العبور الجديدة · دليل الأحياء · سبتمبر 2026</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="72">
<p><strong>الخلاصة:</strong> الحي 13 والحي 14 في العبور الجديدة يقعان في نطاق <strong>«إسكان اجتماعي (منخفض التكاليف)»</strong> كما يظهر على المخطط الاستراتيجي الرسمي للمدينة، ويضمان مشروع <strong>«سكن لكل المصريين»</strong> لمنخفضي الدخل. لذلك يبدأ سعر المتر فيهما من نحو <strong>21,000 جنيه</strong>، مقابل نحو <strong>29,000 جنيه</strong> في <a href="${PEER}">الحي 25</a> الواقع في الحزام السكني الأعلى تصنيفًا. الحيان من أقل خيارات السكن تكلفة في المدينة، والحي 25 هو طرفها الراقي.</p>
<div class="table-wrap"><table style="min-width:0"><thead><tr><th>البند</th><th>الحي 13 والحي 14 — العبور الجديدة</th></tr></thead><tbody>
<tr><td>التصنيف على المخطط الاستراتيجي</td><td>«إسكان اجتماعي (منخفض التكاليف)»، وهي المنطقة المخططة بخطوط حول تقاطع الدائري الأوسطي</td></tr>
<tr><td>المشروع الرئيسي</td><td>«سكن لكل المصريين» لمنخفضي الدخل</td></tr>
<tr><td>حجم المشروع</td><td>806 عمارات و19,344 وحدة في الحيين (2021)، والحي 14 وحده 698 عمارة و16,752 وحدة (2026)</td></tr>
<tr><td>نماذج الوحدات</td><td>75 م² و90 م²</td></tr>
<tr><td>سعر المتر (سبتمبر 2026)</td><td>يبدأ من نحو 21,000 جنيه</td></tr>
<tr><td>الكثافة</td><td>عالية، بوصف جهاز المدينة للحي 14</td></tr>
</tbody></table></div>

<h2>الحيان 13 و14 على المخطط الاستراتيجي</h2>
<p>في مفتاح <a href="/new-obour-master-plan/">المخطط الاستراتيجي لمدينة العبور الجديدة</a> ست فئات سكنية مقترحة، أعلاها «إسكان فاخر» ثم «إسكان فوق متوسط». أما الفئة التي يصفها المفتاح صراحةً بأنها <strong>«منخفض التكاليف»</strong> فهي <strong>«إسكان اجتماعي»</strong>، وتُرسم على اللوحة بخطوط أفقية.</p>
<p>هذه الخطوط تغطي المنطقة الواسعة في شمال غرب المدينة، داخل انحناءة الدائري الأوسطي قرب طريق القاهرة–بلبيس، والمكتوب عليها على اللوحة <strong>«منطقة ٢٦٥٠ فدان»</strong>، إضافة إلى بلوكات مجاورة شرق الدائري. هذا هو نطاق الحيين 13 و14، وهو ما تؤكده الأخبار الرسمية التي تصف مشروع الإسكان الاجتماعي في المدينة بأنه «بمنطقة 2600 فدان».</p>
<figure style="margin:1.5rem 0"><a href="${MAP_IMG}" target="_blank" rel="noopener"><img src="${MAP_IMG}" alt="الحي 13 والحي 14 على المخطط الاستراتيجي للعبور الجديدة داخل نطاق الإسكان الاجتماعي منخفض التكاليف ومنطقة 2650 فدان" width="1600" height="1000" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px;border:1px solid #e3ddd0"></a><figcaption class="caption" style="text-align:center;margin-top:.5rem">نطاق «إسكان اجتماعي (منخفض التكاليف)» حول الحيين 13 و14 على المخطط الاستراتيجي الرسمي، مع مفتاح الألوان. الإطارات والأسهم توضيحية وحدودها تقريبية. انقر للتكبير.</figcaption></figure>

<h2>مشروع «سكن لكل المصريين» في الحيين بالأرقام</h2>
<p>الأرقام التالية منشورة بمصادرها وتواريخها. اقرأ كل رقم بتاريخه، فالأرقام تصف مراحل ونطاقات مختلفة ولا تُجمع على بعضها.</p>
${factsTable}
<p>لاحظ أن رقم 2021 (806 عمارات) يخص الحيين معًا، ورقم 2026 (698 عمارة) يخص الحي 14 وحده، وهو ما يوضح أن الحي 14 يمثل الكتلة الأكبر من المشروع. وكلا الرقمين يعني 24 وحدة في العمارة الواحدة، وهو النمط المعتاد لعمارات الإسكان الاجتماعي.</p>

<h2>الأسعار: لماذا يبدأ المتر من نحو 21,000 جنيه؟</h2>
<p>السعر هنا نتيجة مباشرة للتصنيف. نطاق الإسكان الاجتماعي مخصص لوحدات مدعومة بمواصفات موحدة ومساحات محددة (75 و90 م²) وكثافة عالية، وتكلفة الأرض فيه أقل بكثير من نطاقات الإسكان الأعلى تصنيفًا. لذلك يبدأ سعر المتر في الحيين من نحو 21,000 جنيه (سبتمبر 2026)، بينما يبدأ في الحي 25 من نحو 29,000 جنيه بسبب ارتفاع سعر الأرض هناك.</p>
${priceBars()}
${compare}
<p>الصورة الكاملة للطرف الآخر من المقارنة في <a href="${PEER}">دليل الحي 25: الحي الراقي المرشّح للأعلى سعرًا</a>.</p>
<p class="caption">الأسعار تقريبية حتى سبتمبر 2026، وتتغير حسب الدور والواجهة وحالة الوحدة والتشطيب. أسعار الطروحات الرسمية الجديدة تُعلن في كراسة كل طرح. راجع <a href="/prices/">دليل الأسعار</a>.</p>

<h2>لمن يناسب الحي 13 والحي 14؟</h2>
<ul>
<li><strong>الأسر محدودة الدخل</strong> التي تنطبق عليها شروط الطروحات الرسمية، وهي الفئة المستهدفة أصلًا بالمشروع. خطوات التقديم في <a href="/social-housing-obour/">دليل الإسكان الاجتماعي</a>.</li>
<li><strong>من يبحث عن سعر دخول منخفض</strong> للسكن في العبور الجديدة، ويقبل الكثافة العالية مقابل السعر.</li>
<li><strong>من يريد خدمات مخططة مع المشروع</strong>: مركز شباب الحي 14 اكتمل تنفيذه، وتجري أعمال رفع كفاءة للطرق لخدمة الحيين (${ext(SRC.dostor2025, "الدستور، نوفمبر 2025")}).</li>
</ul>
<p>أما من يبحث عن كثافة منخفضة ومساحات أكبر وطابع راقٍ، فالخيار في الطرف الآخر من المخطط، في <a href="${PEER}">الحي 25</a>.</p>

<h2>قبل الشراء في الحي 13 أو 14: خمس نقاط تحقق</h2>
<ol>
<li><strong>شروط التصرف في الوحدة:</strong> اسأل الجهة المخصِّصة عن شروط التنازل وإعادة البيع المنصوص عليها في العقد قبل دفع أي مبلغ.</li>
<li><strong>البائع هو المخصَّص له:</strong> طابق الاسم في العقد وإيصالات السداد مع بطاقة البائع.</li>
<li><strong>قيّم العمارة لا الحي:</strong> الدور والواجهة والمسافة لأقرب مخرج تغيّر قيمة الوحدة أكثر من رقم الحي.</li>
<li><strong>الصيانة المشتركة:</strong> في الكثافة العالية، حالة السلم والأسانسير (إن وُجد) والمناور هي التحدي اليومي الأول.</li>
<li><strong>المساحة الفعلية:</strong> 75 أو 90 م² في العقد، فاسأل عن الصافي وعن نسبة التحميل.</li>
</ol>
<p>القواعد العامة للشراء الآمن في <a href="/buying-guide/">دليل الشراء</a>.</p>

<h2>الخدمات والمرافق في الحيين</h2>
<p>أعلن جهاز مدينة العبور الجديدة في فبراير 2026 اكتمال مركز شباب الحي 14 على مساحة 10,000 م²، ويضم حمّامي سباحة وملعبين خماسيين ومبنى اجتماعيًا متكاملًا. والمقر الجديد لجهاز المدينة نفسه يقع في «منطقة 2600 فدان» (${ext(SRC.ahram2021, "بوابة الأهرام، أكتوبر 2021")}). ومع ذلك تبقى الخدمات التجارية اليومية في مرحلة نمو، فزر المنطقة بنفسك وتابع <a href="/tracker/">متابعة العبور الجديدة</a> قبل القرار.</p>

<h2>الأسئلة الشائعة</h2>
<div class="faq-block">${faqHtml}</div>
<p class="caption">آخر مراجعة: 16 سبتمبر 2026. المصادر: المخطط الاستراتيجي لمدينة العبور الجديدة (هيئة المجتمعات العمرانية الجديدة)، والأخبار المنسوبة في الجدول أعلاه. لديك معلومة موثقة تخالف ما هنا؟ <a href="/corrections/">راسلنا</a>.</p>
</article><aside class="action-card"><p>قارن قبل أن تقرر</p><a class="button" href="${PEER}">الحي 25: حي الكمبوندات الفاخر ↖</a><a class="text-link" href="/social-housing-obour/">التقديم على الإسكان الاجتماعي ↖</a><a class="text-link" href="/new-obour-master-plan/">المخطط الاستراتيجي كاملًا ↖</a><a class="text-link" href="/new-obour-districts/">كل أحياء العبور الجديدة ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="${PEER}">الحي 25: الحي الراقي المرشّح للأعلى سعرًا</a></li><li><a href="/social-housing-obour/">الإسكان الاجتماعي: الشروط والتقديم</a></li><li><a href="/new-obour-master-plan/">خريطة العبور الجديدة الرسمية</a></li><li><a href="/new-obour-districts/">أحياء العبور الجديدة</a></li><li><a href="/rent-to-own-obour/">الإيجار التمليكي</a></li><li><a href="/sakan-misr-obour/">سكن مصر في العبور</a></li><li><a href="/middle-ring-road-obour/">الدائري الأوسطي</a></li><li><a href="/tracker/">متابعة العبور الجديدة</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, SLUG);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log(`[phase72] /${SLUG}/ — الحي 13 والحي 14: الإسكان الاجتماعي · ${injectLink()} · ${patchIndexes()}`);
}

main();
