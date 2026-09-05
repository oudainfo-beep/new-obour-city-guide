/**
 * seo-phase54-post-build.mjs
 * ==========================
 * يعمل بعد `vite build` على dist/public مباشرة — آخر نقطة قبل النشر.
 *
 * لماذا موجود؟ بعض المراحل تكتب صفحاتها بشكل غير متزامن بعد انتهاء سلسلة
 * المراحل (مثل خريطة /map/ التي تنتظر مهلة الجيوكودينج ثم تكتب)، فتتجاوز
 * إصلاحات 53/53b/53c/53d. أي إصلاح لازم لهذه الصفحات يُطبَّق هنا على ناتج
 * البناء النهائي نفسه، فلا يمكن تجاوزه.
 *
 * حاليًا: توسيع وصف /map/ القصير (103 حرفًا → 156).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distPublic = path.join(root, "dist", "public");

const SHORT_MAP_DESC = "خريطة تفاعلية لأحياء ومشروعات ومدارس ومعالم العبور والعبور الجديدة — بإحداثيات منشورة من OpenStreetMap.";
const LONG_MAP_DESC = "خريطة تفاعلية لأحياء ومشروعات ومدارس ومعالم العبور والعبور الجديدة: مواقع الخدمات والمطورين وأسعار الأحياء في مكان واحد — بإحداثيات منشورة من OpenStreetMap.";

const report = [];

function patchMapDescription() {
  const file = path.join(distPublic, "map", "index.html");
  if (!fs.existsSync(file)) { report.push("map: not found in dist — skipped"); return; }
  const html = fs.readFileSync(file, "utf8");
  if (html.includes(LONG_MAP_DESC)) { report.push("map: description already extended"); return; }
  if (!html.includes(SHORT_MAP_DESC)) { report.push("map: unexpected description — manual check needed"); return; }
  fs.writeFileSync(file, html.split(SHORT_MAP_DESC).join(LONG_MAP_DESC));
  report.push("map: description extended 103 → 156 chars");
}

function main() {
  if (!fs.existsSync(distPublic)) { console.log("phase54: no dist/public — skipped"); return; }
  patchMapDescription();
  console.log("phase54 (post-build) — تمّت:");
  for (const r of report) console.log("  " + r);
}

main();
