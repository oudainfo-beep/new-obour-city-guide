/**
 * seo-phase75-home-motion.mjs — الصفحة الرئيسية «مخطط المدينة الحي» (2026-10-02)
 *
 * يعيد بناء <main> في client/index.html حول فكرة واحدة: الدليل = مخطط حي للمدينة.
 *  1) Hero: نص + بحث بأمثلة متحركة + مخطط تخطيطي (SVG) للعبور والعبور الجديدة — المربعات روابط
 *     لأدلة الأحياء، الطرق تُرسم عند التحميل، ونقاط «حركة» تسير على محور 30 يونيو والطريقين.
 *  2) عدادات حية محسوبة وقت البناء من بيانات الدليل الفعلية (لا أرقام مكتوبة يدويًا).
 *  3) «ماذا تحتاج اليوم؟» — فهرس روابط داخلية لثلاث نوايا: السكن/الخدمات/المعاملات.
 *  4) شريط التصنيفات المتحرك بأعداد كل تصنيف من data/directories.
 *  5) الأقسام التحريرية الحالية (الصورة العامة، الأحياء، الأسئلة الخمسة) كما هي.
 *  6) المطورون بأشرطة درجات تمتلئ عند الظهور — من scripts/lib/developers-data.mjs.
 *  7) أحدث الأدلة: شريط أفقي قابل للسحب، العناوين والأوصاف تُقرأ من الصفحات نفسها.
 *
 * الحركة: transform/opacity فقط (لا CLS)، تحترم prefers-reduced-motion بالكامل،
 * CSS وJS مضمّنان (لا يعتمدان على site.css غير المتزامن). idempotent عبر data-hx.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEVELOPERS } from "./lib/developers-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "client");
const indexPath = path.join(client, "index.html");
const log = (m) => console.log(`[phase75] ${m}`);

let html = fs.readFileSync(indexPath, "utf8");

function build() {
  // ---------------- data (build-time, real) ----------------
  const dirDir = path.join(root, "data", "directories");
  const dirs = {};
  let entries = 0;
  for (const f of fs.readdirSync(dirDir)) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(fs.readFileSync(path.join(dirDir, f), "utf8"));
    if (d && Array.isArray(d.items)) { dirs[d.slug || f.replace(".json", "")] = d.items.length; entries += d.items.length; }
  }
  const categories = Object.keys(dirs).length;
  const sitemap = fs.readFileSync(path.join(client, "public", "sitemap.xml"), "utf8");
  const pages = (sitemap.match(/<loc>/g) || []).length;
  const devCount = DEVELOPERS.length;
  log(`entries=${entries} categories=${categories} pages=${pages} developers=${devCount}`);

  const exists = (p) => fs.existsSync(path.join(client, p.replace(/^\/|\/$/g, ""), "index.html"));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ---------------- keep the editorial sections verbatim ----------------
  const mainMatch = html.match(/<main>([\s\S]*?)<\/main>/);
  if (!mainMatch) { log("no <main> — abort"); return; }
  const oldMain = mainMatch[1];
  const pick = (re) => { const m = oldMain.match(re); return m ? m[0] : ""; };
  const sectionOverview = pick(/<section class="paper section"><div class="wrap split split-image" data-reveal>[\s\S]*?<\/section>/);
  const sectionDistricts = pick(/<section class="green section">[\s\S]*?<\/section>/);
  const sectionQuestions = pick(/<section class="cream section">[\s\S]*?<\/section>/);
  const oldLinks = [...oldMain.matchAll(/<section class="paper section" data-internal-links[\s\S]*?<\/section>/g)].map((m) => m[0]).join("");
  const keptLinks = [...oldLinks.matchAll(/<a href="(\/[^"]+)">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]);

  // ---------------- 1) HERO ----------------
  const tiles = {
    old: [
      ["/district-1/", "الحي الأول", "1"], ["/district-2/", "الحي الثاني", "2"], ["/district-3/", "الحي الثالث", "3"],
      ["/district-4/", "الحي الرابع", "4"], ["/district-5/", "الحي الخامس", "5"], ["/district-6/", "الحي السادس", "6"],
      ["/district-7/", "الحي السابع", "7"], ["/district-8/", "الحي الثامن", "8"], ["/district-9/", "الحي التاسع", "9"],
    ],
    oldWide: [["/golf-city-obour/", "الجولف"], ["/industrial-zone/", "المنطقة الصناعية"]],
    newer: [
      ["/district-13-14-new-obour/", "الحيان 13 و14", "13–14"], ["/district-24-new-obour/", "الحي 24 — بيت الوطن", "24"],
      ["/district-25-new-obour/", "الحي 25", "25"], ["/amal-area-new-obour/", "منطقة الأمل", "الأمل"],
    ],
  };
  let ti = 0;
  const tile = (x, y, w, h, href, label, short, cls) => {
    const i = ti++;
    return `<a href="${href}" class="hx-tile ${cls}" style="--i:${i}" aria-label="${esc(label)}"><title>${esc(label)}</title><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/><text x="${x + w / 2}" y="${y + h / 2 + 6}" text-anchor="middle">${esc(short)}</text></a>`;
  };
  let svgTiles = "";
  // old Obour: 3x3 grid, left cluster
  tiles.old.forEach(([href, label, short], k) => {
    const c = k % 3, r = Math.floor(k / 3);
    svgTiles += tile(40 + (2 - c) * 72, 96 + r * 66, 62, 56, href, label, short, "is-old");
  });
  svgTiles += tile(40, 300, 134, 46, tiles.oldWide[0][0], tiles.oldWide[0][1], tiles.oldWide[0][1], "is-old is-wide");
  svgTiles += tile(184, 300, 62, 46, tiles.oldWide[1][0], tiles.oldWide[1][1], "صناعية", "is-old is-wide");
  // New Obour: right cluster
  svgTiles += tile(338, 96, 86, 66, tiles.newer[0][0], tiles.newer[0][1], tiles.newer[0][2], "is-new");
  svgTiles += tile(434, 96, 86, 66, tiles.newer[1][0], tiles.newer[1][1], tiles.newer[1][2], "is-new");
  svgTiles += tile(338, 172, 182, 76, tiles.newer[2][0], tiles.newer[2][1], tiles.newer[2][2], "is-new is-big");
  svgTiles += tile(338, 258, 182, 46, tiles.newer[3][0], tiles.newer[3][1], tiles.newer[3][2], "is-new is-soft");

  const heroSvg = `<svg class="hx-plan" viewBox="0 0 560 420" role="group" aria-labelledby="hx-plan-t" xmlns="http://www.w3.org/2000/svg">
<title id="hx-plan-t">مخطط تخطيطي مبسّط لأحياء العبور والعبور الجديدة — كل مربع رابط لدليل الحي</title>
<defs><pattern id="hx-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" stroke-width=".5" opacity=".18"/></pattern></defs>
<rect width="560" height="420" fill="url(#hx-grid)" class="hx-gridbg"/>
<g class="hx-roads">
<path id="hx-r1" class="hx-road" pathLength="1" d="M10 54 H550"/>
<path id="hx-r2" class="hx-road" pathLength="1" d="M10 382 H550"/>
<path id="hx-r3" class="hx-axis" pathLength="1" d="M296 54 V382"/>
<path id="hx-r4" class="hx-link" pathLength="1" d="M246 200 C270 200 270 210 296 210 C318 210 318 210 338 210"/>
</g>
<g class="hx-labels" aria-hidden="true">
<text x="420" y="40" text-anchor="middle">طريق القاهرة–بلبيس</text>
<text x="420" y="406" text-anchor="middle">طريق القاهرة–الإسماعيلية</text>
<text x="284" y="330" text-anchor="middle" class="hx-vlabel" transform="rotate(-90 284 330)">محور 30 يونيو</text>
<text x="143" y="82" text-anchor="middle" class="hx-city">العبور</text>
<text x="429" y="82" text-anchor="middle" class="hx-city">العبور الجديدة</text>
</g>
<g class="hx-tiles">${svgTiles}</g>
<g class="hx-traffic" aria-hidden="true">
<circle r="4" class="hx-car"><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#hx-r1"/></animateMotion></circle>
<circle r="4" class="hx-car is-b"><animateMotion dur="12s" begin="-4s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#hx-r2"/></animateMotion></circle>
<circle r="4.5" class="hx-car is-c"><animateMotion dur="6s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#hx-r3"/></animateMotion></circle>
<circle r="3.5" class="hx-car"><animateMotion dur="4.5s" begin="-2s" repeatCount="indefinite"><mpath href="#hx-r4"/></animateMotion></circle>
</g>
</svg>`;

  const chips = [
    ["/pharmacies/", "صيدليات"], ["/hospitals/", "مستشفيات"], ["/schools/", "مدارس"], ["/restaurants/", "مطاعم"],
    ["/compounds/", "كمبوندات"], ["/prices/", "الأسعار"], ["/developers/", "المطورون"],
  ].filter(([h]) => exists(h));

  const hero = `<section class="hx-hero" aria-labelledby="hx-h1">
<div class="hx-glow" aria-hidden="true"></div>
<div class="wrap hx-hero-in">
<div class="hx-copy">
<p class="hx-live"><span class="hx-dot" aria-hidden="true"></span>محدّث أكتوبر 2026 — ${entries.toLocaleString("en-US")} مدخل خدمة موثّق</p>
<h1 id="hx-h1">دليلك الكامل للعبور والعبور الجديدة</h1>
<p class="hx-lead">صيدليات ومستشفيات وعيادات ومدارس ومطاعم وتسوق وخدمات منزلية — بالاسم والعنوان والهاتف والمصدر. ومعها الأحياء والأسعار والمطورون وكل ما تحتاجه قبل الشراء أو الانتقال.</p>
<form class="hx-search" role="search" action="/search/" method="get">
<label class="hx-sr" for="hx-q">ابحث في دليل العبور</label>
<input id="hx-q" type="search" name="q" placeholder="ابحث عن خدمة أو حي أو مشروع…" autocomplete="off" required>
<button type="submit">ابحث</button>
</form>
<nav class="hx-chips" aria-label="تصنيفات سريعة">${chips.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav>
</div>
<figure class="hx-figure">
${heroSvg}
<figcaption>مخطط تخطيطي مبسّط وليس خريطة بمقياس — اضغط أي حي لفتح دليله، أو افتح <a href="/map/">الخريطة التفاعلية</a>.</figcaption>
</figure>
</div>
</section>`;

  // ---------------- 2) LIVE COUNTERS ----------------
  const stats = `<section class="hx-stats" aria-label="الدليل بالأرقام">
<div class="wrap hx-stats-in">
<div><b data-count="${entries}">${entries.toLocaleString("en-US")}</b><span>مدخل خدمة بالاسم والعنوان والهاتف</span></div>
<div><b data-count="${categories}">${categories}</b><span>تصنيفًا من الصيدليات حتى الخدمات الحكومية</span></div>
<div><b data-count="${devCount}">${devCount}</b><span>مطورًا مقيّمًا بالمعايير الخمسة نفسها</span></div>
<div><b data-count="${pages}">${pages.toLocaleString("en-US")}</b><span>صفحة دليل ومقال عن المدينتين</span></div>
</div>
</section>`;

  // ---------------- 3) INTENTS ----------------
  const intents = [
    ["أسكن أو أشتري", "قبل أن تقارن الأسعار، افهم الحي والمطور والأوراق.", [
      ["/districts/", "دليل الأحياء"], ["/prices/", "أسعار العقارات"], ["/developers/", "سجل المطورين"], ["/compounds/", "الكمبوندات"],
      ["/apartments-for-rent-obour/", "شقق للإيجار"], ["/land-price-per-meter-obour/", "سعر متر الأرض"],
    ]],
    ["أبحث عن خدمة قريبة", "عناوين وأرقام موثّقة، وصفحات للخدمات التي تعمل ليلًا.", [
      ["/pharmacies-24-hours/", "صيدليات 24 ساعة"], ["/hospitals/", "المستشفيات"], ["/clinics/", "العيادات"], ["/schools/", "المدارس"],
      ["/nurseries/", "الحضانات"], ["/emergency/", "أرقام الطوارئ"],
    ]],
    ["أنجز معاملة", "أين تذهب، وماذا تحمل معك، وأي جهاز يختص بملفك.", [
      ["/new-obour-city-authority/", "جهاز العبور الجديدة"], ["/obour-authority/", "جهاز مدينة العبور"], ["/building-permits/", "تراخيص البناء"],
      ["/notary-obour/", "الشهر العقاري"], ["/authority-apartments-obour/", "شقق الجهاز والتنازل"], ["/procedures/", "كل الإجراءات"],
    ]],
  ];
  const intentHtml = `<section class="hx-intents" aria-labelledby="hx-int-h">
<div class="wrap">
<h2 id="hx-int-h">ماذا تحتاج اليوم؟</h2>
<div class="hx-int-grid">${intents.map(([h, p, links], k) => `<div class="hx-int" style="--k:${k}">
<h3>${h}</h3><p>${p}</p>
<ul>${links.filter(([href]) => exists(href)).map(([href, t]) => `<li><a href="${href}">${t}</a></li>`).join("")}</ul>
</div>`).join("")}</div>
</div>
</section>`;

  // ---------------- 4) CATEGORY MARQUEE ----------------
  const catMap = [
    ["shopping", "/shopping/", "التسوق والمحلات"], ["restaurants", "/restaurants/", "مطاعم وكافيهات"], ["real-estate-offices", "/real-estate-offices/", "مكاتب عقارية"],
    ["clinics", "/clinics/", "عيادات ومراكز طبية"], ["professional-services", "/professional-services/", "خدمات مهنية"], ["fitness", "/fitness/", "لياقة وتجميل"],
    ["automotive", "/automotive/", "خدمات السيارات"], ["banks", "/banks/", "بنوك وصرافات"], ["home-services", "/home-services/", "خدمات منزلية"],
    ["nurseries", "/nurseries/", "حضانات"], ["pharmacies", "/pharmacies/", "صيدليات"], ["entertainment", "/entertainment/", "ترفيه وأنشطة"],
    ["government-services", "/government-services/", "خدمات حكومية"], ["hospitals", "/hospitals/", "مستشفيات"], ["schools-all", "/schools/", "مدارس"],
  ].filter(([k, href]) => dirs[k] && exists(href));
  const chip = ([k, href, t]) => `<a href="${href}">${t}<span>${dirs[k]}</span></a>`;
  const half = Math.ceil(catMap.length / 2);
  const rowA = catMap.slice(0, half).map(chip).join("");
  const rowB = catMap.slice(half).map(chip).join("");
  const marquee = `<section class="hx-marquee" aria-label="تصنيفات الدليل">
<div class="hx-row"><div class="hx-track">${rowA}</div><div class="hx-track" aria-hidden="true">${rowA.replace(/<a /g, '<a tabindex="-1" ')}</div></div>
<div class="hx-row is-rev"><div class="hx-track">${rowB}</div><div class="hx-track" aria-hidden="true">${rowB.replace(/<a /g, '<a tabindex="-1" ')}</div></div>
</section>`;

  // ---------------- 6) DEVELOPERS ----------------
  const top = DEVELOPERS.slice(0, 6);
  const devHtml = `<section class="hx-devs" aria-labelledby="hx-dev-h">
<div class="wrap hx-dev-in">
<div class="hx-dev-copy">
<h2 id="hx-dev-h">دليل المطورين يبدأ بالدليل</h2>
<p>${devCount} مطورًا مقيّمًا على خمسة معايير معلنة: التسليم، والإدارة، والملاءة، وشفافية التعاقد، والكثافة. الدرجة تتبع ما نشرته الشركة نفسها، والمعايير واحدة على الجميع.</p>
<p class="hx-dev-links"><a class="hx-btn" href="/developers/">افتح جدول المقارنة</a><a href="/methodology/">كيف نحسب الدرجة؟</a></p>
</div>
<ol class="hx-bars">${top.map((d) => `<li><a href="/developers/${d.slug}/"><span class="hx-bar-n">${esc(d.name)}</span><span class="hx-bar"><i style="--v:${(d.total / 5).toFixed(3)}"></i></span><b>${d.totalLabel}</b></a></li>`).join("")}</ol>
</div>
</section>`;

  // ---------------- 7) LATEST GUIDES RAIL ----------------
  const guideSlugs = [
    "new-obour-city-authority", "land-price-per-meter-obour", "rent-from-owner-obour", "high-city-obour", "janna-obour",
    "amal-area-new-obour", "authority-apartments-obour", "youth-housing-obour", "budget-rent-obour", "property-listings-safety-obour",
    "building-violations-obour", "health-insurance-obour", "igcse-schools-obour",
  ];
  const readMeta = (slug) => {
    const p = path.join(client, slug, "index.html");
    if (!fs.existsSync(p)) return null;
    const h = fs.readFileSync(p, "utf8");
    const h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const tag = ((h.match(/<span class="tag">([^<]*)<\/span>/) || [])[1] || "").replace("⌖", "").trim();
    if (!h1) return null;
    return { href: `/${slug}/`, title: h1.replace(/<[^>]+>/g, ""), desc: desc || "", tag };
  };
  const guides = guideSlugs.map(readMeta).filter(Boolean);
  for (const [href, t] of keptLinks) {
    if (!guides.some((g) => g.href === href) && exists(href)) guides.push({ href, title: t, desc: "", tag: "أدلة مختارة" });
  }
  const rail = `<section class="hx-guides" aria-labelledby="hx-g-h">
<div class="wrap">
<div class="hx-g-head"><h2 id="hx-g-h">أحدث الأدلة</h2><div class="hx-g-nav"><button type="button" data-rail="1" aria-label="السابق">›</button><button type="button" data-rail="-1" aria-label="التالي">‹</button></div></div>
<div class="hx-rail" tabindex="0" aria-label="قائمة أحدث الأدلة">${guides.map((g) => `<a class="hx-card" href="${g.href}">${g.tag ? `<small>${esc(g.tag)}</small>` : ""}<b>${esc(g.title)}</b>${g.desc ? `<span>${esc(g.desc)}</span>` : ""}</a>`).join("")}</div>
</div>
</section>`;

  // ---------------- CTA ----------------
  const cta = `<section class="hx-cta"><div class="wrap hx-cta-in"><p><b>الدليل يتحسن بتصحيحاتكم.</b> رقم تغيّر؟ صيدلية انتقلت؟ أرسل التصحيح ونوثّقه وننشره.</p><p><a class="hx-btn is-light" href="/corrections/">اقترح تصحيحًا</a><a href="/badge/">شارة «مُدرج في الدليل» للمنشآت</a></p></div></section>`;

  // ---------------- assemble ----------------
  const newMain = `<main data-hx="1"><div class="hx-progress" aria-hidden="true"></div>${hero}${stats}${intentHtml}${marquee}${sectionOverview}${sectionDistricts}${sectionQuestions}${devHtml}${rail}${cta}</main>`;
  html = html.replace(mainMatch[0], newMain);

  // drop the old hero LCP preload if any (atlas-hero.svg no longer above the fold)
  html = html.replace(/<link rel="preload"[^>]*atlas-hero\.svg[^>]*>/g, "");

  // CLS 0: on the homepage, load site.css render-blocking (it restyles the header after first paint
  // when loaded async) and use font-display:optional so the Arabic webfonts never reflow the hero.
  html = html.replace(/<link rel="stylesheet" href="(\/static\/site\.css\?v=[^"]+)" media="print" onload="this\.media='all'">/, '<link rel="stylesheet" href="$1">');
  html = html.replace(/display=swap/g, "display=optional");
  html = html.replace("</head>", `<style id="hx-css">${CSS}</style></head>`);
  html = html.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script id="hx-js">${JS}</script></body>`);
  fs.writeFileSync(indexPath, html, "utf8");
  log(`homepage rebuilt: ${Math.round(html.length / 1024)}KB, guides=${guides.length}, categories in marquee=${catMap.length}`);
}

// ============================================================================
// CSS — self-contained, scoped by .hx-*; motion = transform/opacity only
// ============================================================================
var CSS = `
:root{--hx-g:#123f33;--hx-g2:#1d5c49;--hx-leaf:#3e8e6c;--hx-amber:#c2671c;--hx-sand:#f5f1e8;--hx-paper:#eef4ef;--hx-ink:#1a2a24;--hx-mute:#5d6d65;--hx-line:#d3dccf;--hx-ease:cubic-bezier(.22,.68,.26,.99)}
.hx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.hx-progress{position:fixed;top:0;inset-inline:0;height:3px;background:linear-gradient(90deg,var(--hx-leaf),var(--hx-amber));transform-origin:100% 50%;transform:scaleX(var(--p,0));z-index:60;pointer-events:none}
.hx-hero{position:relative;overflow:hidden;background:linear-gradient(180deg,#f3f8f4 0%,var(--hx-paper) 100%);padding:clamp(2.2rem,5vw,4.5rem) 0 clamp(2rem,4vw,3.5rem);isolation:isolate}
.hx-glow{position:absolute;inset:-20% -10% auto auto;width:60vw;height:60vw;max-width:760px;max-height:760px;background:radial-gradient(closest-side,rgba(62,142,108,.18),transparent 70%);z-index:-1;animation:hx-drift 18s ease-in-out infinite alternate}
@keyframes hx-drift{to{transform:translate(-8%,10%) scale(1.08)}}
.hx-hero-in{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);min-width:0;gap:clamp(1.5rem,4vw,3.5rem);align-items:center}
.hx-live{display:inline-flex;align-items:center;gap:.55rem;margin:0 0 1rem;padding:.35rem .85rem;border:1px solid var(--hx-line);border-radius:999px;background:#fff;font-size:.86rem;color:var(--hx-g);font-weight:600}
.hx-dot{width:8px;height:8px;border-radius:50%;background:var(--hx-leaf);box-shadow:0 0 0 0 rgba(62,142,108,.55);animation:hx-ping 2s infinite}
@keyframes hx-ping{70%{box-shadow:0 0 0 9px rgba(62,142,108,0)}100%{box-shadow:0 0 0 0 rgba(62,142,108,0)}}
.hx-hero h1{font-family:"Noto Kufi Arabic","IBM Plex Sans Arabic",sans-serif;font-weight:800;font-size:clamp(2.1rem,4.6vw,3.9rem);line-height:1.22;letter-spacing:-.02em;color:var(--hx-ink);margin:0 0 1rem;max-width:16ch}
.hx-lead{font-size:clamp(1rem,1.3vw,1.14rem);line-height:2;color:var(--hx-mute);margin:0 0 1.4rem;max-width:58ch}
.hx-search{display:flex;gap:.4rem;padding:.4rem;background:#fff;border:1.5px solid var(--hx-line);border-radius:16px;box-shadow:0 10px 30px rgba(18,63,51,.08);max-width:560px;transition:border-color .25s,box-shadow .25s}
.hx-search:focus-within{border-color:var(--hx-leaf);box-shadow:0 0 0 4px rgba(62,142,108,.15),0 10px 30px rgba(18,63,51,.1)}
.hx-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:1rem;padding:.75rem .9rem;color:var(--hx-ink)}
.hx-search button{border:0;border-radius:12px;background:var(--hx-g);color:#fff;font:inherit;font-weight:700;padding:0 1.4rem;cursor:pointer;transition:background .2s,transform .2s var(--hx-ease)}
.hx-search button:hover{background:var(--hx-g2)}.hx-search button:active{transform:scale(.96)}
.hx-chips{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:1rem}
.hx-chips a{padding:.4rem .9rem;border-radius:999px;background:#fff;border:1px solid var(--hx-line);color:var(--hx-g);text-decoration:none;font-size:.9rem;font-weight:600;transition:background .2s,color .2s,transform .2s var(--hx-ease)}
.hx-chips a:hover,.hx-chips a:focus-visible{background:var(--hx-g);color:#fff;transform:translateY(-2px)}
.hx-figure{margin:0;position:relative}
.hx-plan{width:100%;height:auto;display:block;color:var(--hx-g);background:#fff;border:1px solid var(--hx-line);border-radius:22px;box-shadow:0 30px 60px -30px rgba(18,63,51,.35);transition:transform .5s var(--hx-ease)}
.hx-figure figcaption{font-size:.8rem;color:var(--hx-mute);margin-top:.6rem;line-height:1.8}
.hx-figure figcaption a{color:var(--hx-g)}
.hx-road,.hx-axis,.hx-link{fill:none;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:hx-draw 1.4s var(--hx-ease) forwards}
.hx-road{stroke:#c9d5cc;stroke-width:9}
.hx-axis{stroke:var(--hx-amber);stroke-width:5;animation-delay:.35s}
.hx-link{stroke:var(--hx-leaf);stroke-width:3;stroke-dasharray:1;animation-delay:.9s}
@keyframes hx-draw{to{stroke-dashoffset:0}}
.hx-labels text{font:600 11px "IBM Plex Sans Arabic",sans-serif;fill:var(--hx-mute)}
.hx-labels .hx-city{font:800 15px "Noto Kufi Arabic",sans-serif;fill:var(--hx-g)}
.hx-labels .hx-vlabel{fill:var(--hx-amber)}
.hx-tile rect{stroke-width:1.5;transition:fill .25s,stroke .25s}
.hx-tile text{font:700 15px "Noto Kufi Arabic",sans-serif;pointer-events:none}
.hx-tile{opacity:0;transform-box:fill-box;transform-origin:center;animation:hx-pop .55s var(--hx-ease) forwards;animation-delay:calc(.5s + var(--i)*55ms);cursor:pointer;outline:none}
@keyframes hx-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.hx-tile.is-old rect{fill:var(--hx-sand);stroke:#dccfb2}.hx-tile.is-old text{fill:var(--hx-ink)}
.hx-tile.is-wide text{font-size:12px}
.hx-tile.is-new rect{fill:var(--hx-g);stroke:var(--hx-g)}.hx-tile.is-new text{fill:#fff}
.hx-tile.is-big text{font-size:22px}
.hx-tile.is-soft rect{fill:#dfeee5;stroke:#b7d3c2}.hx-tile.is-soft text{fill:var(--hx-g);font-size:13px}
.hx-tile:hover rect,.hx-tile:focus-visible rect{fill:var(--hx-amber);stroke:var(--hx-amber)}
.hx-tile:hover text,.hx-tile:focus-visible text{fill:#fff}
.hx-tile:focus-visible rect{stroke:var(--hx-ink);stroke-width:3}
.hx-car{fill:var(--hx-amber);opacity:0;animation:hx-in .4s 1.6s forwards}.hx-car.is-b{fill:var(--hx-leaf)}.hx-car.is-c{fill:#fff;stroke:var(--hx-amber);stroke-width:2}
@keyframes hx-in{to{opacity:1}}
.hx-copy>*{animation:hx-up .7s var(--hx-ease) both}
.hx-copy>:nth-child(2){animation-delay:.08s}.hx-copy>:nth-child(3){animation-delay:.16s}.hx-copy>:nth-child(4){animation-delay:.24s}.hx-copy>:nth-child(5){animation-delay:.32s}
@keyframes hx-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hx-stats{background:var(--hx-g);color:#fff}
.hx-stats-in{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.hx-stats-in>div{padding:1.6rem 1.2rem;border-inline-start:1px solid rgba(255,255,255,.12)}
.hx-stats-in>div:first-child{border-inline-start:0}
.hx-stats b{display:block;font:800 clamp(1.8rem,3.2vw,2.6rem)/1.1 "Noto Kufi Arabic",sans-serif;font-variant-numeric:tabular-nums;color:#fff}
.hx-stats span{display:block;margin-top:.45rem;font-size:.9rem;line-height:1.7;color:rgba(255,255,255,.75)}
.hx-intents{padding:clamp(2.5rem,6vw,4.5rem) 0;background:#fff}
.hx-intents h2,.hx-devs h2,.hx-guides h2{font-family:"Noto Kufi Arabic",sans-serif;font-weight:800;font-size:clamp(1.6rem,3vw,2.3rem);color:var(--hx-ink);margin:0 0 1.4rem;letter-spacing:-.02em}
.hx-int-grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--hx-line);border-radius:20px;overflow:hidden}
.hx-int{padding:1.6rem 1.5rem;border-inline-start:1px solid var(--hx-line);background:linear-gradient(180deg,#fff,#fbfcfa)}
.hx-int:first-child{border-inline-start:0}
.hx-int h3{font:800 1.2rem/1.5 "Noto Kufi Arabic",sans-serif;color:var(--hx-g);margin:0 0 .35rem}
.hx-int p{margin:0 0 1rem;color:var(--hx-mute);font-size:.95rem;line-height:1.85}
.hx-int ul{list-style:none;margin:0;padding:0;display:grid;gap:.15rem}
.hx-int li a{display:flex;justify-content:space-between;align-items:center;padding:.55rem .2rem;border-bottom:1px dashed var(--hx-line);color:var(--hx-ink);text-decoration:none;font-weight:600;transition:color .2s,padding .25s var(--hx-ease)}
.hx-int li a::after{content:"‹";color:var(--hx-amber);font-weight:800;transition:transform .25s var(--hx-ease)}
.hx-int li a:hover,.hx-int li a:focus-visible{color:var(--hx-g);padding-inline-start:.6rem}
.hx-int li a:hover::after{transform:translateX(-4px)}
.hx-marquee{background:var(--hx-paper);padding:1.4rem 0;overflow:hidden;border-block:1px solid var(--hx-line);display:grid;gap:.7rem}
.hx-row{display:flex;width:max-content;animation:hx-marq 48s linear infinite}
.hx-row.is-rev{animation-direction:reverse;animation-duration:56s}
.hx-marquee:hover .hx-row,.hx-marquee:focus-within .hx-row{animation-play-state:paused}
.hx-track{display:flex;gap:.6rem;padding-inline-end:.6rem}
@keyframes hx-marq{to{transform:translateX(50%)}}
.hx-track a{display:inline-flex;align-items:center;gap:.55rem;white-space:nowrap;padding:.55rem 1rem;border-radius:999px;background:#fff;border:1px solid var(--hx-line);color:var(--hx-ink);text-decoration:none;font-weight:600;font-size:.95rem;transition:background .2s,color .2s}
.hx-track a span{font-size:.78rem;font-weight:700;padding:.05rem .5rem;border-radius:999px;background:var(--hx-paper);color:var(--hx-g);font-variant-numeric:tabular-nums}
.hx-track a:hover{background:var(--hx-g);color:#fff}.hx-track a:hover span{background:rgba(255,255,255,.18);color:#fff}
.green.section h2{color:#fff!important;-webkit-text-fill-color:#fff!important;background:none!important}
main[data-hx]{overflow-x:clip}
.hx-copy,.hx-figure{min-width:0}
.hx-devs{padding:clamp(2.5rem,6vw,4.5rem) 0;background:linear-gradient(180deg,#f7faf8,#fff)}
.hx-dev-in{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(1.5rem,4vw,3.5rem);align-items:center}
.hx-dev-copy p{color:var(--hx-mute);line-height:2;margin:0 0 1rem}
.hx-dev-links{display:flex;flex-wrap:wrap;gap:1rem;align-items:center}
.hx-dev-links a:not(.hx-btn){color:var(--hx-g);font-weight:700}
.hx-btn{display:inline-flex;align-items:center;padding:.75rem 1.3rem;border-radius:12px;background:var(--hx-g);color:#fff!important;text-decoration:none;font-weight:700;transition:transform .2s var(--hx-ease),background .2s}
.hx-btn:hover{background:var(--hx-g2);transform:translateY(-2px)}
.hx-btn.is-light{background:#fff;color:var(--hx-g)!important}
.hx-bars{list-style:none;margin:0;padding:1rem;border:1px solid var(--hx-line);border-radius:20px;background:#fff;display:grid;gap:.35rem}
.hx-bars a{display:grid;grid-template-columns:minmax(0,11rem) 1fr 2.6rem;gap:.8rem;align-items:center;padding:.65rem .5rem;border-radius:12px;color:var(--hx-ink);text-decoration:none;transition:background .2s}
.hx-bars a:hover{background:var(--hx-paper)}
.hx-bar-n{font-weight:700;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hx-bar{height:10px;border-radius:99px;background:#e8eee9;overflow:hidden}
.hx-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--hx-leaf),var(--hx-g));transform-origin:100% 50%;transform:scaleX(0);transition:transform 1.2s var(--hx-ease)}
.hx-bars li:nth-child(2) i{transition-delay:.08s}.hx-bars li:nth-child(3) i{transition-delay:.16s}.hx-bars li:nth-child(4) i{transition-delay:.24s}.hx-bars li:nth-child(5) i{transition-delay:.32s}.hx-bars li:nth-child(6) i{transition-delay:.4s}
.hx-bars.is-in i{transform:scaleX(var(--v))}
.hx-bars b{font:800 1.05rem "Noto Kufi Arabic",sans-serif;color:var(--hx-g);font-variant-numeric:tabular-nums;text-align:start}
.hx-guides{padding:clamp(2.5rem,6vw,4rem) 0;background:var(--hx-paper)}
.hx-g-head{display:flex;justify-content:space-between;align-items:center;gap:1rem}
.hx-g-nav{display:flex;gap:.4rem}
.hx-g-nav button{width:42px;height:42px;border-radius:50%;border:1px solid var(--hx-line);background:#fff;color:var(--hx-g);font-size:1.4rem;line-height:1;cursor:pointer;transition:background .2s,color .2s,transform .2s var(--hx-ease)}
.hx-g-nav button:hover{background:var(--hx-g);color:#fff}.hx-g-nav button:active{transform:scale(.92)}
.hx-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(260px,31%);gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:.3rem .2rem 1rem;scrollbar-width:thin;outline:none}
.hx-card{scroll-snap-align:start;display:flex;flex-direction:column;gap:.5rem;padding:1.25rem;border-radius:18px;background:#fff;border:1px solid var(--hx-line);color:var(--hx-ink);text-decoration:none;min-height:200px;transition:transform .3s var(--hx-ease),box-shadow .3s,border-color .3s}
.hx-card:hover,.hx-card:focus-visible{transform:translateY(-4px);border-color:var(--hx-leaf);box-shadow:0 18px 36px -20px rgba(18,63,51,.4)}
.hx-card small{color:var(--hx-amber);font-weight:700;font-size:.8rem}
.hx-card b{font:800 1.05rem/1.6 "Noto Kufi Arabic",sans-serif;color:var(--hx-g)}
.hx-card span{color:var(--hx-mute);font-size:.88rem;line-height:1.85;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.hx-cta{background:linear-gradient(120deg,var(--hx-g),var(--hx-g2),var(--hx-g));background-size:200% 100%;animation:hx-shift 14s ease-in-out infinite alternate;color:#fff}
@keyframes hx-shift{to{background-position:100% 0}}
.hx-cta-in{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1rem;padding:1.8rem 0}
.hx-cta p{margin:0;line-height:1.9}.hx-cta p a:not(.hx-btn){color:#fff;margin-inline-start:1rem;font-weight:600}
@media (max-width:900px){
.hx-hero-in,.hx-dev-in{grid-template-columns:minmax(0,1fr)}
.hx-hero h1{max-width:none}
.hx-int-grid{grid-template-columns:minmax(0,1fr)}.hx-int{border-inline-start:0;border-top:1px solid var(--hx-line)}.hx-int:first-child{border-top:0}
.hx-stats-in{grid-template-columns:repeat(2,1fr)}
.hx-stats-in>div:nth-child(3){border-inline-start:0}
.hx-stats-in>div:nth-child(n+3){border-top:1px solid rgba(255,255,255,.12)}
.hx-rail{grid-auto-columns:82%}
.hx-bars a{grid-template-columns:minmax(0,8.5rem) 1fr 2.4rem}
}
@media (max-width:520px){.hx-bars a{grid-template-columns:minmax(0,1fr) auto;row-gap:.45rem}.hx-bar{grid-column:1 / -1;grid-row:2}.hx-bar-n{white-space:normal}.hx-search button{padding:0 1rem}.hx-stats-in>div{padding:1.2rem .9rem}.hx-g-nav{display:none}}
@media (prefers-reduced-motion:reduce){
.hx-hero *,.hx-hero *::before,.hx-glow,.hx-row,.hx-cta,.hx-copy>*{animation:none!important}
.hx-road,.hx-axis,.hx-link{stroke-dashoffset:0}.hx-tile,.hx-car{opacity:1}.hx-car{display:none}
.hx-bar i{transition:none}.hx-rail{scroll-behavior:auto}
.hx-row{flex-wrap:wrap;width:auto;justify-content:center}.hx-track[aria-hidden]{display:none}.hx-track{flex-wrap:wrap;justify-content:center}
}
`;

// ============================================================================
// JS — counters, score bars, typewriter placeholder, rail buttons, progress,
//      pointer tilt on the plan. Everything off under reduced motion.
// ============================================================================
var JS = `(function(){
var d=document,rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var plan=d.querySelector('.hx-plan');if(rm&&plan&&plan.pauseAnimations)plan.pauseAnimations();
function count(el){var t=+el.getAttribute('data-count');if(rm||!t){return}var s=null,dur=1400;el.textContent='0';
function step(ts){if(!s)s=ts;var p=Math.min((ts-s)/dur,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(t*e).toLocaleString('en-US');if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
var io='IntersectionObserver'in window?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;
if(el.classList.contains('hx-stats'))el.querySelectorAll('[data-count]').forEach(count);
if(el.classList.contains('hx-bars'))el.classList.add('is-in');io.unobserve(el)})},{threshold:.35}):null;
d.querySelectorAll('.hx-stats,.hx-bars').forEach(function(el){if(io)io.observe(el);else el.classList.add('is-in')});
var q=d.getElementById('hx-q');
if(q&&!rm){var ph=['صيدلية 24 ساعة في الحي السابع','مدرسة لغات قريبة','شقق للإيجار من المالك','سعر متر الأرض في العبور الجديدة','جهاز مدينة العبور الجديدة','مستشفى طوارئ'],pi=0,ci=0,del=false,base='ابحث عن: ';
function tick(){if(d.activeElement===q||q.value){setTimeout(tick,1200);return}var w=ph[pi];ci+=del?-1:1;q.setAttribute('placeholder',base+w.slice(0,ci));
var wait=del?35:70;if(!del&&ci===w.length){del=true;wait=1700}else if(del&&ci===0){del=false;pi=(pi+1)%ph.length;wait=350}setTimeout(tick,wait)}setTimeout(tick,1600)}
d.querySelectorAll('[data-rail]').forEach(function(b){b.addEventListener('click',function(){var r=d.querySelector('.hx-rail');if(!r)return;var c=r.querySelector('.hx-card');var w=c?c.getBoundingClientRect().width+16:300;r.scrollBy({left:w*(+b.getAttribute('data-rail')),behavior:rm?'auto':'smooth'})})});
var bar=d.querySelector('.hx-progress');if(bar&&!rm){var tk=false;window.addEventListener('scroll',function(){if(tk)return;tk=true;requestAnimationFrame(function(){var h=d.documentElement,m=h.scrollHeight-h.clientHeight;bar.style.setProperty('--p',m>0?(h.scrollTop/m).toFixed(4):0);tk=false})},{passive:true})}
if(plan&&!rm&&matchMedia('(hover:hover) and (pointer:fine)').matches){var fig=plan.parentNode;fig.addEventListener('pointermove',function(e){var r=fig.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;plan.style.transform='perspective(900px) rotateY('+(x*5).toFixed(2)+'deg) rotateX('+(-y*5).toFixed(2)+'deg)'});fig.addEventListener('pointerleave',function(){plan.style.transform=''})}
})();`;

// run last so CSS/JS constants above are initialised
if (html.includes('data-hx="1"')) log("already applied — skip");
else build();
