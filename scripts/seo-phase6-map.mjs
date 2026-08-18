/**
 * seo-phase6-map.mjs
 * المرحلة السادسة (6.2): صفحة /map/ التفاعلية.
 *
 * المبادئ:
 *   - idempotent: الملفات تُنشأ مرة واحدة؛ الصفحة تُعاد كتابتها بالكامل.
 *   - الإحداثيات من Nominatim OpenStreetMap مع تسجيل المصدر داخل data/map-pins.json.
 *   - ما لا يُعثر على إحداثي موثوق له لا يُدرج.
 *   - popup يحتوي رابطًا داخليًا فقط.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const CATEGORY_COLORS = {
  districts: "#3E6B4A",
  compounds: "#C69148",
  schools: "#4A7C94",
  landmarks: "#8B5A6B",
};

// ---------------------------------------------------------------------------
// جمع الأماكن المراد البحث عنها
// ---------------------------------------------------------------------------
function listSlugs(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const idx = path.join(dir, e.name, "index.html");
    if (fs.existsSync(idx)) out.push({ slug: "/" + path.relative(clientDir, dir) + "/" + e.name + "/", file: idx, id: e.name });
  }
  return out;
}

function extractH1(file) {
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!m) return path.basename(path.dirname(file));
  return m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function districtSearchName(id, h1) {
  const numMap = {
    "district-1": "1", "district-2": "2", "district-3": "3", "district-4": "4",
    "district-5": "5", "district-6": "6", "district-7": "7", "district-8": "8", "district-9": "9",
    "district-24-bet-el-watan": "24", "district-25": "25", "el-momtaz": "El Momtaz",
  };
  const n = numMap[id];
  if (!n) return h1;
  return n === "El Momtaz" ? "El Momtaz Obour Egypt" : `District ${n} Obour Egypt`;
}

function shortName(h1) {
  return h1
    .replace(/ في العبور الجديدة/g, "")
    .replace(/مدارس النيل المصرية الدولية — فرع العبور/g, "Nile Egyptian Schools Obour")
    .replace(/المدرسة الرسمية الدولية بالعبور \(IPS\)/g, "International Public School Obour")
    .replace(/المدرسة المصرية اليابانية بالعبور \(EJS\)/g, "Egyptian Japanese School Obour")
    .replace(/مجمع الحرية التعليمي/g, "Horreya Educational Complex Obour")
    .replace(/مدارس الكرامة الرسمية للغات/g, "Karama Language School Obour")
    .replace(/مجمع الجمهورية الجديدة للتعليم الأساسي/g, "New Republic School Obour")
    .replace(/المدرسة الرسمية الدولية روضة العبور \(IPS\)/g, "IPS Rawdet Obour")
    .replace(/مجمع أسامة بن زيد التعليمي/g, "Osama Bin Zaid School Obour")
    .replace(/مجمع الشيماء التعليمي/g, "Shaimaa Educational Complex Obour")
    .replace(/بلال بن رباح الثانوية المشتركة/g, "Bilal Bin Rabah School Obour")
    .trim();
}

function compoundSearchName(id, h1) {
  const names = {
    canary: "Canary Compound Obour",
    solana: "Solana Compound Obour",
    sundus: "Sundus Compound Obour",
    safari: "Safari Compound Obour",
    "vaily-residence": "Vaily Residence Obour",
    "the-mars": "The Mars Compound Obour",
    "jeddah-mall": "Jeddah Mall Obour",
    "obour-mall": "Obour Mall Obour",
    "town-ten": "Town Ten Compound Obour",
    "glory-gardens": "Glory Gardens Obour",
    "o-kardia": "O Kardia Obour",
    "river-park": "River Park Obour",
    "golf-city": "Golf City Obour",
  };
  return names[id] || shortName(h1) + " Obour";
}

function buildQueries() {
  const queries = [];
  for (const it of listSlugs(path.join(clientDir, "districts"))) {
    const h1 = extractH1(it.file);
    queries.push({ id: it.id, slug: it.slug, name: h1, category: "districts", search: districtSearchName(it.id, h1) });
  }
  for (const it of listSlugs(path.join(clientDir, "compounds"))) {
    const h1 = extractH1(it.file);
    queries.push({ id: it.id, slug: it.slug, name: h1, category: "compounds", search: compoundSearchName(it.id, h1) });
  }
  for (const it of listSlugs(path.join(clientDir, "schools"))) {
    const h1 = extractH1(it.file);
    queries.push({ id: it.id, slug: it.slug, name: h1, category: "schools", search: shortName(h1) + " Egypt" });
  }
  queries.push({ id: "obour-university", slug: "/about/", name: "جامعة العبور", category: "landmarks", search: "Obour University Egypt" });
  queries.push({ id: "obour-new-city-authority", slug: "/about/", name: "جهاز مدينة العبور الجديدة", category: "landmarks", search: "New Obour City Authority Egypt" });
  queries.push({ id: "obour-stadium", slug: "/about/", name: "استاد العبور", category: "landmarks", search: "Obour Stadium Egypt" });
  return queries;
}

// ---------------------------------------------------------------------------
// Nominatim geocoding
// ---------------------------------------------------------------------------
async function geocodeOne(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q.search)}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "obourguide-bot/1.0" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      id: q.id,
      slug: q.slug,
      name: q.name,
      category: q.category,
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      source: `OpenStreetMap Nominatim — ${data[0].display_name} (licence: ${data[0].licence || "ODbL"})`,
    };
  } catch {
    return null;
  }
}

async function ensurePinsFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  const p = path.join(dataDir, "map-pins.json");
  if (fs.existsSync(p)) {
    rep("data", "data/map-pins.json موجود مسبقًا — لم يُعدل");
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {
      return [];
    }
  }
  const queries = buildQueries();
  const pins = [];
  for (const q of queries) {
    const pin = await geocodeOne(q);
    if (pin) {
      pins.push(pin);
      rep("geocode", `${pin.name} → ${pin.lat}, ${pin.lon}`);
    } else {
      rep("geocode", `${q.name} → لم يُعثر على إحداثي موثوق — تُخطّى`);
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
  fs.writeFileSync(p, JSON.stringify(pins, null, 2) + "\n");
  rep("data", `أُنشئ data/map-pins.json بـ ${pins.length} دبوس`);
  return pins;
}

// ---------------------------------------------------------------------------
// بناء صفحة /map/
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

function mapPage(chrome, pins) {
  const url = `${SITE}/map/`;
  const title = "خريطة العبور والعبور الجديدة التفاعلية | دليل العبور";
  const description = "خريطة تفاعلية لأحياء ومشروعات ومدارس ومعالم العبور والعبور الجديدة — بإحداثيات منشورة من OpenStreetMap.";
  const h1 = "خريطة العبور والعبور الجديدة التفاعلية";

  const pinsJson = JSON.stringify(pins);
  const legend = Object.entries(CATEGORY_COLORS)
    .map(([cat, color]) => {
      const label = { districts: "الأحياء", compounds: "المشروعات", schools: "المدارس", landmarks: "معالم" }[cat];
      return `<span style="display:inline-flex;align-items:center;gap:.4rem;margin-left:1rem"><span style="width:12px;height:12px;border-radius:50%;background:${color}"></span>${label}</span>`;
    })
    .join("");

  const body = `
<p>استخدم الخريطة لاستكشاف أحياء ومشروعات ومدارس ومعالم العبور والعبور الجديدة. كل دبوس يحمل رابطًا داخليًا لصفحة الكيان في الدليل. الإحداثيات مأخوذة من OpenStreetMap Nominatim ومسجّلة داخل <code>data/map-pins.json</code>.</p>
<div style="margin:1rem 0">${legend}</div>
<div id="map" style="height:500px;border-radius:8px;border:1px solid #dbe3da;margin:1rem 0"></div>
<p style="font-size:.82rem;color:#607067">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="nofollow noopener">OpenStreetMap</a> contributors. Tiles by <a href="https://carto.com/" target="_blank" rel="nofollow noopener">CARTO</a>.</p>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<script>
(function(){
  const pins = ${pinsJson};
  const colors = ${JSON.stringify(CATEGORY_COLORS)};
  const map = L.map('map').setView([30.21, 31.47], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="nofollow noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/" target="_blank" rel="nofollow noopener">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
  const groups = {};
  pins.forEach(p => {
    const marker = L.circleMarker([p.lat, p.lon], {
      radius: 8,
      fillColor: colors[p.category] || '#333',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map);
    marker.bindPopup('<b>' + p.name + '</b><br><a href="' + p.slug + '">افتح الصفحة ↖</a><br><small>' + (p.source || '').slice(0,80) + '</small>');
    groups[p.category] = (groups[p.category] || 0) + 1;
  });
})();
</script>
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
        { "@type": "ListItem", "position": 2, "name": "الخريطة", "item": url },
      ],
    },
    orgNode(),
  ];
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="${SITE}/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">الخريطة</span></li></ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ خريطة تفاعلية</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="paper section"><div class="wrap">${body}</div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// إضافة رابط الخريطة في قائمة "المدينة"
// ---------------------------------------------------------------------------
function addMapLinkToCityMenu() {
  const marker = 'href="/map/">الخريطة';
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
          // add after "عن المدينة" in city dropdown
          html = html.replace(
            /(<a href="\/about\/">عن المدينة<\/a>)/,
            '$1<a href="/map/">الخريطة</a>'
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
  rep("nav", `أُضيف رابط الخريطة في ${touched} صفحة؛ تُخطّى ${skipped} صفحة موجودة مسبقًا.`);
}

// ---------------------------------------------------------------------------
async function main() {
  const pins = await ensurePinsFile();
  const chrome = loadChrome();
  const dir = path.join(clientDir, "map");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), mapPage(chrome, pins));
  rep("page", `أُنشئت /map/ بـ ${pins.length} دبوس`);
  addMapLinkToCityMenu();

  console.log("=== تقرير المرحلة السادسة: الخريطة التفاعلية (6.2) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
