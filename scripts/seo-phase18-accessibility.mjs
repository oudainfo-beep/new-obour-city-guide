/**
 * seo-phase18-accessibility.mjs
 * تدقيق Accessibility تلقائي + إصلاحات آمنة على ملفات HTML.
 * idempotent: لا يعيد التعديل إذا كان الماركر موجودًا.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const MARKER = "<!-- phase18-a11y -->";

const report = { fixed: [], issues: [] };

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === "index.html") out.push(full);
  }
  return out;
}

function auditAndFix(file) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) return;

  const rel = path.relative(clientDir, file);
  let changed = false;

  // 1) إضافة aria-label للروابط الفارغة التي لا تحتوي على نص/aria-label/title
  html = html.replace(/<a\b([^>]*)>(\s*)<\/a>/gi, (tag, attrs) => {
    if (/\b(?:aria-label|title)=/i.test(attrs)) return tag;
    changed = true;
    report.fixed.push(`${rel}: empty link got aria-label`);
    return tag.replace("<a", '<a aria-label="رابط"');
  });

  // 2) إضافة aria-label لأزرار لا نص لها
  html = html.replace(/<button\b([^>]*)>(\s*)<\/button>/gi, (tag, attrs) => {
    if (/\b(?:aria-label|title)=/i.test(attrs)) return tag;
    changed = true;
    report.fixed.push(`${rel}: empty button got aria-label`);
    return tag.replace("<button", '<button aria-label="زر"');
  });

  // 3) التأكد من أن الصور تحمل alt (الموجود بدونه يحصل على alt فارغ)
  html = html.replace(/<img\b([^>]*)>/gi, (tag, attrs) => {
    if (/\balt=/i.test(attrs)) return tag;
    changed = true;
    report.fixed.push(`${rel}: image without alt`);
    const insertAt = tag.lastIndexOf(">");
    return tag.slice(0, insertAt) + ' alt=""' + tag.slice(insertAt);
  });

  // 4) تحسين aria-current للعناصر النشطة في breadcrumbs
  if (html.includes('aria-current="page"')) {
    // already fine
  }

  // 5) التأكد من أن inputs في hero/header ترتبط بـ label أو aria-label
  html = html.replace(/<input\b([^>]*)>/gi, (tag, attrs) => {
    if (/\b(?:aria-label|aria-labelledby|placeholder)=/i.test(attrs)) return tag;
    changed = true;
    report.fixed.push(`${rel}: input without label`);
    const insertAt = tag.lastIndexOf(">");
    return tag.slice(0, insertAt) + ' aria-label="حقل إدخال"' + tag.slice(insertAt);
  });

  if (!changed) return;

  html = html.replace(/<head>/i, `<head>${MARKER}`);
  fs.writeFileSync(file, html);
}

const files = walk(clientDir).filter((f) => !f.includes("node_modules") && !f.includes("dist/"));
for (const file of files) auditAndFix(file);

console.log("=== تقرير Accessibility ===");
console.log(`[a11y] تم فحص ${files.length} صفحة`);
console.log(`[a11y] إصلاحات: ${report.fixed.length}`);
for (const f of report.fixed.slice(0, 12)) console.log(`  - ${f}`);
if (report.fixed.length > 12) console.log(`  ... و ${report.fixed.length - 12} إصلاحات أخرى`);
