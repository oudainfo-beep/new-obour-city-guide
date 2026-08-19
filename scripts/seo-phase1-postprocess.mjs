/**
 * seo-phase1-postprocess.mjs
 * إصلاحات المرحلة الأولى للسيو — تعمل على ملفات الصفحات في client بعد render-static.mjs وقبل vite build.
 * السكربت idempotent: يمكن تشغيله أكثر من مرة بأمان، ويطبع تقريرًا بما طُبّق وما كان مطبقًا.
 *
 * يغطي مهام الخطة الموحدة:
 *  1.1 الإفصاح + حذف featured + nofollow متماثل لروابط المطورين + حيادية ويدجت الرئيسية + رابط buying-guide
 *  1.2 توحيد روابط tel: إلى صيغة +20 الدولية
 *  1.3 إعادة بناء sitemap.xml (الرئيسية + صفحات فريدة + lastmod حقيقي + بلا changefreq/priority)
 *  1.4 إنشاء صفحات الناشر الثماني + صفحة مشويات
 *  1.5 إصلاح الصفحات الثماني المكسورة (placeholders → H1 حقيقي)
 *  1.6 مراسي id="business-N" + إصلاح url في Schema + حذف openingHours غير الموثقة
 *  1.7 روابط سياقية للصفحات صفرية الروابط + الصفحات اليتيمة
 *  1.8 توسيع Organization للناشر على كل الصفحات + dateModified في Schema
 *  1.10 nofollow لروابط الخرائط + نقل مصادر الفوتر إلى /sources/
 *  1.11 اختصار لاحقة العناوين إلى «| دليل العبور»
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const CONTACT_EMAIL = "info@obourguide.com"; // ← أكّد أن هذه الصندوق موجود أو غيّره هنا
const DEFAULT_LASTMOD = "2026-08";

const report = [];
function rep(key, msg) {
  report.push(`[${key}] ${msg}`);
}

// ---------------------------------------------------------------------------
// أدوات عامة
// ---------------------------------------------------------------------------
const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "أبريل": "04", "ابريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};

function pageLastmod(html) {
  const m = html.match(/آخر تحديث: ([\u0600-\u06FF]+) (\d{4})/);
  if (!m) return DEFAULT_LASTMOD;
  const mm = AR_MONTHS[m[1]];
  return mm ? `${m[2]}-${mm}` : DEFAULT_LASTMOD;
}

function normalizeTel(raw) {
  if (raw.trim().startsWith("+")) return raw.replace(/[^\d+]/g, ""); // دولي بالفعل — لا تلمسه
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("0") && digits.length >= 10 && digits.length <= 11) {
    return "+20" + digits.slice(1);
  }
  return digits; // أرقام طوارئ وخطوط ساخنة قصيرة تبقى كما هي
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
// مكوّنات HTML معاد بناؤها (نفس مخرجات render-static للصفحات السليمة)
// ---------------------------------------------------------------------------
function heroHtml({ tag, eyebrow, title, description }) {
  return `<section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><aside class="route-rail" aria-label="سجل مراجعة الصفحة"><span class="route-no">01</span><div class="route-line" aria-hidden="true"><i></i><b></b><em></em></div><p>سجل الصفحة</p><strong>مراجَع · أغسطس 2026</strong><small>مصدر مرجعي: بيانات منشورة ومخططات معلنة</small></aside><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div></div></section>`;
}
function atlasHtml(title, desc) {
  return `<section class="atlas-body"><div class="wrap atlas-body-grid"><div class="atlas-body-no">02</div><div class="atlas-body-route" aria-hidden="true"><i></i><b></b><em></em></div><div><strong>${title}</strong><span>${desc}</span></div><div class="atlas-status"><span>مراجَع</span><span>بيانات منشورة</span><span>تتطلب معاينة</span></div></div></section>`;
}
const GOV_SOURCES = [
  ["https://lands.nuca.gov.eg/ar/ViewCity.aspx?ID=16", "هيئة المجتمعات العمرانية الجديدة — مخطط مدينة العبور الجديدة"],
  ["http://www.nat.gov.eg/LocationActivity.aspx?id=2085", "الهيئة القومية للأنفاق — القطار الكهربائي الخفيف"],
  ["https://www.arabcont.com/english/project-628", "المقاولون العرب — مسار LRT ومحطاته"],
];
function refsHtml() {
  const items = GOV_SOURCES.map(([u, t], i) =>
    `<li><a href="${u}" target="_blank" rel="noopener noreferrer nofollow">[${i + 1}] ${t} ↗</a></li>`).join("");
  return `<section class="sources"><div class="wrap"><h2>مصادر للقراءة والتحقق</h2><ol>${items}</ol></div></section>`;
}

// ---------------------------------------------------------------------------
// 1.5 — ترميم الصفحات المكسورة: استبدال placeholders بمكونات حقيقية (مع H1)
// ---------------------------------------------------------------------------
function interpolatePlaceholders(html, slug) {
  let changed = 0;
  html = html.replace(/\$\{pageHero\(\{([\s\S]*?)\}\)\}/g, (all, params) => {
    const get = (k) => {
      const m = params.match(new RegExp(k + '\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
      return m ? m[1] : "";
    };
    changed++;
    return heroHtml({ tag: get("tag"), eyebrow: get("eyebrow"), title: get("title"), description: get("description") });
  });
  html = html.replace(/\$\{atlasBody\("((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\)\}/g, (all, t, d) => {
    changed++;
    return atlasHtml(t, d);
  });
  html = html.replace(/\$\{refsHtml\(\)\}/g, () => {
    changed++;
    return refsHtml();
  });
  if (changed) rep("placeholders", `${slug}: رُمّمت ${changed} عناصر (H1 أصبحت ظاهرة)`);
  return html;
}

// ---------------------------------------------------------------------------
// 1.2 — توحيد tel: إلى الصيغة الدولية +20 (روابط + Schema)
// ---------------------------------------------------------------------------
function fixTel(html, slug) {
  let n = 0;
  html = html.replace(/href="tel:([^"]+)"/g, (all, num) => {
    const fixed = normalizeTel(num);
    if (fixed !== num && fixed !== num.replace(/[^\d]/g, "")) n++;
    else if (fixed !== num) n++;
    return `href="tel:${fixed}"`;
  });
  html = html.replace(/"telephone":"([^"]+)"/g, (all, num) => {
    const fixed = normalizeTel(num);
    if (fixed !== num) n++;
    return `"telephone":"${fixed}"`;
  });
  if (n) rep("tel", `${slug}: وُحّدت ${n} أرقام إلى صيغة +20`);
  return html;
}

// ---------------------------------------------------------------------------
// 1.10 — nofollow لكل روابط خرائط جوجل
// ---------------------------------------------------------------------------
function nofollowMaps(html, slug) {
  let n = 0;
  html = html.replace(/<a href="(https?:\/\/(?:www\.)?google\.[a-z.]+\/maps[^"]*)"([^>]*)>/g, (all, url, attrs) => {
    if (attrs.includes("nofollow")) return all;
    n++;
    if (attrs.includes('rel="')) return `<a href="${url}"${attrs.replace('rel="', 'rel="nofollow ')}>`;
    return `<a href="${url}"${attrs} rel="nofollow noopener">`;
  });
  if (n) rep("maps-nofollow", `${slug}: nofollow لـ ${n} رابط خرائط`);
  return html;
}

// ---------------------------------------------------------------------------
// 1.6 — مراسي business-N في بطاقات HTML + إصلاح url في JSON-LD + حذف openingHours
// ---------------------------------------------------------------------------
function fixBusinessAnchors(html, slug) {
  if (!html.includes('class="dir-item"')) return html;
  let i = 0;
  html = html.replace(/<article class="dir-item"(?![^>]*\bid="business-)/g, () => {
    i++;
    return `<article class="dir-item" id="business-${i}"`;
  });
  const cardCount = i;

  // إصلاح JSON-LD: url بمرساة + حذف openingHours
  let jsonFixed = 0;
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, json) => {
    let data;
    try { data = JSON.parse(json); } catch { return all; }
    let touched = false;
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      if (node["@id"] && /#business-\d+$/.test(node["@id"])) {
        const anchor = node["@id"].slice(node["@id"].indexOf("#business-"));
        const pageUrl = node["@id"].slice(0, node["@id"].indexOf("#business-"));
        if (node.url !== pageUrl + anchor) { node.url = pageUrl + anchor; touched = true; }
        if ("openingHours" in node) { delete node.openingHours; touched = true; }
      }
      Object.values(node).forEach(walk);
    };
    walk(data);
    if (touched) {
      jsonFixed++;
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    }
    return all;
  });
  if (cardCount || jsonFixed) rep("business-ids", `${slug}: ${cardCount} مرساة بطاقة + ${jsonFixed} سكيمات مصححة`);
  return html;
}

// ---------------------------------------------------------------------------
// 1.8 — dateModified في JSON-LD + Organization للناشر على كل صفحة
// ---------------------------------------------------------------------------
const ORG_NODE = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": SITE + "/#org",
  "name": "دليل العبور والعبور الجديدة",
  "url": SITE + "/",
  "logo": "https://obourguide.com/brand/logo.png",
  "description": "دليل معلوماتي مستقل عن مدينة العبور والعبور الجديدة يعمل بمعايير تحقق منشورة.",
  "foundingDate": "2026",
  "contactPoint": { "@type": "ContactPoint", "contactType": "editorial", "email": CONTACT_EMAIL, "availableLanguage": "ar" },
  "publishingPrinciples": SITE + "/editorial-policy/",
};

function fixSchemaDatesAndOrg(html, slug) {
  const lastmod = pageLastmod(html);
  let datesAdded = 0;
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, json) => {
    let data;
    try { data = JSON.parse(json); } catch { return all; }
    let touched = false;
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      const t = node["@type"];
      if (["WebPage", "Article", "CollectionPage", "ItemList", "FAQPage"].includes(t)) {
        if (!node.dateModified) { node.dateModified = lastmod; touched = true; }
        if (!node.datePublished) { node.datePublished = lastmod; touched = true; }
      }
      Object.values(node).forEach(walk);
    };
    walk(data);
    if (touched) { datesAdded++; return `<script type="application/ld+json">${JSON.stringify(data)}</script>`; }
    return all;
  });

  if (!html.includes("#org")) {
    // الرئيسية: وسّع عقدة Organization الموجودة بدل إضافة عقدة ثانية
    const legacy = '{"@type":"Organization","name":"دليل العبور والعبور الجديدة","url":"https://obourguide.com/","logo":"https://obourguide.com/brand/logo.png","description":"دليل معلوماتي عن مدينة العبور والعبور الجديدة."}';
    if (html.includes(legacy)) {
      const extended = JSON.stringify({ ...ORG_NODE, "@context": undefined, "@id": SITE + "/#org" }).replace(',"@context":null', '');
      html = html.replace(legacy, extended);
      rep("org", `${slug}: وُسّعت عقدة Organization القائمة`);
    } else {
      const node = { ...ORG_NODE };
      html = html.replace("</head>", `<script type="application/ld+json">${JSON.stringify(node)}</script></head>`);
      rep("org", `${slug}: أُضيفت عقدة Organization للناشر`);
    }
  }
  if (datesAdded) rep("dates", `${slug}: dateModified/datePublished في ${datesAdded} سكيمات (${lastmod})`);
  return html;
}

// ---------------------------------------------------------------------------
// 1.10 — فوتر موحّد: نقل المصادر الخارجية إلى /sources/ وربط صفحات الناشر
// ---------------------------------------------------------------------------
const FOOTER_ABOUT = `<section><h2>عن الدليل</h2><a href="/about-us/">من نحن</a><a href="/methodology/">منهجية التقييم</a><a href="/editorial-policy/">السياسة التحريرية</a><a href="/disclosure/">الإفصاح والشفافية</a><a href="/sources/">المصادر</a><a href="/corrections/">سياسة التصحيح</a><a href="/privacy/">الخصوصية</a><a href="/contact/">تواصل معنا</a></section>`;

function fixFooter(html, slug) {
  const re = /<section><h2>مصادر مفتوحة<\/h2>[\s\S]*?<\/section>/;
  if (re.test(html)) {
    html = html.replace(re, FOOTER_ABOUT);
    rep("footer", `${slug}: مصادر الفوتر انتقلت إلى /sources/ وأُضيفت روابط الناشر`);
  }
  // الرئيسية تفتقد سطر آخر تحديث
  if (!html.includes('class="last-updated"') && html.includes("ونرحّب بأي تصحيح موثّق.</p>")) {
    html = html.replace("ونرحّب بأي تصحيح موثّق.</p>", `ونرحّب بأي تصحيح موثّق.</p><p class="last-updated">آخر تحديث: أغسطس 2026</p>`);
    rep("footer", `${slug}: أُضيف سطر «آخر تحديث» للفوتر`);
  }
  return html;
}

// ---------------------------------------------------------------------------
// 1.11 — اختصار لاحقة العناوين
// ---------------------------------------------------------------------------
function fixTitleSuffix(html, slug) {
  const before = html;
  html = html.replaceAll(" | دليل العبور والعبور الجديدة</title>", " | دليل العبور</title>");
  html = html.replaceAll(' | دليل العبور والعبور الجديدة"', ' | دليل العبور"');
  if (html !== before) rep("title", `${slug}: قُصّرت لاحقة العنوان إلى «| دليل العبور»`);
  return html;
}

// ---------------------------------------------------------------------------
// 1.1 — صفحة المطورين: إفصاح + حذف featured + nofollow متماثل
// ---------------------------------------------------------------------------
const DEV_DOMAINS = [
  "ouda-developments.com", "sud.com.eg", "alashraaf.com", "elmoltqa.com",
  "valerodevelopments.com", "kayandev.com", "mrsdevelopment.com",
  "metwadeegroup.com", "mazaya-development.com", "ebdaa-developments.com", "bravo.sa",
];
const DISCLOSURE_BANNER = `<div class="note disclosure-banner" role="note"><strong>تنبيه تحريري:</strong> دليل العبور يرتبط بعلاقة مع عوده للتطوير العقاري، إحدى الشركات المُقيَّمة في هذا الجدول. لم نستثنِها لأن حذف مطوّر قائم في المدينة يُضعف الدليل، لكن درجتها محسوبة بنفس المعايير الخمسة المنشورة المطبقة على الجميع، وبنفس مصادر التحقق. <a href="/disclosure/">التفاصيل الكاملة في صفحة الإفصاح</a>.</div>`;

function nofollowDomainLinks(html, domains) {
  let n = 0;
  for (const d of domains) {
    const esc = d.replace(/\./g, "\\.");
    const re = new RegExp(`<a\\b[^>]*?href="https?://[^"]*${esc}[^"]*"[^>]*>`, "g");
    html = html.replace(re, (tag) => {
      if (tag.includes("nofollow")) return tag;
      n++;
      if (/rel="[^"]*"/.test(tag)) return tag.replace(/rel="([^"]*)"/, 'rel="nofollow $1"');
      return tag.replace(/>$/, ' rel="nofollow noopener">');
    });
  }
  return [html, n];
}

function fixDevelopersPage(html) {
  // حذف التمييز البصري لصف عوده
  if (html.includes('<tr class="featured">')) {
    html = html.replaceAll('<tr class="featured">', "<tr>");
    rep("developers", "حُذف class=featured — كل الصفوف متماثلة");
  }
  // بانر الإفصاح أعلى الجدول
  if (!html.includes("disclosure-banner") && html.includes('<div class="table-wrap">')) {
    html = html.replace('<div class="table-wrap">', DISCLOSURE_BANNER + '<div class="table-wrap">');
    rep("developers", "أُضيف بانر الإفصاح أعلى جدول المطورين");
  }
  // nofollow متماثل لكل روابط المطورين الخارجية
  const [out, n] = nofollowDomainLinks(html, DEV_DOMAINS);
  if (n) rep("developers", `nofollow متماثل لـ ${n} رابطًا خارجيًا لمواقع المطورين`);
  return out;
}

// ---------------------------------------------------------------------------
// 1.1 — الرئيسية: حيادية ويدجت الدرجات (المصفوفة كاملة بدل صفين)
// ---------------------------------------------------------------------------
const SCORE_CARD_OLD = `<aside class="score-card"><div><span>عوده للتطوير العقاري</span><b>4.4<small>/5</small></b></div><div><span>الصفوة للتطوير العمراني</span><b>3.3<small>/5</small></b></div><div><span>الملتقى للتطوير العقاري</span><b>3.1<small>/5</small></b></div><div><span>الأشراف للتطوير العقاري</span><b>3<small>/5</small></b></div><div><span>فاليرو للتطوير العقاري</span><b>3<small>/5</small></b></div><div><span>كيان للتطوير العقاري</span><b>2.8<small>/5</small></b></div><p>✓ الدرجات إرشادية ومقيدة بما هو منشور وقابل للمراجعة — نفس المعايير الخمسة على الجميع (<a href="/methodology/">المنهجية</a> · <a href="/disclosure/">الإفصاح</a>).</p></aside>`;
const SCORE_CARD_NEW = `<aside class="score-card"><div><span>الأشراف للتطوير العقاري</span><b>3<small>/5</small></b></div><div><span>عوده للتطوير العقاري</span><b>4.4<small>/5</small></b></div><div><span>الصفوة للتطوير العمراني</span><b>3.3<small>/5</small></b></div><div><span>الملتقى للتطوير العقاري</span><b>3.1<small>/5</small></b></div><div><span>فاليرو للتطوير العقاري</span><b>3<small>/5</small></b></div><div><span>كيان للتطوير العقاري</span><b>2.8<small>/5</small></b></div><p>✓ الدرجات إرشادية ومقيدة بما هو منشور وقابل للمراجعة — نفس المعايير الخمسة على الجميع (<a href="/methodology/">المنهجية</a> · <a href="/disclosure/">الإفصاح</a>).</p></aside>`;

function fixHomepage(html) {
  if (html.includes(SCORE_CARD_OLD)) {
    html = html.replace(SCORE_CARD_OLD, SCORE_CARD_NEW);
    rep("home", "ويدجت الدرجات تعرض المصفوفة كاملة (6 مطورين) مع رابطي المنهجية والإفصاح");
  }
  return html;
}

// ---------------------------------------------------------------------------
// 1.1 — buying-guide: الرابط الخارجي لعوده يصبح nofollow
// ---------------------------------------------------------------------------
function fixBuyingGuide(html) {
  const [out, n] = nofollowDomainLinks(html, ["ouda-developments.com"]);
  if (n) rep("buying-guide", `nofollow لـ ${n} رابط خارجي لعوده في دليل الشراء`);
  return out;
}

// ---------------------------------------------------------------------------
// 1.7 + 1.5 — روابط سياقية: الصفحات الخمس صفرية الروابط + اليتيمة + مشويات
// ---------------------------------------------------------------------------
const RELATED = {
  "/directory/": {
    title: "أدلة شاملة",
    links: [
      ["/living-guide/", "دليل العيش في العبور — الحياة اليومية قبل الانتقال"],
      ["/education-guide/", "دليل التعليم — المدارس والمصاريف وخطوات التسجيل"],
      ["/price-report-q3-2026/", "تقرير أسعار عقارات العبور — الربع الثالث 2026"],
    ],
  },
  "/schools/": {
    title: "أدلة ذات صلة",
    links: [["/education-guide/", "دليل التعليم الشامل في العبور والعبور الجديدة"]],
  },
  "/prices/": {
    title: "قبل أن تقارن الأسعار",
    links: [
      ["/price-report-q3-2026/", "تقرير أسعار الربع الثالث 2026 — منهجية وأرقام مؤرخة"],
      ["/developers/", "قارن المطورين على خمسة معايير منشورة"],
      ["/mistakes/", "أخطاء شائعة في الشراء تجنّبها قبل التوقيع"],
    ],
  },
  "/investment/": {
    title: "موضوعات ذات صلة",
    links: [
      ["/developers/", "دليل المطورين — من تنشر بياناته ومن لا ينشر"],
      ["/prices/", "أسعار العقارات الحالية في العبور"],
      ["/mistakes/", "الأخطاء الشائعة في الاستثمار العقاري"],
    ],
  },
  "/compare/": {
    title: "موضوعات ذات صلة",
    links: [
      ["/prices/", "أحدث أسعار العقارات في العبور"],
      ["/districts/", "خريطة الأحياء والمناطق بالتفصيل"],
    ],
  },
  "/districts/": {
    title: "موضوعات ذات صلة",
    links: [
      ["/compare/", "العبور الجديدة مقابل التجمع والشروق والعاصمة الإدارية"],
      ["/prices/", "أسعار العقارات حسب النطاق"],
      ["/developers/", "من يطوّر كل نطاق وما سجله المنشور"],
    ],
  },
  "/buying-guide/": {
    title: "موضوعات ذات صلة",
    links: [
      ["/mistakes/", "أخطاء شائعة في الشراء — اقرأها قبل التوقيع"],
      ["/developers/", "قارن المطورين بالمعايير الخمسة المنشورة"],
      ["/prices/", "تحقق من مستوى الأسعار الحالي"],
    ],
  },
  "/emergency/": {
    title: "موضوعات ذات صلة",
    links: [["/health/", "دليل الصحة والمستشفيات في العبور"]],
  },
  "/restaurants/": {
    title: "أقسام فرعية",
    links: [
      ["/restaurants/mashawi/", "مطاعم المشويات والحاتي في العبور"],
      ["/restaurants/bakeries/", "المخابز والحلويات"],
      ["/restaurants/cafes/", "الكافيهات والكوفي شوب"],
      ["/restaurants/fast-food/", "الوجبات السريعة"],
    ],
  },
};

function injectRelated(html, slug) {
  const cfg = RELATED[slug];
  if (!cfg || html.includes("related-guides")) return html;
  const links = cfg.links.map(([u, t]) => `<li><a href="${u}">${t}</a></li>`).join("");
  const block = `<section class="section related-guides"><div class="wrap"><h2>${cfg.title}</h2><ul class="related-list">${links}</ul></div></section>`;
  // قبل قسم المصادر إن وُجد، وإلا قبل نهاية main
  if (html.includes('<section class="sources">')) {
    html = html.replace('<section class="sources">', block + '<section class="sources">');
  } else if (html.includes("</main>")) {
    html = html.replace("</main>", block + "</main>");
  } else {
    return html;
  }
  rep("related", `${slug}: أُضيفت ${cfg.links.length} روابط سياقية وصفية`);
  return html;
}

// living-guide: إضافة رابط الصحة في الشريط الجانبي القائم
function fixLivingGuideAside(html) {
  const anchor = '<a class="text-link" href="/schools/">دليل المدارس ↖</a>';
  if (html.includes(anchor) && !html.includes('href="/health/">الصحة والمستشفيات')) {
    html = html.replace(anchor, anchor + '<a class="text-link" href="/health/">الصحة والمستشفيات ↖</a>');
    rep("related", "/living-guide/: رابط الصحة أُضيف للشريط الجانبي");
  }
  return html;
}

// ---------------------------------------------------------------------------
// قالب الصفحات الجديدة (نفس هيكل الموقع)
// ---------------------------------------------------------------------------
const NAV_GROUPS = `
<div class="nav-item"><a href="/">الرئيسية</a></div>
<div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">المدينة <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/about/">عن المدينة</a><a href="/districts/">الأحياء والمناطق</a><a href="/transport/">المواصلات والوصول</a><a href="/compare/">مقارنة المدن</a></div></div>
<div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">السكن والشراء <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/prices/">أسعار العقارات</a><a href="/buying-guide/">دليل الشراء</a><a href="/developers/">دليل المطورين</a><a href="/investment/">الاستثمار العقاري</a><a href="/mistakes/">أخطاء شائعة</a></div></div>
<div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">الخدمات والأدلة <i aria-hidden="true">▾</i></span><div class="nav-drop nav-drop-wide"><a href="/directory/">كل الأدلة</a><a href="/services/">الخدمات والمرافق</a><a href="/health/">الصحة والمستشفيات</a><a href="/schools/">المدارس</a><a href="/pharmacies/">الصيدليات (42)</a><a href="/hospitals/">المستشفيات والمراكز الطبية (19)</a><a href="/clinics/">العيادات والمراكز الطبية (105)</a><a href="/nurseries/">الحضانات والمراكز التعليمية (38)</a><a href="/restaurants/">المطاعم والكافيهات (300)</a><a href="/shopping/">التسوق والمحلات (285)</a><a href="/home-services/">الخدمات المنزلية (66)</a><a href="/professional-services/">الخدمات المهنية (71)</a><a href="/fitness/">اللياقة والتجميل (40)</a><a href="/automotive/">خدمات السيارات (58)</a><a href="/banks/">البنوك والصرافات (78)</a><a href="/real-estate-offices/">المكاتب والشركات العقارية (124)</a><a href="/entertainment/">الترفيه والأنشطة (34)</a><a href="/government-services/">الخدمات الحكومية والعامة (31)</a><a href="/logistics/">النقل والشحن (9)</a><a href="/hotels/">الفنادق والإقامة (2)</a></div></div>
<div class="nav-item nav-accent"><a href="/emergency/">الطوارئ</a></div>
<div class="nav-item"><a href="/faq/">الأسئلة</a></div>`;

function siteHeader() {
  return `<header class="site-header"><div class="wrap header-row"><a class="brand" href="/"><img src="/brand/logo.svg" width="46" height="46" alt="رمز دليل العبور والعبور الجديدة"><span><b>دليل</b><em>العبور والعبور الجديدة</em><small>العبور · العبور الجديدة</small></span></a><nav class="desktop-nav" aria-label="التنقل الرئيسي">${NAV_GROUPS}</nav><form class="site-search" role="search" action="/search/" method="get"><input type="search" name="q" placeholder="ابحث…" aria-label="ابحث في الدليل" required><button type="submit" aria-label="بحث">⌕</button></form><details class="mobile-menu"><summary aria-label="فتح قائمة التنقل">☰</summary><nav aria-label="التنقل الرئيسي للموبايل"><form class="m-search" role="search" action="/search/" method="get"><input type="search" name="q" placeholder="ابحث في الدليل…" aria-label="ابحث في الدليل" required><button type="submit">⌕</button></form><a class="m-solo" href="/">الرئيسية</a><details class="m-group"><summary>المدينة</summary><div><a href="/about/">عن المدينة</a><a href="/districts/">الأحياء والمناطق</a><a href="/transport/">المواصلات والوصول</a><a href="/compare/">مقارنة المدن</a></div></details><details class="m-group"><summary>السكن والشراء</summary><div><a href="/prices/">أسعار العقارات</a><a href="/buying-guide/">دليل الشراء</a><a href="/developers/">دليل المطورين</a><a href="/investment/">الاستثمار العقاري</a><a href="/mistakes/">أخطاء شائعة</a></div></details><details class="m-group"><summary>الخدمات والأدلة</summary><div><a href="/directory/">كل الأدلة</a><a href="/services/">الخدمات والمرافق</a><a href="/health/">الصحة والمستشفيات</a><a href="/schools/">المدارس</a><a href="/pharmacies/">الصيدليات (42)</a><a href="/hospitals/">المستشفيات والمراكز الطبية (19)</a><a href="/clinics/">العيادات والمراكز الطبية (105)</a><a href="/nurseries/">الحضانات والمراكز التعليمية (38)</a><a href="/restaurants/">المطاعم والكافيهات (300)</a><a href="/shopping/">التسوق والمحلات (285)</a><a href="/home-services/">الخدمات المنزلية (66)</a><a href="/professional-services/">الخدمات المهنية (71)</a><a href="/fitness/">اللياقة والتجميل (40)</a><a href="/automotive/">خدمات السيارات (58)</a><a href="/banks/">البنوك والصرافات (78)</a><a href="/real-estate-offices/">المكاتب والشركات العقارية (124)</a><a href="/entertainment/">الترفيه والأنشطة (34)</a><a href="/government-services/">الخدمات الحكومية والعامة (31)</a><a href="/logistics/">النقل والشحن (9)</a><a href="/hotels/">الفنادق والإقامة (2)</a></div></details><a class="m-solo" href="/emergency/">الطوارئ</a><a class="m-solo" href="/faq/">الأسئلة</a></nav></details></div></header>`;
}

function siteFooter() {
  return `<footer class="site-footer"><div class="wrap footer-grid"><section><div class="footer-brand"><img src="/brand/logo.svg" width="44" height="44" alt="رمز دليل العبور والعبور الجديدة"><b>دليل العبور والعبور الجديدة</b></div><p>هذا الدليل والتقييمات والمقارنات مبنية على معايير منشورة قابلة للتحقق، ونرحّب بأي تصحيح موثّق.</p><p class="last-updated">آخر تحديث: أغسطس 2026</p></section><section><h2>مسارات الدليل</h2><a href="/directory/">دليل الخدمات</a><a href="/districts/">الأحياء</a><a href="/prices/">الأسعار</a><a href="/developers/">دليل المطورين</a><a href="/emergency/">الطوارئ</a><a href="/search/">بحث</a></section>${FOOTER_ABOUT}</div><div class="wrap footer-base"><span>© 2026 دليل العبور والعبور الجديدة</span><span>معلوماتي · قابل للمراجعة · مصادر منشورة</span></div></footer>`;
}

function makePage({ slug, title, description, h1, tag, crumb, body, extraSchemas = [] }) {
  const url = SITE + slug;
  const schemas = [
    { "@context": "https://schema.org", "@type": "WebPage", "name": h1, "url": url, "inLanguage": "ar-EG", "datePublished": DEFAULT_LASTMOD, "dateModified": DEFAULT_LASTMOD, "publisher": { "@id": SITE + "/#org" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": crumb, "item": url },
    ]},
    ORG_NODE,
    ...extraSchemas,
  ];
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><link rel="canonical" href="${url}"><meta name="theme-color" content="#3E6B4A"><meta property="og:type" content="website"><meta property="og:locale" content="ar_EG"><meta property="og:site_name" content="دليل العبور والعبور الجديدة"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://obourguide.com/brand/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="/brand/logo.svg"><link rel="apple-touch-icon" href="/brand/logo.png"><link rel="stylesheet" href="/static/site.css?v=aba77274"><link rel="stylesheet" href="/static/schools-directory.css?v=1de726d4">${ld}</head><body>${siteHeader()}<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="https://obourguide.com/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">${crumb}</span></li></ol></div></nav><main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}</article><aside class="action-card"><p>صفحات الناشر</p><a class="text-link" href="/about-us/">من نحن ↖</a><a class="text-link" href="/methodology/">منهجية التقييم ↖</a><a class="text-link" href="/editorial-policy/">السياسة التحريرية ↖</a><a class="text-link" href="/disclosure/">الإفصاح والشفافية ↖</a><a class="text-link" href="/sources/">المصادر ↖</a><a class="text-link" href="/corrections/">سياسة التصحيح ↖</a><a class="text-link" href="/privacy/">الخصوصية ↖</a><a class="text-link" href="/contact/">تواصل معنا ↖</a></aside></div></section></main>${siteFooter()}</body></html>`;
}

// ---------------------------------------------------------------------------
// 1.4 — محتوى صفحات الناشر الثماني
// ---------------------------------------------------------------------------
const PUBLISHER_PAGES = [
  {
    slug: "/about-us/", crumb: "من نحن", tag: "عن الدليل",
    title: "من نحن — دليل العبور والعبور الجديدة | دليل العبور",
    description: "من يقف خلف دليل العبور والعبور الجديدة، وما نطاق تغطيته، وكيف يعمل.",
    h1: "من نحن",
    body: `<h2>ما هذا الموقع؟</h2>
<p>دليل العبور والعبور الجديدة دليل معلوماتي مستقل عن مدينة العبور القائمة ومدينة العبور الجديدة. يجمع أكثر من 1,300 مدخل خدمة — صيدليات ومستشفيات وعيادات ومدارس ومطاعم وتسوق وخدمات منزلية — بالاسم والعنوان والهاتف والمصدر، إضافة إلى أدلة الأحياء والأسعار والمواصلات والمطورين وخطوات الشراء.</p>
<h2>كيف نعمل؟</h2>
<p>كل مدخل في الدليل مبني على مصدر منشور يمكنك فحصه بنفسك: مواقع رسمية، صفحات معلنة للأنشطة، وبيانات حكومية. لا ننشر رقمًا أو عنوانًا لا نستطيع نسبه إلى مصدر، ونذكر حدود المعلومة عندما تكون ناقصة بدل ملء الفراغ بادعاءات.</p>
<h2>الاستقلالية والشفافية</h2>
<p>يلتزم الدليل بمعايير تحقق موحدة تُطبق على الجميع دون استثناء. توجد علاقة بين الدليل وإحدى شركات التطوير العقاري المُقيَّمة في صفحة المطورين، وهي موضحة بالكامل في <a href="/disclosure/">صفحة الإفصاح</a> — لم تُستثنَ الشركة من التقييم ولم تُمنح معايير مختلفة.</p>
<h2>ماذا لا نفعل؟</h2>
<p>لا نبيع ترتيبًا ولا نعرض «تمييزًا» مدفوعًا داخل الجداول، ولا نقبل إدراج أي نشاط مقابل مقابل مالي، ولا ننشر بيانات اتصال لم نتحقق منها. أي جهة ترى خطأ في بياناتها يمكنها طلب التصحيح عبر <a href="/corrections/">سياسة التصحيح</a>.</p>`,
  },
  {
    slug: "/contact/", crumb: "تواصل معنا", tag: "تواصل",
    title: "تواصل معنا | دليل العبور",
    description: "قناة التواصل الرسمية مع فريق دليل العبور والعبور الجديدة: تصحيحات، إضافات، واستفسارات.",
    h1: "تواصل معنا",
    body: `<h2>للتصحيحات والإضافات</h2>
<p>إذا كنت صاحب نشاط مدرج في الدليل ولاحظت خطأ في الاسم أو العنوان أو رقم الهاتف، أو إذا كان نشاطك غير مدرج وتريد إضافته، راسلنا على: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> مع ذكر اسم النشاط كما يظهر في الدليل ومصدر يدعم التصحيح (صفحة رسمية أو مستند).</p>
<h2>للاستفسارات العامة</h2>
<p>نرحب بأسئلة القراء عن منهجية التقييم ومصادر البيانات عبر نفس البريد. نرد عادة خلال أيام عمل، وننشر التصحيحات الجوهرية في <a href="/corrections/">سجل التصحيحات</a>.</p>
<h2>ملاحظة مهمة</h2>
<p>الدليل معلوماتي ولا يقدم استشارات عقارية أو قانونية، ولا يتوسط في أي عملية بيع أو شراء. القرارات المالية الكبيرة تستحق مراجعة مستندات رسمية ومشورة متخصصة مستقلة.</p>`,
  },
  {
    slug: "/editorial-policy/", crumb: "السياسة التحريرية", tag: "الشفافية",
    title: "السياسة التحريرية | دليل العبور",
    description: "المعايير التحريرية لدليل العبور: مصادر النشر، التحقق، الاستقلالية، وحدود المعلومات.",
    h1: "السياسة التحريرية",
    body: `<h2>مبدأ الدليل قبل الدرجة</h2>
<p>لا نُصدر أحكامًا مطلقة على أي شركة أو نشاط. ننشر ما هو موثق وقابل للفحص، ونذكر صراحة ما هو ناقص. عندما تتفوق جهة في معيار ما فلأنها تنشر دليلًا أقوى فيه — لا لأي اعتبار آخر.</p>
<h2>مصادر النشر المقبولة</h2>
<p>المواقع الرسمية للجهات الحكومية، الصفحات الرسمية للأنشطة التجارية، البيانات الصحفية الموقعة، والأدلة التجارية المنشورة مثل يلو بيدجز. كل مدخل يحمل اسم مصدره.</p>
<h2>التحقق والتحديث</h2>
<p>تُراجع الأقسام دوريًا ويظهر تاريخ آخر مراجعة أسفل كل صفحة. البيانات قد تتغير بعد تاريخ المراجعة؛ لذلك نطلب من القارئ تحويل أي معلومة جوهرية إلى مستند قبل الاعتماد عليها في قرار شراء.</p>
<h2>الاستقلالية</h2>
<p>لا يقبل الدليل محتوى إعلانيًا مموّهًا، ولا روابط مدفوعة داخل المحتوى التحريري. العلاقات التي قد تُعد تضارب مصالح تُفصح علنًا في <a href="/disclosure/">صفحة الإفصاح</a> وتُدار بمعايير موحدة على الجميع.</p>
<h2>الأخطاء</h2>
<p>عند اكتشاف خطأ نصححه ونوثق التصحيح في <a href="/corrections/">سجل التصحيحات</a> دون حذف صامت.</p>`,
  },
  {
    slug: "/methodology/", crumb: "منهجية التقييم", tag: "الشفافية",
    title: "منهجية تقييم المطورين: المعايير الخمسة مشروحة | دليل العبور",
    description: "تعريف كل معيار من معايير تقييم المطورين الخمسة، والدليل المطلوب فيه، وتاريخ المراجعة، وآلية الاعتراض.",
    h1: "منهجية تقييم المطورين",
    body: `<h2>لماذا خمسة معايير؟</h2>
<p>شراء وحدة على الخريطة قرار مخاطرة. حوّلنا المخاطرة إلى خمسة أسئلة قابلة للفحص، وكل معيار يقيس جانبًا مختلفًا منها.</p>
<h2>المعيار الأول: سابقة الأعمال المسلّمة</h2>
<p>السؤال: هل سلّم المطور وحدات قائمة يمكن زيارتها؟ الدليل المقبول: عدد وحدات معلن بتاريخ تسليم محدد، أو مبانٍ قائمة يمكن معاينتها. التصريح الصحفي وحده لا يكفي للدرجة الكاملة.</p>
<h2>المعيار الثاني: إدارة ما بعد التسليم</h2>
<p>السؤال: من يدير المشروع بعد البيع وبأي خبرة؟ الدليل المقبول: اسم جهة إدارة منشور مع سجل تشغيل معلن. غياب الاسم يعني درجة منخفضة مهما كان حجم الشركة.</p>
<h2>المعيار الثالث: الملاءة المالية</h2>
<p>السؤال: كيف يموّل المطور التنفيذ؟ الدليل المقبول: شراكات مؤسسية أو تمويل مصرفي معلن بقيمة وطرف مسمّى، أو إفصاحات مالية رسمية.</p>
<h2>المعيار الرابع: شفافية التعاقد</h2>
<p>السؤال: هل المواصفات والتكاليف مكتوبة ومعلنة؟ الدليل المقبول: قائمة أسعار بسعر المتر وأنظمة سداد وموعد تسليم، ومواصفات تشطيب، وعقد نموذجي. لا أحد من المطورين الستة ينشر عقدًا نموذجيًا حتى تاريخ المراجعة.</p>
<h2>المعيار الخامس: البناء والكثافة</h2>
<p>السؤال: ما نسبة البناء والارتفاعات والمساحات المفتوحة؟ الدليل المقبول: نسبة بناء معلنة لمشروع بعينه مع الارتفاعات.</p>
<h2>الدرجة وتاريخ المراجعة</h2>
<p>الدرجة من 5 إرشادية وتعكس حجم ما هو منشور وقت آخر مراجعة (أغسطس 2026)، لا جودة الشركة المطلقة. شركة ممتازة لا تنشر بياناتها تحصل على درجة منخفضة هنا — وهذا مقصود.</p>
<h2>آلية الاعتراض</h2>
<p>أي مطور يرى أن بياناته المنشورة أقوى مما ظهر في الجدول يراسلنا عبر <a href="/contact/">صفحة التواصل</a> بروابط البيانات، وتُراجع وتُحدَّث الدرجة في المراجعة التالية مع توثيق التغيير في <a href="/corrections/">سجل التصحيحات</a>. العلاقة بين الدليل وإحدى الشركات المُقيَّمة موضحة في <a href="/disclosure/">صفحة الإفصاح</a>.</p>`,
  },
  {
    slug: "/disclosure/", crumb: "الإفصاح والشفافية", tag: "الشفافية",
    title: "الإفصاح: علاقة الدليل بعوده للتطوير العقاري | دليل العبور",
    description: "إفصاح كامل عن العلاقة بين دليل العبور وعوده للتطوير العقاري، وكيف نديرها تحريريًا.",
    h1: "الإفصاح والشفافية",
    body: `<h2>ما العلاقة؟</h2>
<p>دليل العبور والعبور الجديدة يرتبط بعلاقة مع <strong>عوده للتطوير العقاري</strong>، إحدى شركات التطوير العاملة في مدينة العبور والمُقيَّمة في <a href="/developers/">جدول المطورين</a>.</p>
<h2>لماذا لم نستثنِها من الجدول؟</h2>
<p>لأن حذف مطوّر قائم ومعروف في المدينة يُضعف الدليل ويضلل القارئ. الخيار الصحيح ليس الإخفاء بل الإفصاح: تبقى الشركة في الجدول، وتُحسب درجتها بنفس المعايير الخمسة المنشورة المطبقة على الجميع، وبنفس مصادر التحقق.</p>
<h2>كيف ندير العلاقة عمليًا؟</h2>
<p>لا تمييز بصري لأي شركة في الجدول — كل الصفوف بشكل واحد. كل الروابط الخارجية لمواقع المطورين، بما فيها موقع عوده، تحمل السمة نفسها (nofollow) دون استثناء. الدرجة تتبع ما هو منشور وقابل للفحص فقط، وأي جهة — بما فيها عوده — لا تحصل على درجة في معيار لا تنشر دليله.</p>
<h2>أين يظهر أثر ذلك؟</h2>
<p>في الجدول الحالي لا تتصدر عوده كل المعايير: الملتقى أعلى في الكثافة، والصفوة أوضح في توثيق التسليم، وفاليرو هي الوحيدة التي تنشر جهة إدارة باسمها. هذه النتائج منشورة كما هي لأن المعايير تحكمها.</p>
<h2>التزامنا</h2>
<p>إذا تغيرت العلاقة أو نطاقها سنحدّث هذه الصفحة ونوثق التغيير في <a href="/corrections/">سجل التصحيحات</a>. وأي قارئ يرى أن العلاقة أثرت على محتوى بعينه يمكنه الاعتراض عبر <a href="/contact/">صفحة التواصل</a>.</p>`,
  },
  {
    slug: "/corrections/", crumb: "سياسة التصحيح", tag: "الشفافية",
    title: "سياسة التصحيح وسجل التصحيحات | دليل العبور",
    description: "كيف نصحح الأخطاء في دليل العبور، وسجل موثق بالتصحيحات الجوهرية.",
    h1: "سياسة التصحيح",
    body: `<h2>كيف تطلب تصحيحًا؟</h2>
<p>راسلنا عبر <a href="/contact/">صفحة التواصل</a> مع: اسم الصفحة، والمعلومة كما تظهر، والصحيح منها، ومصدر يدعم التصحيح (رابط رسمي أو مستند). الطلبات بلا مصدر تُراجع لكنها لا تُنشر حتى تُوثق.</p>
<h2>ماذا يحدث بعد ذلك؟</h2>
<p>نراجع الطلب مقابل المصدر، ونصحح المعلومة، ونحدّث تاريخ المراجعة في الصفحة. التصحيحات الجوهرية — التي تغيّر درجة أو حقيقة رئيسية — تُوثق في السجل أدناه بتاريخها.</p>
<h2>سجل التصحيحات</h2>
<p>أغسطس 2026 — إطلاق نظام التوثيق هذا. لا توجد تصحيحات جوهرية مسجلة قبل هذا التاريخ. سيُحدَّث هذا السجل مع كل تصحيح مستقبلي.</p>`,
  },
  {
    slug: "/sources/", crumb: "المصادر", tag: "التوثيق",
    title: "مصادر الدليل المفتوحة | دليل العبور",
    description: "المصادر الرسمية والمنشورة التي يعتمد عليها دليل العبور والعبور الجديدة.",
    h1: "المصادر",
    body: `<h2>مصادر حكومية ورسمية</h2>
<ol><li><a href="https://lands.nuca.gov.eg/ar/ViewCity.aspx?ID=16" target="_blank" rel="noopener noreferrer nofollow">هيئة المجتمعات العمرانية الجديدة — مخطط مدينة العبور الجديدة ↗</a> — المساحات والتقسيمات التخطيطية.</li>
<li><a href="http://www.nat.gov.eg/LocationActivity.aspx?id=2085" target="_blank" rel="noopener noreferrer nofollow">الهيئة القومية للأنفاق — القطار الكهربائي الخفيف LRT ↗</a> — مسار القطار ومحطاته.</li>
<li><a href="https://www.arabcont.com/english/project-628" target="_blank" rel="noopener noreferrer nofollow">المقاولون العرب — مسار LRT ومحطاته ↗</a> — توثيق تنفيذي للمسار.</li></ol>
<h2>مصادر الأدلة التجارية</h2>
<p>أدخلات الدليل الخدمي (الأسماء والعناوين والهواتف) مصدرها أدلة تجارية منشورة — في مقدمتها يلو بيدجز — ويظهر اسم المصدر أسفل كل مدخل. هذه البيانات تتغير باستمرار؛ راجع تاريخ آخر تحديث أسفل كل صفحة وتحقق هاتفيًا قبل الزيارة.</p>
<h2>مصادر تقييم المطورين</h2>
<p>المواقع الرسمية للمطورين الستة والبيانات الصحفية الموقعة، ومخططات المشروعات المعلنة. تفاصيل المعايير في <a href="/methodology/">صفحة المنهجية</a>.</p>`,
  },
  {
    slug: "/privacy/", crumb: "الخصوصية", tag: "الخصوصية",
    title: "سياسة الخصوصية | دليل العبور",
    description: "ما البيانات التي يجمعها دليل العبور من زواره — والإجابة المختصرة: شبه لا شيء.",
    h1: "سياسة الخصوصية",
    body: `<h2>ما الذي نجمعه؟</h2>
<p>الموقع ثابت (Static) ولا يتطلب تسجيلًا ولا حسابات ولا يجمع بيانات شخصية عن الزوار. البحث داخل الموقع يتم عبر ملف فهرس محلي دون إرسال استعلامك إلى خوادم خارجية.</p>
<h2>ملفات تعريف الارتباط والتحليلات</h2>
<p>لا نستخدم ملفات تعريف ارتباط تتبعية ولا نركّب أدوات تحليلات تحدد هوية الزائر. قد يسجل مزود الاستضافة سجلات تقنية قياسية (عنوان IP ونوع المتصفح) لأغراض الأمان والتشغيل فقط.</p>
<h2>الروابط الخارجية</h2>
<p>روابط الخرائط والمواقع الرسمية تنقلك إلى خدمات طرف ثالث لها سياساتها الخاصة. راجع سياسة خصوصية أي موقع تنتقل إليه قبل مشاركة بياناتك معه.</p>
<h2>التواصل</h2>
<p>إذا راسلتنا عبر البريد في <a href="/contact/">صفحة التواصل</a> نستخدم بريدك للرد على طلبك فقط، ولا ننشئ قوائم تسويقية ولا نشارك بياناتك مع أي طرف.</p>`,
  },
];

// ---------------------------------------------------------------------------
// 1.5 — صفحة /restaurants/mashawi/ من بيانات الدليل نفسها
// ---------------------------------------------------------------------------
const MASHAWI_RE = /b\.?b\.?q|kabab|kababgy|kababji|mashaw|mashwy|haty|hawawshi|grill|كباب|مشوي|حاتي|حواوشي/i;

function buildMashawiPage() {
  const dataPath = path.join(root, "data", "directories", "restaurants.json");
  if (!fs.existsSync(dataPath)) {
    rep("mashawi", "تعذر العثور على data/directories/restaurants.json — تخطّي إنشاء الصفحة");
    return null;
  }
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const items = (data.items || []).filter((it) => it.c === "مطاعم" && (MASHAWI_RE.test(it.n) || MASHAWI_RE.test(it.e || "")));
  if (!items.length) {
    rep("mashawi", "لا نتائج مطابقة للمشويات — تخطّي");
    return null;
  }
  const cards = items.map((it, i) => {
    const tel = it.t ? `<a class="dir-call" href="tel:${normalizeTel(it.t)}">☎ ${it.p || it.t}</a>` : "";
    const q = encodeURIComponent(`${it.n} ${it.a}`);
    const map = `<a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener noreferrer nofollow">الخريطة ↗</a>`;
    return `<article class="dir-item" id="business-${i + 1}"><h4>${it.n}</h4><p class="dir-addr">⌖ ${it.a}</p><div class="dir-actions">${tel}${map}</div><small>المصدر: ${it.s}</small></article>`;
  }).join("");
  const schema = {
    "@context": "https://schema.org", "@type": "ItemList",
    "name": "مطاعم المشويات والحاتي في العبور",
    "numberOfItems": items.length,
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem", "position": i + 1,
      "item": {
        "@type": "Restaurant",
        "@id": `${SITE}/restaurants/mashawi/#business-${i + 1}`,
        "name": it.n,
        "url": `${SITE}/restaurants/mashawi/#business-${i + 1}`,
        ...(it.t ? { "telephone": normalizeTel(it.t) } : {}),
        "address": { "@type": "PostalAddress", "streetAddress": it.a, "addressLocality": "مدينة العبور", "addressRegion": "القليوبية", "addressCountry": "EG" },
      },
    })),
  };
  const body = `<h2>مطاعم المشويات والحاتي في العبور</h2>
<p>قسم فرعي من <a href="/restaurants/">دليل المطاعم والكافيهات</a> يجمع محلات المشويات والكباب والحاتي والحواوشي في مدينة العبور بالاسم والعنوان ورقم الهاتف والمصدر. ${items.length} مكانًا مدرجًا حتى آخر مراجعة.</p>
<div class="dir-list">${cards}</div>
<p class="caption">البيانات من أدلة تجارية منشورة ويظهر مصدر كل مدخل أسفله. تحقق هاتفيًا قبل الزيارة، وصحّح أي معلومة عبر <a href="/contact/">صفحة التواصل</a>.</p>`;
  return makePage({
    slug: "/restaurants/mashawi/",
    title: "مطاعم المشويات والحاتي في العبور: الأسماء والعناوين والهواتف | دليل العبور",
    description: `دليل مطاعم المشويات والكباب والحاتي في مدينة العبور: ${items.length} مكانًا بالاسم والعنوان والهاتف والمصدر.`,
    h1: "مطاعم المشويات والحاتي في العبور",
    tag: "قسم فرعي · مطاعم",
    crumb: "المشويات",
    body,
    extraSchemas: [schema],
  });
}

// ---------------------------------------------------------------------------
// 1.3 — إعادة بناء sitemap.xml من ملفات الصفحات الفعلية
// ---------------------------------------------------------------------------
const SITEMAP_EXCLUDE = new Set([
  "/404/", "/search/",
  "/dining-guide/", "/shopping-guide/", "/health-guide/", // دُمجت بتحويلات 301
]);

function rebuildSitemap(files) {
  const entries = [];
  for (const f of files) {
    const slug = slugOf(f);
    if (SITEMAP_EXCLUDE.has(slug)) continue;
    const html = fs.readFileSync(f, "utf8");
    entries.push({ slug, lastmod: pageLastmod(html) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  const out = path.join(clientDir, "public", "sitemap.xml");
  fs.writeFileSync(out, xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة فريدة شاملة الرئيسية، بـ lastmod حقيقي وبلا changefreq/priority`);
}

// ---------------------------------------------------------------------------
// التنفيذ
// ---------------------------------------------------------------------------
function main() {
  let files = listPageFiles();

  for (const file of files) {
    const slug = slugOf(file);
    let html = fs.readFileSync(file, "utf8");
    const before = html;

    html = interpolatePlaceholders(html, slug);   // 1.5
    html = fixTel(html, slug);                    // 1.2
    html = nofollowMaps(html, slug);              // 1.10
    html = fixBusinessAnchors(html, slug);        // 1.6
    html = fixSchemaDatesAndOrg(html, slug);      // 1.8
    html = fixFooter(html, slug);                 // 1.10
    html = fixTitleSuffix(html, slug);            // 1.11
    html = injectRelated(html, slug);             // 1.7 + 1.5
    if (slug === "/developers/") html = fixDevelopersPage(html);   // 1.1
    if (slug === "/") html = fixHomepage(html);                    // 1.1
    if (slug === "/buying-guide/") html = fixBuyingGuide(html);    // 1.1
    if (slug === "/living-guide/") html = fixLivingGuideAside(html); // 1.7

    if (html !== before) fs.writeFileSync(file, html);
  }

  // 1.4 — صفحات الناشر الثماني
  for (const p of PUBLISHER_PAGES) {
    const file = path.join(clientDir, p.slug.replace(/^\//, "").replace(/\/$/, ""), "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, makePage(p));
    rep("publisher", `${p.slug} أُنشئت`);
  }

  // 1.5 — صفحة المشويات
  const mashawi = buildMashawiPage();
  if (mashawi) {
    const file = path.join(clientDir, "restaurants", "mashawi", "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, mashawi);
    rep("mashawi", "/restaurants/mashawi/ أُنشئت");
  }

  // 1.3 — خريطة الموقع (بعد إنشاء كل الصفحات)
  rebuildSitemap(listPageFiles());

  console.log("=== تقرير إصلاحات المرحلة الأولى ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
