/**
 * seo-phase61-realty-nav-tab.mjs
 * المرحلة 61b — إضافة تبويب «عقارات» أول قائمة التنقل (بطلب المالك 2026-09-09).
 *
 * يضيف مجموعة «عقارات ▾» (11 وجهة منشورة ومتحقق منها) قبل مجموعة «المدينة»
 * في nav لكل الصفحات، على النمطين desktop-nav وmobile-nav.
 * idempotent: يتخطى الصفحات التي تحمل التبويب فعلًا.
 *
 * ملاحظة: لا توجد صفحة «استلام فوري» مستقلة بعد — تُضاف عند توفرها.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const REALTY_DROP = `<div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">عقارات <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/apartments-for-sale-obour/">شقق للبيع</a><a href="/compounds/">كمبوندات</a><a href="/new-projects-watch/">مشروعات جديدة</a><a href="/prices/">أسعار العقارات</a><a href="/price-report-q3-2026/">سعر المتر</a><a href="/lands/">أراضي للبيع</a><a href="/installments-obour/">تقسيط</a><a href="/developers-directory/">المطورون</a><a href="/best-districts/">أفضل المناطق للاستثمار</a><a href="/buying-guide/">دليل المشتري</a><a href="/compare/">مقارنة المشروعات</a></div></div>`;
const REALTY_MOBILE = `<details class="m-group"><summary>عقارات</summary><div><a href="/apartments-for-sale-obour/">شقق للبيع</a><a href="/compounds/">كمبوندات</a><a href="/new-projects-watch/">مشروعات جديدة</a><a href="/prices/">أسعار العقارات</a><a href="/price-report-q3-2026/">سعر المتر</a><a href="/lands/">أراضي للبيع</a><a href="/installments-obour/">تقسيط</a><a href="/developers-directory/">المطورون</a><a href="/best-districts/">أفضل المناطق للاستثمار</a><a href="/buying-guide/">دليل المشتري</a><a href="/compare/">مقارنة المشروعات</a></div></details>`;

const DESKTOP_RE = /<nav class="desktop-nav"[\s\S]*?<\/nav>/i;
const MOBILE_RE = /<nav aria-label="التنقل الرئيسي للموبايل"[\s\S]*?<\/nav>/i;
const ALREADY = 'aria-haspopup="true">عقارات';

function patch(html) {
  if (html.includes(ALREADY)) return null;
  if (!DESKTOP_RE.test(html)) return null;
  // يقف «عقارات» أول مجموعات التنقل (أقصى اليمين في RTL)
  html = html.replace(DESKTOP_RE, (m) => m.replace('<div class="nav-item nav-has-drop">', REALTY_DROP + '<div class="nav-item nav-has-drop">'));
  if (MOBILE_RE.test(html)) {
    html = html.replace(MOBILE_RE, (m) => m.replace('<details class="m-group">', REALTY_MOBILE + '<details class="m-group">'));
  }
  return html;
}

function main() {
  let updated = 0, skipped = 0, missed = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (e.name !== "index.html") continue;
      const html = fs.readFileSync(full, "utf8");
      if (html.includes(ALREADY)) { skipped++; continue; }
      const out = patch(html);
      if (out === null) { missed++; continue; }
      fs.writeFileSync(full, out, "utf8");
      updated++;
    }
  };
  walk(clientDir);
  console.log(`Phase 61 realty nav tab: ${updated} pages updated, ${skipped} already had it, ${missed} without desktop-nav`);
}

main();
