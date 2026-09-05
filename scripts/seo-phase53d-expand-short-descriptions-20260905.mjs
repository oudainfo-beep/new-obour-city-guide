/**
 * seo-phase53d-expand-short-descriptions-20260905.mjs
 * ===================================================
 * تقرير Ahrefs: «Meta description too short» على نطاق واسع (مثال: /banks/).
 * بعد الجولات السابقة بقيت ~270 صفحة في نطاق 70–109 حرفًا (عتبة Ahrefs ≈ 110).
 *
 * الإستراتيجية — توسيع محافظ ومقصود:
 *  - الصفحات القصيرة هنا قالبية بالكامل (صفحات كيانات «بيانات منشورة عن…» وصفحات
 *    قوائم «دليل X: N مدخل…»)، فنُلحق كلمة ختامية ثابتة قصيرة تناسب نوع الصفحة.
 *  - تُختار اللاحقة بحيث تستقر النتيجة بين 112 و158 حرفًا (بعيدًا عن العتبتين).
 *  - لا نلمس أي وصف ≥110 أو أي وصف كُتب يدويًا (قوائم MANUAL_* في 53/53c).
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

// لواحق مدرَّجة بالطول — نجرّب الأطول الذي يبقينا ضمن النطاق
const AR_SUFFIXES = {
  entity: [
    "؛ تُراجَع البيانات دوريًا من مصادرها المعلنة، ويُرحَّب بأي تصحيح موثّق عبر صفحة التواصل.",
    "؛ تُراجَع البيانات دوريًا ويُرحَّب بالتصحيح الموثّق.",
    "؛ بيانات تُراجَع دوريًا.",
  ],
  listing: [
    "؛ وتُحدَّث القائمة دوريًا من مصادرها المعلنة — تصفّحها أو قارن بين الأحياء والأقسام.",
    "؛ وتُحدَّث القائمة دوريًا من مصادر معلنة.",
    "؛ وتُحدَّث دوريًا.",
  ],
  generic: [
    " — من دليل العبور والعبور الجديدة؛ بمصادر معلنة قابلة للمراجعة والتصحيح.",
    " — من دليل العبور؛ بمصادر معلنة قابلة للمراجعة.",
  ],
};
const EN_SUFFIXES = {
  generic: [
    " — from the verified Obour Guide directory, with published sources for every entry.",
    " — from the verified Obour Guide directory.",
  ],
};

function classify(route, desc) {
  if (route.startsWith("/en/")) return "en";
  if (desc.startsWith("بيانات منشورة عن")) return "entity";
  if (/مدخل|قائمة|دليل /.test(desc)) return "listing";
  return "generic";
}

const MANUAL53D = new Map(Object.entries({
  "/map/": "خريطة تفاعلية لأحياء ومشروعات ومدارس ومعالم العبور والعبور الجديدة: مواقع الخدمات والمطورين وأسعار الأحياء في مكان واحد — من دليل العبور.",
}));

function expandDesc(html, route) {
  if (MANUAL53D.has(route)) {
    const mm = html.match(/<meta name="description" content="([^"]*)">/);
    if (mm && mm[1] !== MANUAL53D.get(route)) {
      return { html: html.replace(mm[0], `<meta name="description" content="${MANUAL53D.get(route)}">`), changed: true };
    }
  }
  const m = html.match(/<meta name="description" content="([^"]*)">/);
  if (!m) return { html, changed: false };
  const desc = m[1];
  const len = desc.length;
  if (len === 0 || len >= 110) return { html, changed: false };
  const kind = classify(route, desc);
  const suffixes = kind === "en" ? EN_SUFFIXES.generic : AR_SUFFIXES[kind];
  for (const suf of suffixes) {
    let next = desc.replace(/[.\s]+$/, "") + suf;
    if (next.length >= 112 && next.length <= 158) {
      return { html: html.replace(m[0], `<meta name="description" content="${next}">`), changed: true, before: len, after: next.length };
    }
  }
  return { html, changed: false };
}

function main() {
  const pages = listPages();
  let expanded = 0, stillShort = [];
  for (const p of pages) {
    const html = read(p.file);
    const res = expandDesc(html, p.route);
    if (res.changed) { write(p.file, res.html); expanded++; }
    else {
      const m = html.match(/<meta name="description" content="([^"]*)">/);
      if (m && m[1].length > 0 && m[1].length < 110 && p.route !== "/404/") stillShort.push(`${p.route} (${m[1].length})`);
    }
  }
  rep("desc-expand", `أوصاف قصيرة وُسّعت: ${expanded} — ما زالت <110: ${stillShort.length}${stillShort.length ? " → " + stillShort.slice(0, 10).join("، ") : ""}`);
  console.log("phase53d (expand short descriptions) — تمّت:");
  console.log(report.map((r) => "  " + r).join("\n"));
}

main();
