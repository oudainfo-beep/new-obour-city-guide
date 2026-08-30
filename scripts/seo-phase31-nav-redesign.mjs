/**
 * seo-phase31-nav-redesign.mjs
 * المرحلة 31 — إعادة تصميم قائمة التنقل (9 عناصر مزدحمة ← 5 مجموعات نظيفة).
 *
 * التصميم الجديد:
 *   المدينة ▾ | السكن والأسعار ▾ | الخدمات ▾ | المجتمع ▾ | الطوارئ
 * يستبدل كتلتي nav في كل الصفحات بالقالب الجديد مباشرة (regex)،
 * ويحدّث قالب seo-phase2-nav.mjs نفسه ليبقى متسقًا في البنايات القادمة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

export const NEW_DESKTOP_NAV = `<nav class="desktop-nav" aria-label="التنقل الرئيسي"><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">المدينة <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/about/">عن المدينة</a><a href="/districts/">الأحياء والمناطق</a><a href="/map/">الخريطة</a><a href="/transport/">المواصلات والوصول</a><a href="/nearby-cities/">المدن القريبة</a><a href="/compare/">مقارنة المدن</a></div></div><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">السكن والأسعار <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/prices/">أسعار العقارات</a><a href="/price-report-q3-2026/">تقرير الأسعار Q3 2026</a><a href="/buying-guide/">دليل الشراء</a><a href="/rent/">الإيجار</a><a href="/developers/">دليل المطورين</a><a href="/developers-directory/">دليل كل شركات التطوير</a><a href="/investment/">الاستثمار العقاري</a><a href="/mistakes/">أخطاء شائعة</a></div></div><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">الخدمات <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/directory/">دليل الخدمات</a><a href="/education-guide/">التعليم والمدارس</a><a href="/health-guide/">الصحة والمستشفيات</a><a href="/shopping/">التسوق والأسواق</a><a href="/jobs-obour/">الوظائف</a><a href="/government-services/">خدمات حكومية</a></div></div><div class="nav-item nav-has-drop"><span class="nav-top" tabindex="0" role="button" aria-haspopup="true">المجتمع <i aria-hidden="true">▾</i></span><div class="nav-drop"><a href="/ask/">اسأل وأجب — مجتمع العبور</a><a href="/news/">أخبار المدينة</a><a href="/updates/">تحديثات الدليل</a><a href="/tracker/">متابعة العبور الجديدة</a><a href="/faq/">الأسئلة الشائعة</a></div></div><div class="nav-item nav-accent"><a href="/emergency/">الطوارئ</a></div></nav>`;

export const NEW_MOBILE_NAV = `<nav aria-label="التنقل الرئيسي للموبايل"><form class="m-search" role="search" action="/search/" method="get"><input type="search" name="q" placeholder="ابحث في الدليل…" aria-label="ابحث في الدليل" required><button type="submit">⌕</button></form><details class="m-group"><summary>المدينة</summary><div><a href="/about/">عن المدينة</a><a href="/districts/">الأحياء والمناطق</a><a href="/map/">الخريطة</a><a href="/transport/">المواصلات والوصول</a><a href="/nearby-cities/">المدن القريبة</a><a href="/compare/">مقارنة المدن</a></div></details><details class="m-group"><summary>السكن والأسعار</summary><div><a href="/prices/">أسعار العقارات</a><a href="/price-report-q3-2026/">تقرير الأسعار Q3 2026</a><a href="/buying-guide/">دليل الشراء</a><a href="/rent/">الإيجار</a><a href="/developers/">دليل المطورين</a><a href="/developers-directory/">دليل كل شركات التطوير</a><a href="/investment/">الاستثمار العقاري</a><a href="/mistakes/">أخطاء شائعة</a></div></details><details class="m-group"><summary>الخدمات</summary><div><a href="/directory/">دليل الخدمات</a><a href="/education-guide/">التعليم والمدارس</a><a href="/health-guide/">الصحة والمستشفيات</a><a href="/shopping/">التسوق والأسواق</a><a href="/jobs-obour/">الوظائف</a><a href="/government-services/">خدمات حكومية</a></div></details><details class="m-group"><summary>المجتمع</summary><div><a href="/ask/">اسأل وأجب — مجتمع العبور</a><a href="/news/">أخبار المدينة</a><a href="/updates/">تحديثات الدليل</a><a href="/tracker/">متابعة العبور الجديدة</a><a href="/faq/">الأسئلة الشائعة</a></div></details><a class="m-solo" href="/emergency/">الطوارئ</a></nav>`;

const DESKTOP_RE = /<nav class="desktop-nav"[\s\S]*?<\/nav>/i;
const MOBILE_RE = /<nav aria-label="التنقل الرئيسي للموبايل"[\s\S]*?<\/nav>/i;

function updatePhase2Template() {
  const p = path.join(root, "scripts", "seo-phase2-nav.mjs");
  let s = fs.readFileSync(p, "utf8");
  if (s.includes("اسأل وأجب")) return "already new";
  s = s.replace(/const DESKTOP_NAV = `[\s\S]*?`;/, `const DESKTOP_NAV = \`${NEW_DESKTOP_NAV}\`;`);
  s = s.replace(/const MOBILE_NAV = `[\s\S]*?`;/, `const MOBILE_NAV = \`${NEW_MOBILE_NAV}\`;`);
  fs.writeFileSync(p, s, "utf8");
  return "phase2 template updated";
}

function main() {
  let updated = 0, skipped = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (e.name !== "index.html") continue;
      let html = fs.readFileSync(full, "utf8");
      if (html.includes("اسأل وأجب — مجتمع العبور")) { skipped++; continue; }
      if (!DESKTOP_RE.test(html)) continue;
      html = html.replace(DESKTOP_RE, NEW_DESKTOP_NAV);
      if (MOBILE_RE.test(html)) html = html.replace(MOBILE_RE, NEW_MOBILE_NAV);
      fs.writeFileSync(full, html, "utf8");
      updated++;
    }
  };
  walk(clientDir);
  console.log(`Phase 31 nav redesign: ${updated} pages restyled, ${skipped} already new`);
  console.log("[template]", updatePhase2Template());
}

main();
