/**
 * seo-phase1b-fixes.mjs
 * إصلاحات متبقّية بعد التحقق الحيّ من المرحلة الأولى (زحف 72 صفحة على obourguide.com).
 * تعمل بعد render-static.mjs وبعد seo-phase1-postprocess.mjs وقبل vite build.
 * idempotent: تشغيلها أكثر من مرة آمن ولا يكرّر شيئًث.
 *
 * ما تصلحه (كلها ثغرات مؤكَّدة بالزحف لا افتراضات):
 *  1b.1  روابط خرائط جوجل بلا nofollow في صفحات المدارس العشر
 *        السبب: regex المرحلة 1 يفترض أن href هي أول سمة (<a href="...">)، وصفحات
 *        المدارس تستخدم <a class="button" href="..."> فلم تُطابَق. 10 روابط dofollow حية.
 *  1b.2  15 صفحة بلا dateModified/datePublished
 *        السبب: مشّاء المرحلة 1 يضيف التواريخ لأنواع CreativeWork فقط
 *        (WebPage/Article/CollectionPage/ItemList/FAQPage)، وهذه الصفحات عقدتها
 *        الرئيسية Place أو School أو HowTo أو WebSite — وهي أنواع لا تقبل dateModified
 *        في schema.org أصلًا. الإصلاح الصحيح: حقن عقدة WebPage سليمة تحمل التواريخ
 *        وتشير إلى الناشر، لا حشو التواريخ في عقدة Place/School (وهو ما كان سيكون خطأ).
 *  1b.3  اختصار العناوين التي تتجاوز 62 محرفًا (6 صفحات) — قائمة صريحة، لا قصّ آلي.
 *  1b.4  llms.txt — ملف إرشاد لزواحف نماذج اللغة (اختياري، مفعّل بعلم ENABLE_LLMS_TXT).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";
const ENABLE_LLMS_TXT = true;

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "أبريل": "04", "ابريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};
function pageLastmod(html) {
  const m = html.match(/آخر تحديث: ([؀-ۿ]+) (\d{4})/);
  if (!m) return DEFAULT_LASTMOD;
  return AR_MONTHS[m[1]] ? `${m[2]}-${AR_MONTHS[m[1]]}` : DEFAULT_LASTMOD;
}
function listPageFiles() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "index.html") out.push(full);
    }
  };
  walk(clientDir);
  return out;
}
function slugOf(file) {
  const rel = path.relative(clientDir, file).replace(/\\/g, "/");
  return rel === "index.html" ? "/" : "/" + rel.replace(/\/index\.html$/, "") + "/";
}

// ---------------------------------------------------------------------------
// 1b.1 — nofollow لكل روابط الخرائط أيًّا كان ترتيب السمات
// ---------------------------------------------------------------------------
function nofollowMapsAnyOrder(html, slug) {
  let n = 0;
  html = html.replace(/<a\b[^>]*>/g, (tag) => {
    if (!/href="https?:\/\/(?:www\.)?google\.[a-z.]+\/maps/.test(tag)) return tag;
    if (/\bnofollow\b/.test(tag)) return tag;
    n++;
    if (/\brel="([^"]*)"/.test(tag)) return tag.replace(/\brel="([^"]*)"/, (a, v) => `rel="nofollow ${v}"`);
    return tag.replace(/\s*>$/, ' rel="nofollow noopener">');
  });
  if (n) rep("maps-nofollow", `${slug}: نوفولو لـ ${n} رابط خرائط فاتت المرحلة 1`);
  return html;
}

// ---------------------------------------------------------------------------
// 1b.2 — عقدة WebPage بتواريخ للصفحات التي عقدتها الرئيسية Place/School/HowTo/WebSite
// ---------------------------------------------------------------------------
const DATED_TYPES = new Set(["WebPage", "Article", "NewsArticle", "CollectionPage", "ItemList", "FAQPage", "HowTo"]);

function readSchemas(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { out.push(JSON.parse(m[1])); } catch { out.push(null); }
  }
  return out;
}
function hasDatedNode(html) {
  let found = false;
  const walk = (n) => {
    if (found || !n) return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (typeof n !== "object") return;
    const t = n["@type"];
    const ts = Array.isArray(t) ? t : [t];
    if (ts.some((x) => DATED_TYPES.has(x)) && n.dateModified) { found = true; return; }
    Object.values(n).forEach(walk);
  };
  readSchemas(html).forEach(walk);
  return found;
}
function firstEntityId(html) {
  // إن وُجدت عقدة Place/School لها ؠid نربطها كـ mainEntity — وإلا نتركها
  for (const s of readSchemas(html)) {
    const stack = [s];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== "object") continue;
      if (Array.isArray(n)) { stack.push(...n); continue; }
      const t = n["@type"];
      const ts = Array.isArray(t) ? t : [t];
      if (ts.some((x) => ["Place", "School", "EducationalOrganization", "LocalBusiness"].includes(x)) && n["@id"]) return n["@id"];
      stack.push(...Object.values(n));
    }
  }
  return null;
}
function addWebPageNode(html, slug) {
  if (hasDatedNode(html)) return html;
  if (html.includes('"@id":"' + SITE + slug + '#webpage"')) return html; // idempotent
  const lastmod = pageLastmod(html);
  const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const name = h1m ? h1m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
  const canonM = html.match(/<link rel="canonical" href="([^"]+)"/);
  const url = canonM ? canonM[1] : SITE + slug;
  const descM = html.match(/<meta name="description" content="([^"]*)"/);
  const ent = firstEntityId(html);
  const node = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": SITE + slug + "#webpage",
    "name": name || undefined,
    "url": url,
    "description": descM ? descM[1] : undefined,
    "inLanguage": "ar-EG",
    "datePublished": lastmod,
    "dateModified": lastmod,
    "publisher": { "@id": SITE + "/#org" },
    ...(ent ? { "mainEntity": { "@id": ent } } : {}),
  };
  const json = JSON.stringify(node, (k, v) => (v === undefined ? undefined : v));
  html = html.replace("</head>", `<script type="application/ld+json">${json}</script></head>`);
  rep("webpage-node", `${slug}: أُضيفت عقدة WebPage بتواريخ (${lastmod})${ent ? " + mainEntity" : ""}`);
  return html;
}

// ---------------------------------------------------------------------------
// 1b.3 — اختصار العناوين الطويلة (قائمة صريحة من الزحف الحي)
// ---------------------------------------------------------------------------
const TITLE_REWRITES = {
  "/about/": [
    "مدينة العبور الجديدة 2026: موقع، مساحة، والفرق عن العبور القديمة",
    "مدينة العبور الجديدة: الموقع والمساحة والفرق عن القدي٥ة",
  ],
  "/districts/": [
    "أحياء العبور الجديدة: دليل الأحياء 1-25 والحي المتميز + الأسعار",
    "أحياء العبور الجديدة: دليل الأحياء 1-25 والحي المتميز",
  ],
  "/obour-vs-obour-new/": [
    "الفرق بين العبور والعبور الجديدة: مقارنة شاملة 2026 | دليل العبور",
    "الفرق بين العبور والعبور الجديدة: مقارنة 2026 | دليل العبور",
  ],
  "/price-report-q3-2026/": [
    "تقرير أسعار العقارات في العبور — الربع الثالث 2026 | دليل العبور",
    "أسعار عقارات العبور — تقرير الربع الثالث 2026 | دليل العبور",
  ],
  "/restaurants/mashawi/": [
    "مطاعم المشويات والحاتي في العبور: الأسماء والعناوين والهواتف | دليل العبور",
    "مطاعم المشويات والحاتي في العبور | دليل العبور",
  ],
  "/transport/": [
    "مواصلات العبور الجديدة: القطار الكهربائي LRT ومحاور الوصول 2026",
    "مواصلات العبور الجديدة: القطار الكهربائي LRT ومحاور الوصول",
  ],
};
function fixLongTitle(html, slug) {
  const r = TITLE_REWRITES[slug];
  if (!r) return html;
  const [oldT, newT] = r;
  if (!html.includes(oldT)) return html;
  html = html.replaceAll(oldT, newT);
  rep("title-len", `${slug}: ${oldT.length} → ${newT.length} محرفًا`);
  return html;
}

// ---------------------------------------------------------------------------
// 1b.4 — llms.txt
// ---------------------------------------------------------------------------
function writeLlmsTxt() {
  if (!ENABLE_LLMS_TXT) return;
  const out = path.join(clientDir, "public", "llms.txt");
  const body = `# دليل العبور والعبور الجديدة

> دليل معلوماتي مستقل عن مدينة العبور القائمة ومدينة العبور الجديدة (محافظة القليوبية، مصر).
> أكثر من 1,600+ مدخل خدمة بالاسم والعنوان والهاتف والمصدر، إضافة إلى أدلة الأحياء
> والأسعار والمواصلات والمدارس والمطورين وخطوات الشراء. كل معلومة منسوبة إلى مصدر
> منشور قابل للفحص، وما لا مصدر له يُذكر كنقص لا يُملك بادعاء.

## عن الناشر
- [من نحن](${SITE}/about-us/)
- [السياسة التحريرية](${SITE}/editorial-policy/)
- [منهجية تقييم المطورين](${SITE}/methodology/)
- [الإفصاح والشفافية](${SITE}/disclosure/): استقلال الدليل عن كل الكيانات المُدرجة وعدم وجود علاقة تجارية مع أي مطور
- [المصادر](${SITE}/sources/)
- [سياسة التصحيح](${SITE}/corrections/)

## المدينة
- [عن مدينة العبور الجديدة](${SITE}/about/)
- [مدينة العبور القائمة](${SITE}/old-obour/)
- [الفرق بين العبور والعبور الجديدة](${SITE}/obour-vs-obour-new/)
- [الأحياء والمناطق](${SITE}/districts/)
- [المواصلات والقطار الكهربائي LRT](${SITE}/transport/)
- [مقارنة العبور بمدن أخرٚ](${SITE}/compare/)

## السكن والشراء
- [أسعار العقارات](${SITE}/prices/)
- [تقرير أسعار الربع الثالث 2026](${SITE}/price-report-q3-2026/)
- [دليل الشراء](${SITE}/buying-guide/)
- [دليل المطورين والمعايير الخمسة](${SITE}/developers/)
- [الاستثمار العقاري](${SITE}/investment/)
- [أخطاء شائعة قبل التوقيع](${SITE}/mistakes/)

## الخدمات والأدلة
- [فهرس كل الأدلة](${SITE}/directory/)
- [الصيدليات](${SITE}/pharmacies/) · [المستشفيات](${SITE}/hospitals/) · [العيادات](${SITE}/clinics/)
- [المدارس](${SITE}/schools/) · [الحضانات](${SITE}/nurseries/) · [دليل التعليم](${SITE}/education-guide/)
- [المطاعم والكافيهات](${SITE}/restaurants/) · [التسوق](${SITE}/shopping/) · [البنوك](${SITE}/banks/)
- [الطوارئ والأرقام الرسمية](${SITE}/emergency/)
- [دليل العيش في العبور](${SITE}/living-guide/)

## أدلة الأحياء
- [أفضل أحياء العبور حسب الاحتياج](${SITE}/best-districts/)
- أدلة كل حي: [الأول](${SITE}/district-1/) · [الثاني](${SITE}/district-2/) · [الثالث](${SITE}/district-3/) · [الرابع](${SITE}/district-4/) · [الخامس](${SITE}/district-5/) · [السادس](${SITE}/district-6/) · [السابع](${SITE}/district-7/) · [الثامن](${SITE}/district-8/) · [التاسع](${SITE}/district-9/)

## أدلة الإسكان والشراء (2026)
- [دار مصر في العبور](${SITE}/dar-misr-obour/) · [سكن مصر](${SITE}/sakan-misr-obour/) · [التقسيط](${SITE}/installments-obour/)
- [كيف تختار شقتك](${SITE}/choose-apartment/) · [فيلات للبيع](${SITE}/villas-for-sale-obour/) · [عقارات العبور الجديدة](${SITE}/new-obour-real-estate/)
- [توقعات الأسعار وقراءة السوق](${SITE}/price-forecast-obour/) · [العقارات التجارية](${SITE}/commercial-real-estate/)

## الإيجارات
- [فيلات](${SITE}/villas-rent-obour/) · [محلات](${SITE}/shops-rent-obour/) · [مكاتب](${SITE}/offices-rent-obour/) · [مخازن](${SITE}/warehouses-obour/) · [شقق مفروشة](${SITE}/furnished-apartments/) · [استوديو](${SITE}/studio-rent-obour/)

## المواصلات والوصول
- [مواصلات العبور من القاهرة](${SITE}/transport-from-cairo/) · [الدائري الأوسطي](${SITE}/middle-ring-road-obour/) · [النقل الداخلي](${SITE}/internal-transport/)

## الأسواق والتسوق
- [سوق الجمعة](${SITE}/friday-market/) · [السوق المركزي](${SITE}/central-market/) · [الهايبر ماركت](${SITE}/supermarkets/)
- [انفينتي مول](${SITE}/infinity-mall/) · [جولف سيتي مول](${SITE}/golf-city-mall/) · [مولات العبور الجديدة](${SITE}/new-obour-malls/)

## الصحة
- [خدمات 24 ساعة والطوارئ](${SITE}/hospital-24-hours/) · [صيدليات مناوبة](${SITE}/pharmacies-24-hours/)
- [معامل التحاليل والأشعة](${SITE}/labs-radiology/) · [عيادات الأسنان](${SITE}/dentists-obour/) · [العلاج الطبيعي](${SITE}/physical-therapy-obour/)

## التعليم
- [مدارس اللغات](${SITE}/language-schools/) · [مدارس العبور الجديدة](${SITE}/new-obour-schools/) · [المصرية اليابانية](${SITE}/japanese-school-obour/) · [الجامعات القريبة](${SITE}/universities-near-obour/)

## الحياة اليومية والعمل
- [دليفري العبور](${SITE}/food-delivery/) · [الانتقال للمدينة](${SITE}/moving-to-obour/) · [نقل العفش](${SITE}/movers-obour/)
- [الإنترنت والاتصالات](${SITE}/telecom-obour/) · [الرقم البريدي 11828](${SITE}/postal-code/) · [مكاتب البريد](${SITE}/post-offices/)
- [وظائف العبور](${SITE}/jobs-obour/) · [المنطقة الصناعية](${SITE}/industrial-companies/) · [مشاكل المدينة وحلولها](${SITE}/obour-problems/)
- [رحلات يوم واحد](${SITE}/day-trips/) · [المدن القريبة](${SITE}/nearby-cities/) · [أخبار موثوقة](${SITE}/obour-news/)

## English Guides
- [Living in Obour](${SITE}/en/living-guide/) · [Cost of Living](${SITE}/en/cost-of-living/) · [Apartments for Sale](${SITE}/en/apartments-for-sale/)
- [Property Investment](${SITE}/en/property-investment/) · [Commuting to Cairo](${SITE}/en/commuting-to-cairo/) · [Postal Code](${SITE}/en/postal-code/) · [Nurseries](${SITE}/en/nurseries/) · [International Schools](${SITE}/en/international-schools/)

## قواعد الاقتباس
- الأرقام والعناوين والهواتف مأخوذة من أدلة تجارية ومصادر رسمية منشورة، ويظهر اسم المصدر أسفل كل مدخل.
- الدرجات في جدول المطورين تقيس **جحم ما يُنشر ويمكن التحقق منه**، لا جودة الشركة المطلقة.
- البيانات تتغير: كل صفحة تحمل تاريخ آخر مراجعة، ويُنصح بالتحقق الهاتفي قبل أي قرار.
- الدليل معلوماتي ولا يبيع ولا يتوسط في أي عملية شراء.
`;
  if (fs.existsSync(out) && fs.readFileSync(out, "utf8") === body) {
    rep("llms", "llms.txt موجود ومطابق — لا تغيير");
    return;
  }
  fs.writeFileSync(out, body);
  rep("llms", "كُتب client/public/llms.txt");
}

// ---------------------------------------------------------------------------
function main() {
  const files = listPageFiles();
  for (const file of files) {
    const slug = slugOf(file);
    let html = fs.readFileSync(file, "utf8");
    const before = html;
    html = nofollowMapsAnyOrder(html, slug); // 1b.1
    html = fixLongTitle(html, slug);         // 1b.3
    html = addWebPageNode(html, slug);       // 1b.2  (بعد العنوان كي يلتقط الوصف النهائي)
    if (html !== before) fs.writeFileSync(file, html);
  }
  writeLlmsTxt(); // 1b.4

  console.log("=== تقرير إصلاحات 1b ===");
  for (const l of report) console.log(l);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}
main();
