/**
 * seo-phase5-updates.mjs
 * المرحلة الخامسة (5.4 + 5.6):
 *   - صفحة /updates/ من data/updates.json (فارغة = حالة فارغة محافظة).
 *   - RSS feed في /feed.xml.
 *   - robots.txt: سطور Allow صريحة للبوتات المحددة.
 *   - إعادة بناء sitemap.xml (آخر سكربت في السلسلة).
 *
 * المبادئ:
 *   - idempotent.
 *   - لا أخبار مُختلعة: البيانات تقرأ فقط من data/updates.json.
 *   - لا معلومات جديدة غير منشورة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data");
const publicDir = path.join(clientDir, "public");
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
    "name": "دليل العبور والعبور الجديدة",
    "url": SITE + "/",
    "logo": "https://obourguide.com/brand/logo.png",
    "foundingDate": "2026",
    "publishingPrinciples": SITE + "/editorial-policy/",
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

function pageShell(chrome, { title, description, url, h1, tag, breadcrumbItems, body }) {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": h1,
      "url": url,
      "inLanguage": "ar-EG",
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
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${breadcrumbItems
    .map((it, i) => {
      if (i === breadcrumbItems.length - 1) {
        return `<li><span aria-current="page">${it.name}</span></li>`;
      }
      return `<li><a href="${it.item}">${it.name}</a></li><li class="sep">›</li>`;
    })
    .join("")}</ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap">${body}</div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// قراءة التحديثات
// ---------------------------------------------------------------------------
function ensureUpdatesJson() {
  fs.mkdirSync(dataDir, { recursive: true });
  const p = path.join(dataDir, "updates.json");
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, "[]\n");
    rep("data", "أُنشئ data/updates.json كمصفوفة فارغة");
  }
  return p;
}

function readUpdates() {
  const p = ensureUpdatesJson();
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${y}-${m}-${d}T00:00:00+02:00`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildFeedXML(updates) {
  const now = new Date().toISOString();
  const items = updates
    .map((u) => {
      const date = u.date || DEFAULT_LASTMOD;
      const title = escapeXml(u.title || "تحديث");
      const url = u.url ? `${SITE}${u.url}` : SITE + "/updates/";
      const desc = escapeXml(u.description || "");
      return `  <item>\n    <title>${title}</title>\n    <link>${url}</link>\n    <guid>${url}</guid>\n    <pubDate>${formatDate(date)}</pubDate>\n    <description>${desc}</description>\n  </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>تحديثات دليل العبور والعبور الجديدة</title>\n  <link>${SITE}/updates/</link>\n  <description>تحديثات منشورة على دليل العبور والعبور الجديدة من مصادر رسمية ومنشورة.</description>\n  <language>ar-EG</language>\n  <lastBuildDate>${now}</lastBuildDate>\n  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />\n${items}\n</channel>\n</rss>\n`;
}

function updatesPage(chrome, updates) {
  const url = `${SITE}/updates/`;
  const title = "تحديثات دليل العبور والعبور الجديدة | دليل العبور";
  const description = "تتبّع التحديثات المنشورة على دليل العبور والعبور الجديدة. لا أخبار مُختلعة — كل تحديث مُرفق بمصدر منشور.";
  const h1 = "تحديثات دليل العبور";

  let body;
  if (updates.length === 0) {
    body = `
<p>لا توجد تحديثات منشورة حاليًا. هذه الصفحة تُملأ فقط من ملف <code>data/updates.json</code> عندما تتوفر تحديثات مُوثَّقة بمصادر منشورة.</p>
<p><a href="/feed.xml">اشترك عبر RSS ↗</a></p>
<div class="action-card">
  <p>هل لديك تحديث مُوثَّق؟</p>
  <p>أرسل لنا تحديثًا من مصدر رسمي عبر <a href="/contact/">صفحة التواصل</a> مع ذكر رابط المصدر. لا تُرسل إعلانات تسويقية أو بيانات بدون مصدر.</p>
  <a class="button" href="/contact/">اقترح تحديثًا موثقًا ↖</a>
</div>
`;
  } else {
    const rows = updates
      .map((u) => {
        const date = u.date || DEFAULT_LASTMOD;
        const titleText = u.title || "تحديث";
        const link = u.url ? `<a href="${u.url}">${titleText}</a>` : titleText;
        return `<tr><td>${date}</td><td>${link}</td><td>${u.description || ""}</td><td>${u.source_label || ""}</td></tr>`;
      })
      .join("");
    body = `
<p>الجدول أدناه يضم التحديثات المُدرجة من مصادر منشورة. كل تحديث مرفق بتاريخ ومصدر يمكنك فحصه.</p>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>التاريخ</th><th>العنوان</th><th>الوصف</th><th>المصدر</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
`;
  }

  return pageShell(chrome, {
    title,
    description,
    url,
    h1,
    tag: "تحديثات منشورة",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "التحديثات", item: url },
    ],
    body,
  });
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------
function updateRobotsTxt() {
  const p = path.join(publicDir, "robots.txt");
  const explicitAllow = [
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
  ].join("\n");

  let content = "";
  if (fs.existsSync(p)) {
    content = fs.readFileSync(p, "utf8");
  }
  if (content.includes("User-agent: GPTBot")) {
    rep("robots", "robots.txt يحتوي على السطور الصريحة مسبقًا — لم يُعدل");
    return;
  }
  content = explicitAllow + content;
  fs.writeFileSync(p, content);
  rep("robots", "أُضيفت سطور Allow صريحة لـ GPTBot وClaudeBot وPerplexityBot وGoogle-Extended في robots.txt");
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
function rebuildSitemap() {
  const entries = [];
  for (const f of listPageFiles()) {
    const slug = slugOf(f);
    if (SITEMAP_EXCLUDE.has(slug)) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (بدون changefreq/priority)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const updates = readUpdates();

  const updatesDir = path.join(clientDir, "updates");
  fs.mkdirSync(updatesDir, { recursive: true });
  fs.writeFileSync(path.join(updatesDir, "index.html"), updatesPage(chrome, updates));
  rep("page", `أُنشئت /updates/ (${updates.length} تحديث)`);

  fs.writeFileSync(path.join(publicDir, "feed.xml"), buildFeedXML(updates));
  rep("feed", `أُنشئ /feed.xml (${updates.length} عنصر)`);

  updateRobotsTxt();
  rebuildSitemap();

  console.log("=== تقرير المرحلة الخامسة: التحديثات والـ RSS وrobots.txt (5.4 + 5.6) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
