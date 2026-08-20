/**
 * seo-phase3-data-hub.mjs
 * المرحلة الثالثة (3.1): مركز البيانات المفتوحة /data/
 *
 * يعمل بعد render-static.mjs والمراحل الثانية:
 *   node scripts/render-static.mjs
 *   node scripts/seo-phase1-postprocess.mjs
 *   node scripts/seo-phase2-developers.mjs
 *   node scripts/seo-phase2-districts.mjs
 *   node scripts/seo-phase2-compounds.mjs
 *   node scripts/seo-phase3-data-hub.mjs
 *
 * ينشئ ملفات JSON/CSV قابلة للتحميل في client/public/data/
 * وصفحة /data/ تشرح البيانات وترخّصها وتربطها بـ /methodology/ و /sources/.
 *
 * المبادئ الملزمة:
 *  - idempotent: كل تشغيل يعيد كتابة الملفات بالكامل.
 *  - لا حقائق مخترعة: البيانات مأخوذة فقط من الملفات الموجودة.
 *  - رخصة البيانات CC BY-SA 4.0 مع نسبة العمل إلى دليل العبور.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const dataPublicDir = path.join(publicDir, "data");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";
const LICENSE = "CC BY-SA 4.0";
const ATTRIBUTION = "دليل العبور والعبور الجديدة";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// ---------------------------------------------------------------------------
// أدوات عامة
// ---------------------------------------------------------------------------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const META_KEYS = new Set(["generated", "license", "attribution"]);

function stableGenerated(payload, filePath) {
  const payloadStr = JSON.stringify(payload);
  if (fs.existsSync(filePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const existingPayload = {};
      for (const [k, v] of Object.entries(existing)) {
        if (!META_KEYS.has(k)) existingPayload[k] = v;
      }
      if (JSON.stringify(existingPayload) === payloadStr && existing.generated) {
        return existing.generated;
      }
    } catch {}
  }
  return new Date().toISOString();
}

function jsonMeta(payload, filePath) {
  return {
    generated: stableGenerated(payload, filePath),
    license: LICENSE,
    attribution: ATTRIBUTION,
  };
}

// يستخرج مصفوفة const NAME = [...] من ملف JS بشكل آمن نسبيًا
function extractArray(filePath, varName) {
  const src = fs.readFileSync(filePath, "utf8");
  const prefix = `const ${varName} = `;
  const start = src.indexOf(prefix);
  if (start === -1) throw new Error(`لا يوجد مصفوفة ${varName} في ${filePath}`);

  let i = start + prefix.length;
  if (src[i] !== "[") throw new Error(`المتغير ${varName} ليس مصفوفة`);

  let depth = 1;
  i++;
  let inString = false;
  let stringChar = null;
  let escaped = false;

  for (; i < src.length; i++) {
    const ch = src[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (inString) {
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }

  const literal = src.slice(start + prefix.length, i);
  // eslint-disable-next-line no-eval
  return eval(literal);
}

// ---------------------------------------------------------------------------
// تحميل البيانات من الملفات الموجودة فقط
// ---------------------------------------------------------------------------
const directories = fs
  .readdirSync(path.join(root, "data", "directories"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, "data", "directories", f), "utf8")));

const realSchools = extractArray(path.join(root, "scripts", "render-static.mjs"), "realSchools");
const neighborhoods = extractArray(path.join(root, "scripts", "render-static.mjs"), "neighborhoods");
const landings = extractArray(path.join(root, "scripts", "render-static.mjs"), "landings");
const COMPOUNDS = extractArray(path.join(root, "scripts", "seo-phase2-compounds.mjs"), "COMPOUNDS");
const DEVELOPERS = extractArray(path.join(root, "scripts", "seo-phase2-developers.mjs"), "DEVELOPERS");

// ---------------------------------------------------------------------------
// تحضير البيانات القابلة للتحميل
// ---------------------------------------------------------------------------
function buildDirectoriesData(filePath) {
  const items = directories
    .filter((d) => Array.isArray(d.items))
    .flatMap((d) =>
      d.items.map((it) => ({
        directorySlug: d.slug,
        directoryTitle: d.title,
        name: it.n || "",
        englishName: it.e || "",
        category: it.c || "",
        area: it.a || "",
        phone: it.t || it.p || "",
        source: it.s || "",
      }))
    );

  const payload = {
    count: items.length,
    directories: directories.map((d) => ({ slug: d.slug, title: d.title, count: d.count, lead: d.lead })),
    items,
  };
  return { ...jsonMeta(payload, filePath), ...payload };
}

function csvEscape(val) {
  const s = String(val ?? "").replace(/\r?\n/g, " ");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildDirectoriesCsv() {
  const rows = directories
    .filter((d) => Array.isArray(d.items))
    .flatMap((d) =>
      d.items.map((it) => ({
        name: it.n || "",
        category: it.c || "",
        area: it.a || "",
        phone: it.t || it.p || "",
        source: it.s || "",
      }))
    );

  const header = ["name", "category", "area", "phone", "source"];
  const lines = [header.join(","), ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(","))];
  return lines.join("\n") + "\n";
}

function buildDistrictsData() {
  const districtObjects = neighborhoods.map((n) => ({
    id: n[0],
    name: n[1],
    status: n[2],
    targetAudience: n[3],
    note: n[4],
  }));
  return { ...jsonMeta(), count: districtObjects.length, districts: districtObjects };
}

function buildSchoolsData(filePath) {
  const payload = { count: realSchools.length, schools: realSchools };
  return { ...jsonMeta(payload, filePath), ...payload };
}

function buildCompoundsData(filePath) {
  const payload = { count: COMPOUNDS.length, compounds: COMPOUNDS };
  return { ...jsonMeta(payload, filePath), ...payload };
}

function buildDevelopersData(filePath) {
  const payload = { count: DEVELOPERS.length, developers: DEVELOPERS };
  return { ...jsonMeta(payload, filePath), ...payload };
}

// ---------------------------------------------------------------------------
// كتابة ملفات التحميل
// ---------------------------------------------------------------------------
const datasets = [];

function writeDataset(filename, content, rows, fields, format) {
  const filePath = path.join(dataPublicDir, filename);
  fs.writeFileSync(filePath, content);
  datasets.push({ filename, format, rows, fields });
  rep("dataset", `${filename}: ${rows} صف · ${format}`);
}

function writeDownloadables() {
  ensureDir(dataPublicDir);

  const directoriesPath = path.join(dataPublicDir, "obour-directories.json");
  const directoriesData = buildDirectoriesData(directoriesPath);
  writeDataset(
    "obour-directories.json",
    JSON.stringify(directoriesData, null, 2),
    directoriesData.items.length,
    ["directorySlug", "directoryTitle", "name", "englishName", "category", "area", "phone", "source"],
    "JSON"
  );

  writeDataset(
    "obour-directories.csv",
    buildDirectoriesCsv(),
    directoriesData.items.length,
    ["name", "category", "area", "phone", "source"],
    "CSV"
  );

  const schoolsPath = path.join(dataPublicDir, "obour-schools.json");
  const schoolsData = buildSchoolsData(schoolsPath);
  writeDataset(
    "obour-schools.json",
    JSON.stringify(schoolsData, null, 2),
    schoolsData.schools.length,
    ["group", "name", "slug", "area", "type", "source", "sourceLabel", "maps"],
    "JSON"
  );

  const districtsPath = path.join(dataPublicDir, "obour-districts.json");
  const districtsData = buildDistrictsData(districtsPath);
  writeDataset(
    "obour-districts.json",
    JSON.stringify(districtsData, null, 2),
    districtsData.districts.length,
    ["id", "name", "status", "targetAudience", "note"],
    "JSON"
  );

  const compoundsPath = path.join(dataPublicDir, "obour-compounds.json");
  const compoundsData = buildCompoundsData(compoundsPath);
  writeDataset(
    "obour-compounds.json",
    JSON.stringify(compoundsData, null, 2),
    compoundsData.compounds.length,
    ["slug", "name", "developer", "district", "status", "source", "published"],
    "JSON"
  );

  const developersPath = path.join(dataPublicDir, "obour-developers.json");
  const developersData = buildDevelopersData(developersPath);
  writeDataset(
    "obour-developers.json",
    JSON.stringify(developersData, null, 2),
    developersData.developers.length,
    ["slug", "name", "domain", "scores", "total", "published", "pending", "projects", "sourceNote"],
    "JSON"
  );
}

// ---------------------------------------------------------------------------
// chrome: head/header/footer من about-us/index.html
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
    "name": ATTRIBUTION,
    "url": SITE + "/",
    "logo": SITE + "/brand/logo.png",
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

function dataPage(chrome) {
  const url = `${SITE}/data/`;
  const title = "بيانات دليل العبور المفتوحة | دليل العبور";
  const description = "تنزيل بيانات دليل العبور والعبور الجديدة بصيغ JSON وCSV: أدلة الخدمات، المدارس، الأحياء، المشروعات، والمطورين. رخصة CC BY-SA 4.0.";
  const h1 = "بيانات دليل العبور المفتوحة";

  const tableHeader = `
    <div style="grid-template-columns:1.6fr .7fr .6fr 2fr 1fr">
      <b>الملف</b>
      <b>الصيغة</b>
      <b>الصفوف</b>
      <b>الحقول الرئيسية</b>
      <b>الترخيص</b>
    </div>`;

  const tableRows = datasets
    .map(
      (d) => `
    <div style="grid-template-columns:1.6fr .7fr .6fr 2fr 1fr">
      <span><a href="/data/${d.filename}" download><strong>${d.filename}</strong></a></span>
      <span>${d.format}</span>
      <span>${d.rows.toLocaleString("ar-EG")}</span>
      <span>${d.fields.join(" · ")}</span>
      <span><a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ar" target="_blank" rel="nofollow noopener">CC BY-SA 4.0 ↗</a></span>
    </div>`
    )
    .join("");

  const schemaRows = datasets
    .map(
      (d) => `
    <tr>
      <td><strong>${d.filename}</strong></td>
      <td>${d.format}</td>
      <td>${d.rows.toLocaleString("ar-EG")}</td>
      <td>${d.fields.join("، ")}</td>
    </tr>`
    )
    .join("");

  const body = `
    <h2>هدف البيانات المفتوحة</h2>
    <p>هذه الصفحة تنشر كل ما جمعه دليل العبور والعبور الجديدة من بيانات منظمة وقابلة للتحميل — بدون اختراع أو إضافة. يمكن استخدامها في البحث، ومقارنة الخدمات، وبناء تطبيقات، بشرط نسبة العمل إلى دليل العبور والعبور الجديدة والحفاظ على نفس الرخصة.</p>
    <p>البيانات مأخوذة من: ملفات <code>data/directories/*.json</code>، وملف <code>scripts/render-static.mjs</code> (المدارس والأحياء)، وملفات المرحلة الثانية للمطورين والمشروعات.</p>

    <h2>ملفات قابلة للتحميل</h2>
    <div class="data-table">${tableHeader}${tableRows}</div>
    <p><small>جميع الملفات مكتوبة من الصفر عند كل تشغيل (idempotent). آخر تحديث: ${DEFAULT_LASTMOD}.</small></p>

    <h2>ترخيص الاستخدام</h2>
    <p>البيانات مرخصة بموجب <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ar" target="_blank" rel="nofollow noopener">رخصة المشاع الإبداعي نسبة المؤلف - الترخيص بالمثل 4.0 دولي ↗</a>. الشروط:</p>
    <ul class="check-list">
      <li>✓ النسبة: اذكر <strong>دليل العبور والعبور الجديدة</strong> كمصدر.</li>
      <li>✓ المشاركة بالمثل: أي derivative يجب أن يحمل نفس الرخصة.</li>
      <li>✓ لا ضمان: البيانات تقاس بما نُشر من مصادر؛ تحقق ميدانيًا قبل أي قرار.</li>
    </ul>

    <h2>هيكل كل ملف</h2>
    <div class="table-wrap"><table class="data-table-table">
      <thead><tr><th>الملف</th><th>الصيغة</th><th>الصفوف</th><th>الحقول</th></tr></thead>
      <tbody>${schemaRows}</tbody>
    </table></div>

    <h2>منهجية المصادر والتحقق</h2>
    <p>لا نضيف بيانات من دون مصدر. كل مدخل في الأدلة يرتبط بمصدره المنشور، وكل مشروع ومطور يقتبس البيانات المنشورة فقط. للتفاصيل:</p>
    <p>
      <a href="/methodology/">منهجية التقييم</a> ·
      <a href="/sources/">المصادر والمراجع</a> ·
      <a href="/editorial-policy/">السياسة التحريرية</a> ·
      <a href="/corrections/">سياسة التصحيح</a>
    </p>

    <h2>كيف تُبلغ عن خطأ أو إضافة</h2>
    <p>إذا وجدت خطأً أو لديك بيانات منشورة قابلة للفحص ترغب بإضافتها، استخدم <a href="/corrections/">صفحة التصحيح</a>. لا نُدرج أي بيانات لا يمكن نسبتها لمصدر منشور.</p>
  `;

  const aside = `
    <aside class="action-card">
      <p>مركز البيانات</p>
      <a class="text-link" href="/methodology/">منهجية التقييم ↖</a>
      <a class="text-link" href="/sources/">المصادر ↖</a>
      <a class="text-link" href="/editorial-policy/">السياسة التحريرية ↖</a>
      <a class="text-link" href="/corrections/">سياسة التصحيح ↖</a>
      <a class="text-link" href="/directory/">دليل الخدمات ↖</a>
      <a class="text-link" href="/developers/">دليل المطورين ↖</a>
    </aside>
  `;

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
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "بيانات مفتوحة", "item": url },
      ],
    },
    orgNode(),
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "بيانات دليل العبور المفتوحة",
      "url": url,
      "license": "https://creativecommons.org/licenses/by-sa/4.0/",
      "creator": { "@id": SITE + "/#org" },
      "distribution": datasets.map((d) => ({
        "@type": "DataDownload",
        "contentUrl": `${SITE}/data/${d.filename}`,
        "encodingFormat": d.format === "CSV" ? "text/csv" : "application/json",
        "name": d.filename,
      })),
    },
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `
    <nav class="breadcrumb" aria-label="مسار التنقل">
      <div class="wrap">
        <ol>
          <li><a href="${SITE}/">الرئيسية</a></li>
          <li class="sep">›</li>
          <li><span aria-current="page">بيانات مفتوحة</span></li>
        </ol>
      </div>
    </nav>`;
  const main = `
    <main>
      <section class="page-hero">
        <div class="grid-bg" aria-hidden="true"></div>
        <div class="wrap hero-layout">
          <div class="hero-copy-block">
            <span class="tag">⌖ مركز البيانات</span>
            <h1>${h1}</h1>
            <p>${description}</p>
          </div>
        </div>
      </section>
      <section class="paper section">
        <div class="wrap content-grid">
          <article>${body}</article>
          ${aside}
        </div>
      </section>
    </main>`;

  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

function buildDataPage(chrome) {
  ensureDir(path.join(clientDir, "data"));
  const file = path.join(clientDir, "data", "index.html");
  fs.writeFileSync(file, dataPage(chrome));
  rep("page", "/data/ أُنشئت");
}

// ---------------------------------------------------------------------------
// إعادة بناء sitemap.xml
// ---------------------------------------------------------------------------
const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "أبريل": "04", "ابريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};
const SITEMAP_EXCLUDE = new Set(["/404/", "/search/", "/dining-guide/", "/shopping-guide/", "/health-guide/"]);
const KNOWN_DIRECTORIES = new Set(directories.filter((d) => d.slug !== "schools-all").map((d) => `/${d.slug}/`));
const KNOWN_LANDINGS = new Set(landings.map((L) => `/${L.parent}/${L.slug}/`));

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
  const isHome = slug === "/";
  const isPrices = slug === "/prices/";
  const isDevelopersIndex = slug === "/developers/";
  const isDirectory = KNOWN_DIRECTORIES.has(slug);
  const isLanding = KNOWN_LANDINGS.has(slug);
  const isSchool = slug.startsWith("/schools/");

  if (isHome || isPrices) return { priority: isHome ? "1.0" : "0.9", changefreq: "weekly" };
  if (isDevelopersIndex) return { priority: "0.9", changefreq: "monthly" };
  if (isDirectory || isLanding) return { priority: "0.8", changefreq: "weekly" };
  if (isSchool) return { priority: "0.6", changefreq: "monthly" };
  return { priority: "0.7", changefreq: "monthly" };
}

function rebuildSitemap() {
  const entries = [];
  for (const f of listPageFiles()) {
    const slug = slugOf(f);
    if (SITEMAP_EXCLUDE.has(slug)) continue;
    const { priority, changefreq } = sitemapPriorityAndFreq(slug);
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")), priority, changefreq });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (شاملة /data/)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  writeDownloadables();
  buildDataPage(chrome);
  rebuildSitemap();

  console.log("=== تقرير المرحلة الثالثة: مركز البيانات المفتوحة (3.1) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
