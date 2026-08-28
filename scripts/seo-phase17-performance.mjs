/**
 * seo-phase17-performance.mjs
 * تحسينات الأداء الصغيرة والآمنة على كل ملفات HTML.
 * idempotent: لا يعيد تطبيق التحسين إذا كان الماركر موجودًا.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const MARKER = "<!-- phase17-performance -->";

const report = [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === "index.html") out.push(full);
  }
  return out;
}

function optimize(file) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) return;

  let changed = false;

  // 1) إضافة decoding="async" للصور التي لا تملكه
  html = html.replace(/<img\b([^>]*)>/gi, (tag, attrs) => {
    if (/\bdecoding=/i.test(attrs)) return tag;
    const insertAt = tag.lastIndexOf(">");
    changed = true;
    return tag.slice(0, insertAt) + ' decoding="async"' + tag.slice(insertAt);
  });

  // 2) التأكد من أن الصور خارج الهيرو تحمل loading="lazy"
  html = html.replace(/<img\b([^>]*)>/gi, (tag, attrs) => {
    if (/\bloading=/i.test(attrs) || /\bfetchpriority=/i.test(attrs)) return tag;
    const insertAt = tag.lastIndexOf(">");
    changed = true;
    return tag.slice(0, insertAt) + ' loading="lazy"' + tag.slice(insertAt);
  });

  // 3) تحويل خطوط Google إلى تحميل غير محجوب إذا كانت قديمة
  const oldFont = /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Sans\+Arabic:[^"]*&display=swap">/;
  if (oldFont.test(html)) {
    const fontUrl = html.match(/https:\/\/fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Sans\+Arabic:[^"]*&display=swap/)[0];
    html = html.replace(
      oldFont,
      `<link rel="preload" as="style" href="${fontUrl}"><link rel="stylesheet" href="${fontUrl}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${fontUrl}"></noscript>`
    );
    changed = true;
  }

  if (!changed) return;

  html = html.replace(/<head>/i, `<head>${MARKER}`);
  fs.writeFileSync(file, html);
  report.push(path.relative(clientDir, file));
}

const files = walk(clientDir).filter((f) => !f.includes("node_modules") && !f.includes("dist/"));
for (const file of files) optimize(file);

console.log(`=== تقرير تحسينات الأداء ===`);
console.log(`[performance] تم تحسين ${report.length} صفحة`);
for (const f of report.slice(0, 10)) console.log(`  - ${f}`);
if (report.length > 10) console.log(`  ... و ${report.length - 10} صفحات أخرى`);
