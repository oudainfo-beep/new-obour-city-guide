/**
 * seo-phase28-news-feed.mjs
 * المرحلة 28 — تبويب الأخبار: تجميع تلقائي لتغطية الصحف عن العبور والعبور الجديدة.
 *
 * الآلية:
 *  - يسحب Google News RSS لثلاثة استعلامات: «العبور الجديدة» و«مدينة العبور» و«Obour City».
 *  - يصفّي آخر 90 يومًا، يزيل التكرار، ويخزّن النتيجة في data/news-cache.json (مُلتزم بالمستودع).
 *  - إن تعذّر السحب (بناء بلا إنترنت) يستخدم آخر كاش — الصفحة لا تنهار أبدًا.
 *  - يبني /news/ بروابط خارجية موثقة للمصادر الصحفية + ItemList schema.
 *  - idempotent بالكامل: يعاد توليده كل build بمحتوى محدث.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data");
const CACHE = path.join(dataDir, "news-cache.json");
const SITE = "https://obourguide.com";
const TODAY = "2026-08-28";
const MAX_AGE_DAYS = 90;
const MAX_ITEMS = 40;

const QUERIES = [
  { q: "العبور الجديدة", label: "العبور الجديدة" },
  { q: "مدينة العبور", label: "مدينة العبور" },
  { q: "Obour City", label: "Obour City" },
];

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

function decode(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
}

async function fetchFeed(q) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ar&gl=EG&ceid=EG:ar`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "ObourGuideNewsBot/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const title = decode((b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const link = decode((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "");
    const pubDate = (b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";
    const source = decode((b.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || "");
    const ts = Date.parse(pubDate);
    if (!title || !link || !ts) continue;
    items.push({ title, link, source: source || "مصدر صحفي", ts, topic: q });
  }
  return items;
}

async function collectNews() {
  const all = [];
  for (const { q } of QUERIES) {
    try {
      const items = await fetchFeed(q);
      rep("OK", `feed "${q}": ${items.length} items`);
      all.push(...items);
    } catch (e) {
      rep("WARN", `feed "${q}" failed: ${e.message}`);
    }
  }
  // merge with previous cache for continuity, dedupe by title
  let cached = [];
  if (fs.existsSync(CACHE)) {
    try { cached = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch {}
  }
  const byTitle = new Map();
  for (const it of [...all, ...cached]) {
    const key = it.title.replace(/\s+/g, " ").slice(0, 80).toLowerCase();
    if (!byTitle.has(key)) byTitle.set(key, it);
  }
  const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
  const merged = [...byTitle.values()]
    .filter((x) => x.ts > cutoff)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_ITEMS);
  if (all.length > 0) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(merged));
    rep("OK", `news cache updated: ${merged.length} items`);
  } else {
    rep("WARN", "all feeds failed — using cached news only");
  }
  return merged;
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" });
}

function buildPage(chrome, items) {
  const url = `${SITE}/news/`;
  const title = "أخبار العبور والعبور الجديدة من الصحف — محدثة يوميًا | دليل العبور";
  const description = "تغطية الصحف والمواقع الإخبارية لمدينة العبور والعبور الجديدة مجمعة تلقائيًا في مكان واحد: عناوين ومصادر وتواريخ — تُحدَّث مع كل نشر للموقع.";
  const h1 = "أخبار العبور والعبور الجديدة من الصحف";

  const schemas = [
    {
      "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
      name: "دليل العبور والعبور الجديدة", url: SITE + "/", logo: SITE + "/brand/logo.png",
      foundingDate: "2026", publishingPrinciples: SITE + "/editorial-policy/",
    },
    {
      "@context": "https://schema.org", "@type": "CollectionPage", name: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "الأخبار", item: url },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 20).map((it, i) => ({
        "@type": "ListItem", position: i + 1, name: it.title, url: it.link,
      })),
    },
  ];

  let head = chrome.head;
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  head = head.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  head = head.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  head = head.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  head = head.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);

  const list = items.length
    ? items.map((it) => `<li style="margin-bottom:1.1rem"><a href="${it.link}" rel="noopener nofollow" target="_blank"><strong>${it.title}</strong></a><br><small>${it.source} · ${fmtDate(it.ts)}</small></li>`).join("\n")
    : `<p>لا توجد أخبار مجمعة حاليًا. تُحدَّث هذه الصفحة تلقائيًا مع كل نشر للموقع.</p>`;

  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ أخبار موثقة</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>
<p>هذه الصفحة تجمع تلقائيًا ما تنشره الصحف والمواقع الإخبارية عن <strong>مدينة العبور والعبور الجديدة</strong> — من مشروعات وطرق وخدمات وأسعار — مرتبة بالأحدث، مع اسم المصدر الصحفي وتاريخ النشر ورابط الخبر الأصلي. التجميع آلي من موجز الأخبار العامة، والروابط تقود لمواقع الناشرين الأصليين.</p>
<p>لتحليلنا التحريري للمستجدات راجع <a href="/obour-news/">دليل متابعة الأخبار الموثوقة</a> و<a href="/tracker/">متابعة أحداث العبور الجديدة</a>، ولتطورات السوق <a href="/new-projects-watch/">رصد المشروعات الجديدة</a> و<a href="/market-reports-obour/">التقارير العقارية الخارجية</a>.</p>
<h2>آخر التغطيات الصحفية</h2>
<ul style="list-style:none;padding:0">${list}</ul>
<p class="caption">العناوين والمحتوى ملك للناشرين الأصليين. التجميع لأغراض الإحالة الإخبارية مع رابط المصدر لكل خبر. لتصحيح أو إضافة مصدر: <a href="/corrections/">صفحة التصحيح</a>.</p>
</article><aside class="action-card"><p>خبر موثق عن العبور لم يظهر هنا؟</p><a class="button" href="/corrections/">أرسله بمصدره ↖</a><a class="text-link" href="/updates/">تحديثات الدليل ↖</a></aside></div></section></main>`;
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">الأخبار</span></li></ol></div></nav>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

function addNavLink() {
  // تبويب «الأخبار» في قائمة الموقع — تعديل المانح حتى تنسخه كل الصفحات في البناء
  const donorPath = path.join(clientDir, "about-us", "index.html");
  let html = fs.readFileSync(donorPath, "utf8");
  if (html.includes('href="/news/"')) {
    rep("SKIP", "nav already links /news/");
    return;
  }
  const marker = '<div class="nav-item"><a href="/health-guide/">الصحة</a></div>';
  if (!html.includes(marker)) {
    rep("WARN", "nav marker not found — skipped nav link");
    return;
  }
  html = html.replace(marker, `${marker}<div class="nav-item"><a href="/news/">الأخبار</a></div>`);
  const mMarker = '<a class="m-solo" href="/health-guide/">الصحة</a>';
  if (html.includes(mMarker)) {
    html = html.replace(mMarker, `${mMarker}<a class="m-solo" href="/news/">الأخبار</a>`);
  }
  fs.writeFileSync(donorPath, html, "utf8");
  rep("OK", "added /news/ to site nav (desktop + mobile)");
}

async function main() {
  const items = await collectNews();
  const chrome = loadChrome();
  const outDir = path.join(clientDir, "news");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), buildPage(chrome, items), "utf8");
  rep("OK", `wrote /news/ with ${items.length} items`);
  addNavLink();
  console.log("Phase 28 news feed done");
  console.log(report.join("\n"));
}

main();
