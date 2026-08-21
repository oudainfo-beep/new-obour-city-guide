/**
 * seo-phase16-en-new-pages.mjs
 * المرحلة السادسة عشر: نسخ إنجليزية للفئات والمحاور الجديدة.
 *
 * تنشئ (إن لم تكن موجودة):
 *   /en/compounds/ · /en/districts/ · /en/developers/ · /en/prices/ · /en/buying-guide/
 *   /en/tools/ · /en/compare/ · /en/investment/ · /en/transport/
 *   /en/districts/district-1/ … /en/districts/district-9/
 *
 * وتضيف:
 *   - hreflang متبادل مع الصفحات العربية المقابلة.
 *   - روابط من الصفحة الإنجليزية الرئيسية /en/ إلى المحاور الجديدة.
 *   - إعادة بناء sitemap.xml لتشمل الروابط الجديدة.
 *
 * المبادئ:
 *   - idempotent: تتجاوز الصفحات الموجودة ولا تكرّر حقن hreflang.
 *   - لا تُختلق إحصائيات أو ادّعاءات غير منشورة.
 *   - المحتوى مبني على البيانات/الصفحات العربية الموجودة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(clientDir, "public", "data");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// ---------------------------------------------------------------------------
// Chrome من about-us
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
  'href="/tools/"': 'href="/en/tools/"',
  'href="/compare/"': 'href="/en/compare/"',
  'href="/investment/"': 'href="/en/investment/"',
  'href="/transport/"': 'href="/en/transport/"',
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
  const asideLinks = breadcrumbItems
    .filter((_, i) => i > 0)
    .map((it) => `<a class="text-link" href="${it.item}">${it.name} ↖</a>`)
    .join("");
  const arLink = arUrl !== SITE + "/" ? `<a class="text-link" href="${arUrl}">Arabic version ↖</a>` : `<a class="text-link" href="/">النسخة العربية ↖</a>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap content-grid"><article>${body}</article><aside class="action-card"><p>Important pages</p><a class="text-link" href="/en/">Home ↖</a>${asideLinks}${arLink}</aside></div></section></main>`;
  return `<!doctype html>${head.replace(/<head>/, `<html lang="en" dir="ltr"><head>`).replace(/<\/head>/, `</head><body>`)}${header}${breadcrumb}${main}${footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
function toolsPage(chrome) {
  const arUrl = `${SITE}/tools/`;
  const url = `${SITE}/en/tools/`;
  const title = "Calculator Tools Before You Buy or Move | Obour Guide";
  const description = "Interactive calculators to estimate mortgage payments, daily commute cost, and school fees before moving to Obour or New Obour.";
  const h1 = "Calculator Tools Before You Move";
  const body = `
<p>Use these calculators to estimate major expenses before a purchase or move. Every result depends on the numbers you enter, and the output is indicative only.</p>

<div class="dir-hub" style="margin-top:1.8rem">
  <a class="dir-hub-card" href="/tools/mortgage-affordability/">
    <small>Calculator</small>
    <b>Mortgage Affordability</b>
    <span>Enter your monthly income, expenses, interest rate, and down payment to estimate a maximum installment and a suitable unit value.</span>
    <i>Open calculator →</i>
  </a>
  <a class="dir-hub-card" href="/tools/commute-cost/">
    <small>Calculator</small>
    <b>Daily Commute Cost</b>
    <span>Compare car cost (fuel and wear) with public transport based on the number of commuting days per month.</span>
    <i>Open calculator →</i>
  </a>
  <a class="dir-hub-card" href="/tools/school-fees/">
    <small>Calculator</small>
    <b>School Fees</b>
    <span>Calculate total study cost over the years, including annual fees, transport, activities, uniform, and books.</span>
    <i>Open calculator →</i>
  </a>
</div>

<div class="disclaimer" style="margin-top:1.5rem;padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
  <strong>Notice:</strong> These tools do not provide financial, investment, or educational advice. Results depend on your own data, and actual prices and fees from banks, schools, and fuel stations may differ. Always verify with the source before deciding.
</div>

<p><a href="/tools/">Arabic tools hub →</a> (Arabic)</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Tools",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Tools", item: url },
    ],
    body,
  });
}

function comparePage(chrome) {
  const arUrl = `${SITE}/compare/`;
  const url = `${SITE}/en/compare/`;
  const title = "New Obour vs Fifth Settlement vs New Capital: 2026 Comparison";
  const description = "Practical comparison of east Cairo cities from a buyer's angle: maturity, relative price, services, and commute time. No city is promoted over another.";
  const h1 = "New Obour vs Other Cities: A Buyer's Comparison";
  const body = `
<p>There is no absolute "best city." Each city in east Cairo serves a different need. Fifth Settlement is a mature market with complete services and higher resale liquidity, but prices are higher and traffic is heavier. New Obour offers relatively lower prices in expansion zones and proximity to east Cairo axes, though some zones still need time for facilities. Shorouk is quieter and less dense but has fewer commercial options. The New Capital is new and planned but has large internal distances.</p>

<h2>Quick comparison table</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>City</th><th>Nature</th><th>Strengths</th><th>Watch out for</th></tr></thead>
<tbody>
  <tr><td>New Obour</td><td>New-generation city at varying phases</td><td>Relatively lower prices in expansion zones, proximity to east Cairo axes</td><td>Some zones still waiting for facilities</td></tr>
  <tr><td>Fifth Settlement</td><td>Mature market with services in most areas</td><td>Services, schools, entertainment available; higher resale liquidity</td><td>Higher prices and heavier traffic on main axes</td></tr>
  <tr><td>Shorouk</td><td>Established city with a quiet residential character</td><td>Lower density and moderate prices</td><td>Fewer commercial and entertainment options</td></tr>
  <tr><td>New Administrative Capital</td><td>Large new city under development</td><td>New infrastructure and modern planning</td><td>Large internal distances and higher car dependency</td></tr>
</tbody>
</table></div>
<p><small>This comparison is general and describes market direction at the time of update. It is not a substitute for inspecting a specific location or comparing two specific projects.</small></p>

<h2>Why there is no single best city</h2>
<p>Every city in east Cairo serves a different need. Fifth Settlement is a mature market with complete services and higher resale liquidity, but its prices are higher and its traffic heavier. New Obour offers relatively lower prices in expansion zones and proximity to east Cairo axes, but some of its zones need time for facilities. Shorouk is quieter and less dense, but its commercial options are fewer. The New Capital is new and planned, but its internal distances are large.</p>
<p>The right comparison starts with one question: where do you spend your day? If your work is in Fifth Settlement, a cheaper unit in a farther city may cost you two hours a day — a real cost that does not appear in the contract. If your work is in 10th of Ramadan or east Cairo's industrial area, New Obour may become the more logical choice by a clear margin.</p>

<h2>How to compare true cost</h2>
<p>Do not compare price per square meter alone. Calculate: unit price, maintenance deposit, annual management fees, finishing cost, then add daily commute cost over five years. Sometimes the higher-priced unit in a closer city is actually cheaper over the medium term. And sometimes the price gap is large enough to justify a longer commute.</p>
<p>Add liquidity too: how long does it take to sell a similar unit in each city? Mature markets usually resell faster, while expansion zones may need more time or a discount. If you are buying for short- or medium-term investment, this factor can matter more than the price-per-square-meter gap.</p>

<h2>When is New Obour the most suitable choice?</h2>
<p>It usually suits people who work in east or north Cairo, who accept a time horizon for some services to mature in exchange for a lower price, and who prefer lower density and larger spaces. It is less suitable for those who need fully complete services immediately, those who work in west Cairo, or those who want very fast resale liquidity.</p>
<p>This guide does not recommend buying in any specific city. The goal is to help you reach a decision based on your daily schedule, budget, and accepted risk level, and to turn comparison from a general impression into reviewable numbers.</p>

<h2>Commute time comparison — the number that often decides</h2>
<p>Daily commute time is a factor whose impact grows over time, not shrinks. In the first year you may tolerate a long trip with the excitement of moving; by the third year it becomes a daily burden. So measure the trip in reality, not from a map estimate.</p>
<p>The practical method: go from the unit to your workplace on a normal workday, once at 7:30 AM and once returning at 4 PM. Record both numbers. Repeat for each city you are considering. You may find that differences are sometimes the opposite of what the map suggested, because congestion does not correlate with distance.</p>

<h2>Resale liquidity between cities</h2>
<p>If you are thinking of selling within five years, market liquidity becomes a core factor. Mature markets such as Fifth Settlement see more buying and selling activity, which usually means a shorter time to sell and a smaller gap from the asking price. New expansion zones may need more time or a larger discount, especially if the same developer still has similar units available at comparable prices.</p>
<p>Practical question: how many similar units are currently offered for sale in the same project or area? If the number is large, you will compete against them when selling. If the developer is still selling in the same phase, it is hard to sell at a higher price.</p>

<h2>City growth stage and its effect on price</h2>
<p>Every new city goes through phases: allocation and construction, then delivery and initial occupancy, then services completion, then maturity. The highest price increases usually happen between the second and third phases, when services start arriving and occupancy rises. Buying before that carries higher risk and potentially higher return; buying after is safer and less profitable.</p>
<p>Identify where each city you consider sits on this path, and where you sit on risk tolerance. A buyer moving within a year needs a mature city. An investor who can wait five years may find more value in an earlier phase.</p>

<h2>Related comparisons</h2>
<ul>
  <li><a href="/compare/district-1-vs-district-5/">District 1 vs District 5</a> (Arabic)</li>
  <li><a href="/compare/canary-vs-solana/">Canary vs Solana</a> (Arabic)</li>
  <li><a href="/compare/district-3-vs-district-7/">District 3 vs District 7</a> (Arabic)</li>
  <li><a href="/compare/district-24-vs-district-25/">District 24 vs District 25</a> (Arabic)</li>
  <li><a href="/compare/sundus-vs-safari/">Sundus vs Safari</a> (Arabic)</li>
  <li><a href="/compare/glory-gardens-vs-golf-city/">Glory Gardens vs Golf City</a> (Arabic)</li>
</ul>

<h2>Sources for verification</h2>
<ul>
  <li>New Urban Communities Authority — New Obour master plan</li>
  <li>National Tunnel Authority — LRT light rail</li>
  <li>Arab Contractors — LRT route and stations</li>
</ul>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "City Comparison",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Compare Cities", item: url },
    ],
    body,
  });
}

function investmentPage(chrome) {
  const arUrl = `${SITE}/investment/`;
  const url = `${SITE}/en/investment/`;
  const title = "Real Estate Investment in New Obour: Return, Risk, and Use Cases";
  const description = "Four buying situations, rental yield calculation, risk factors, and realistic expectations for investing in Obour and New Obour.";
  const h1 = "Investment in New Obour: Which Situation Are You In?";
  const body = `
<p>There is no single piece of advice that fits everyone. Family residence is different from early purchase, rental investment is different from resale — and each situation has a different risk measure. So do not ask "Is New Obour a good investment?" but "Does it fit my situation?"</p>

<h2>Start by identifying your situation</h2>
<p>The most common mistake in real estate decisions is one person advising another based on their own experience, even though the goal is completely different. Someone who bought to live measures success by daily quality of life. Someone who bought early measures it by the price gap after delivery. Someone who bought to rent measures it by net yield. Therefore, define your situation first; the criterion that matters changes entirely with the goal of the purchase.</p>

<h3>1. Long-term family residence</h3>
<p>Priority goes to existing services, schools, and daily commute time — not the lowest price per square meter. The biggest risk here is not price but moving into an unserved area.</p>

<h3>2. Early purchase at a discount</h3>
<p>Priority goes to documents, written execution timing, and the track record of the implementing party. The biggest risk is delay, so the discount must be enough to compensate for years of waiting.</p>

<h3>3. Rental investment</h3>
<p>Priority goes to proximity to work areas and universities and actual occupancy rate. Calculate yield after deducting maintenance, fees, and vacancy periods — not before.</p>

<h3>4. Medium-term resale</h3>
<p>Priority goes to liquidity: how long does it take to sell a similar unit in the same zone? Mature markets are faster; expansion zones may need more time or a discount.</p>

<h2>How to calculate return without excess optimism</h2>
<p>Start from total cost, not unit price: price, maintenance deposit, annual management fees, finishing, and contract expenses. Then calculate expected income after deducting vacancy (one or two months per year on average), periodic maintenance, and any rental commission. The resulting number is the real yield, and it is usually clearly lower than the number quoted in ads.</p>
<p>If you are buying on installments, add financing cost: the difference between cash price and total installments. This gap can consume years of yield if not calculated. Do not build the calculation on future price growth; past growth rates are historical data, not a promise.</p>

<h2>What actually raises risk?</h2>
<p>Three factors: unclear implementing party, incomplete facilities in the zone, and lack of a written delivery date. Any one of them alone may be acceptable for a sufficient discount. Two or three together require a pause and re-evaluation, because each factor amplifies the others. Before committing, review the developer comparison on published criteria to understand what documented data is available for each company.</p>
<p>Conversely, risk drops with a visitable track record, announced post-delivery management, clear land and license documents, and a detailed contract. These elements do not guarantee profit, but they reduce the chance of unexpected loss — which is the core of real estate risk management.</p>

<h2>When is waiting better than buying?</h2>
<p>When you cannot answer three questions: where exactly is the unit? what is the facility phase around it? and who will execute and manage it? Missing any of these answers means the lower price may be compensation for a risk you have not yet calculated. Waiting until the answers become clear is not hesitation; it is part of evaluation.</p>

<h2>How to calculate rental yield realistically</h2>
<p>Real rental yield is not annual rent divided by unit price. Calculate it as: annual rent, minus maintenance and management fees, minus average vacancy between tenants (one to two months per year in new areas), minus periodic refurbishment, minus due taxes. The result divided by the total amount you paid including finishing and furniture.</p>
<p>The gap between the simple calculation and the realistic one is usually large. A unit that seems to yield 8% may end up at 5% or less after the above deductions. This does not mean the investment is bad, but it means comparisons with alternatives should be based on the real number, not the advertised one.</p>

<h2>Rental demand: who will live in your unit?</h2>
<p>Before buying to rent, identify the expected tenant. Is it a family working in the industrial area? A student at a nearby university? An employee working in east Cairo and looking for cheaper housing? Each segment has different needs for space, finishing, and location, and buying without defining the segment means a unit that may not suit anyone specifically.</p>
<p>Verify demand in reality: search for rental listings in the same area and record their count, how long they stay published, and the asking prices. Many listings staying for months means supply exceeds demand. Few listings that disappear quickly means good demand. This free research takes an hour and sometimes changes your decision.</p>

<h2>Long-term investment vs. speculation</h2>
<p>Speculation means buying to sell within one or two years to benefit from a price gap between phases. It carries the highest risk and depends on continued market rises and your ability to sell at a specific time. Long-term investment depends on rental yield and value growth over years, and is less sensitive to short-term fluctuations.</p>
<p>Define which of the two you are practicing before buying, because each requires a different choice. The speculator needs a project in an early phase at a price below the market and with limited supply. The long-term investor needs a location with stable rental demand and good management that preserves the project's condition. Confusing the two is a common cause of unmet expectations.</p>

<h2>Related pages</h2>
<ul>
  <li><a href="/en/developers/">Developer directory</a></li>
  <li><a href="/en/prices/">Property prices</a></li>
  <li><a href="/mistakes/">Common investment mistakes</a> (Arabic)</li>
</ul>

<h2>Sources for verification</h2>
<ul>
  <li>New Urban Communities Authority — New Obour master plan</li>
  <li>National Tunnel Authority — LRT light rail</li>
  <li>Arab Contractors — LRT route and stations</li>
</ul>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Investment",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Investment", item: url },
    ],
    body,
  });
}

function transportPage(chrome) {
  const arUrl = `${SITE}/transport/`;
  const url = `${SITE}/en/transport/`;
  const title = "New Obour Transport: LRT Train and Access Routes";
  const description = "Transport in New Obour: LRT light rail, regional and middle ring roads, R2 axis, and how to measure your real commute before buying.";
  const h1 = "Access Starts With Your Daily Route";
  const body = `
<p>Proximity to an axis is not enough on its own. Compare starting point, rush-hour time, and drop-off point to understand the real value of a location in your daily life.</p>

<h2>Measured travel times</h2>
<h3>20–40 minutes to Greater Cairo destinations</h3>
<p>This general range is based on initial car measurements from New Obour at different congestion times. The detailed breakdown per destination is still under detailed measurement; do not use this range as a fixed timing for a specific address.</p>
<p style="font-size:.85rem;color:#607067"><strong>Methodology:</strong> actual car measurements from New Obour at different congestion times · <strong>Date:</strong> 2026-08 · <strong>By:</strong> Obour Guide team</p>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>Destination</th><th>Status</th></tr></thead>
<tbody>
  <tr><td>Nasr City</td><td>Detailed measurement in progress</td></tr>
  <tr><td>Heliopolis</td><td>Detailed measurement in progress</td></tr>
  <tr><td>Downtown Cairo</td><td>Detailed measurement in progress</td></tr>
  <tr><td>Fifth Settlement</td><td>Detailed measurement in progress</td></tr>
  <tr><td>Shorouk</td><td>Detailed measurement in progress</td></tr>
  <tr><td>Cairo Airport</td><td>Detailed measurement in progress</td></tr>
</tbody>
</table></div>

<h2>Light Rail Transit (LRT)</h2>
<p>The LRT route links Adly Mansour to several new cities and includes Obour station among the announced stations. Published implementation data states that the main route serves Obour, Mostaqbal, Shorouk, Badr, the New Administrative Capital, and 10th of Ramadan, with operating speeds reaching up to 120 km/h on parts of the line. This information matters, but it only becomes a residential advantage when you know your distance from the station and how to reach it.</p>
<p>For a residential decision, do not treat the station as a standalone guarantee. Measure your travel time from the unit to the station and from the station to your destination, and ask about last-mile connection cost and availability in morning and evening hours. If you will drive to the station, calculate fuel, waiting, and parking. If you will rely on local transport, confirm its actual regularity, not just its theoretical existence.</p>

<h2>Axes are not a fixed arrival time</h2>
<p>City plans show routes linked to the regional and middle ring roads and the R2 axis, giving the city clear importance in east Cairo. But geographical proximity does not equal daily comfort. The distance to the axis may be short, while the entry point, interchange, or congestion adds significant minutes. Therefore, test the trip at the time you will actually use it, not only in quiet hours.</p>
<p>When comparing two districts, record three trips: work, school or daily service, and weekend or emergency. If one option is cheaper but adds significant daily time, the difference is not just minutes; it is a continuous operating cost. If one option is closer to an LRT station but needs a difficult connection, the theoretical proximity may lose value.</p>

<h2>Reading common destinations</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>Destination</th><th>How to read the relationship</th><th>Test on site</th></tr></thead>
<tbody>
  <tr><td>My City / Fifth Settlement areas</td><td>Connection via east Cairo axes</td><td>Rush-hour time and entry route</td></tr>
  <tr><td>Shorouk</td><td>Relatively close extension of new cities</td><td>Road and drop-off point</td></tr>
  <tr><td>New Administrative Capital</td><td>Road and train link depending on starting point</td><td>Distance to LRT station</td></tr>
  <tr><td>Airport</td><td>Varies by axis and trip time</td><td>Round trip during work hours</td></tr>
</tbody>
</table></div>

<h2>How to build a personal access map</h2>
<p>Start with three points: unit location, nearest axis or station, and your frequent destination. Draw the route you will actually use, then add an alternative for congestion. After that, test the trip at least twice: once in the morning and once in the evening. If comparing two projects, do not ask "which is closer to the city?" but "which gives me a more stable daily trip?"</p>
<p>Remember that access is not only for work. Schools, hospitals, shopping, family, and the airport may all be part of the decision. A unit that seems right for the work commute may not fit the daily school run. It is better to list your top five destinations and measure each alternative against them. This turns the map from a general picture into a personal decision tool.</p>

<h2>When does train proximity become a real advantage?</h2>
<p>A station becomes an advantage when it is part of a repeated trip you can measure. If you will use the train weekly or daily, calculate arrival time at the station, connection cost, waiting time, and drop-off point. If your main trips are by car to destinations not directly served by the line, axis proximity may matter more than station proximity. There is no public-transport advantage that suits everyone; there is only an advantage tied to your own route.</p>

<h2>How to document a trip result</h2>
<p>Write the trip time in a short note with date, time, start point, and end point. Repeat the measurement on a different day if possible, because one trip may be affected by a temporary condition. If comparing two projects, use the same method for both: clear starting point, similar measurement time, and fixed destination. This turns the road experience from an impression into a number you can review when comparing price and services.</p>

<h2>Guide rules for access</h2>
<ul>
  <li><strong>Measure from your door.</strong> Do not measure from the district boundary or the billboard; real distance starts at your location.</li>
  <li><strong>Test rush hour.</strong> A quiet trip may hide a daily cost that only appears during work hours.</li>
  <li><strong>Calculate the last mile.</strong> The value of a train or axis is completed by how you reach it, what it costs, and how regular it is.</li>
</ul>

<h2>Sources for verification</h2>
<ul>
  <li>New Urban Communities Authority — New Obour master plan</li>
  <li>National Tunnel Authority — LRT light rail</li>
  <li>Arab Contractors — LRT route and stations</li>
</ul>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Transport",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Transport", item: url },
    ],
    body,
  });
}

const CATEGORY_LABELS = {
  banks: "Banks & Money Transfer",
  entertainment: "Entertainment & Activities",
  shopping: "Shopping & Stores",
  nurseries: "Nurseries & Learning Centers",
  "home-services": "Home Services",
  "professional-services": "Professional Services",
  supermarkets: "Supermarkets & Hypermarkets",
  pharmacies: "Pharmacies",
  clinics: "Clinics & Medical Centers",
  cafes: "Cafes & Coffee Shops",
  fitness: "Fitness & Beauty",
  hospitals: "Hospitals & Medical Centers",
  restaurants: "Restaurants & Cafes",
  automotive: "Car Services",
};

function districtServicesSection(districtNum) {
  const dir = path.join(clientDir, "districts", `district-${districtNum}`);
  if (!fs.existsSync(dir)) return "";
  const links = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const subIndex = path.join(dir, ent.name, "index.html");
    if (fs.existsSync(subIndex)) {
      const label = CATEGORY_LABELS[ent.name] || ent.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      links.push(`<a class="text-link" href="/districts/district-${districtNum}/${ent.name}/">${label}</a>`);
    }
  }
  if (!links.length) return "";
  return `<section class="paper section wrap" aria-label="District ${districtNum} services"><h2>Services in District ${districtNum}</h2><p>${links.join(" · ")}</p></section>`;
}

function districtPage(chrome, n) {
  const arUrl = `${SITE}/districts/district-${n}/`;
  const url = `${SITE}/en/districts/district-${n}/`;
  const title = `District ${n} in New Obour: Location, Services, and Prices | Obour Guide`;
  const description = `Guide to District ${n} in New Obour: execution phase, service status, who it suits, and how to evaluate the district yourself before a site visit.`;
  const h1 = `District ${n} in New Obour`;
  const servicesSection = districtServicesSection(n);
  const body = `
<p>District names in a new city are not enough on their own. One district can contain plots at very different stages, and the same street can differ in paving, lighting, and services. The right comparison starts with your time goal: move-in within months, early purchase with delayed utility completion, or medium-horizon investment?</p>

<h2>District summary from published data</h2>
<div class="table-wrap"><table><thead><tr><th>Item</th><th>Published description</th></tr></thead><tbody>
<tr><td>Scope</td><td><strong>Districts 1–9</strong></td></tr>
<tr><td>Phase</td><td>Services existing</td></tr>
<tr><td>Best suited for</td><td>Faster move-in and practical living</td></tr>
<tr><td>Service status</td><td>Wide variety in product and condition; the site visit drives comparison more than the district name alone.</td></tr>
</tbody></table></div>
<p>Published data specifically about District ${n} is limited; what appears here is grouped analytically under the 1–9 range stated on the published page.</p>

<h2>How to evaluate this district yourself</h2>
<ol>
  <li><strong>Street readiness:</strong> Are paving, lighting, and sidewalks in place on the specific street, not only at the gate?</li>
  <li><strong>Core utilities:</strong> Are water, electricity, and sewer connected to the advertised plot or building?</li>
  <li><strong>Execution timing:</strong> If buying early, what is the written date for utility delivery, not just units?</li>
  <li><strong>Entry point:</strong> How do you reach the specific street from the main axis during rush hour?</li>
  <li><strong>Neighboring uses:</strong> What is planned next to the site and will it affect quietness or orientation?</li>
</ol>

<h2>What is not currently published</h2>
<ul>
  <li>Plot boundaries and internal streets inside District ${n}.</li>
  <li>Distribution of residential projects by street inside the district.</li>
  <li>Official geographic coordinates of the district.</li>
</ul>
<p>We leave these fields unpublished instead of inventing data; you can verify them on site or through the New Urban Communities Authority.</p>

<h2>Related pages</h2>
<p><a href="/en/districts/">Districts & Areas</a> · <a href="/en/prices/">Property Prices</a> · <a href="/en/developers/">Developers</a> · <a href="/en/buying-guide/">Buying Guide</a></p>
<p>All numbered districts: <a href="/en/districts/">Districts 1–9</a></p>
`
  const html = pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Districts",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Districts", item: SITE + "/en/districts/" },
      { name: `District ${n}`, item: url },
    ],
    body,
  });
  if (!servicesSection) return html;
  // Insert services section before </main>
  return html.replace(/<\/main>/, `${servicesSection}</main>`);
}

// ---------------------------------------------------------------------------
// Helpers for existing priority list pages
// ---------------------------------------------------------------------------
function compoundsPage(chrome) {
  const arUrl = `${SITE}/compounds/`;
  const url = `${SITE}/en/compounds/`;
  const title = "New Obour Compounds: Published Data & Sources";
  const description = "An index of residential and commercial projects announced in New Obour, with developer, district, status, and source. No invented estimates or fake ratings.";
  const h1 = "New Obour Compounds";
  const compounds = JSON.parse(fs.readFileSync(path.join(dataDir, "obour-compounds.json"), "utf8")).compounds || [];
  const rows = compounds
    .map((c) => {
      const nameEn = c.slug.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
      const dev = c.developer?.name || "Not published";
      const district = c.district?.name || c.city || "Not published";
      const status = c.status || "Announced project";
      const source = c.source || "Not published";
      return `<tr><td><strong>${nameEn}</strong></td><td>${dev}</td><td>${district}</td><td>${status}</td><td>${source}</td></tr>`;
    })
    .join("");
  const body = `
<p>This table lists only what is published. Any project without a published source is marked "not published" until a documented correction arrives. We do not add invented scores, estimated prices, or fake ratings.</p>

<div class="table-wrap"><table class="data-table">
<thead><tr><th>Project</th><th>Developer</th><th>District / Location</th><th>Status</th><th>Source</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>

<h2>How to read this directory</h2>
<p>Each project connects to three nodes: project → developer → district. We show published data and leave gaps clearly marked. Before any decision, review the developer page, the district page, and visit the site.</p>
<p>The status column tells you how far the project has been announced. "Announced project" means a name and developer are published, but construction progress and delivery timing need direct verification. "Under construction / announced launch" means the project has moved to an active construction phase according to the developer's published information. A "not published" location means the developer has not publicly specified the district or plot; this is a gap, not a judgment.</p>

<h2>What to ask for each project</h2>
<ul>
  <li>Exact plot location and district boundary.</li>
  <li>Land allocation, license, and approved master plan.</li>
  <li>Build ratio, heights, and open-space percentage.</li>
  <li>Delivery date and link to construction milestones.</li>
  <li>Management company and maintenance-fee structure.</li>
  <li>Total cost including maintenance deposit, management fees, and finishing.</li>
</ul>

<h2>Red flags</h2>
<ul>
  <li>The project is marketed with no published source or official website.</li>
  <li>The location is described only as "New Obour" without a district or street.</li>
  <li>The sales team avoids providing a model contract or master plan.</li>
  <li>Delivery dates are stated orally but not written in the contract.</li>
  <li>Prices or growth promises are presented without a source or measurement date.</li>
</ul>

<p><a href="/en/developers/">Developer directory</a> · <a href="/en/districts/">Districts</a> · <a href="/en/prices/">Prices</a></p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Compounds",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Compounds", item: url },
    ],
    body,
  });
}

function districtsListPage(chrome) {
  const arUrl = `${SITE}/districts/`;
  const url = `${SITE}/en/districts/`;
  const title = "New Obour Districts 1–25 & El-Momtaz: A Buyer's Map";
  const description = "Districts are not compared by name only. Use execution phase, service proximity, and your goal to build a shortlist for site visits instead of relying on generic marketing copy.";
  const h1 = "New Obour Districts: A Buyer's Map";
  const districtData = JSON.parse(fs.readFileSync(path.join(dataDir, "obour-districts.json"), "utf8")).districts || [];
  const rows = districtData
    .map((d) => `<tr><td>${d.name}</td><td>${d.status}</td><td>${d.targetAudience}</td></tr>`)
    .join("");
  const districtLinks = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return `<a class="text-link" href="/en/districts/district-${n}/">District ${n}</a>`;
  }).join(" · ");
  const body = `
<p>District names in a new city are not a sufficient summary. One zone can contain plots at very different stages, and the same street can differ in paving, lighting, and services. The right comparison starts with your time goal: move-in within months, early purchase with delayed utility completion, or medium-horizon investment?</p>

<h2>Quick decision matrix</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>District</th><th>Profile</th><th>Best for</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>

<h2>Districts 1–9</h2>
<p>These districts are grouped under "services existing" in published data. They suit faster move-in and practical living, but product and condition vary widely. Visit the specific street before deciding.</p>
<p>${districtLinks}</p>

<h2>How to choose a district without falling for the name</h2>
<p>For near-term residence, focus on actual service readiness: water, electricity, paving, lighting, daily shops, schools, and access. Do not ask only "Is the district good?" but "Is this street ready for my daily life today?"</p>
<p>For early purchase, add questions about land allocation, master plan, expected utilities, and written delivery schedule. The difference between the two is not courage; it is the type of risk you accept. If you are investing on a medium horizon, look at the master plan, road connectivity, and the phase of surrounding services.</p>

<h2>Field inspection checklist</h2>
<ul>
  <li>Confirm the actual plot or project location, not just the district name in the ad.</li>
  <li>Measure travel time in a real trip, both ways, not from a marketing estimate.</li>
  <li>Inspect utilities in the surrounding street, not only at the gate or billboard.</li>
  <li>Ask about neighboring uses and their announced plans; they affect quietness and value.</li>
  <li>Request the execution phase and written service-delivery schedule if buying early.</li>
</ul>

<h2>Red flags that should slow you down</h2>
<ul>
  <li>The ad mentions only the city name or district number without a specific street or plot.</li>
  <li>You are pressured to decide before visiting the site or reading the contract.</li>
  <li>Utilities are described as "coming soon" with no written timeline.</li>
  <li>The price is far below comparable options and the reason is vague.</li>
  <li>The developer refuses to provide land allocation or license documents.</li>
</ul>

<h2>Related</h2>
<p><a href="/en/prices/">Property prices</a> · <a href="/en/developers/">Developer directory</a> · <a href="/en/buying-guide/">Buying guide</a></p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Districts",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Districts", item: url },
    ],
    body,
  });
}

function developersPage(chrome) {
  const arUrl = `${SITE}/developers/`;
  const url = `${SITE}/en/developers/`;
  const title = "New Obour Developers 2026: Comparison & Disclosure";
  const description = "Obour and New Obour developers: the guide comes before the grade. We evaluate what is published and verifiable, and state the limits of available information clearly.";
  const h1 = "New Obour Developers";
  const devs = JSON.parse(fs.readFileSync(path.join(dataDir, "obour-developers.json"), "utf8")).developers || [];
  const scored = devs.filter((d) => !d.pending && Array.isArray(d.scores));
  const pending = devs.filter((d) => d.pending);
  const scoreRows = scored
    .map((d) => {
      const total = d.total || (d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(1);
      return `<tr><td><a href="/developers/${d.slug}/">${d.name}</a> (Arabic)</td><td>${d.scores[0]}</td><td>${d.scores[1]}</td><td>${d.scores[2]}</td><td>${d.scores[3]}</td><td>${d.scores[4]}</td><td>${total} / 5</td></tr>`;
    })
    .join("");
  const pendingList = pending.map((d) => `<li><strong>${d.name}</strong> — ${d.projects || ""} · ${d.sourceNote || ""}</li>`).join("");
  const body = `
<h2>Verification path</h2>
<p>Follow delivery track record, post-delivery management, financial standing, contract transparency, and build density — instead of judging from one ad or title.</p>
<ul>
  <li><strong>Delivered units:</strong> Can you visit a finished project by this developer?</li>
  <li><strong>Post-delivery management:</strong> Is there a named management company with operating experience?</li>
  <li><strong>Financial standing:</strong> Are partnerships or funding announced and verifiable?</li>
  <li><strong>Contract transparency:</strong> Are specifications and costs written clearly?</li>
  <li><strong>Build density:</strong> What are the build ratio, heights, and space quality?</li>
</ul>

<h2>Reference table</h2>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>Developer</th><th>Delivered units</th><th>Management</th><th>Finance</th><th>Transparency</th><th>Density</th><th>Total</th></tr></thead>
<tbody>${scoreRows}</tbody>
</table></div>

<h2>How to use the table without turning a score into an ad</h2>
<p>Start with the criterion most linked to your risk. If you are buying for near-term residence, delivery and management matter more than a future promise. If you are buying early, financial standing and contract transparency become more sensitive. If you care about quality of life inside the project, build ratio, heights, and open spaces should be part of the comparison.</p>
<p>Do not accept a score without evidence, and do not accept evidence without a date. Published data can change, and projects move from one phase to another. The guide lists the source of each page and asks you to convert any important information into a document before signing.</p>

<h2>What you can verify yourself</h2>
<ul>
  <li>Visit a delivered project and check its operating condition.</li>
  <li>Ask for the management company name and maintenance budget.</li>
  <li>Request the funding partnership and its documents.</li>
  <li>Read the specifications and cost annex.</li>
  <li>Check the approved build ratio and heights on the master plan.</li>
</ul>

<h2>Developers still being completed</h2>
<p>These developers have announced projects in Obour or New Obour, but published information is not yet enough to apply the five criteria. We list them by name and source because hiding an existing developer is worse than rating it incompletely. Any company that sends published data can enter the main table.</p>
<ul>${pendingList}</ul>

<h2>Before you commit to a developer</h2>
<p>Ask for a model contract before reserving, and consult a real-estate lawyer. Some clauses may look standard but carry details that vary by project. Especially for under-construction projects, make sure the contract links delivery to specific construction milestones, not just a calendar date. Keep all payment receipts, request periodic construction updates, and preserve copies of every written communication. These documents become critical if you need to negotiate or escalate later.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Developers",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Developers", item: url },
    ],
    body,
  });
}

function pricesPage(chrome) {
  const arUrl = `${SITE}/prices/`;
  const url = `${SITE}/en/prices/`;
  const title = "New Obour Property Prices 2026: Price-per-Sqm Snapshot";
  const description = "A dated price snapshot to set a search range. The real price changes by phase, exact location, payment plan, and construction status.";
  const h1 = "New Obour Property Prices";
  const body = `
<p>Price is an indicator, not a substitute for comparison. We use averages to set a search range only. The real price changes by phase, exact location, payment system, and construction status.</p>

<h2>Compound snapshot · May 2026</h2>
<p><strong>32,900 EGP/m²</strong> — indicative compound average mentioned in the project brief. This is not a binding price for any specific unit.</p>

<h2>How to use this number correctly</h2>
<p>The average does not equal project valuation. Value rises or falls with exact location, finishing level, total payments, unit size, construction ratio, and delivery credibility. Do not compare a cash price with an installment price without calculating total cost, and do not use a general average to justify a higher price in a location whose services you have not tested.</p>
<p>The dated number is useful for setting an initial search range. If an offer is much higher than the average, ask why: is the location more mature? Is the finishing better? Is delivery sooner? Is density lower? If it is much lower, ask too: are utilities incomplete? Does the payment plan hide a cost? Is delivery far away? A lower price is not always an opportunity, and a higher price is not always quality.</p>

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
<p>New Obour is not one homogeneous market. A unit in an area with ready services differs from one in a project under construction, and land at an early phase differs from a ready apartment. Even inside the same compound, value can change with facade, floor, view, and proximity to services or roads.</p>
<p>So do not ask only "What is the price per square meter?" but "What does this price include?" Start by calculating the total cost: unit price, maintenance deposit, management fees, finishing if not included, contract fees, and any extra payments. Then compare this cost with alternatives you can visit.</p>

<h2>Reading price with location and developer</h2>
<p>Price cannot be separated from location or from the implementing party. A location near an axis but hard to reach may not justify a large premium. A developer offering an attractive price but unclear about management, funding, or build ratio may carry higher risk.</p>
<p>The guide uses price as a first signal, then links it to three questions: Where exactly is the unit? What is the execution status? And who stands behind the project? If you compare New Obour with other areas, do not compare price per square meter alone. Compare travel time to your destination, service level, delivery date, and daily operating cost.</p>

<h2>How to build your own comparison table</h2>
<p>Put each offer in its own row, then record the cash price, installment price, total cost, maintenance deposit, delivery date, finishing status, and build ratio. Add your daily commute time and the service level around the location. When the numbers sit side by side, it becomes easier to see that a lower-priced offer may cost more because of financing, finishing, or distant services.</p>
<p>Do not delete offers that raise questions; make the question part of the table. If management fees are unclear, write "not announced." If the delivery date is not written, write "needs document." These empty cells are not a weakness in your comparison; they signal what must be completed before signing.</p>

<h2>Price checklist before accepting any offer</h2>
<ul>
  <li>Ask for the cash price, the installment price, and the total cost under each plan.</li>
  <li>Record the date of the price offer, because the market can change between visits.</li>
  <li>Compare only similar units in area, finishing, and delivery date.</li>
  <li>Tie the price to the district phase and actual services, not to the city name alone.</li>
  <li>Review the developer page before judging whether the price is fair or high.</li>
</ul>

<p><em>Annual growth figures mentioned in project briefs are used as dated historical data, not as a forecast or investment recommendation. Check the source and measurement date before relying on them.</em></p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Prices",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Prices", item: url },
    ],
    body,
  });
}

function buyingGuidePage(chrome) {
  const arUrl = `${SITE}/buying-guide/`;
  const url = `${SITE}/en/buying-guide/`;
  const title = "Buying an Apartment in New Obour: A Step-by-Step Guide";
  const description = "A calm buying guide: from goal to contract. Each step below reduces a different risk — goal, location, inspection, documents, cost, then written comparison.";
  const h1 = "Buying an Apartment in New Obour";
  const body = `
<p>Do not let a price offer or limited deadline push you past site and document checks. The buying decision becomes calmer when you split it into steps, each reducing a different risk.</p>

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
<p>After defining the goal, write a total budget, not just a starting price. Add the maintenance deposit, management fees, finishing, moving costs, and any deferred payments. Then define your daily destinations and measure access to them. This gives you a decision framework before you enter a sales office or read a new ad.</p>

<h2>Inspection is not a formality</h2>
<p>Visit the site on a workday and at rush hour, and in the evening if possible. Look at paving, lighting, water, electricity, daily shops, and neighboring uses. If the project is under construction, do not settle for a mock-up or photo; ask for the exact plot location, utility phase, and written delivery date.</p>
<p>During the visit, record comparable notes: arrival time, street condition, noise level, service proximity, and the condition of neighboring buildings. Do not rely only on general impression. The goal is to turn the visit into data you can review when comparing three similar options.</p>

<h2>Documents before enthusiasm</h2>
<p>Ask for land allocation, license, master plan, and written obligations. Review the net unit area, payment schedule, delivery date, finishing status, maintenance deposit, management fees, penalties, and dispute-resolution mechanism. Any unclear clause should be clarified in writing before you pay large amounts. If the offer relies on "trust" instead of documents, that is a signal to pause.</p>

<h2>Do not confuse price with total cost</h2>
<p>Price is a number in the ad; total cost is everything you will pay until you live in or manage the unit. Compare cash price with installment price, and calculate the financing difference. Then link the result to the unit location, execution status, and developer track record. A cheaper unit is not always better, and a higher-priced unit is not always higher quality. The better decision is the one that is clearest and most balanced with your goal.</p>

<h2>How to handle sales pressure</h2>
<p>If you hear that the offer "ends today" or the unit is the "last chance," calmly ask for the same documents. A good offer survives review, and a clear project does not need to stop you from comparing. Ask for time to read the contract, and do not pay a large amount before receiving a full copy of the terms.</p>
<p>Use a direct question: "What makes this offer suitable for my specific goal?" If the answer is general, return to your framework: location, total cost, delivery, management, and density. If the answer is specific, ask for written proof. This turns the conversation from persuasion into documentation.</p>

<h2>Five questions for any developer</h2>
<ul>
  <li><strong>Track record:</strong> Where is a delivered project you can visit?</li>
  <li><strong>Management:</strong> Who runs the place after delivery?</li>
  <li><strong>Funding:</strong> What is the basis of construction financing?</li>
  <li><strong>Contract:</strong> What specifications and costs are written?</li>
  <li><strong>Density:</strong> What are the build ratio and heights?</li>
</ul>

<h2>Warning</h2>
<p>This guide does not provide legal or investment advice. Verify every document with a qualified lawyer and the relevant government authority before signing.</p>
`;
  return pageShell(chrome, {
    title, description, url, arUrl, h1,
    tag: "Buying Guide",
    breadcrumbItems: [
      { name: "Home", item: SITE + "/en/" },
      { name: "Buying Guide", item: url },
    ],
    body,
  });
}

// ---------------------------------------------------------------------------
// Execution helpers
// ---------------------------------------------------------------------------
function writePageIfMissing(slug, builder) {
  const file = path.join(clientDir, ...slug.split("/")) + ".html";
  if (fs.existsSync(file)) {
    rep("skip", `/${slug.replace(/\/index$/, "")}/ already exists`);
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, builder());
  rep("page", `/${slug.replace(/\/index$/, "")}/ created`);
  return true;
}

const PRIORITY_PAGES = [
  { slug: "en/compounds/index", builder: (chrome) => compoundsPage(chrome) },
  { slug: "en/districts/index", builder: (chrome) => districtsListPage(chrome) },
  { slug: "en/developers/index", builder: (chrome) => developersPage(chrome) },
  { slug: "en/prices/index", builder: (chrome) => pricesPage(chrome) },
  { slug: "en/buying-guide/index", builder: (chrome) => buyingGuidePage(chrome) },
  { slug: "en/tools/index", builder: (chrome) => toolsPage(chrome) },
  { slug: "en/compare/index", builder: (chrome) => comparePage(chrome) },
  { slug: "en/investment/index", builder: (chrome) => investmentPage(chrome) },
  { slug: "en/transport/index", builder: (chrome) => transportPage(chrome) },
];

function generatePages(chrome) {
  for (const p of PRIORITY_PAGES) {
    writePageIfMissing(p.slug, () => p.builder(chrome));
  }
  for (let n = 1; n <= 9; n++) {
    writePageIfMissing(`en/districts/district-${n}/index`, () => districtPage(chrome, n));
  }
}

// ---------------------------------------------------------------------------
// hreflang on Arabic counterparts
// ---------------------------------------------------------------------------
const HREFLANG_PAIRS = [
  { ar: "tools/index.html", en: "/en/tools/" },
  { ar: "compare/index.html", en: "/en/compare/" },
  { ar: "investment/index.html", en: "/en/investment/" },
  { ar: "transport/index.html", en: "/en/transport/" },
  ...Array.from({ length: 9 }, (_, i) => ({ ar: `districts/district-${i + 1}/index.html`, en: `/en/districts/district-${i + 1}/` })),
];

function arUrlOf(fileName) {
  const rel = fileName.replace(/index\.html$/, "").replace(/\/$/, "");
  return rel ? `${SITE}/${rel}/` : `${SITE}/`;
}

function addHreflangToArabicPages() {
  let touched = 0;
  let skipped = 0;
  for (const pair of HREFLANG_PAIRS) {
    const file = path.join(clientDir, pair.ar);
    if (!fs.existsSync(file)) {
      skipped++;
      continue;
    }
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
  rep("hreflang", `Added/fixed hreflang on ${touched} Arabic pages; skipped ${skipped} already-correct or missing pages.`);
}

// ---------------------------------------------------------------------------
// Update /en/ home page links
// ---------------------------------------------------------------------------
function updateEnHome() {
  const file = path.join(clientDir, "en", "index.html");
  let html = fs.readFileSync(file, "utf8");
  if (html.includes('href="/en/transport/"') && html.includes('href="/en/tools/"')) {
    rep("home", "English home page already links to new hubs; skipped.");
    return;
  }
  html = html.replace(
    'href="/compare/">(Arabic)<small>05</small><b>City Comparison</b>',
    'href="/en/compare/"><small>05</small><b>City Comparison</b>'
  );
  html = html.replace(
    'href="/transport/">(Arabic)<small>06</small><b>Transport & Access</b>',
    'href="/en/transport/"><small>06</small><b>Transport & Access</b>'
  );
  const oldTransport = '  <a class="dir-hub-card" href="/en/transport/"><small>06</small><b>Transport & Access</b><span>City axes and the electric train in one clear route.</span><span>Read →</span></a>\n</div>';
  const newCards = `  <a class="dir-hub-card" href="/en/transport/"><small>06</small><b>Transport & Access</b><span>City axes and the electric train in one clear route.</span><span>Read →</span></a>
  <a class="dir-hub-card" href="/en/tools/"><small>07</small><b>Calculator Tools</b><span>Mortgage, commute, and school-fee estimators before you decide.</span><span>Open tools →</span></a>
  <a class="dir-hub-card" href="/en/investment/"><small>08</small><b>Investment Guide</b><span>Return, risk, and the four common buying situations.</span><span>Read →</span></a>
</div>`;
  html = html.replace(oldTransport, newCards);
  fs.writeFileSync(file, html);
  rep("home", "Updated /en/ home page with links to compare, transport, tools, and investment hubs.");
}

// ---------------------------------------------------------------------------
// Rebuild sitemap.xml
// ---------------------------------------------------------------------------
function rebuildSitemap() {
  const AR_MONTHS = {
    يناير: "01", فبراير: "02", مارس: "03", أبريل: "04", مايو: "05", يونيو: "06",
    يوليو: "07", أغسطس: "08", سبتمبر: "09", أكتوبر: "10", نوفمبر: "11", ديسمبر: "12",
  };
  const EXCLUDE = new Set(["public/sitemap.xml", "public/404.html", "404"]);

  function walk(dir, out) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      const rel = path.relative(clientDir, full).replace(/\\/g, "/");
      if (EXCLUDE.has(rel)) continue;
      if (ent.isDirectory()) walk(full, out);
      else if (ent.name === "index.html") out.push(full);
    }
  }
  const files = [];
  walk(clientDir, files);

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
  for (const f of files) {
    const slug = slugOf(f);
    if (EXCLUDE.has(slug.slice(1, -1))) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(clientDir, "public", "sitemap.xml"), xml);
  rep("sitemap", `Rebuilt sitemap.xml: ${entries.length} pages`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  generatePages(chrome);
  addHreflangToArabicPages();
  updateEnHome();
  rebuildSitemap();

  console.log("=== Phase 16 Report: English pages for new categories and hubs ===");
  for (const line of report) console.log(line);
  console.log(`=== Done: ${report.length} operations ===`);
}

main();
