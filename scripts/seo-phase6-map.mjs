/**
 * seo-phase6-map.mjs
 * المرحلة السادسة (6.2): صفحة /map/ التفاعلية.
 *
 * المبادئ:
 *   - idempotent: يُعاد الجيوكودينج للدبابيس المفقودة أو الخارجة فقط؛
 *     الدبابيس الصالحة داخل حدود المدينتين تُحتفظ بها.
 *   - الإحداثيات من Nominatim OpenStreetMap مع تسجيل صيغة البحث الناجحة.
 *   - ما لا يُعثر على إحداثي موثوق له داخل الحدود لا يُدرج.
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

// حدود العبور / العبور الجديدة التقريبية
const BOUNDS = { latMin: 30.19, latMax: 30.32, lonMin: 31.43, lonMax: 31.62 };
function inBounds(lat, lon) {
  return lat >= BOUNDS.latMin && lat <= BOUNDS.latMax && lon >= BOUNDS.lonMin && lon <= BOUNDS.lonMax;
}

// ---------------------------------------------------------------------------
// استخراج بيانات من الصفحات
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

function extractAddressFromSchoolPage(file) {
  const html = fs.readFileSync(file, "utf8");
  // look for "العنوان" row added by phase6.4
  const m = html.match(/<span>العنوان<\/span><span>([^<]+)<\/span>/);
  return m ? m[1].trim() : null;
}

// ---------------------------------------------------------------------------
// أسماء قصيرة للعرض في popup
// ---------------------------------------------------------------------------
function shortDistrictName(h1, id) {
  const numMap = {
    "district-1": "الحي الأول", "district-2": "الحي الثاني", "district-3": "الحي الثالث",
    "district-4": "الحي الرابع", "district-5": "الحي الخامس", "district-6": "الحي السادس",
    "district-7": "الحي السابع", "district-8": "الحي الثامن", "district-9": "الحي التاسع",
    "district-24-bet-el-watan": "الحي 24 · بيت الوطن", "district-25": "الحي 25",
    "el-momtaz": "الحي المتميز",
  };
  return numMap[id] || h1.replace(/ في العبور الجديدة:.*$/, "").trim();
}

function shortCompoundName(h1, id) {
  const names = {
    canary: "كناري", solana: "سولانا", sundus: "سندس", safari: "سفاري",
    "vaily-residence": "فيالي ريزيدنس", "the-mars": "ذا مارس", "jeddah-mall": "مول جدة",
    "obour-mall": "اوبو مول", "town-ten": "Town Ten", "glory-gardens": "جلوري جاردنز",
    "o-kardia": "أو كارديا", "river-park": "River Park", "golf-city": "جولف سيتي",
  };
  return names[id] || h1.replace(/ في العبور.*$/, "").trim();
}

function shortSchoolName(h1, id) {
  const names = {
    "nile-egyptian-school-obour": "مدارس النيل المصرية",
    "international-public-school-obour": "المدرسة الرسمية الدولية IPS",
    "egyptian-japanese-school-obour": "المدرسة المصرية اليابانية EJS",
    "bilal-bin-rabah-secondary": "ثانوية بلال بن رباح",
    "horreya-educational-complex": "مجمع الحرية التعليمي",
    "ips-rawdet-elobour": "IPS روضة العبور",
    "karama-official-language-school": "مدارس الكرامة الرسمية للغات",
    "new-republic-basic-education": "مجمع الجمهورية الجديدة",
    "osama-bin-zaid-complex": "مجمع أسامة بن زيد",
    "shaimaa-educational-complex": "مجمع الشيماء التعليمي",
  };
  return names[id] || h1.replace(/ \(EJS\)| \(IPS\)/, "").trim();
}

function shortLandmarkName(id) {
  return {
    "obour-university": "جامعة العبور",
    "obour-new-city-authority": "جهاز مدينة العبور الجديدة",
    "obour-stadium": "استاد العبور",
  }[id] || id;
}

// ---------------------------------------------------------------------------
// بناء استعلامات البحث
// ---------------------------------------------------------------------------
function districtSearchVariants(id, h1) {
  const numMap = {
    "district-1": "1", "district-2": "2", "district-3": "3", "district-4": "4",
    "district-5": "5", "district-6": "6", "district-7": "7", "district-8": "8", "district-9": "9",
    "district-24-bet-el-watan": "24", "district-25": "25", "el-momtaz": "El Momtaz",
  };
  const n = numMap[id];
  if (id === "el-momtaz") {
    return [
      "الحي المتميز مدينة العبور",
      "حي المتميز العبور",
      "El Momtaz Obour Egypt",
      "El Momtaz district Obour city",
      "Al Momtaz Obour",
    ];
  }
  return [
    `District ${n} Obour`,
    `Obour district ${n}`,
    `الحي ${n} مدينة العبور`,
    `الحي ${n} العبور الجديدة`,
    `حي ${n} العبور`,
    `District ${n} Obour New City`,
    `Al Hayy ${n} Obour`,
  ];
}

function compoundSearchVariants(id, h1) {
  const enNames = {
    canary: "Canary", solana: "Solana", sundus: "Sundus", safari: "Safari",
    "vaily-residence": "Vaily Residence", "the-mars": "The Mars", "jeddah-mall": "Jeddah Mall",
    "obour-mall": "Obour Mall", "town-ten": "Town Ten", "glory-gardens": "Glory Gardens",
    "o-kardia": "O Kardia", "river-park": "River Park", "golf-city": "Golf City",
  };
  const arNames = {
    canary: "كناري", solana: "سولانا", sundus: "سندس", safari: "سفاري",
    "vaily-residence": "فيالي ريزيدنس", "the-mars": "ذا مارس", "jeddah-mall": "مول جدة",
    "obour-mall": "اوبو مول", "town-ten": "تاون تن", "glory-gardens": "جلوري جاردنز",
    "o-kardia": "او كارديا", "river-park": "ريفر بارك", "golf-city": "جولف سيتي",
  };
  const base = enNames[id] || h1.replace(/ في العبور.*$/, "").trim();
  const ar = arNames[id] || shortCompoundName(h1, id);
  return [
    `${base} Obour New City`,
    `كمبوند ${ar} العبور`,
    `${base} Compound Obour`,
    `${ar} مدينة العبور الجديدة`,
    `${base} El Obour`,
    `${ar} العبور`,
    `${base} Egypt`,
  ];
}

function schoolSearchVariants(q) {
  const variants = [];
  // priority: published address
  if (q.address) {
    variants.push(`${q.address}، العبور`);
    variants.push(`${q.address}، مدينة العبور`);
  }
  const short = q.displayName;
  variants.push(`${short}، العبور`);
  variants.push(`${short}، مدينة العبور`);
  if (q.englishName) {
    variants.push(`${q.englishName} Obour`);
    variants.push(`${q.englishName} El Obour`);
  }
  variants.push(`${short} Egypt`);
  return [...new Set(variants)];
}

function landmarkSearchVariants(id) {
  if (id === "obour-university") {
    return [
      "جامعة العبور",
      "Obour University",
      "Obour University Egypt",
      "Obour University Qalyubia",
    ];
  }
  if (id === "obour-new-city-authority") {
    return [
      "جهاز مدينة العبور الجديدة",
      "New Obour City Authority",
      "جهاز العبور الجديدة",
    ];
  }
  if (id === "obour-stadium") {
    return [
      "استاد العبور",
      "Obour Stadium",
      "Obour Stadium Egypt",
      "ستاد العبور",
    ];
  }
  return [];
}

function buildQueries() {
  const queries = [];
  for (const it of listSlugs(path.join(clientDir, "districts"))) {
    const h1 = extractH1(it.file);
    queries.push({
      id: it.id,
      slug: it.slug,
      name: h1,
      displayName: shortDistrictName(h1, it.id),
      category: "districts",
      variants: districtSearchVariants(it.id, h1),
    });
  }
  for (const it of listSlugs(path.join(clientDir, "compounds"))) {
    const h1 = extractH1(it.file);
    queries.push({
      id: it.id,
      slug: it.slug,
      name: h1,
      displayName: shortCompoundName(h1, it.id),
      category: "compounds",
      variants: compoundSearchVariants(it.id, h1),
    });
  }
  const englishNames = {
    "nile-egyptian-school-obour": "Nile Egyptian International School Obour",
    "international-public-school-obour": "International Public School Obour",
    "egyptian-japanese-school-obour": "Egyptian Japanese School Obour",
    "bilal-bin-rabah-secondary": "Bilal Bin Rabah School Obour",
    "horreya-educational-complex": "Horreya Educational Complex Obour",
    "ips-rawdet-elobour": "IPS Rawdet Obour",
    "karama-official-language-school": "Karama Language School Obour",
    "new-republic-basic-education": "New Republic School Obour",
    "osama-bin-zaid-complex": "Osama Bin Zaid School Obour",
    "shaimaa-educational-complex": "Shaimaa Educational Complex Obour",
  };
  for (const it of listSlugs(path.join(clientDir, "schools"))) {
    const h1 = extractH1(it.file);
    queries.push({
      id: it.id,
      slug: it.slug,
      name: h1,
      displayName: shortSchoolName(h1, it.id),
      englishName: englishNames[it.id] || null,
      address: extractAddressFromSchoolPage(it.file),
      category: "schools",
      variants: [], // filled below
    });
  }
  // fill variants for schools after address/englishName are set
  for (const q of queries.filter((x) => x.category === "schools")) {
    q.variants = schoolSearchVariants(q);
  }

  queries.push({
    id: "obour-university",
    slug: "/about/",
    name: "جامعة العبور",
    displayName: shortLandmarkName("obour-university"),
    category: "landmarks",
    variants: landmarkSearchVariants("obour-university"),
  });
  queries.push({
    id: "obour-new-city-authority",
    slug: "/about/",
    name: "جهاز مدينة العبور الجديدة",
    displayName: shortLandmarkName("obour-new-city-authority"),
    category: "landmarks",
    variants: landmarkSearchVariants("obour-new-city-authority"),
  });
  queries.push({
    id: "obour-stadium",
    slug: "/about/",
    name: "استاد العبور",
    displayName: shortLandmarkName("obour-stadium"),
    category: "landmarks",
    variants: landmarkSearchVariants("obour-stadium"),
  });
  return queries;
}

// ---------------------------------------------------------------------------
// Nominatim geocoding
// ---------------------------------------------------------------------------
async function geocodeRaw(query) {
  // Use Photon by komoot with a bbox around Obour/New Obour for better local results.
  const bbox = `${BOUNDS.lonMin},${BOUNDS.latMin},${BOUNDS.lonMax},${BOUNDS.latMax}`;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&bbox=${bbox}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "obourguide-bot/1.0" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;
    const f = data.features[0];
    const coords = f.geometry.coordinates;
    const p = f.properties;
    const display = [p.name, p.street, p.district, p.city, p.state, p.country]
      .filter(Boolean)
      .join(", ");
    return {
      lat: parseFloat(coords[1]),
      lon: parseFloat(coords[0]),
      display_name: display || query,
      licence: "ODbL",
      feature: f,
    };
  } catch {
    return null;
  }
}

function isGenericResult(name, displayName) {
  if (!name) return true;
  const lower = name.toLowerCase();
  const words = lower.split(/\s+/);
  // Generic-only names that Photon returns when it cannot find the requested place
  const genericExact = [
    "العبور", "obour", "مدينة العبور", "new obour city", "el obour",
    "العبور الجديدة", "obour city",
  ];
  for (const g of genericExact) {
    const cleanG = g.toLowerCase();
    if (lower === cleanG || lower.replace(/\s+/g, "") === cleanG.replace(/\s+/g, "")) return true;
  }
  // Generic commercial names that should never represent a district/school/landmark
  const genericSubstrings = [
    "high city", "هاى سيتى", "هاي سيتي", "hay city",
    "mall city", "city mall", "مول سيتي", "سيتي مول",
  ];
  for (const g of genericSubstrings) {
    if (lower.includes(g.toLowerCase())) return true;
  }
  return false;
}

function resultMatches(feature, q) {
  const p = feature.properties;
  const name = (p.name || "").toLowerCase();
  const street = (p.street || "").toLowerCase();
  const locality = (p.locality || "").toLowerCase();
  const district = (p.district || "").toLowerCase();
  const city = (p.city || "").toLowerCase();
  const state = (p.state || "").toLowerCase();
  // Must be in Qalyubia
  if (state && !state.includes("قليوبية") && !state.includes("qalyubia")) return false;
  // Must not be a generic-only result
  if (isGenericResult(p.name, q.displayName)) return false;

  const fullText = `${name} ${street} ${locality} ${district} ${city}`;

  // Districts: accept if locality/district/street/name contains the district number/name
  // and does NOT contain a different district number/name.
  if (q.category === "districts") {
    const numMap = {
      "district-1": ["1", "الاول", "الأول"], "district-2": ["2", "الثاني"], "district-3": ["3", "الثالث"],
      "district-4": ["4", "الرابع"], "district-5": ["5", "الخامس"], "district-6": ["6", "السادس"],
      "district-7": ["7", "السابع"], "district-8": ["8", "الثامن"], "district-9": ["9", "التاسع"],
      "district-24-bet-el-watan": ["24", "بيت الوطن"], "district-25": ["25"], "el-momtaz": ["المتميز", "momtaz"],
    };
    const markers = numMap[q.id] || [];
    let matched = false;
    for (const marker of markers) {
      if (fullText.includes(marker.toLowerCase())) { matched = true; break; }
    }
    if (!matched) return false;
    // Reject if result mentions a different district number (e.g. street 3 for district 5)
    const allNumbers = ["1","2","3","4","5","6","7","8","9","24","25"];
    for (const n of allNumbers) {
      if (markers.includes(n)) continue;
      if (fullText.includes(` ${n} `) || fullText.includes(`شارع ${n}`) || fullText.includes(`street ${n}`) || fullText.includes(`district ${n}`) || fullText.includes(`حي ${n}`) || fullText.includes(`الحي ${n}`)) {
        return false;
      }
    }
    return true;
  }

  // For schools/landmarks/compounds: accept if name/street/locality contains a keyword
  const keywords = [q.displayName, ...(q.englishName ? [q.englishName] : [])]
    .filter(Boolean)
    .flatMap((n) => n.split(/\s+/));
  for (const kw of keywords) {
    const clean = kw.replace(/[()]/g, "").toLowerCase();
    if (clean.length < 3) continue;
    if (fullText.includes(clean)) return true;
  }
  // Compounds: also accept if the Arabic or English compound name appears
  if (q.category === "compounds") {
    const ar = shortCompoundName(q.name, q.id).toLowerCase();
    const enNames = {
      canary: "canary", solana: "solana", sundus: "sundus", safari: "safari",
      "vaily-residence": "vaily", "the-mars": "mars", "jeddah-mall": "jeddah",
      "obour-mall": "obour mall", "town-ten": "town ten", "glory-gardens": "glory",
      "o-kardia": "kardia", "river-park": "river", "golf-city": "golf",
    };
    const en = (enNames[q.id] || "").toLowerCase();
    if (name.includes(ar) || name.includes(en)) return true;
  }
  return false;
}

function coordKey(lat, lon) {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

async function geocodeOne(q, usedCoords) {
  for (const variant of q.variants) {
    const result = await geocodeRaw(variant);
    if (result && inBounds(result.lat, result.lon) && resultMatches(result.feature, q)) {
      const key = coordKey(result.lat, result.lon);
      if (usedCoords.has(key)) {
        rep("dedup", `${q.displayName}: تُجاهل نتيجة مكررة مع كيان آخر عند ${key}`);
        continue;
      }
      return {
        id: q.id,
        slug: q.slug,
        name: q.displayName,
        category: q.category,
        lat: result.lat,
        lon: result.lon,
        source: `OpenStreetMap/Photon — «${variant}» — ${result.display_name} (licence: ${result.licence || "ODbL"})`,
      };
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
  return null;
}

// ---------------------------------------------------------------------------
// إدارة ملف الدبابيس
// ---------------------------------------------------------------------------
function loadExistingPins() {
  const p = path.join(dataDir, "map-pins.json");
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return [];
  }
}

async function ensurePinsFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  const p = path.join(dataDir, "map-pins.json");
  const existing = loadExistingPins();
  const queries = buildQueries();

  const kept = [];
  const skipped = [];
  const added = [];
  const usedCoords = new Set();

  // Seed used coords from existing valid pins to avoid duplicates across rebuilds
  for (const pin of existing) {
    if (inBounds(pin.lat, pin.lon)) usedCoords.add(coordKey(pin.lat, pin.lon));
  }

  for (const q of queries) {
    const existingPin = existing.find((p) => p.id === q.id);
    if (existingPin && inBounds(existingPin.lat, existingPin.lon)) {
      // keep but ensure short name
      kept.push({ ...existingPin, name: q.displayName });
      usedCoords.add(coordKey(existingPin.lat, existingPin.lon));
      rep("keep", `${q.displayName}: إحداثي موجود داخل الحدود — تُحتفظ به`);
      continue;
    }
    if (existingPin) {
      rep("drop", `${q.displayName}: إحداثي سابق خارج حدود المدينتين — يُعاد البحث`);
    }
    const pin = await geocodeOne(q, usedCoords);
    if (pin) {
      added.push(pin);
      usedCoords.add(coordKey(pin.lat, pin.lon));
      rep("geocode", `${pin.name} → ${pin.lat}, ${pin.lon} (بحث: ${q.variants.find((v) => pin.source.includes(`«${v}»`)) || q.variants[0]})`);
    } else {
      skipped.push({ id: q.id, name: q.displayName, category: q.category, reason: "لم يُعثر على إحداثي موثوق داخل الحدود" });
      rep("skip", `${q.displayName}: لم يُعثر على إحداثي موثوق داخل الحدود — تُخطّى`);
    }
  }

  const pins = [...kept, ...added];
  fs.writeFileSync(p, JSON.stringify(pins, null, 2) + "\n");
  rep("data", `أُنشئ/أُحدّث data/map-pins.json: ${pins.length} دبوس (مُحتفظ ${kept.length}، مُضاف ${added.length}، مُخطّى ${skipped.length})`);
  return { pins, skipped };
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
  const map = L.map('map').setView([30.225, 31.50], 12);
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
  const { pins, skipped } = await ensurePinsFile();
  const chrome = loadChrome();
  const dir = path.join(clientDir, "map");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), mapPage(chrome, pins));
  rep("page", `أُنشئت /map/ بـ ${pins.length} دبوس`);
  addMapLinkToCityMenu();

  console.log("=== تقرير المرحلة السادسة: الخريطة التفاعلية (6.2) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
  if (skipped.length) {
    console.log("=== ماتُخطّى (خارج الخريطة) ===");
    for (const s of skipped) console.log(`- [${s.category}] ${s.name}: ${s.reason}`);
  }
}

main();
