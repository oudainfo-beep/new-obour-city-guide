/**
 * seo-phase9-internal-links.mjs
 * المرحلة التاسعة: محرك الروابط الداخلية بين الكيانات.
 *
 * المبادئ:
 *   - idempotent: marker <!-- phase9-internal-links --> يمنع التكرار.
 *   - روابط سياقية فقط: كل حي ← مشروعاته + مطوّريه + مدارسه؛ كل مشروع ← مطوّره + حيه؛
 *     كل مطوّر ← مشروعاته + أحيائه؛ كل مدرسة ← حيها + مدارس قريبة.
 *   - لا معلومات مُختلعة: العلاقات مبنية على البيانات المنشورة في data/obour-*.json.
 *   - لا تكرار: الروابط الموجودة مسبقًا في "صفحات ذات صلة" تُستبعد.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(clientDir, "public", "data");

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const MARKER = "<!-- phase9-internal-links -->";

// ---------------------------------------------------------------------------
// أدوات عامة
// ---------------------------------------------------------------------------
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function listIndexFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const f = path.join(dir, entry.name, "index.html");
    if (fs.existsSync(f)) out.push(f);
  }
  return out;
}

function cleanName(name) {
  return name.replace(/[\u061C\u200E\u200F]/g, "").trim();
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter((x) => {
    const k = keyFn(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseExistingLinks(html) {
  const links = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    links.add(m[1].replace(/\/$/, ""));
  }
  return links;
}

function buildLinkParagraph(links, prefix = "") {
  if (!links.length) return "";
  const items = links.map(([href, text]) => `<a href="${href}">${text}</a>`).join(" · ");
  return `<p>${prefix ? prefix + " " : ""}${items}</p>`;
}

function injectRelatedSection(html, extraHtml, slug) {
  if (html.includes(MARKER)) return { changed: false, reason: "marker" };

  const relatedHeading = "<h2>صفحات ذات صلة</h2>";
  const idx = html.indexOf(relatedHeading);

  if (idx !== -1) {
    // نجد نهاية الفقرة/الفقرات التي تلي العنوان
    const after = idx + relatedHeading.length;
    let end = after;
    let depth = 0;
    while (end < html.length) {
      const openP = html.indexOf("<p", end);
      const closeP = html.indexOf("</p>", end);
      const nextH = html.search(/<h[1-6][^>]*>/);
      if (closeP === -1) break;
      end = closeP + 4;
      // إذا وصلنا إلى عنوان جديد أو aside، نتوقف
      const nextTagIdx = Math.min(
        openP === -1 ? Infinity : openP,
        closeP === -1 ? Infinity : closeP,
        nextH === -1 ? Infinity : nextH
      );
      if (nextTagIdx === nextH && nextH > after && nextH < end) {
        end = nextH;
        break;
      }
      // نتقدم فوق أول </p>
      if (html.slice(end, end + 50).includes("<h2") || html.slice(end, end + 50).includes("<aside")) {
        break;
      }
      // نتوقف بعد مجموعة الفقرات المتتالية
      const following = html.slice(end, end + 200);
      if (!following.trim().startsWith("<p") && !following.trim().startsWith("</p>")) break;
    }
    const insert = `\n${MARKER}\n${extraHtml}`;
    html = html.slice(0, end) + insert + html.slice(end);
    return { changed: true, html };
  }

  // لا يوجد قسم ذات صلة: نُضيف قسمًا قبل </main>
  const mainEnd = html.lastIndexOf("</main>");
  if (mainEnd !== -1) {
    const section = `\n<section class="paper section" data-internal-links="true">\n<div class="wrap">\n<h2>صفحات ذات صلة</h2>\n${MARKER}\n${extraHtml}\n</div>\n</section>\n`;
    html = html.slice(0, mainEnd) + section + html.slice(mainEnd);
    return { changed: true, html };
  }

  return { changed: false, reason: "no-injection-point" };
}

// ---------------------------------------------------------------------------
// بناء فهارس العلاقات
// ---------------------------------------------------------------------------
const compoundsData = readJson(path.join(dataDir, "obour-compounds.json"));
const developersData = readJson(path.join(dataDir, "obour-developers.json"));
const schoolsData = readJson(path.join(dataDir, "obour-schools.json"));

const compounds = compoundsData.compounds || [];
const developers = developersData.developers || [];
const schools = schoolsData.schools || [];

const compoundsByDistrict = {};
const compoundsByDeveloper = {};
const developersByDistrict = {};

for (const c of compounds) {
  const dSlug = c.district?.slug;
  const devSlug = c.developer?.slug;

  if (dSlug) {
    (compoundsByDistrict[dSlug] ||= []).push(c);
    if (devSlug) {
      (developersByDistrict[dSlug] ||= new Set()).add(devSlug);
    }
  }
  if (devSlug) {
    (compoundsByDeveloper[devSlug] ||= []).push(c);
    if (dSlug) {
      const devDistricts = developersByDistrict[devSlug] ||= new Set();
      devDistricts.add(dSlug);
    }
  }
}

// تحويل Sets إلى مصفوفات
for (const k of Object.keys(developersByDistrict)) {
  developersByDistrict[k] = Array.from(developersByDistrict[k]);
}

const developerBySlug = Object.fromEntries(developers.map((d) => [d.slug, d]));

// ربط المدرسة بالحي من نص المنطقة
const areaToDistrict = {
  "الحي الأول": "district-1",
  "الحي الثاني": "district-2",
  "الحي الثالث": "district-3",
  "الحي الرابع": "district-4",
  "الحي الخامس": "district-5",
  "الحي السادس": "district-6",
  "الحي السابع": "district-7",
  "الحي الثامن": "district-8",
  "الحي التاسع": "district-9",
  "الحي 24": "district-24-bet-el-watan",
  "بيت الوطن": "district-24-bet-el-watan",
  "الحي 25": "district-25",
  "المتميز": "el-momtaz",
};

function districtSlugFromSchool(school) {
  const area = school.area || "";
  for (const [phrase, slug] of Object.entries(areaToDistrict)) {
    if (area.includes(phrase)) return slug;
  }
  return null;
}

const schoolsByDistrict = {};
for (const s of schools) {
  const dSlug = districtSlugFromSchool(s);
  if (dSlug) {
    (schoolsByDistrict[dSlug] ||= []).push(s);
  }
}

// ---------------------------------------------------------------------------
// معالجة الصفحات
// ---------------------------------------------------------------------------
function makeLink(href, text) {
  // Ahrefs audit 2026-09-06: keep the trailing slash — slash-less URLs 301 to the
  // canonical slash form, and linking to redirects wastes crawl budget.
  return [href, cleanName(text)];
}

function processDistrictPage(file, slug) {
  const districtSlug = path.basename(path.dirname(file));
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) return { status: "skipped", slug };

  const existing = parseExistingLinks(html);
  const links = [];

  // مشروعات في الحي
  const districtCompounds = compoundsByDistrict[districtSlug] || [];
  for (const c of uniqueBy(districtCompounds, (x) => x.slug).slice(0, 5)) {
    const href = `/compounds/${c.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, c.name));
    }
  }

  // مطوّرون في الحي
  const districtDevs = (developersByDistrict[districtSlug] || [])
    .map((ds) => developerBySlug[ds])
    .filter(Boolean);
  for (const d of uniqueBy(districtDevs, (x) => x.slug).slice(0, 4)) {
    const href = `/developers/${d.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, d.name));
    }
  }

  // مدارس في الحي
  const districtSchools = (schoolsByDistrict[districtSlug] || []).slice(0, 4);
  for (const s of districtSchools) {
    const href = `/schools/${s.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, s.name));
    }
  }

  if (!links.length) return { status: "no-links", slug };

  const extra = buildLinkParagraph(links, "روابط سياقية:");
  const r = injectRelatedSection(html, extra, slug);
  if (!r.changed) return { status: r.reason, slug };

  fs.writeFileSync(file, r.html);
  return { status: "injected", slug, count: links.length };
}

function processCompoundPage(file, slug) {
  const compoundSlug = path.basename(path.dirname(file));
  const compound = compounds.find((c) => c.slug === compoundSlug);
  if (!compound) return { status: "no-data", slug };

  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) return { status: "skipped", slug };

  const existing = parseExistingLinks(html);
  const links = [];

  // مطوّر المشروع
  if (compound.developer?.slug) {
    const d = developerBySlug[compound.developer.slug];
    if (d) {
      const href = `/developers/${d.slug}/`;
      if (!existing.has(href.replace(/\/$/, ""))) {
        links.push(makeLink(href, d.name));
      }
    }
  }

  // الحي
  if (compound.district?.slug) {
    const href = `/districts/${compound.district.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, compound.district.name));
    }
  }

  // مشروعات أخرى للمطوّر نفسه
  const devCompounds = (compoundsByDeveloper[compound.developer?.slug] || [])
    .filter((c) => c.slug !== compoundSlug);
  for (const c of uniqueBy(devCompounds, (x) => x.slug).slice(0, 3)) {
    const href = `/compounds/${c.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, c.name));
    }
  }

  // مشروعات أخرى في نفس الحي
  const districtCompounds = (compoundsByDistrict[compound.district?.slug] || [])
    .filter((c) => c.slug !== compoundSlug && c.developer?.slug !== compound.developer?.slug);
  for (const c of uniqueBy(districtCompounds, (x) => x.slug).slice(0, 3)) {
    const href = `/compounds/${c.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, c.name));
    }
  }

  if (!links.length) return { status: "no-links", slug };

  const extra = buildLinkParagraph(links, "روابط سياقية:");
  const r = injectRelatedSection(html, extra, slug);
  if (!r.changed) return { status: r.reason, slug };

  fs.writeFileSync(file, r.html);
  return { status: "injected", slug, count: links.length };
}

function processDeveloperPage(file, slug) {
  const devSlug = path.basename(path.dirname(file));
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) return { status: "skipped", slug };

  const existing = parseExistingLinks(html);
  const links = [];

  // مشروعات المطوّر
  const devCompounds = compoundsByDeveloper[devSlug] || [];
  for (const c of uniqueBy(devCompounds, (x) => x.slug).slice(0, 6)) {
    const href = `/compounds/${c.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, c.name));
    }
  }

  // أحياء يعمل فيها
  const devDistricts = new Set();
  for (const c of devCompounds) {
    if (c.district?.slug) devDistricts.add(c.district.slug);
  }
  for (const dSlug of devDistricts) {
    const district = compounds
      .flatMap((c) => (c.district?.slug === dSlug ? [c.district] : []))
      .find((d) => d?.slug === dSlug);
    const href = `/districts/${dSlug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, district?.name || dSlug));
    }
  }

  if (!links.length) return { status: "no-links", slug };

  const extra = buildLinkParagraph(links, "روابط سياقية:");
  const r = injectRelatedSection(html, extra, slug);
  if (!r.changed) return { status: r.reason, slug };

  fs.writeFileSync(file, r.html);
  return { status: "injected", slug, count: links.length };
}

function processSchoolPage(file, slug) {
  const schoolSlug = path.basename(path.dirname(file));
  const school = schools.find((s) => s.slug === schoolSlug);
  if (!school) return { status: "no-data", slug };

  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) return { status: "skipped", slug };

  const existing = parseExistingLinks(html);
  const links = [];

  // الحي
  const dSlug = districtSlugFromSchool(school);
  if (dSlug) {
    const districtName = {
      "district-1": "الحي الأول",
      "district-2": "الحي الثاني",
      "district-3": "الحي الثالث",
      "district-4": "الحي الرابع",
      "district-5": "الحي الخامس",
      "district-6": "الحي السادس",
      "district-7": "الحي السابع",
      "district-8": "الحي الثامن",
      "district-9": "الحي التاسع",
      "district-24-bet-el-watan": "الحي 24 · بيت الوطن",
      "district-25": "الحي 25 · الإسكان الفاخر",
      "el-momtaz": "الحي المتميز",
    }[dSlug];
    const href = `/districts/${dSlug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, districtName || dSlug));
    }
  }

  // مدارس قريبة (نفس المجموعة، باستثناء المدرسة نفسها)
  const nearby = schools
    .filter((s) => s.slug !== schoolSlug && s.group === school.group)
    .slice(0, 4);
  for (const s of nearby) {
    const href = `/schools/${s.slug}/`;
    if (!existing.has(href.replace(/\/$/, ""))) {
      links.push(makeLink(href, s.name));
    }
  }

  // دليل التعليم
  if (!existing.has("/education-guide")) {
    links.push(["/education-guide/", "دليل التعليم في العبور"]);
  }

  if (!links.length) return { status: "no-links", slug };

  const extra = buildLinkParagraph(links, "روابط سياقية:");
  const r = injectRelatedSection(html, extra, slug);
  if (!r.changed) return { status: r.reason, slug };

  fs.writeFileSync(file, r.html);
  return { status: "injected", slug, count: links.length };
}

// ---------------------------------------------------------------------------
// روابط فوتر عالمية للصفحات المفيدة التي لا تظهر في التنقل الرئيسي
// ---------------------------------------------------------------------------
const FOOTER_MARKER = "<!-- phase9-footer-links -->";
const FOOTER_UTILITY_LINKS = [
  ['<a href="/directory/">دليل الخدمات</a>', '<a href="/directory/">دليل الخدمات</a><a href="/entities/">فهرس الكيانات</a><a href="/updates/">تحديثات الدليل</a><a href="/tracker/">متابعة أحداث العبور الجديدة</a>'],
];

function addFooterUtilityLinks() {
  let touched = 0;
  let skipped = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "index.html") {
        let html = fs.readFileSync(full, "utf8");
        if (html.includes(FOOTER_MARKER)) { skipped++; continue; }
        let changed = false;
        for (const [needle, replacement] of FOOTER_UTILITY_LINKS) {
          if (html.includes(needle)) {
            html = html.replace(needle, replacement + FOOTER_MARKER);
            changed = true;
          }
        }
        if (changed) {
          fs.writeFileSync(full, html);
          touched++;
        }
      }
    }
  };
  walk(clientDir);
  rep("footer-links", `أُضيفت روابط فوتر مساعدة في ${touched} صفحة؛ تُخطّى ${skipped} صفحة.`);
}

// ---------------------------------------------------------------------------
// ربط صفحات Pillar والمقارنات اليتيمة بصفحاتها الأم
// ---------------------------------------------------------------------------
function linkOrphanPillarAndComparePages() {
  const injections = [
    { file: path.join(clientDir, "compare", "index.html"), links: [
      ["/compare/district-1-vs-district-5/", "مقارنة: الحي الأول مقابل الحي الخامس"],
      ["/compare/canary-vs-solana/", "مقارنة: كناري مقابل سولانا"],
    ]},
    { file: path.join(clientDir, "living-guide", "index.html"), links: [
      ["/roads/", "شوارع ومحاور العبور الجديدة"],
      ["/university/", "جامعة العبور والتعليم العالي"],
      ["/lands/", "الأراضي والتخصيص في العبور الجديدة"],
      ["/industrial-zone/", "المنطقة الصناعية بالعبور"],
    ]},
    { file: path.join(clientDir, "shopping", "index.html"), links: [
      ["/shopping/", "دليل التسوق في العبور"],
    ]},
    { file: path.join(clientDir, "restaurants", "index.html"), links: [
      ["/restaurants/", "دليل الأكل والمطاعم في العبور"],
    ]},
  ];
  let touched = 0;
  for (const { file, links } of injections) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes(MARKER)) continue;
    const extra = buildLinkParagraph(links, "أدلة فرعية ذات صلة:");
    const r = injectRelatedSection(html, extra, path.basename(path.dirname(file)));
    if (r.changed) {
      fs.writeFileSync(file, r.html);
      touched++;
    }
  }
  rep("orphan-links", `أُضيفت روابط لـ ${touched} صفحة أم لصفحات فرعية يتيمة.`);
}


// ---------------------------------------------------------------------------
// Ahrefs audit 2026-09-06: slash-less internal URLs 301 to their slash form.
// Pages with an existing MARKER block are skipped above, so stale slash-less
// hrefs would survive the build — normalize every internal href to the final
// canonical (trailing-slash) URL whenever the target directory exists.
function healTrailingSlashes() {
  let healed = 0;
  for (const f of listIndexFiles(clientDir)) {
    const html = fs.readFileSync(f, "utf8");
    const out = html.replace(/href="((?:https:\/\/obourguide\.com)?\/[^"#?]*?)"/g, (m, url) => {
      const prefix = url.startsWith("https://") ? "https://obourguide.com" : "";
      const p = url.slice(prefix.length);
      if (p === "" || p.endsWith("/") || /\.[a-z0-9]+$/i.test(p)) return m;
      if (fs.existsSync(path.join(clientDir, p, "index.html"))) return `href="${prefix}${p}/"`;
      return m;
    });
    if (out !== html) {
      fs.writeFileSync(f, out);
      healed++;
    }
  }
  rep("slash-heal", `سُوّيت روابط بلا شرطة مائلة أخيرة في ${healed} صفحة.`);
}

// ---------------------------------------------------------------------------
function main() {
  const counts = {
    district: { injected: 0, skipped: 0, noLinks: 0, other: 0 },
    compound: { injected: 0, skipped: 0, noLinks: 0, other: 0 },
    developer: { injected: 0, skipped: 0, noLinks: 0, other: 0 },
    school: { injected: 0, skipped: 0, noLinks: 0, other: 0 },
  };

  for (const f of listIndexFiles(path.join(clientDir, "districts"))) {
    const slug = "/districts/" + path.basename(path.dirname(f)) + "/";
    const r = processDistrictPage(f, slug);
    if (r.status === "injected") counts.district.injected++;
    else if (r.status === "skipped") counts.district.skipped++;
    else if (r.status === "no-links") counts.district.noLinks++;
    else counts.district.other++;
  }

  for (const f of listIndexFiles(path.join(clientDir, "compounds"))) {
    const slug = "/compounds/" + path.basename(path.dirname(f)) + "/";
    const r = processCompoundPage(f, slug);
    if (r.status === "injected") counts.compound.injected++;
    else if (r.status === "skipped") counts.compound.skipped++;
    else if (r.status === "no-links") counts.compound.noLinks++;
    else counts.compound.other++;
  }

  for (const f of listIndexFiles(path.join(clientDir, "developers"))) {
    const slug = "/developers/" + path.basename(path.dirname(f)) + "/";
    const r = processDeveloperPage(f, slug);
    if (r.status === "injected") counts.developer.injected++;
    else if (r.status === "skipped") counts.developer.skipped++;
    else if (r.status === "no-links") counts.developer.noLinks++;
    else counts.developer.other++;
  }

  for (const f of listIndexFiles(path.join(clientDir, "schools"))) {
    const slug = "/schools/" + path.basename(path.dirname(f)) + "/";
    const r = processSchoolPage(f, slug);
    if (r.status === "injected") counts.school.injected++;
    else if (r.status === "skipped") counts.school.skipped++;
    else if (r.status === "no-links") counts.school.noLinks++;
    else counts.school.other++;
  }

  rep("districts", `أُضيفت روابط سياقية في ${counts.district.injected} حي، تُخطّى ${counts.district.skipped}، لا روابط ${counts.district.noLinks}`);
  rep("compounds", `أُضيفت روابط سياقية في ${counts.compound.injected} مشروع، تُخطّى ${counts.compound.skipped}، لا روابط ${counts.compound.noLinks}`);
  rep("developers", `أُضيفت روابط سياقية في ${counts.developer.injected} مطوّر، تُخطّى ${counts.developer.skipped}، لا روابط ${counts.developer.noLinks}`);
  rep("schools", `أُضيفت روابط سياقية في ${counts.school.injected} مدرسة، تُخطّى ${counts.school.skipped}، لا روابط ${counts.school.noLinks}`);

  addFooterUtilityLinks();
  linkOrphanPillarAndComparePages();
  healTrailingSlashes();

  console.log("=== تقرير المرحلة التاسعة: محرك الروابط الداخلية ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
