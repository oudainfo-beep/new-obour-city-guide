/**
 * ينسخ مستند 404 إلى جذر الإخراج باسم 404.html.
 * Cloudflare Pages يقدّم هذا الملف بحالة 404 لأي مسار غير موجود،
 * بدل إرجاع الصفحة الرئيسية بحالة 200 (soft 404).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatorPath = path.join(root, "scripts", "render-static.mjs");
let source = fs.readFileSync(generatorPath, "utf8");

if (source.includes('"404.html"')) {
  throw new Error("نسخة 404.html مضافة بالفعل في المولد.");
}

const anchor = "console.log(`Rendered ${pages.length} main pages";
if (!source.includes(anchor)) throw new Error("لم يتم العثور على سطر النهاية في المولد.");

const injected = `// نسخة 404 في جذر الإخراج: Cloudflare Pages يقدّمها بحالة 404 لأي مسار غير موجود
fs.copyFileSync(pathFor("404"), path.join(publicDir, "404.html"));

${anchor}`;

source = source.replace(anchor, injected);
fs.writeFileSync(generatorPath, source);
console.log("تمت إضافة إخراج 404.html إلى جذر الموقع.");
