/**
 * seo-phase5-en.mjs
 * المرحلة الخامسة (5.5): نسخة إنجليزية مختصرة للصفحات الثماني الأساسية.
 *
 * تنشئ:
 *   /en/ · /en/about/ · /en/districts/ · /en/prices/ · /en/developers/
 *   /en/buying-guide/ · /en/living-guide/ · /en/compounds/
 *
 * وتضيف:
 *   - hreflang ثلاثي (ar · en · x-default) على النسختين.
 *   - رابط "English" واحد في الفوتر.
 *
 * المبادئ:
 *   - idempotent: تُعاد كتابة النسخ الإنجليزية؛ روابط hreflang تُضاف مرة واحدة.
 *   - النبرة محايدة تحذيرية، لا تبيع.
 *   - الروابط الداخلية المترجمة تشير للنسخة الإنجليزية، الباقي للعربية مع (Arabic).
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
// استعارة الهيكل من الصفحة الرئيسية العربية
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
    "name": "Obour Guide",
    "url": SITE + "/",
    "logo": "https://obourguide.com/brand/logo.png",
    "foundingDate": "2026",
    "publishingPrinciples": SITE + "/editorial-policy/",
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
};

function translateInternalLinks(html) {
  let out = html;
  for (const [ar, en] of Object.entries(EN_LINK_MAP)) {
    out = out.split(ar).join(en);
  }
  return out;
}

// translate header/footer chrome while keeping the brand name Arabic
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
    'placeholder="ابحث…"': 'placeholder="Search…"',
    'aria-label="ابحث في الدليل"': 'aria-label="Search the guide"',
    'aria-label="بحث"': 'aria-label="Search"',
    '>مسارات الدليل<': '>Guide Paths<',
    '>دليل الخدمات<': '>Service Directory<',
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

function buildFooter(footer) {
  // used only for English pages: keep the footer consistent with Arabic footer logic
  const marker = 'href="/en/">English';
  if (footer.includes(marker)) return footer;
  return footer.replace(
    /(<section>\s*<h2>مسارات الدليل<\/h2>\s*<a href="\/directory\/">دليل الخدمات<\/a>)/,
    '$1<a href="/en/">English</a>'
  );
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

function pageShell(chrome, { title, description, url, arUrl, h1, tag, breadcrumbItems, body, aside }) {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": h1,
      "url": url,
      "inLanguage": "en-US",
      "datePublished": DEFAULT_LASTMOD,
      "dateModified": DEFAULT_LASTMOD,
      "publisher": { "@id": SITE + "/#org" },
      "description": description,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((it, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": it.name,
        "item": it.item,
      })),
    },
    orgNode(),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas, arUrl });
  const translated = translateChrome({ header: chrome.header, footer: buildFooter(chrome.footer) });
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
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;
  return `<!doctype html>${head.replace(/<head>/, `<html lang="en" dir="ltr"><head>`).replace(/<\/head>/, `</head><body>`)}${header}${breadcrumb}${main}${footer}</body></html>`;
}

const ASIDE_EN = `<aside class="action-card"><p>Important pages</p><a class="text-link" href="/en/">Home ↖</a><a class="text-link" href="/en/about/">About Obour ↖</a><a class="text-link" href="/en/districts/">Districts ↖</a><a class="text-link" href="/en/prices/">Prices ↖</a><a class="text-link" href="/en/developers/">Developers ↖</a><a class="text-link" href="/en/buying-guide/">Buying Guide ↖</a><a class="text-link" href="/en/living-guide/">Living Guide ↖</a><a class="text-link" href="/en/compounds/">Compounds ↖</a><a class="text-link" href="/">النسخة العربية ↖</a></aside>`;

// ---------------------------------------------------------------------------
// الصفحات الثماني
// ---------------------------------------------------------------------------
function homePage(chrome) {
  const arUrl = `${SITE}/`;
  const url = `${SITE}/en/`;
  const title = "Obour & New Obour City Guide 2026: Districts, Prices, Developers";
  const description = "A neutral, source-based guide to Obour and New Obour City: services, districts, property prices, developers, and daily life — before you buy or move.";
  const h1 = "Obour & New Obour City Guide";
  const body = `
<p>Read the city before you buy into it. This guide lists more than 1,300 service entries in Obour — pharmacies, hospitals, clinics, schools, restaurants, shopping, and home services — with names, addresses, phones, and sources. Alongside them: districts, prices, developers, and everything you need before making a decision.</p>

<div class="dir-hub" style="margin-top:1.8rem">
  <a class="dir-hub-card" href="/en/districts/"><small>01</small><b>Districts & Areas</b><span>Understand each zone before comparing prices.</span><span>Explore districts →</span></a>
  <a class="dir-hub-card" href="/en/prices/"><small>02</small><b>Property Prices</b><span>A dated price snapshot to build a first comparison.</span><span>See prices →</span></a>
  <a class="dir-hub-card" href="/en/developers/"><small>03</small><b>Developer Directory</b><span>Sortable comparison on five published criteria.</span><span>Browse developers →</span></a>
  <a class="dir-hub-card" href="/en/living-guide/"><small>04</small><b>Services & Daily Life</b><span>Schools, hospitals, shopping — what you actually live after moving.</span><span>Read the living guide →</span></a>
  <a class="dir-hub-card" href="/compare/">(Arabic)<small>05</small><b>City Comparison</b><span>New Obour vs. Fifth Settlement, Shorouk, and the New Capital.</span><span>Compare →</span></a>
  <a class="dir-hub-card" href="/transport/">(Arabic)<small>06</small><b>Transport & Access</b><span>City axes and the electric train in one clear route.</span><span>Read →</span></a>
</div>

<h2>City snapshot</h2>
<p>New Obour is a planned city under the New Urban Communities Authority. Published planning data points to a total area of roughly 59,000 feddans and a built-up mass of about 22,000 feddans. The practical importance of these numbers is not their size alone, but the difference in service maturity between districts.</p>
<ul>
  <li><strong>~59,000 feddans</strong> · total planned area</li>
  <li><strong>~22,000 feddans</strong> · built-up mass</li>
  <li><strong>2016</strong> · city establishment decree</li>
</ul>
<p><a href="/en/about/">Understand the difference between Obour and New Obour →</a></p>

<h2>How to read the map</h2>
<p>There is no "best district" without knowing your goal. In a city growing in phases, the decision to move now is different from the decision to buy early. This is a starting map to narrow your search, then visit the site and the documents.</p>
<div class="district-mini-grid">
  <div><strong>District 24 · Beit El-Watan</strong><br>Land or early purchase</div>
  <div><strong>District 25 · Premium Housing</strong><br>Long-term residence or medium-horizon investment</div>
  <div><strong>El-Momtaz</strong><br>Quieter living with larger spaces</div>
  <div><strong>Districts 1–9</strong><br>Faster move-in and practical living</div>
</div>
<p>Field inspection cannot be replaced by a photo or map.</p>

<h2>Five questions that protect your decision</h2>
<ol>
  <li>Is the project deliverable? Can you visit it today?</li>
  <li>Who manages after delivery, and with what experience?</li>
  <li>Is construction funding visible and verifiable?</li>
  <li>Does the contract detail specifications and costs?</li>
  <li>What is the build ratio, height, and space quality?</li>
</ol>
<p><a href="/en/buying-guide/">Read the full buying guide →</a></p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Obour & New Obour",
    breadcrumbItems: [{ name: "Home", item: url }],
    body, aside: ASIDE_EN,
  });
}

function aboutPage(chrome) {
  const arUrl = `${SITE}/about/`;
  const url = `${SITE}/en/about/`;
  const title = "New Obour City: Location, Area & Difference from Old Obour";
  const description = "A practical reading of New Obour's location, planning area, and what distinguishes it from older Obour when comparing residence or investment.";
  const h1 = "New Obour City";
  const body = `
<p>The purchase decision starts with distinguishing the city boundary and the phase of each zone, not with a one-line price comparison.</p>

<h2>City card</h2>
<p>New Obour was established by presidential decree in 2016 and falls under the New Urban Communities Authority (NUCA). Published planning data indicates a total area close to 59,000 feddans, with a built-up mass of about 22,000 feddans. But the large number is not a guarantee that services are complete at every point; it describes the planning scope, not the execution stage of a specific street.</p>
<p>This guide therefore treats the city as a map of phases. Some areas are closer to established living patterns; others represent expansion or launches tied to a utilities and delivery schedule.</p>

<h2>The difference that matters to buyers</h2>
<p>Confusion between Obour and New Obour is common because the names are close, but the practical decision needs clear separation.</p>
<ul>
  <li><strong>Old Obour:</strong> older city with more mature services and daily life in multiple zones, though conditions vary strongly by street and area.</li>
  <li><strong>New Obour:</strong> newer planning and wider extensions. Suitable if you accept reading execution phase carefully in exchange for newer, wider opportunities.</li>
</ul>
<p>This does not mean one is always better; it means the comparison metric is different.</p>

<h2>How to read the location before the price</h2>
<p>Start from the four directions: north by the Cairo–Belbeis desert road, south by the Cairo–Ismailia road, west by Old Obour, and east toward 10th of Ramadan. These boundaries help you understand the logic of connectivity, but they are not enough for a decision. Next, map your daily route: work, school, family, and the airport. Then visit the site before comparing prices.</p>

<h2>Sources</h2>
<p>Planning data is sourced from NUCA published city plans and publicly announced maps. All figures are indicative and require on-site verification.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "About the city",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "About Obour", item: url }],
    body, aside: ASIDE_EN,
  });
}

function districtsPage(chrome) {
  const arUrl = `${SITE}/districts/`;
  const url = `${SITE}/en/districts/`;
  const title = "New Obour Districts 1–25 & El-Momtaz: A Buyer's Map";
  const description = "Districts are not compared by name only. Use execution phase, service proximity, and your goal to build a shortlist for site visits instead of relying on generic marketing copy.";
  const h1 = "New Obour Districts";
  const body = `
<p>District names in a new city are not a sufficient summary. One zone can contain plots at very different stages, and the same street can differ in paving, lighting, and services. The right comparison starts with your time goal: move-in within months, early purchase with delayed utility completion, or medium-horizon investment?</p>

<h2>Quick decision matrix</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>District</th><th>Profile</th><th>Best for</th></tr></thead>
<tbody>
  <tr><td>District 24 · Beit El-Watan</td><td>Connected to R2 axis; verify exact location, utilities, and delivery timing.</td><td>Land or early purchase</td></tr>
  <tr><td>District 25 · Premium Housing</td><td>Near Middle Ring Road and newer launches; separate delivery phase from existing services.</td><td>Long-term residence or medium-horizon investment</td></tr>
  <tr><td>El-Momtaz</td><td>Relatively mature options for an organized community; price varies by street and finish.</td><td>Quieter living with larger spaces</td></tr>
  <tr><td>Districts 1–9</td><td>Wide product variety and conditions; site visit drives comparison more than the district name.</td><td>Faster move-in and practical living</td></tr>
</tbody>
</table></div>

<h2>How to choose a district without falling for the name</h2>
<p>For near-term residence, focus on actual service readiness: water, electricity, paving, lighting, daily shops, schools, and access. Do not ask only "Is the district good?" but "Is this street ready for my daily life today?"</p>
<p>For early purchase, add questions about land allocation, master plan, expected utilities, and written delivery schedule. The difference between the two is not courage; it is the type of risk you accept.</p>

<h2>Field inspection is non-negotiable</h2>
<p>Visit in the evening, on a workday, and during rush hour. Check the street condition, nearby uses, noise, and actual shop activity. A picture or map cannot replace this.</p>

<h2>Related</h2>
<p><a href="/en/prices/">Property prices</a> · <a href="/en/developers/">Developer directory</a> · <a href="/en/buying-guide/">Buying guide</a></p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Districts & Areas",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Districts", item: url }],
    body, aside: ASIDE_EN,
  });
}

function pricesPage(chrome) {
  const arUrl = `${SITE}/prices/`;
  const url = `${SITE}/en/prices/`;
  const title = "New Obour Property Prices 2026: Price-per-Sqm Snapshot";
  const description = "A dated price snapshot to set a search range. The real price changes by phase, exact location, payment plan, and construction status.";
  const h1 = "Property Prices in New Obour";
  const body = `
<p>Price is an indicator, not a substitute for comparison. We use averages to set a search range only. The real price changes by phase, exact location, payment system, and construction status.</p>

<h2>Compound snapshot · May 2026</h2>
<p><strong>32,900 EGP/m²</strong> — indicative compound average mentioned in the project brief. This is not a binding price for any specific unit.</p>

<h2>How to use this number correctly</h2>
<p>The average does not equal project valuation. Value rises or falls with exact location, finishing level, total payments, unit size, construction ratio, and delivery credibility. Do not compare a cash price with an installment price without calculating total cost, and do not use a general average to justify a higher price in a location whose services you have not tested.</p>

<h2>Indicative comparison ranges</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>Search type</th><th>What changes the price?</th><th>Comparison question</th></tr></thead>
<tbody>
  <tr><td>Unit in a mature district</td><td>Condition, finishing, services</td><td>What is the real cost of moving in?</td></tr>
  <tr><td>Compound under construction</td><td>Delivery date, payment plan, density</td><td>Does the price include all fees?</td></tr>
  <tr><td>Land or early launch</td><td>Allocation, utilities, development timeline</td><td>What is the next written step?</td></tr>
  <tr><td>vs. Fifth Settlement / New Capital</td><td>Proximity to work and transport alternatives</td><td>How much do you pay per minute of commute?</td></tr>
</tbody>
</table></div>

<h2>Why prices differ inside the same city</h2>
<p>New Obour is not one homogeneous market. A unit in an area with ready services differs from one in a project under construction, and land at an early phase differs from a ready apartment. Even inside the same compound, value can change with facade, floor, and view.</p>

<p><em>Annual growth figures mentioned in project briefs are used as dated historical data, not as a forecast or investment recommendation. Check the source and measurement date before relying on them.</em></p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Property Prices",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Prices", item: url }],
    body, aside: ASIDE_EN,
  });
}

function developersPage(chrome) {
  const arUrl = `${SITE}/developers/`;
  const url = `${SITE}/en/developers/`;
  const title = "New Obour Developers 2026: Comparison & Disclosure";
  const description = "Obour and New Obour developers: the guide comes before the grade. We evaluate what is published and verifiable, and state the limits of available information clearly.";
  const h1 = "Developers in Obour & New Obour";
  const body = `
<div class="editorial-disclosure" style="background:#f3ead8;border-right:4px solid #c69148;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.9rem;line-height:1.9;color:#5c4a30">
  <strong>Editorial notice:</strong> Obour Guide has a relationship with Ouda Real Estate Development, one of the companies rated in this table. We did not exclude it because removing an existing developer in the city would weaken the guide; its score is calculated using the same five published criteria applied to everyone, with the same verification sources. Full details are on the <a href="/disclosure/">disclosure page</a> (Arabic).
</div>

<h2>Verification path</h2>
<p>Follow delivery track record, post-delivery management, financial standing, contract transparency, and build density — instead of judging from one ad or title.</p>

<h2>Reference table</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>Developer</th><th>Delivered units</th><th>Management</th><th>Finance</th><th>Transparency</th><th>Density</th><th>Total</th></tr></thead>
<tbody>
  <tr><td><a href="/developers/alashraaf/">Al-Ashraaf Real Estate</a> (Arabic)</td><td>4.2</td><td>2.0</td><td>4.5</td><td>2.0</td><td>2.5</td><td>3.0 / 5</td></tr>
  <tr><td><a href="/developers/ouda/">Ouda Real Estate Development</a> (Arabic)</td><td>4.6</td><td>4.5</td><td>4.5</td><td>4.2</td><td>4.3</td><td>4.4 / 5</td></tr>
  <tr><td><a href="/developers/alsafwa/">Al-Safwa Urban Development</a> (Arabic)</td><td>4.5</td><td>2.0</td><td>4.4</td><td>2.8</td><td>2.7</td><td>3.3 / 5</td></tr>
  <tr><td><a href="/developers/elmoltqa/">El-Moltqa Real Estate</a> (Arabic)</td><td>3.6</td><td>2.0</td><td>1.8</td><td>3.4</td><td>4.5</td><td>3.1 / 5</td></tr>
  <tr><td><a href="/developers/valero/">Valero Developments</a> (Arabic)</td><td>2.0</td><td>4.3</td><td>2.6</td><td>4.0</td><td>2.2</td><td>3.0 / 5</td></tr>
  <tr><td><a href="/developers/kayan/">Kayan Real Estate</a> (Arabic)</td><td>2.6</td><td>2.0</td><td>1.8</td><td>3.6</td><td>3.8</td><td>2.8 / 5</td></tr>
</tbody>
</table></div>

<h2>Developers still being completed</h2>
<p>These developers have announced projects in Obour or New Obour, but published information is not yet enough to apply the five criteria. We list them by name and source because hiding an existing developer is worse than rating it incompletely. Any company that sends published data can enter the main table.</p>
<ul>
  <li><strong>MRS Development</strong> — Vaily Residence, New Obour · official website published</li>
  <li><strong>Motassem Group</strong> — The Mars, Jeddah Mall, Obour Mall · official website published</li>
  <li><strong>Town Ten</strong> — Mazaya Developments · official website published</li>
  <li><strong>Glory Gardens</strong> — Eagle Group · news and intermediary sources, no official website visible</li>
  <li><strong>O-Kardia</strong> — For You Developments · news and intermediary sources</li>
  <li><strong>River Park</strong> — Al-Raee Developments · news and intermediary sources</li>
  <li><strong>Golf City</strong> — Ebdaa Developments · official website published</li>
</ul>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Developer Directory",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Developers", item: url }],
    body, aside: ASIDE_EN,
  });
}

function buyingGuidePage(chrome) {
  const arUrl = `${SITE}/buying-guide/`;
  const url = `${SITE}/en/buying-guide/`;
  const title = "Buying an Apartment in New Obour: A Step-by-Step Guide";
  const description = "A calm buying guide: from goal to contract. Each step below reduces a different risk — goal, location, inspection, documents, cost, then written comparison.";
  const h1 = "Buying Guide";
  const body = `
<p>Do not let a price offer or limited deadline push you past site and document checks.</p>

<h2>Decision line</h2>
<ol>
  <li><strong>Define goal and timeline</strong> — residence soon or longer-horizon investment? This determines district and unit type.</li>
  <li><strong>Shortlist locations</strong> — compare 3 similar options instead of dozens of non-comparable ads.</li>
  <li><strong>Inspect twice</strong> — visit on a workday and at rush hour to understand the route and services.</li>
  <li><strong>Check land and license</strong> — ask for land allocation, license, master plan, and written obligations.</li>
  <li><strong>Read the contract as total cost</strong> — price, maintenance, delivery, penalties, and finishing must be clear.</li>
  <li><strong>Keep a written comparison</strong> — simple documentation protects you from emotional decisions or sales pressure.</li>
</ol>

<h2>Start with the goal, not the ad</h2>
<p>The most common buying mistake is starting from an attractive offer and then trying to fit your need to it. The calmer way is the opposite: define your goal first. Do you want to move within a year? Are you looking for a family unit near schools and services? Do you accept early purchase for a lower price? Each answer changes district type, developer type, and acceptable risk.</p>

<h2>Inspection is not a formality</h2>
<p>Visit the site on a workday and at rush hour, and in the evening if possible. Look at paving, lighting, water, electricity, daily shops, and neighboring uses. If the project is under construction, do not settle for a mock-up or photo; ask for the exact plot location, utility phase, and written delivery date.</p>

<h2>Warning</h2>
<p>This guide does not provide legal or investment advice. Verify every document with a qualified lawyer and the relevant government authority before signing.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Buying Guide",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Buying Guide", item: url }],
    body, aside: ASIDE_EN,
  });
}

function livingGuidePage(chrome) {
  const arUrl = `${SITE}/living-guide/`;
  const url = `${SITE}/en/living-guide/`;
  const title = "Living in Obour: Transport, Shopping, Schools & Healthcare";
  const description = "A practical guide to daily life in Obour and New Obour: transport, schools, healthcare, shopping, and services — with published sources you can verify.";
  const h1 = "Living in Obour";
  const body = `
<p>Housing is not just walls; it is your morning commute, school proximity, nearest pharmacy, and how fast you reach work.</p>

<h2>Transport & daily access</h2>
<p><strong>Old Obour</strong> connects to Cairo via the Cairo–Ismailia desert road, public buses, microbuses, and railway lines.</p>
<p><strong>New Obour</strong> benefits from the LRT electric train linking it to the New Capital and east Cairo, plus R2 axis and the Middle Ring Road. Before choosing, test the trip time at rush hour, not on a map.</p>

<h2>Shopping & malls</h2>
<p>Old Obour has traditional markets such as Friday Market, plus hypermarkets and neighborhood shops. New Obour has newer malls such as Obour City Mall and Golf City Mall, with more commercial centers expected as population density rises. Major supermarkets (Carrefour, Saudi Market) are available in both cities.</p>

<h2>Schools & education</h2>
<p>Old Obour has mature government and private language schools. New Obour has newer schools including IPS, Nile Egyptian Schools, Egyptian Japanese School, and government schools. For school fees, see the <a href="/en/compounds/">compounds page</a> or the Arabic <a href="/school-fees/">school fees guide</a>.</p>

<h2>Healthcare</h2>
<p>Both cities have hospitals, clinics, pharmacies, and labs. Use the Arabic <a href="/hospitals/">hospitals directory</a>, <a href="/clinics/">clinics directory</a>, and <a href="/pharmacies/">pharmacies directory</a> for verified names, addresses, and phones.</p>

<h2>Before you move</h2>
<p>Test your daily route, check utility bills in the area, confirm school registration windows, and identify the nearest emergency services. A cheaper unit can become expensive if it adds hours to your week.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Living Guide",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Living Guide", item: url }],
    body, aside: ASIDE_EN,
  });
}

function compoundsPage(chrome) {
  const arUrl = `${SITE}/compounds/`;
  const url = `${SITE}/en/compounds/`;
  const title = "New Obour Compounds: Published Data & Sources";
  const description = "An index of residential and commercial projects announced in New Obour, with developer, district, status, and source. No invented estimates or fake ratings.";
  const h1 = "New Obour Compounds";
  const body = `
<p>This table lists only what is published. Any project without a published source is marked "not published" until a documented correction arrives.</p>

<div class="table-wrap"><table class="data-table">
<thead><tr><th>Project</th><th>Developer</th><th>District / Location</th><th>Status</th><th>Source</th></tr></thead>
<tbody>
  <tr><td>Canary</td><td>Ouda Real Estate Development</td><td>District 25 · Premium Housing</td><td>Under construction / announced launch</td><td>Ouda official website — reviewed Aug 2026</td></tr>
  <tr><td>Solana</td><td>Ouda Real Estate Development</td><td>Not published</td><td>Announced project</td><td>Ouda official website — reviewed Aug 2026</td></tr>
  <tr><td>Sundus</td><td>Ouda Real Estate Development</td><td>Not published</td><td>Announced project</td><td>Ouda official website — reviewed Aug 2026</td></tr>
  <tr><td>Safari</td><td>Ouda Real Estate Development</td><td>Not published</td><td>Announced project</td><td>Ouda official website — reviewed Aug 2026</td></tr>
  <tr><td>Vaily Residence</td><td>MRS Development</td><td>New Obour</td><td>Announced project</td><td>MRS official website</td></tr>
  <tr><td>The Mars</td><td>Motassem Group</td><td>Not published</td><td>Announced project</td><td>Motassem Group official website</td></tr>
  <tr><td>Jeddah Mall</td><td>Motassem Group</td><td>Not published</td><td>Announced project</td><td>Motassem Group official website</td></tr>
  <tr><td>Obour Mall</td><td>Motassem Group</td><td>Not published</td><td>Announced project</td><td>Motassem Group official website</td></tr>
  <tr><td>Town Ten</td><td>Mazaya Developments</td><td>Arabi El-Gedida / New Obour</td><td>Announced project</td><td>Mazaya official website</td></tr>
  <tr><td>Glory Gardens</td><td>Eagle Group</td><td>New Obour</td><td>Announced project</td><td>News and intermediary sources — no official website visible</td></tr>
  <tr><td>O-Kardia</td><td>For You Developments</td><td>In front of District 8</td><td>Announced project</td><td>News and intermediary sources — no official website visible</td></tr>
  <tr><td>River Park</td><td>Al-Raee Developments</td><td>Golden Square</td><td>Announced project</td><td>News and intermediary sources — no official website visible</td></tr>
  <tr><td>Golf City</td><td>Ebdaa Developments</td><td>Obour and its communities</td><td>Announced project</td><td>Ebdaa official website</td></tr>
</tbody>
</table></div>

<h2>How to read this directory</h2>
<p>Each project page links three nodes: project → developer → district. We do not add invented scores or ratings; we show published data and leave gaps clearly marked. Before any decision, review the developer page, the district page, and visit the site.</p>

<p><a href="/en/developers/">Developer directory</a> · <a href="/en/districts/">Districts</a> · <a href="/en/prices/">Prices</a></p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Compounds",
    breadcrumbItems: [{ name: "Home", item: SITE + "/en/" }, { name: "Compounds", item: url }],
    body, aside: ASIDE_EN,
  });
}

// ---------------------------------------------------------------------------
// hreflang على النسخ العربية
// ---------------------------------------------------------------------------
const PAIRS = [
  { ar: "index.html", en: "/en/" },
  { ar: "about/index.html", en: "/en/about/" },
  { ar: "districts/index.html", en: "/en/districts/" },
  { ar: "prices/index.html", en: "/en/prices/" },
  { ar: "developers/index.html", en: "/en/developers/" },
  { ar: "buying-guide/index.html", en: "/en/buying-guide/" },
  { ar: "living-guide/index.html", en: "/en/living-guide/" },
  { ar: "compounds/index.html", en: "/en/compounds/" },
];

function arUrlOf(fileName) {
  // canonical Arabic URL must end with a trailing slash to match canonical
  const rel = fileName.replace(/index\.html$/, "").replace(/\/$/, "");
  return rel ? `${SITE}/${rel}/` : `${SITE}/`;
}

function addHreflangToArabicPages() {
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
    // remove any existing alternate hreflang block on this page to keep it idempotent and correct
    html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, "");
    html = html.replace(/<link rel="canonical" href="[^"]*">/, (m) => `${m}${expected}`);
    if (!html.includes('property="og:locale:alternate"')) {
      html = html.replace(/<meta property="og:locale" content="[^"]*">/, (m) => `${m}<meta property="og:locale:alternate" content="en_US">`);
    }
    fs.writeFileSync(file, html);
    touched++;
  }
  rep("hreflang", `أُضيفت/أُصلحت روابط hreflang على ${touched} صفحة عربية؛ تُخطّى ${skipped} صفحة صحيحة مسبقًا.`);
}

// ---------------------------------------------------------------------------
// sitemap
// ---------------------------------------------------------------------------
const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "أبريل": "04", "ابريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};
const SITEMAP_EXCLUDE = new Set(["/404/", "/search/", "/dining-guide/", "/shopping-guide/", "/health-guide/"]);

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
function pageLastmod(html) {
  const m = html.match(/آخر تحديث: ([\u0600-\u06FF]+) (\d{4})/);
  if (!m) return DEFAULT_LASTMOD;
  const mm = AR_MONTHS[m[1]];
  return mm ? `${m[2]}-${mm}` : DEFAULT_LASTMOD;
}
function sitemapPriorityAndFreq(slug) {
  if (slug === "/") return { priority: "1.0", changefreq: "weekly" };
  if (slug.startsWith("/en/")) return { priority: "0.7", changefreq: "monthly" };
  return { priority: "0.7", changefreq: "monthly" };
}
function rebuildSitemap() {
  const entries = [];
  for (const f of listPageFiles()) {
    const slug = slugOf(f);
    if (SITEMAP_EXCLUDE.has(slug)) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")), ...sitemapPriorityAndFreq(slug) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(clientDir, "public", "sitemap.xml"), xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (شاملة النسخة الإنجليزية)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const pages = [
    { slug: "en/index", builder: homePage },
    { slug: "en/about/index", builder: aboutPage },
    { slug: "en/districts/index", builder: districtsPage },
    { slug: "en/prices/index", builder: pricesPage },
    { slug: "en/developers/index", builder: developersPage },
    { slug: "en/buying-guide/index", builder: buyingGuidePage },
    { slug: "en/living-guide/index", builder: livingGuidePage },
    { slug: "en/compounds/index", builder: compoundsPage },
  ];
  for (const p of pages) {
    const file = path.join(clientDir, ...p.slug.split("/")) + ".html";
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, p.builder(chrome));
    rep("page", `/${p.slug.replace("/index", "")}/ أُنشئت`);
  }
  addHreflangToArabicPages();
  addEnglishLinkToAllFooters();
  rebuildSitemap();

  console.log("=== تقرير المرحلة الخامسة: النسخة الإنجليزية (5.5) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
