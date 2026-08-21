/**
 * seo-phase19-internal-links.mjs
 * المرحلة 19: سد فجوات الروابط الداخلية — ربط الصفحات اليتيمة والجديدة بالكيانات.
 *
 * المبادئ:
 *   - idempotent: marker <!-- phase19-internal-links --> يمنع التكرار.
 *   - لا معلومات مُختلعة: الروابط مبنية على بنية المجلدات والبيانات المنشورة.
 *   - الأولوية للصفحات اليتيمة (0 روابط داخلية واردة).
 *   - لا تعديل للصفحات التي تربط بأطفالها بالفعل.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const MARKER = "<!-- phase19-internal-links -->";
const HEAD_MARKER = "<!-- phase19-head-links -->";

// ---------------------------------------------------------------------------
// أدوات عامة
// ---------------------------------------------------------------------------
function listPages(dir, base = "") {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "public" || e.name === "src" || e.name === "data") continue;
    const full = path.join(dir, e.name);
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listPages(full, rel));
    else if (e.name === "index.html") out.push({ file: full, path: "/" + base });
  }
  return out;
}

function normalizeHref(href, pagePath) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  if (href.startsWith("http")) {
    if (href.startsWith("https://obourguide.com")) href = href.replace("https://obourguide.com", "");
    else return null;
  }
  href = href.replace(/\/$/, "");
  if (!href.startsWith("/")) {
    const parts = pagePath.split("/").filter(Boolean);
    const relParts = href.split("/").filter(Boolean);
    const resolved = [];
    for (const p of relParts) {
      if (p === "..") resolved.pop();
      else if (p !== ".") resolved.push(p);
    }
    href = "/" + resolved.join("/");
  }
  return href.replace(/\/$/, "") || "/";
}

function extractLinks(html, pagePath) {
  const links = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const nh = normalizeHref(m[1], pagePath);
    if (nh) links.add(nh);
  }
  return links;
}

function titleFromHtml(html, fallback) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/\s*\|\s*Obour Guide/i, "").trim() : fallback;
}

function h1FromHtml(html, fallback) {
  const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : fallback;
}

function buildLinkList(links) {
  if (!links.length) return "";
  const items = links.map(([href, text]) => `<li><a href="${href}">${text}</a></li>`).join("\n");
  return `<ul class="link-list">\n${items}\n</ul>`;
}

function injectBeforeClosing(html, insert, tag) {
  const idx = html.lastIndexOf(`</${tag}>`);
  if (idx === -1) return { changed: false };
  return { changed: true, html: html.slice(0, idx) + insert + html.slice(idx) };
}

function injectRelatedSection(html, extraHtml, heading = "صفحات ذات صلة") {
  if (html.includes(MARKER)) return { changed: false, reason: "marker" };

  const relatedHeading = "<h2>صفحات ذات صلة</h2>";
  const idx = html.indexOf(relatedHeading);
  if (idx !== -1) {
    const after = idx + relatedHeading.length;
    let end = after;
    while (end < html.length) {
      const closeP = html.indexOf("</p>", end);
      const nextH = html.indexOf("<h2", end);
      if (closeP === -1) break;
      end = closeP + 4;
      if (nextH !== -1 && nextH < end) { end = nextH; break; }
      const following = html.slice(end, end + 200).trim();
      if (!following.startsWith("<p") && !following.startsWith("</p")) break;
    }
    const insert = `\n${MARKER}\n${extraHtml}`;
    return { changed: true, html: html.slice(0, end) + insert + html.slice(end) };
  }

  const mainEnd = html.lastIndexOf("</main>");
  if (mainEnd !== -1) {
    const section = `\n<section class="paper section" data-internal-links="phase19">\n<div class="wrap">\n<h2>${heading}</h2>\n${MARKER}\n${extraHtml}\n</div>\n</section>\n`;
    return { changed: true, html: html.slice(0, mainEnd) + section + html.slice(mainEnd) };
  }

  return { changed: false, reason: "no-injection-point" };
}

// ---------------------------------------------------------------------------
// بناء خريطة الموقع والعلاقات
// ---------------------------------------------------------------------------
const pages = listPages(clientDir);
const pageMap = new Map(pages.map(p => [p.path, p]));

const incoming = new Map(pages.map(p => [p.path, new Set()]));
for (const page of pages) {
  const html = fs.readFileSync(page.file, "utf8");
  for (const h of extractLinks(html, page.path)) {
    if (pageMap.has(h) && h !== page.path) incoming.get(h).add(page.path);
  }
}

const orphans = pages.filter(p => incoming.get(p.path).size === 0 && p.path !== "/404");
rep("inventory", `إجمالي الصفحات: ${pages.length}، اليتيمة: ${orphans.length}`);

// ---------------------------------------------------------------------------
// 1) ربط صفحات الأبناء بصفحات الآباء (إصلاح اليتيمة)
// ---------------------------------------------------------------------------
const parentChild = new Map();
for (const page of pages) {
  if (page.path === "/") continue;
  const parts = page.path.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const parentPath = "/" + parts.slice(0, -1).join("/");
    if (pageMap.has(parentPath)) {
      if (!parentChild.has(parentPath)) parentChild.set(parentPath, []);
      parentChild.get(parentPath).push(page);
    }
  }
}

let parentInjections = 0;
let childInjections = 0;
let skippedParent = 0;

for (const [parentPath, children] of parentChild) {
  const parent = pageMap.get(parentPath);
  let html = fs.readFileSync(parent.file, "utf8");
  if (html.includes(MARKER)) { skippedParent++; continue; }

  const existing = extractLinks(html, parentPath);
  const missingChildren = children.filter(c => !existing.has(c.path));
  if (!missingChildren.length) continue;

  const links = missingChildren.map(c => {
    const ch = fs.readFileSync(c.file, "utf8");
    const text = h1FromHtml(ch, titleFromHtml(ch, path.basename(path.dirname(c.file))));
    return [c.path + "/", text];
  });

  const extra = buildLinkList(links);
  const r = injectRelatedSection(html, extra, "المزيد في هذا القسم");
  if (r.changed) {
    fs.writeFileSync(parent.file, r.html);
    parentInjections++;
    rep("parent-link", `${parentPath}: +${links.length} أبناء`);
  }
}

// ---------------------------------------------------------------------------
// 2) إضافة روابط إخوة لبعض الصفحات اليتيمة التي ليس لها روابط واردة
// ---------------------------------------------------------------------------
for (const orphan of orphans) {
  const parts = orphan.path.split("/").filter(Boolean);
  if (parts.length < 2) continue;
  const parentPath = "/" + parts.slice(0, -1).join("/");
  if (!pageMap.has(parentPath)) continue;

  let html = fs.readFileSync(orphan.file, "utf8");
  if (html.includes(MARKER)) continue;

  const siblings = (parentChild.get(parentPath) || [])
    .filter(c => c.path !== orphan.path)
    .slice(0, 6);
  if (!siblings.length) continue;

  const existing = extractLinks(html, orphan.path);
  const links = siblings
    .filter(s => !existing.has(s.path))
    .map(s => {
      const sh = fs.readFileSync(s.file, "utf8");
      const text = h1FromHtml(sh, titleFromHtml(sh, path.basename(path.dirname(s.file))));
      return [s.path + "/", text];
    });

  if (!links.length) continue;
  const extra = buildLinkList(links);
  const r = injectRelatedSection(html, extra, "روابط في نفس القسم");
  if (r.changed) {
    fs.writeFileSync(orphan.file, r.html);
    childInjections++;
    rep("sibling-link", `${orphan.path}: +${links.length} إخوة`);
  }
}

// ---------------------------------------------------------------------------
// 3) ربط صفحات استراتيجية عالية القيمة
// ---------------------------------------------------------------------------
const strategicInjections = [
  {
    file: path.join(clientDir, "compounds", "index.html"),
    links: [
      ["/best-compounds-obour/", "أفضل كمبوندات العبور"],
      ["/best-compounds-new-obour/", "أفضل كمبوندات العبور الجديدة"],
    ],
    heading: "أدلة اختيار الكمبوندات",
  },
  {
    file: path.join(clientDir, "developers", "index.html"),
    links: [
      ["/best-compounds-obour/", "أفضل كمبوندات العبور"],
      ["/best-compounds-new-obour/", "أفضل كمبوندات العبور الجديدة"],
      ["/real-estate-developers-in-obour/", "دليل مطوري العبور"],
    ],
    heading: "أدلة المطورين والمشاريع",
  },
  {
    file: path.join(clientDir, "districts", "index.html"),
    links: [
      ["/best-compounds-obour/", "أفضل كمبوندات العبور"],
      ["/best-compounds-new-obour/", "أفضل كمبوندات العبور الجديدة"],
      ["/new-obour-districts/", "أحياء العبور الجديدة"],
    ],
    heading: "أدلة الأحياء والسكن",
  },
  {
    file: path.join(clientDir, "best-compounds-obour", "index.html"),
    links: [
      ["/best-compounds-new-obour/", "أفضل كمبوندات العبور الجديدة"],
      ["/compounds/", "فهرس المشاريع"],
    ],
    heading: "روابط ذات صلة",
  },
  {
    file: path.join(clientDir, "best-compounds-new-obour", "index.html"),
    links: [
      ["/best-compounds-obour/", "أفضل كمبوندات العبور"],
      ["/compounds/", "فهرس المشاريع"],
    ],
    heading: "روابط ذات صلة",
  },
  {
    file: path.join(clientDir, "new-obour", "index.html"),
    links: [
      ["/new-obour-districts/", "أحياء العبور الجديدة"],
      ["/new-obour-services/", "خدمات العبور الجديدة"],
      ["/best-compounds-new-obour/", "أفضل كمبوندات العبور الجديدة"],
    ],
    heading: "استكشف العبور الجديدة",
  },
  {
    file: path.join(clientDir, "services", "index.html"),
    links: [
      ["/new-obour-services/", "خدمات العبور الجديدة"],
      ["/directory/", "دليل الخدمات"],
      ["/emergency/", "أرقام الطوارئ"],
      ["/obour-city-malls/", "مولات العبور"],
      ["/obour-city-pharmacies/", "صيدليات العبور"],
      ["/obour-city-restaurants/", "مطاعم العبور"],
      ["/obour-city-schools/", "مدارس العبور"],
    ],
    heading: "أدلة الخدمات",
  },
  {
    file: path.join(clientDir, "hospitals", "index.html"),
    links: [
      ["/obour-city-hospitals/", "مستشفيات مدينة العبور"],
      ["/clinics/", "العيادات والمراكز الطبية"],
      ["/emergency/", "أرقام الطوارئ"],
    ],
    heading: "أدلة صحية",
  },
  {
    file: path.join(clientDir, "tools", "index.html"),
    links: [
      ["/mortgage-affordability/", "حاسبة تمويل العقار"],
      ["/commute-cost/", "حاسبة تكلفة التنقل"],
      ["/school-fees/", "حاسبة الرسوم الدراسية"],
      ["/cost-of-living/", "تكلفة المعيشة"],
    ],
    heading: "أدوات تفاعلية",
  },
  {
    file: path.join(clientDir, "pharmacies", "index.html"),
    links: [
      ["/obour-city-pharmacies/", "دليل صيدليات العبور"],
      ["/emergency/", "أرقام الطوارئ"],
    ],
    heading: "أدلة صحية",
  },
  {
    file: path.join(clientDir, "restaurants", "index.html"),
    links: [
      ["/obour-city-restaurants/", "دليل مطاعم العبور"],
      ["/dining-guide/", "دليل الأكل والمطاعم"],
    ],
    heading: "أدلة مطاعم",
  },
  {
    file: path.join(clientDir, "schools", "index.html"),
    links: [
      ["/obour-city-schools/", "دليل مدارس العبور"],
      ["/education-guide/", "دليل التعليم في العبور"],
    ],
    heading: "أدلة تعليمية",
  },
  {
    file: path.join(clientDir, "shopping", "index.html"),
    links: [
      ["/obour-city-malls/", "دليل مولات العبور"],
      ["/shopping-guide/", "دليل التسوق في العبور"],
    ],
    heading: "أدلة تسوق",
  },
  {
    file: path.join(clientDir, "shopping-guide", "index.html"),
    links: [
      ["/obour-city-malls/", "دليل مولات العبور"],
      ["/shopping/", "فهرس التسوق"],
    ],
    heading: "أدلة تسوق",
  },
  {
    file: path.join(clientDir, "dining-guide", "index.html"),
    links: [
      ["/obour-city-restaurants/", "دليل مطاعم العبور"],
      ["/restaurants/", "فهرس المطاعم"],
      ["/cafes/", "كافيهات العبور"],
    ],
    heading: "أدلة مطاعم",
  },
  {
    file: path.join(clientDir, "cafes", "index.html"),
    links: [
      ["/obour-city-restaurants/", "دليل مطاعم العبور"],
      ["/dining-guide/", "دليل الأكل والمطاعم"],
    ],
    heading: "أدلة مطاعم",
  },
  {
    file: path.join(clientDir, "clinics", "index.html"),
    links: [
      ["/obour-city-pharmacies/", "دليل صيدليات العبور"],
      ["/hospitals/", "مستشفيات العبور"],
      ["/emergency/", "أرقام الطوارئ"],
    ],
    heading: "أدلة صحية",
  },
  {
    file: path.join(clientDir, "directory", "index.html"),
    links: [
      ["/obour-city-malls/", "دليل مولات العبور"],
      ["/obour-city-pharmacies/", "دليل صيدليات العبور"],
      ["/obour-city-restaurants/", "دليل مطاعم العبور"],
      ["/obour-city-schools/", "دليل مدارس العبور"],
    ],
    heading: "أدلة حسب النوع",
  },
];

let strategicCount = 0;
for (const { file, links, heading } of strategicInjections) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) continue;
  const pagePath = "/" + path.relative(clientDir, path.dirname(file)).replace(/\\/g, "/");
  const existing = extractLinks(html, pagePath);
  const newLinks = links.filter(([href]) => !existing.has(href.replace(/\/$/, "")));
  if (!newLinks.length) continue;
  const extra = buildLinkList(newLinks);
  const r = injectRelatedSection(html, extra, heading);
  if (r.changed) {
    fs.writeFileSync(file, r.html);
    strategicCount++;
    rep("strategic", `${pagePath}: +${newLinks.length}`);
  }
}

// ---------------------------------------------------------------------------
// 4) ربط الصفحة الرئيسية بالأدلة الاستراتيجية الجديدة
// ---------------------------------------------------------------------------
const homeFile = path.join(clientDir, "index.html");
let homeHtml = fs.readFileSync(homeFile, "utf8");
if (!homeHtml.includes(MARKER)) {
  const existing = extractLinks(homeHtml, "/");
  const homeLinks = [
    ["/best-compounds-obour/", "أفضل كمبوندات العبور"],
    ["/best-compounds-new-obour/", "أفضل كمبوندات العبور الجديدة"],
    ["/new-obour-districts/", "أحياء العبور الجديدة"],
    ["/new-obour-services/", "خدمات العبور الجديدة"],
    ["/entities/", "فهرس الكيانات"],
    ["/updates/", "تحديثات الدليل"],
  ].filter(([href]) => !existing.has(href.replace(/\/$/, "")));
  if (homeLinks.length) {
    const extra = buildLinkList(homeLinks);
    const r = injectRelatedSection(homeHtml, extra, "أحدث أدلة Obour Guide");
    if (r.changed) {
      fs.writeFileSync(homeFile, r.html);
      rep("home", `الصفحة الرئيسية: +${homeLinks.length} روابط استراتيجية`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5) إضافة روابط breadcrumb/رجوع للأبواب الرئيسية في بعض الصفحات اليتيمة
// ---------------------------------------------------------------------------
const orphanFixes = [
  { path: "/obour-city-hospitals", parent: "/hospitals/", label: "مستشفيات العبور" },
  { path: "/new-obour-districts", parent: "/new-obour/", label: "العبور الجديدة" },
  { path: "/new-obour-services", parent: "/new-obour/", label: "العبور الجديدة" },
];

let breadcrumbCount = 0;
for (const { path: childPath, parent, label } of orphanFixes) {
  const page = pageMap.get(childPath);
  if (!page) continue;
  let html = fs.readFileSync(page.file, "utf8");
  if (html.includes(MARKER)) continue;
  const existing = extractLinks(html, childPath);
  if (existing.has(parent.replace(/\/$/, ""))) continue;
  const extra = `<p><a href="${parent}">← العودة إلى ${label}</a></p>`;
  const r = injectRelatedSection(html, extra, "التنقل");
  if (r.changed) {
    fs.writeFileSync(page.file, r.html);
    breadcrumbCount++;
    rep("breadcrumb", `${childPath}: رابط رجوع إلى ${parent}`);
  }
}

// ---------------------------------------------------------------------------
// تقرير نهائي
// ---------------------------------------------------------------------------
console.log("=== تقرير المرحلة 19: سد فجوات الروابط الداخلية ===");
for (const line of report) console.log(line);
console.log(`=== ملخص: ${parentInjections} صفحة أب، ${childInjections} صفحة يتيمة، ${strategicCount} صفحة استراتيجية، ${breadcrumbCount} breadcrumb ===`);
