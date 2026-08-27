/**
 * seo-phase24-search-index.mjs
 * المرحلة 24 — فهرسة البحث الداخلي تلقائيًا.
 *
 * المشكلة: render-static.mjs يبني search-index.json من قائمة صفحاته الداخلية
 * فقط، فلا تظهر صفحات المراحل (phase scripts) في نتائج /search/.
 *
 * الحل: بعد تشغيل كل مراحل المحتوى، نمسح كل client/**​/index.html فعليًا
 * ونضيف الصفحات غير المفهرسة إلى search-index.json (نحتفظ بمداخل الأدلة
 * والمدارس كما هي، ونزيل التكرار بالرابط). idempotent: يُعاد البناء كل build.
 *
 * الاستبعاد: 404 وsearch وoffline وملفات public وsrc.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const indexPath = path.join(publicDir, "search-index.json");

const EXCLUDE_DIRS = new Set(["public", "src", "data", "brand", "static"]);
const EXCLUDE_SLUGS = new Set(["/404/", "/search/", "/offline/"]);

function walkPages() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || EXCLUDE_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "index.html") out.push(full);
    }
  };
  walk(clientDir);
  return out;
}

function slugOf(file) {
  const rel = path.relative(clientDir, path.dirname(file)).split(path.sep).join("/");
  return rel === "" || rel === "." ? "/" : `/${rel}/`;
}

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function main() {
  if (!fs.existsSync(indexPath)) {
    console.log("[FAIL] search-index.json not found — render-static must run first");
    process.exit(1);
  }
  const base = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const seen = new Set(base.map((x) => x.u));
  const added = [];
  for (const file of walkPages()) {
    const u = slugOf(file);
    if (EXCLUDE_SLUGS.has(u) || seen.has(u)) continue;
    const html = fs.readFileSync(file, "utf8");
    let n = extract(html, /<title>([^<]+)<\/title>/);
    n = n.replace(/ \| دليل العبور$/, "").replace(/ \| Obour Guide$/, "");
    const d = extract(html, /<meta name="description" content="([^"]*)">/);
    if (!n) continue;
    const entry = { n, d, u, k: "صفحة" };
    base.push(entry);
    seen.add(u);
    added.push(u);
  }
  fs.writeFileSync(indexPath, JSON.stringify(base));
  console.log(`Phase 24 search index done: ${base.length} entries total, ${added.length} pages added`);
  if (added.length) console.log(added.join("\n"));
}

main();
