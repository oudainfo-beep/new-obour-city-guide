/**
 * seo-phase2-nav.mjs
 * المرحلة الثانية (2.7): إعادة هيكلة التنقل من 33 رابطًا إلى 7 محاور.
 *
 * القواعد الملزمة:
 *  - idempotent: فحص marker قبل التعديل.
 *  - 7 محاور فقط في التنقل الرئيسي.
 *  - /directory/ هي مقصد كل الروابط المحذوفة من القائمة.
 *  - يُطبّق على desktop-nav وmobile-nav معًا.
 *
 * الاستخدام:
 *   node scripts/seo-phase2-nav.mjs --preview index   # صفحة واحدة للمراجعة
 *   node scripts/seo-phase2-nav.mjs                  # كل الصفحات
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const MARKER = "<!-- phase2.7-nav-restructured -->";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const previewArg = process.argv.includes("--preview")
  ? process.argv[process.argv.indexOf("--preview") + 1]
  : null;

// ---------------------------------------------------------------------------
// الهيكل الجديد للتنقل
// ---------------------------------------------------------------------------
const DESKTOP_NAV = `<nav class="desktop-nav" aria-label="التنقل الرئيسي"><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">المدينة <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/about/">عن المدينة</a><a href="/districts/">الأحياء والمناطق</a><a href="/transport/">المواصلات والوصول</a><a href="/compare/">مقارنة المدن</a></div></div><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">السكن والشراء <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/prices/">أسعار العقارات</a><a href="/buying-guide/">دليل الشراء</a><a href="/developers/">دليل المطورين</a><a href="/investment/">الاستثمار العقاري</a><a href="/mistakes/">أخطاء شائعة</a></div></div><div class="nav-item"><a href="/directory/">الخدمات</a></div><div class="nav-item"><a href="/education-guide/">التعليم</a></div><div class="nav-item"><a href="/health-guide/">الصحة</a></div><div class="nav-item"><a href="/news/">الأخبار</a></div><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">الأسعار والتقارير <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/prices/">أسعار العقارات</a><a href="/price-report-q3-2026/">تقرير الأسعار Q3 2026</a></div></div><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">الطوارئ والأسئلة <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/emergency/">الطوارئ</a><a href="/faq/">الأسئلة الشائعة</a></div></div></nav>`;

const MOBILE_NAV = `<nav aria-label="التنقل الرئيسي للموبايل"><form class="m-search" role="search" action="/search/" method="get"><input type="search" name="q" placeholder="ابحث في الدليل…" aria-label="ابحث في الدليل" required><button type="submit">⌕</button></form><details class="m-group"><summary>المدينة</summary><div><a href="/about/">عن المدينة</a><a href="/districts/">الأحياء والمناطق</a><a href="/transport/">المواصلات والوصول</a><a href="/compare/">مقارنة المدن</a></div></details><details class="m-group"><summary>السكن والشراء</summary><div><a href="/prices/">أسعار العقارات</a><a href="/buying-guide/">دليل الشراء</a><a href="/developers/">دليل المطورين</a><a href="/investment/">الاستثمار العقاري</a><a href="/mistakes/">أخطاء شائعة</a></div></details><a class="m-solo" href="/directory/">الخدمات</a><a class="m-solo" href="/education-guide/">التعليم</a><a class="m-solo" href="/health-guide/">الصحة</a><a class="m-solo" href="/news/">الأخبار</a><details class="m-group"><summary>الأسعار والتقارير</summary><div><a href="/prices/">أسعار العقارات</a><a href="/price-report-q3-2026/">تقرير الأسعار Q3 2026</a></div></details><details class="m-group"><summary>الطوارئ والأسئلة</summary><div><a href="/emergency/">الطوارئ</a><a href="/faq/">الأسئلة الشائعة</a></div></details></nav>`;

function restructurePage(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes(MARKER)) {
    rep("skip", `${path.relative(clientDir, filePath)}: مُعاد هيكلته سابقًا`);
    return false;
  }

  const origLen = html.length;
  html = html.replace(/<nav class="desktop-nav"[\s\S]*?<\/nav>/i, DESKTOP_NAV);
  html = html.replace(/<nav aria-label="التنقل الرئيسي للموبايل"[\s\S]*?<\/nav>/i, MOBILE_NAV);

  if (html.length === origLen) {
    rep("skip", `${path.relative(clientDir, filePath)}: لم يُعثر على تنقل للاستبدال`);
    return false;
  }

  // marker بعد الـ mobile nav مباشرة
  html = html.replace(MOBILE_NAV, MOBILE_NAV + MARKER);
  fs.writeFileSync(filePath, html, "utf8");
  rep("nav", `${path.relative(clientDir, filePath)}: أُعيد هيكلة التنقل إلى 7 محاور`);
  return true;
}

// ---------------------------------------------------------------------------
// تحديد الصفحات المستهدفة
// ---------------------------------------------------------------------------
let targets;
if (previewArg) {
  const p = previewArg === "index"
    ? path.join(clientDir, "index.html")
    : path.join(clientDir, previewArg, "index.html");
  targets = [p];
  rep("mode", `preview على صفحة واحدة: /${previewArg}/`);
} else {
  targets = [];
  function collect(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        collect(full);
      } else if (entry === "index.html") {
        targets.push(full);
      }
    }
  }
  collect(clientDir);
  rep("mode", `كل الصفحات: ${targets.length} صفحة`);
}

let done = 0;
for (const t of targets) {
  if (fs.existsSync(t) && restructurePage(t)) done++;
}

console.log("=== تقرير المرحلة الثانية: إعادة هيكلة التنقل (2.7) ===");
for (const r of report) console.log(r);
console.log(`=== انتهى: ${done} صفحة/صفحات ===`);
