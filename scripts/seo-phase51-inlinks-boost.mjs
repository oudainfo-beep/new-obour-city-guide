/**
 * seo-phase51-inlinks-boost.mjs
 * المرحلة 51 — تقوية الروابط الداخلية للصفحات ضعيفة الروابط.
 *
 * المشكلة (من تدقيق Ahrefs): 338 صفحة لها رابط داخلي واحد فقط —
 * أغلبها صفحات المطورين (207) وأحياء ومولات فرعية.
 *
 * الحل: قسم «مطورون ذوو صلة» / «صفحات ذات صلة» يضيف 4 روابط لكل صفحة ضعيفة.
 * idempotent عبر علامة data-inlinks="51".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const report = [];

function titleOf(slug) {
  const p = path.join(clientDir, slug, "index.html");
  if (!fs.existsSync(p)) return slug;
  const m = fs.readFileSync(p, "utf8").match(/<h1>([^<]+)<\/h1>/);
  return m ? m[1].trim() : slug;
}

function addRelated(file, links, label) {
  if (!fs.existsSync(file)) return "missing";
  let html = fs.readFileSync(file, "utf8");
  if (html.includes('data-inlinks="51"')) return "already";
  if (!html.includes("</main>")) return "no-main";
  const items = links.map((s) => `<li><a href="/${s}/">${titleOf(s)}</a></li>`).join("");
  const section = `<section class="section" data-inlinks="51"><div class="wrap"><h2>${label}</h2><ul>${items}</ul></div></section>`;
  html = html.replace("</main>", section + "</main>");
  fs.writeFileSync(file, html, "utf8");
  return "added";
}

// 1) مطورون: كل صفحة تربط بـ4 آخرين + من صفحة الدليل الرئيسية
function boostDevelopers() {
  const dir = path.join(clientDir, "developers-directory");
  if (!fs.existsSync(dir)) return;
  const devs = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("dev-"))
    .map((e) => `developers-directory/${e.name}`);
  let n = 0;
  devs.forEach((slug, i) => {
    const others = devs.filter((s) => s !== slug);
    const picked = [];
    for (let k = 1; k <= 4; k++) picked.push(others[(i + k) % others.length]);
    // + رابط لدليل المطورين الرئيسي ودليل الكمبوندات
    picked.push("developers-directory", "best-developers-obour");
    const r = addRelated(path.join(clientDir, slug, "index.html"), picked, "مطورون وأدلة ذات صلة");
    if (r === "added") n++;
  });
  rep2(`developers: ${n} pages boosted`);
}

// 2) الأحياء الفرعية: ربط دائري بين الأحياء + روابط لأدلة الأحياء
function boostDistricts() {
  const base = path.join(clientDir, "districts");
  if (!fs.existsSync(base)) return;
  const dists = fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("district-"))
    .map((e) => `districts/${e.name}`);
  let n = 0;
  dists.forEach((slug, i) => {
    const others = dists.filter((s) => s !== slug);
    const picked = [];
    for (let k = 1; k <= 3; k++) picked.push(others[(i + k) % others.length]);
    picked.push("districts", "best-districts", "district-1");
    const r = addRelated(path.join(clientDir, slug, "index.html"), picked, "أحياء وأدلة ذات صلة");
    if (r === "added") n++;
  });
  rep2(`districts: ${n} pages boosted`);
}

// 3) المولات: ربط دائري بين صفحات المولات الفرعية
function boostMalls() {
  const base = path.join(clientDir, "malls");
  if (!fs.existsSync(base)) return;
  const malls = fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => `malls/${e.name}`);
  if (malls.length < 2) return;
  let n = 0;
  malls.forEach((slug, i) => {
    const others = malls.filter((s) => s !== slug);
    const picked = [];
    for (let k = 1; k <= 3; k++) picked.push(others[(i + k) % others.length]);
    picked.push("malls", "best-malls-obour", "shopping");
    const r = addRelated(path.join(clientDir, slug, "index.html"), picked, "مولات وتسوق ذات صلة");
    if (r === "added") n++;
  });
  rep2(`malls: ${n} pages boosted`);
}

function rep2(m) { report.push(`[OK] ${m}`); }

function main() {
  boostDevelopers();
  boostDistricts();
  boostMalls();
  console.log("Phase 51 inlinks boost done");
  console.log(report.join("\n"));
}

main();
