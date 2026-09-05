/**
 * seo-phase53-audit-fixes-20260905.mjs
 * ====================================
 * إصلاحات تقرير تدقيق Sitebulb بتاريخ 2026-09-05 — الجزء الأول (سكيما + ميتا + robots):
 *  1) حذف datePublished/dateModified من عُقد ItemList (ترث من Intangible لا CreativeWork —
 *     التواريخ عليها تُنتج خطأ schema.org: UNKNOWN_FIELD). كان مصدرها ختم phase1 للتواريخ.
 *  2) إصلاح حقول telephone المُدمجة: أرقام متعددة ملصقة في نص واحد تتحول إلى مصفوفة.
 *  3) تقليم meta description: إزالة حشوة «مصدر البيانات: أدلة منشورة قابلة للفحص.»
 *     وقصّ الجمل الختامية بأمان، مع إعادة صياغة يدوية لسبع صفحات إنجليزية.
 *  4) robots.txt بسياسة موحدة: سماح بالفهرسة ومحركات إجابات AI وحظر زواحف التدريب —
 *     بما يتوافق مع طبقة Cloudflare المُدارة بدل التناقض معها (سبب تحذير
 *     "Inconsistent AI training bot policy").
 *  5) _redirects: تحويل 301 لمسارات /districts/district-N/pharmacies/ المكررة إلى
 *     /pharmacies-district-N/ (النسخة القانونية الموحدة).
 * الربط الداخلي وخريطة الموقع في scripts/seo-phase53b-internal-links-20260905.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const report = [];
const rep = (section, msg) => report.push(`[${section}] ${msg}`);

function listPages() {
  const pages = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (["public", "node_modules"].includes(entry.name)) continue;
      const sub = path.join(dir, entry.name);
      const idx = path.join(sub, "index.html");
      if (fs.existsSync(idx)) {
        pages.push({ route: "/" + path.relative(clientDir, sub).split(path.sep).join("/") + "/", file: idx });
      }
      walk(sub);
    }
  };
  walk(clientDir);
  if (fs.existsSync(path.join(clientDir, "index.html"))) {
    pages.push({ route: "/", file: path.join(clientDir, "index.html") });
  }
  return pages;
}

const read = (f) => fs.readFileSync(f, "utf8");
const write = (f, c) => fs.writeFileSync(f, c);

// ---------------------------------------------------------------------------
// 1 — إصلاح JSON-LD
// ---------------------------------------------------------------------------

/** يفكّك نص أرقام ملصقة إلى مصفوفة أرقام مصرية صالحة، أو null إن تعذّر بأمان */
function splitPhones(value) {
  if (typeof value !== "string") return null;
  if (!/^\+?[\d\s;،,·/-]+$/.test(value)) return null;
  // الشكل الأول: أرقام مفصولة بفواصل واضحة — «02-4482-8159; 0128-8691-005» أو «… · …»
  if (/[;،,·]/.test(value)) {
    const parts = value.split(/[;،,·]/).map((s) => s.replace(/[^\d+]/g, "")).filter(Boolean);
    if (parts.length < 2) return null;
    const cleaned = [];
    for (let part of parts) {
      if (part.startsWith("0020")) part = "0" + part.slice(4);
      else if (part.startsWith("+20")) part = "0" + part.slice(3);
      if (!/^(01[0125]\d{8}|02\d{8}|0800\d{7}|0\d{9,10}|1[5679]\d{3})$/.test(part)) return null;
      cleaned.push(part);
    }
    return cleaned;
  }
  // الشكل الثاني: كتلة أرقام ملصقة بلا فواصل — «02449170270244917114…»
  let d = value.replace(/[\s/-]/g, "");
  if (d.startsWith("0020")) d = "0" + d.slice(4);
  else if (d.startsWith("+20")) d = "0" + d.slice(3);
  if (d.length < 12) return null; // رقم واحد طبيعي — لا تلمسه
  const nums = [];
  let rest = d;
  while (rest.length) {
    let m = null;
    if (rest.startsWith("01")) m = rest.match(/^01[0125]\d{8}/);            // محمول 11
    else if (rest.startsWith("02")) m = rest.match(/^02\d{8}/);             // أرضي القاهرة الكبرى 10
    else if (rest.startsWith("0800")) m = rest.match(/^0800\d{7}/);         // مجاني
    else if (rest.startsWith("0")) m = rest.match(/^0\d{2}\d{7,8}/);        // أرضي محافظات
    else if (rest.startsWith("1")) m = rest.match(/^1[5679]\d{3}/);         // خط ساخن 5 خانات
    if (!m) return null; // بقية غير قابلة للتفسير — نترك النص كما هو
    nums.push(m[0]);
    rest = rest.slice(m[0].length);
  }
  return nums.length >= 2 ? nums : null;
}

function fixJsonLd(html) {
  let itemListFixed = 0, phonesFixed = 0;
  const out = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, json) => {
    let data;
    try { data = JSON.parse(json); } catch { return all; }
    let touched = false;
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      if (node["@type"] === "ItemList") {
        if ("datePublished" in node) { delete node.datePublished; touched = true; }
        if ("dateModified" in node) { delete node.dateModified; touched = true; }
        if (touched) itemListFixed++;
      }
      if (typeof node.telephone === "string") {
        const split = splitPhones(node.telephone);
        if (split) { node.telephone = split; touched = true; phonesFixed++; }
      }
      Object.values(node).forEach(walk);
    };
    walk(data);
    return touched ? `<script type="application/ld+json">${JSON.stringify(data)}</script>` : all;
  });
  return { html: out, itemListFixed, phonesFixed };
}

// ---------------------------------------------------------------------------
// 2 — تقليم meta description
// ---------------------------------------------------------------------------

const BOILERPLATE = [
  " مصدر البيانات: أدلة منشورة قابلة للفحص.",
  "مصدر البيانات: أدلة منشورة قابلة للفحص.",
  " We evaluate what is published and verifiable, and state the limits of available information clearly.",
];

// صفحات إنجليزية تحتاج إعادة صياغة يدوية (جُملة واحدة طويلة لا تُقصّ آليًا)
const MANUAL_META = new Map(Object.entries({
  "/en/24-hour-pharmacies/": "Need medicine at night in Obour? How the pharmacy duty system works, how to find an open pharmacy after hours, and the emergency numbers to keep.",
  "/en/apartments-for-sale/": "How to buy an apartment in Obour City: where to search, how prices vary by district, resale vs developer vs government, and the checklist before you sign.",
  "/en/districts/": "Compare Obour districts the right way: execution phase, service proximity, and your goal — build a shortlist for site visits, not marketing copy.",
  "/en/international-schools/": "Choosing an international school in Obour: verify curriculum accreditation, real all-in fees, admission timelines, and the visit checklist that matters.",
  "/en/nurseries/": "A practical parent guide to nurseries in Obour City: types, age ranges, realistic fees, and the visit checklist before registering your child.",
  "/en/postal-code/": "The postal code for Obour City, Qalyubia is 11828. How Egyptian postal codes work and how to verify your street's code with Egypt Post.",
  "/en/property-investment/": "An honest framework for property investment in Obour City: rental demand drivers, real yield math, hidden risks, and due diligence before you buy.",
}));

function trimMeta(html, route) {
  const m = html.match(/<meta name="description" content="([^"]*)">/);
  if (!m) return { html, changed: false, before: 0, after: 0 };
  let desc = m[1];
  const before = desc.length;
  if (MANUAL_META.has(route) && MANUAL_META.get(route) !== desc) {
    const fixed = MANUAL_META.get(route);
    return { html: html.replace(m[0], `<meta name="description" content="${fixed}">`), changed: true, before, after: fixed.length };
  }
  if (before <= 160) return { html, changed: false, before, after: before };

  let next = desc;
  // (أ) عبارات حشو معروفة
  for (const phrase of BOILERPLATE) {
    if (next.length > 155 && next.includes(phrase) && next.length - phrase.length >= 60) {
      next = next.replace(phrase, "");
    }
  }
  next = next.replace(/\s{2,}/g, " ").replace(/\s+([.،!؟])/g, "$1").trim();
  // (ب) مقطع بعد شرطة إم — إن كان الجزء الأول مكتفيًا بذاته
  if (next.length > 155) {
    const dashIdx = next.lastIndexOf(" — ");
    if (dashIdx >= 60) {
      const head = next.slice(0, dashIdx).replace(/[،,;\s]+$/, "");
      if (head.length >= 60) next = head + ".";
    }
  }
  // (ج) حذف جمل ختامية (عربي/إنجليزي) طالما الباقي ≥ 70 حرفًا
  while (next.length > 155) {
    const cut = Math.max(
      next.lastIndexOf(". ", next.length - 2),
      next.lastIndexOf("؟ "), next.lastIndexOf("! "),
      next.lastIndexOf("، ", next.length - 2) // فاصلة عربية كملاذ أخير
    );
    if (cut < 70) break;
    next = next.slice(0, cut + 1).trim();
    if (!/[.!؟…]$/.test(next)) next += ".";
  }
  next = next.trim();
  if (next === desc) return { html, changed: false, before, after: before };
  return { html: html.replace(m[0], `<meta name="description" content="${next}">`), changed: true, before, after: next.length };
}

// ---------------------------------------------------------------------------
// 4 — robots.txt متسق
// ---------------------------------------------------------------------------

const ROBOTS = `# Obour Guide — robots.txt
# السياسة (موحدة على مستوى الموقع): الفهرسة ومحركات إجابات الذكاء الاصطناعي مسموحة؛
# زواحف تدريب النماذج محظورة. لا تُضف قواعد Allow يدوية لهذه الزواحف — طبقة
# Cloudflare المُدارة تحظرها أيضًا، وأي تناقض Allow/Disallow يُعيد تحذير
# "Inconsistent AI training bot policy" في التدقيق.

User-agent: *
Content-Signal: search=yes, ai-train=no, use=reference
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: DeepseekBot
Disallow: /

User-agent: xAI-Bot
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: cohere-training-data-crawler
Disallow: /

User-agent: Omgilibot
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: AI2Bot
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: Timpibot
Disallow: /

User-agent: ImagesiftBot
Disallow: /

Sitemap: https://obourguide.com/sitemap.xml
`;

// ---------------------------------------------------------------------------
// 5 — _redirects: تحويلات توحيد مسار الصيدليات
// ---------------------------------------------------------------------------

function fixRedirects() {
  const file = path.join(clientDir, "public", "_redirects");
  let content = fs.existsSync(file) ? read(file) : "";
  if (content.includes("phase53")) return rep("redirects", "موجودة مسبقًا — تخطّي");
  const block = `
# phase53: توحيد مسار صيدليات الأحياء (النسخة المسطحة هي القانونية)
/districts/district-1/pharmacies/ /pharmacies-district-1/ 301
/districts/district-1/pharmacies /pharmacies-district-1/ 301
/districts/district-2/pharmacies/ /pharmacies-district-2/ 301
/districts/district-2/pharmacies /pharmacies-district-2/ 301
/districts/district-5/pharmacies/ /pharmacies-district-5/ 301
/districts/district-5/pharmacies /pharmacies-district-5/ 301
/districts/district-6/pharmacies/ /pharmacies-district-6/ 301
/districts/district-6/pharmacies /pharmacies-district-6/ 301
/districts/district-9/pharmacies/ /pharmacies-district-9/ 301
/districts/district-9/pharmacies /pharmacies-district-9/ 301
`;
  write(file, content.replace(/\s*$/, "") + "\n" + block);
  rep("redirects", "أُضيفت 10 قواعد 301 إلى _redirects");
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const pages = listPages();
  rep("scan", `إجمالي الصفحات: ${pages.length}`);
  let ilf = 0, pf = 0, metas = 0, stillLong = [];
  for (const p of pages) {
    let html = read(p.file);
    const j = fixJsonLd(html);
    html = j.html;
    const mt = trimMeta(html, p.route);
    html = mt.html;
    if (mt.changed) metas++;
    if (mt.after > 160) stillLong.push(`${p.route} (${mt.after})`);
    if (html !== read(p.file)) write(p.file, html);
    ilf += j.itemListFixed; pf += j.phonesFixed;
  }
  rep("schema", `ItemList نُظّفت من التواريخ: ${ilf} كتلة — telephone تحولت لمصفوفات: ${pf}`);
  rep("meta", `أوصاف قُلّمت: ${metas} — ما زالت >160: ${stillLong.length}${stillLong.length ? " → " + stillLong.slice(0, 12).join("، ") : ""}`);
  write(path.join(clientDir, "public", "robots.txt"), ROBOTS);
  rep("robots", "robots.txt أُعيد كتابته بسياسة موحدة (حظر تدريب AI، سماح ببحث/إجابات AI)");
  fixRedirects();
  console.log("phase53 audit fixes (schema/meta/robots/redirects) — تمّت:");
  console.log(report.map((r) => "  " + r).join("\n"));
}

main();
