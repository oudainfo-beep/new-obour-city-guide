/**
 * seo-phase8-en-category-pages.mjs
 * المرحلة الثامنة (8.3): نسخ إنجليزية لصفحات الأدلة المحلية.
 *
 * تنشئ:
 *   /en/restaurants/ · /en/hospitals/ · /en/schools/
 *   /en/pharmacies/ · /en/clinics/
 *
 * وتضيف:
 *   - hreflang متبادل مع الصفحات العربية المقابلة.
 *   - رابط English في الفوتر (idempotent).
 *
 * لا تُعيد بناء sitemap — تبقى مهمة آخر سكربت في السلسلة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// ---------------------------------------------------------------------------
// استعارة الهيكل من about-us
// ---------------------------------------------------------------------------
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
    name: "Obour Guide",
    url: SITE + "/",
    logo: "https://obourguide.com/brand/logo.png",
    foundingDate: "2026",
    publishingPrinciples: SITE + "/editorial-policy/",
  };
}

function buildHead(head, { title, description, url, schemas, arUrl }) {
  let h = head;
  h = h.replace(/<html lang="ar" dir="rtl">/, `<html lang="en" dir="ltr">`);
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  h = h.replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="en_US">`);
  if (!h.includes('property="og:locale:alternate"')) {
    h = h.replace(/<meta property="og:locale" content="en_US">/, `<meta property="og:locale" content="en_US"><meta property="og:locale:alternate" content="ar_EG">`);
  }
  const hreflang = `<link rel="alternate" hreflang="ar" href="${arUrl}"><link rel="alternate" hreflang="en" href="${url}"><link rel="alternate" hreflang="x-default" href="${arUrl}">`;
  if (!h.includes('hreflang="en"')) {
    h = h.replace(/<link rel="canonical" href="[^"]*">/, (m) => `${m}${hreflang}`);
  }
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

const EN_LINK_MAP = {
  'href="/"': 'href="/en/"',
  'href="/about/"': 'href="/en/about/"',
  'href="/districts/"': 'href="/en/districts/"',
  'href="/prices/"': 'href="/en/prices/"',
  'href="/developers/"': 'href="/en/developers/"',
  'href="/buying-guide/"': 'href="/en/buying-guide/"',
  'href="/living-guide/"': 'href="/en/living-guide/"',
  'href="/compounds/"': 'href="/en/compounds/"',
  'href="/restaurants/"': 'href="/en/restaurants/"',
  'href="/hospitals/"': 'href="/en/hospitals/"',
  'href="/schools/"': 'href="/en/schools/"',
  'href="/pharmacies/"': 'href="/en/pharmacies/"',
  'href="/clinics/"': 'href="/en/clinics/"',
};

function translateInternalLinks(html) {
  let out = html;
  for (const [ar, en] of Object.entries(EN_LINK_MAP)) {
    out = out.split(ar).join(en);
  }
  return out;
}

function translateChrome({ header, footer }) {
  const labelMap = {
    'aria-label="التنقل الرئيسي"': 'aria-label="Main navigation"',
    '>المدينة <': '>City <',
    '>المدينة<': '>City<',
    '<summary>المدينة</summary>': '<summary>City</summary>',
    '>عن المدينة<': '>About the City<',
    '>الأحياء والمناطق<': '>Districts<',
    '>المواصلات والوصول<': '>Transport<',
    '>مقارنة المدن<': '>Compare Cities<',
    '>السكن والشراء <': '>Living & Buying <',
    '>السكن والشراء<': '>Living & Buying<',
    '<summary>السكن والشراء</summary>': '<summary>Living & Buying</summary>',
    '>أسعار العقارات<': '>Prices<',
    '>دليل الشراء<': '>Buying Guide<',
    '>دليل المطورين<': '>Developers<',
    '>الاستثمار العقاري<': '>Investment<',
    '>أخطاء شائعة<': '>Common Mistakes<',
    '>الخدمات<': '>Services<',
    '>الخدمات <': '>Services <',
    '>التعليم<': '>Education<',
    '>الصحة<': '>Health<',
    '>الأسعار والتقارير <': '>Prices & Reports <',
    '>الأسعار والتقارير<': '>Prices & Reports<',
    '<summary>الأسعار والتقارير</summary>': '<summary>Prices & Reports</summary>',
    '>تقرير الأسعار Q3 2026<': '>Price Report Q3 2026<',
    '>الطوارئ والأسئلة <': '>Emergency & FAQ <',
    '>الطوارئ والأسئلة<': '>Emergency & FAQ<',
    '<summary>الطوارئ والأسئلة</summary>': '<summary>Emergency & FAQ</summary>',
    '>الطوارئ<': '>Emergency<',
    '>الأسئلة الشائعة<': '>FAQ<',
    '>الخريطة<': '>Map<',
    '>إجراءات حكومية<': '>Government Procedures<',
    'placeholder="ابحث…"': 'placeholder="Search…"',
    'aria-label="ابحث في الدليل"': 'aria-label="Search the guide"',
    'aria-label="بحث"': 'aria-label="Search"',
    '>مسارات الدليل<': '>Guide Paths<',
    '>دليل الخدمات<': '>Service Directory<',
    '>البيانات المفتوحة<': '>Open Data<',
    '>الأحياء<': '>Districts<',
    '>الأسعار<': '>Prices<',
    '>بحث<': '>Search<',
    '>عن الدليل<': '>About the Guide<',
    '>من نحن<': '>About Us<',
    '>منهجية التقييم<': '>Methodology<',
    '>السياسة التحريرية<': '>Editorial Policy<',
    '>الإفصاح والشفافية<': '>Disclosure<',
    '>المصادر<': '>Sources<',
    '>سياسة التصحيح<': '>Corrections<',
    '>الخصوصية<': '>Privacy<',
    '>تواصل معنا<': '>Contact<',
    '>آخر تحديث: أغسطس 2026<': '>Last updated: August 2026<',
    '>هذا الدليل والتقييمات والمقارنات مبنية على معايير منشورة قابلة للتحقق، ونرحّب بأي تصحيح موثّق.<': '>This guide, ratings, and comparisons are based on published, verifiable criteria. Documented corrections are welcome.<',
    '>معلوماتي · قابل للمراجعة · مصادر منشورة<': '>Factual · Reviewable · Published Sources<',
    'alt="رمز دليل العبور والعبور الجديدة"': 'alt="Obour Guide logo"',
  };
  let h = header;
  let f = footer;
  for (const [ar, en] of Object.entries(labelMap)) {
    h = h.split(ar).join(en);
    f = f.split(ar).join(en);
  }
  return { header: h, footer: f };
}

function addEnglishLinkToAllFooters() {
  const marker = 'href="/en/">English';
  let touched = 0;
  let skipped = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "index.html") {
        let html = fs.readFileSync(full, "utf8");
        if (!html.includes(marker)) {
          html = html.replace(
            /(<section>\s*<h2>مسارات الدليل<\/h2>\s*<a href="\/directory\/">دليل الخدمات<\/a>)/,
            '$1<a href="/en/">English</a>'
          );
          fs.writeFileSync(full, html);
          touched++;
        } else {
          skipped++;
        }
      }
    }
  };
  walk(clientDir);
  rep("footer", `أُضيف رابط English في ${touched} صفحة؛ تُخطّى ${skipped} صفحة موجودة مسبقًا.`);
}

function pageShell(chrome, { title, description, url, arUrl, h1, tag, breadcrumbItems, body, schemasExtra = [] }) {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: h1,
      url,
      inLanguage: "en-US",
      datePublished: DEFAULT_LASTMOD,
      dateModified: DEFAULT_LASTMOD,
      publisher: { "@id": SITE + "/#org" },
      description,
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1,
      url,
      inLanguage: "en-US",
      isPartOf: { "@id": SITE + "/#org" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.item,
      })),
    },
    orgNode(),
    ...schemasExtra,
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas, arUrl });
  const translated = translateChrome({ header: chrome.header, footer: chrome.footer });
  const header = translateInternalLinks(translated.header);
  const footer = translateInternalLinks(translated.footer);
  const breadcrumb = `<nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><ol>${breadcrumbItems
    .map((it, i) => {
      if (i === breadcrumbItems.length - 1) {
        return `<li><span aria-current="page">${it.name}</span></li>`;
      }
      return `<li><a href="${it.item}">${it.name}</a></li><li class="sep">›</li>`;
    })
    .join("")}</ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap content-grid"><article>${body}</article><aside class="action-card"><p>Important pages</p><a class="text-link" href="/en/">Home ↖</a><a class="text-link" href="/en/restaurants/">Restaurants ↖</a><a class="text-link" href="/en/hospitals/">Hospitals ↖</a><a class="text-link" href="/en/schools/">Schools ↖</a><a class="text-link" href="/en/pharmacies/">Pharmacies ↖</a><a class="text-link" href="/en/clinics/">Clinics ↖</a><a class="text-link" href="/">النسخة العربية ↖</a></aside></div></section></main>`;
  return `<!doctype html>${head.replace(/<head>/, `<html lang="en" dir="ltr"><head>`).replace(/<\/head>/, `</head><body>`)}${header}${breadcrumb}${main}${footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// الصفحات الخمس
// ---------------------------------------------------------------------------
function restaurantsPage(chrome) {
  const arUrl = `${SITE}/restaurants/`;
  const url = `${SITE}/en/restaurants/`;
  const title = "Restaurants & Cafes in Obour: 300+ Listings with Addresses";
  const description = "300+ restaurants and cafes in Obour and New Obour: names, addresses, phones, and categories. Use it to test delivery coverage before choosing a district.";
  const h1 = "Restaurants & Cafes in Obour";
  const body = `
<p>Restaurants and cafes are a quick signal of how mature a neighborhood is. In Obour, the highest concentration sits on main axes and in high-density districts, but density is not evenly distributed. Some areas rely on one commercial cluster that gets crowded in the evening.</p>

<p>Before you move, test three things: which restaurants deliver to your exact address, how long delivery takes during rush hour, and whether the nearest cluster causes noise or traffic at night. A cheaper apartment can become expensive if it adds daily inconvenience.</p>

<h2>What this directory lists</h2>
<ul>
  <li>300+ published entries covering fast food, cafes, bakeries, grills, and dessert shops.</li>
  <li>Names, addresses, phone numbers, and source links where available.</li>
  <li>Distribution across districts — use it as a first filter, not a final choice.</li>
</ul>

<h2>How to read the distribution</h2>
<p>The Arabic directory breaks entries down by district. District 1, Golf City, and Obour general show the highest counts, while newer zones have fewer options. A low count does not mean "bad" — it often means the area is still building out its retail base.</p>

<p><a href="/restaurants/">Browse the full Arabic directory →</a> (Arabic)</p>

<h2>Three practical checks</h2>
<ol>
  <li>Open delivery apps and enter your prospective address to see real availability.</li>
  <li>Visit the area on a Thursday evening to gauge noise and parking.</li>
  <li>Check whether daily groceries, not just restaurants, are within walking distance.</li>
</ol>

<h2>Delivery coverage: the real test</h2>
<p>A restaurant 2 km away on a map may refuse delivery to your exact building, especially in newer parts of New Obour where addresses are still being mapped. Open the main delivery apps, pin your prospective unit, and see which restaurants actually appear. Then check estimated delivery time at 8 PM on a Thursday — that is when delays are longest.</p>

<p>Also test the reverse: if you prefer cooking, see whether supermarkets and green grocers deliver to the same address. A district with few restaurants but reliable grocery delivery may suit some families better than a noisy food cluster.</p>

<h2>What the categories mean in practice</h2>
<ul>
  <li><strong>Fast food:</strong> widely available, often the first to deliver to new areas.</li>
  <li><strong>Cafes:</strong> concentrated near commercial axes; useful as a daytime workspace signal.</li>
  <li><strong>Bakeries:</strong> essential for daily bread; check morning opening hours.</li>
  <li><strong>Grills and seafood:</strong> usually clustered; expect higher evening traffic around them.</li>
</ul>

<h2>Red flags to watch</h2>
<p>Be cautious if a listing has no phone, no exact address, or only a district name. In a rapidly growing city, old locations close and new ones open quickly. Call before visiting, and ask for a nearby landmark if the street name is unfamiliar to your driver.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Restaurants & Cafes",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Restaurants", item: url }],
    body,
  });
}

function hospitalsPage(chrome) {
  const arUrl = `${SITE}/hospitals/`;
  const url = `${SITE}/en/hospitals/`;
  const title = "Hospitals & Medical Centers in Obour: Emergency Directory";
  const description = "Hospitals and medical centers in Obour and New Obour: addresses, phones, and the nearest emergency option per district. Verified sources only.";
  const h1 = "Hospitals & Medical Centers in Obour";
  const body = `
<p>The most important number before moving is not the apartment price — it is the night-time distance to the nearest hospital with emergency care. In Obour, major hospitals and specialized centers are concentrated on main axes and in specific districts, while other areas depend on clinics and smaller centers.</p>

<h2>Published hospital pages</h2>
<ul>
  <li><a href="/hospitals/el-obour-hospital/">El-Obour Specialized Hospital — Ain Shams University</a> (Arabic)</li>
  <li><a href="/hospitals/tabarak-childrens-hospital-obour/">Tabarak Children's Hospital</a> (Arabic)</li>
</ul>

<h2>What to verify before a decision</h2>
<ul>
  <li>Does the facility have a 24-hour emergency department?</li>
  <li>Does it accept your insurance?</li>
  <li>How long is the trip at rush hour, not on a map?</li>
  <li>Are the specialties you need actually available?</li>
</ul>

<p>The directory lists 19 major hospitals and medical centers with published addresses and phones. It is a starting point, not a medical recommendation.</p>

<p><a href="/hospitals/">Browse the full Arabic directory →</a> (Arabic) · <a href="/en/clinics/">Clinics</a> · <a href="/en/pharmacies/">Pharmacies</a></p>

<h2>Emergency planning by district</h2>
<p>If you are considering a unit far from the main Cairo-Ismailia road or the regional ring road, plan the emergency route in advance. Ask a local driver how long the trip takes at 9 PM, not at noon. Some new districts have short map distances to hospitals but require longer exits or unlit connecting roads.</p>

<p>For families with children, note which hospital has a pediatric emergency unit and whether it operates overnight. For older residents, check cardiology and neurology availability. The presence of a hospital nearby matters less if the specialty you need is only available during daytime hours.</p>

<h2>Insurance and payment reality</h2>
<p>Even if a hospital is technically "nearby," verify that it accepts your health insurance network. Many private centers require cash deposits for emergency admission. Ask neighbors or building security about their real experience with the nearest facilities — they often know which hospital responds fastest at night.</p>

<h2>When to use a hospital versus a clinic</h2>
<p>Use the hospital directory for emergencies, surgeries, and specialist consultations. For routine dental work, dermatology, physiotherapy, or lab tests, the <a href="/en/clinics/">clinics directory</a> is usually more convenient and faster. The key is knowing which option is appropriate before a crisis happens.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Hospitals",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Hospitals", item: url }],
    body,
  });
}

function schoolsPage(chrome) {
  const arUrl = `${SITE}/schools/`;
  const url = `${SITE}/en/schools/`;
  const title = "Schools in New Obour: Government, Languages, International & Nile";
  const description = "School options in Obour and New Obour: government, language, international, and Nile schools. Addresses, fees where published, and practical questions before applying.";
  const h1 = "Schools in New Obour";
  const body = `
<p>For families with children, the school decision often comes before the home decision. Obour and New Obour offer government schools, language schools, international schools (British/American), and Nile schools, but the mix is not spread evenly across districts.</p>

<h2>Types of schools in the directory</h2>
<ul>
  <li><strong>Government schools:</strong> widely available and lowest cost; follow the Egyptian national curriculum.</li>
  <li><strong>Language schools:</strong> Egyptian national curriculum with some subjects taught in English.</li>
  <li><strong>International schools:</strong> follow foreign curricula such as IGCSE; fees are higher and admissions open earlier.</li>
  <li><strong>Nile schools:</strong> Egyptian-Japanese partnership schools with a separate admissions portal.</li>
</ul>

<h2>Published individual pages</h2>
<ul>
  <li><a href="/schools/nile-egyptian-school-obour/">Nile Egyptian School — Obour</a> (Arabic)</li>
  <li><a href="/schools/international-public-school-obour/">International Public School (IPS) — Obour</a> (Arabic)</li>
  <li><a href="/schools/egyptian-japanese-school-obour/">Egyptian-Japanese School — Obour</a> (Arabic)</li>
  <li><a href="/schools/st-joseph-school-obour/">St. Joseph School — Obour</a> (Arabic)</li>
</ul>

<h2>Before you apply</h2>
<ol>
  <li>Confirm the curriculum and accreditation.</li>
  <li>Ask for the current fee schedule and any refundable deposits.</li>
  <li>Check transport options and pickup timing.</li>
  <li>Ask about waiting lists, especially for international grades.</li>
</ol>

<p><a href="/schools/">Browse the full Arabic directory →</a> (Arabic) · <a href="/en/living-guide/">Living guide</a></p>

<h2>Location matters more than distance</h2>
<p>A school may be only 3 km away on a map but require 25 minutes during the morning queue. Test the route from your shortlisted building to the school gate at the exact pickup and drop-off times. Ask about school bus routes: some schools cover wide areas, while others expect parents to arrange private transport.</p>

<p>Also confirm which district the school is actually in. Some school names include "Obour" but serve students from both Old Obour and New Obour. The administrative zone can affect admission priority and transport logistics.</p>

<h2>Fee structure: what to ask</h2>
<p>Published fees are usually the tuition portion only. Ask specifically about application fees, seat deposits, annual activity fees, uniform, books, and bus fees. Some international schools also charge separate exam registration fees for IGCSE or SAT tracks. A quoted fee that looks affordable can double once extras are added.</p>

<h2>Timing and admissions</h2>
<p>International and Nile schools often open admissions months before government schools. If you are moving mid-year, ask whether the grade you need has an open seat. Government schools may require district-based documentation, so confirm the required papers early rather than waiting until the last week of August.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Schools",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Schools", item: url }],
    body,
  });
}

function pharmaciesPage(chrome) {
  const arUrl = `${SITE}/pharmacies/`;
  const url = `${SITE}/en/pharmacies/`;
  const title = "Pharmacies in Obour: 42 Locations with Phones";
  const description = "42 pharmacies in Obour and New Obour: addresses, phones, and opening hours where published. Check 24-hour coverage before moving.";
  const h1 = "Pharmacies in Obour";
  const body = `
<p>Pharmacies are the first emergency line for a fever, a chronic prescription refill, or an unexpected need. In Obour, their distribution is uneven: some districts have several pharmacies within walking distance, while others depend on a main-axis pharmacy or delivery.</p>

<h2>Key questions before choosing a home</h2>
<ul>
  <li>Is there a pharmacy within a short walk or drive?</li>
  <li>Does any nearby pharmacy operate 24 hours or have a night-shift roster?</li>
  <li>Do delivery apps cover your address, and how long does delivery take?</li>
  <li>Do larger central pharmacies keep a wider stock of less common medicines?</li>
</ul>

<p>The directory lists 42 pharmacies with published addresses and phones. Use it to map coverage around your shortlist, then confirm opening hours directly.</p>

<p><a href="/pharmacies/">Browse the full Arabic directory →</a> (Arabic) · <a href="/en/hospitals/">Hospitals</a> · <a href="/en/clinics/">Clinics</a></p>

<h2>24-hour coverage is not universal</h2>
<p>Many pharmacies in the directory keep standard daytime hours. Night coverage often rotates between a few central locations, especially on main axes. If you have a chronic condition, small children, or elderly family members, identify the nearest 24-hour or late-night option before you need it. Calling the pharmacy after 10 PM is the fastest way to confirm.</p>

<p>In New Obour specifically, retail pharmacy coverage is still developing in some districts. Residents in newer phases often rely on pharmacies in Old Obour, Golf City, or Youth Housing for late-night needs. Factor that distance into your decision if medication access is a priority.</p>

<h2>Delivery vs. in-person</h2>
<p>Delivery apps can cover some addresses in Obour, but coverage gaps exist in newer blocks. Even when delivery is available, controlled or refrigerated medicines usually require a personal visit. Use delivery for convenience, not as your only plan.</p>

<h2>Stock differences between branches</h2>
<p>Larger branches on commercial axes usually stock a wider range of medicines, supplements, and medical supplies. Smaller neighborhood branches may need to order less common items. If you take a specific medication regularly, ask your nearest branch whether they keep it in stock or can order it reliably.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Pharmacies",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Pharmacies", item: url }],
    body,
  });
}

function clinicsPage(chrome) {
  const arUrl = `${SITE}/clinics/`;
  const url = `${SITE}/en/clinics/`;
  const title = "Clinics, Labs & Radiology in Obour: 105 Entries";
  const description = "105 clinics, labs, and radiology centers in Obour and New Obour: names, addresses, phones, and sources. Filter by specialty before visiting.";
  const h1 = "Clinics & Medical Centers in Obour";
  const body = `
<p>While hospitals handle emergencies, clinics handle daily care: dental, dermatology, pediatrics, physiotherapy, lab tests, and imaging. Obour has a dense network of clinics, especially in District 1 and Youth Housing, but distribution changes quickly as the city grows.</p>

<h2>What the directory includes</h2>
<ul>
  <li>105 published entries: clinics, labs, and radiology centers.</li>
  <li>Specialties, addresses, phones, and source links where available.</li>
  <li>Geographic breakdown by district to estimate local coverage.</li>
</ul>

<h2>How to choose safely</h2>
<ol>
  <li>Confirm the specialty and whether walk-ins are accepted.</li>
  <li>Ask for the license number and verify it with the relevant authority.</li>
  <li>For labs, ask which tests are done on-site and which are sent out.</li>
  <li>Calculate the trip at rush hour, not just the map distance.</li>
</ol>

<p><a href="/clinics/">Browse the full Arabic directory →</a> (Arabic) · <a href="/en/hospitals/">Hospitals</a> · <a href="/en/pharmacies/">Pharmacies</a></p>

<h2>Specialty concentration by area</h2>
<p>Dental and dermatology clinics are widely distributed, while pediatric and physiotherapy centers tend to cluster near main roads. Radiology and lab networks usually have a central branch plus smaller collection points. If your doctor orders an MRI or CT scan, you may need to visit a central branch even if a smaller lab is closer.</p>

<p>Use the district filter in the Arabic directory to see which specialties are actually available near your shortlisted area. A district with many general practitioners but no pediatrician or physiotherapist may force long regular trips.</p>

<h2>Verification steps</h2>
<ul>
  <li>Ask the clinic for the doctor's syndicate registration number if it is not displayed.</li>
  <li>For labs, check whether they are accredited by the relevant health authority.</li>
  <li>Read recent reviews from local residents, not generic ratings.</li>
  <li>Confirm prices for common procedures before booking.</li>
</ul>

<h2>Clinic or hospital?</h2>
<p>Choose a clinic for routine checkups, chronic disease follow-up, dental work, skin treatments, and physiotherapy. Go to a hospital for emergencies, surgeries, overnight admission, or when multiple specialties need to coordinate. Knowing the difference saves time and money, and prevents overcrowding emergency rooms for non-urgent cases.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Clinics",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Clinics", item: url }],
    body,
  });
}

// ---------------------------------------------------------------------------
// hreflang على الصفحات العربية المقابلة
// ---------------------------------------------------------------------------
const PAIRS = [
  { ar: "restaurants/index.html", en: "/en/restaurants/" },
  { ar: "hospitals/index.html", en: "/en/hospitals/" },
  { ar: "schools/index.html", en: "/en/schools/" },
  { ar: "pharmacies/index.html", en: "/en/pharmacies/" },
  { ar: "clinics/index.html", en: "/en/clinics/" },
];

function arUrlOf(fileName) {
  const rel = fileName.replace(/index\.html$/, "").replace(/\/$/, "");
  return rel ? `${SITE}/${rel}/` : `${SITE}/`;
}

function addHreflangToArabicCategoryPages() {
  let touched = 0;
  let skipped = 0;
  for (const pair of PAIRS) {
    const file = path.join(clientDir, pair.ar);
    let html = fs.readFileSync(file, "utf8");
    const arUrl = arUrlOf(pair.ar);
    const enUrl = SITE + pair.en;
    const expected = `<link rel="alternate" hreflang="ar" href="${arUrl}"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="x-default" href="${arUrl}">`;
    if (html.includes(expected)) {
      skipped++;
      continue;
    }
    html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, "");
    html = html.replace(/<link rel="canonical" href="[^"]*">/, (m) => `${m}${expected}`);
    if (!html.includes('property="og:locale:alternate"')) {
      html = html.replace(/<meta property="og:locale" content="[^"]*">/, (m) => `${m}<meta property="og:locale:alternate" content="en_US">`);
    }
    fs.writeFileSync(file, html);
    touched++;
  }
  rep("hreflang", `أُضيفت/أُصلحت روابط hreflang على ${touched} صفحة عربية للأدلة؛ تُخطّى ${skipped} صفحة صحيحة مسبقًا.`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const pages = [
    { slug: "en/restaurants/index", builder: restaurantsPage },
    { slug: "en/hospitals/index", builder: hospitalsPage },
    { slug: "en/schools/index", builder: schoolsPage },
    { slug: "en/pharmacies/index", builder: pharmaciesPage },
    { slug: "en/clinics/index", builder: clinicsPage },
  ];
  for (const p of pages) {
    const file = path.join(clientDir, ...p.slug.split("/")) + ".html";
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, p.builder(chrome));
    rep("page", `/${p.slug.replace("/index", "")}/ أُنشئت`);
  }
  addHreflangToArabicCategoryPages();
  addEnglishLinkToAllFooters();

  console.log("=== تقرير المرحلة الثامنة: الصفحات الإنجليزية للأدلة (8.3) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
