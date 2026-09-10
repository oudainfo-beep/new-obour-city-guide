/**
 * seo-phase-DAILY-20260910.mjs
 * المهمة اليومية (2026-09-10): 5 مقالات عربية جديدة.
 *
 * الصفحات (تدوير الفئات: تسوق وأغذية / خدمات مهنية / خدمات مالية / مواصلات / صحة):
 *   1) coffee-roasters-obour    — محامص العبور: بن طازج ومكسرات (قائمة موثقة: restaurants.json «محامص»)
 *   2) digital-marketing-obour  — شركات التسويق الرقمي (قائمة موثقة: professional-services.json «تسويق رقمي»)
 *   3) money-transfer-obour     — تحويل الأموال: ويسترن يونيون والبدائل (قائمة موثقة: banks.json «تحويل أموال»)
 *   4) charging-stations-obour  — شحن السيارات الكهربائية في العبور — نثري إرشادي
 *   5) doctor-visit-home-obour  — الكشف المنزلي في العبور — نثري إرشادي
 *
 * القواعد: idempotent، لا حقائق مخترعة (نطاقات + تنبيه تحقق + «غير منشور»)،
 * نمط loadChrome/buildHead من about-us كما في seo-phase24-ar-wave2-20260828.mjs،
 * JSON-LD: WebPage + FAQPage + BreadcrumbList + Organization، عربي lang=rtl،
 * عنوان <60 حرفًا، وصف 150-160 حرفًا (يُفحص ويُسجَّل في التقرير)، FAQ ≥3،
 * روابط داخلية لمسارات حقيقية، وبطاقة تصحيح /corrections/ في القالب.
 *
 * البنية: هذا الملف منسّق فقط — البنية المشتركة في daily-20260910/lib.mjs،
 * وتسجيل الصفحات في daily-20260910/content-*.mjs (نفس قالب الموجات اليومية).
 */
import {
  PAGES,
  TODAY,
  loadChrome,
  readData,
  dataTable,
  writePage,
  injectHubLink,
  rep,
  report,
} from "./daily-20260910/lib.mjs";
import { LISTICLES } from "./daily-20260910/content-listicles.mjs";
import "./daily-20260910/content-prose.mjs";

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();
  const listicleBySlug = new Map(LISTICLES.map((L) => [L.slug, L]));

  for (const { relDir, builder } of PAGES) {
    let html = builder(chrome);
    const L = listicleBySlug.get(relDir);
    if (L) {
      const data = readData(L.data);
      if (!data || !data.items) {
        rep("FAIL", `data ${L.data} not found`);
        continue;
      }
      const items = data.items.filter((it) => L.cats.includes(it.c));
      const note = `إجمالي المنشور في هذا التصنيف: <strong>${items.length}</strong> مدخلًا من الدليل الموثق${items.length > 30 ? " — يعرض الجدول أول 30" : ""}.`;
      html = html.replace(`<div data-listicle="${L.slug}"></div>`, `<h2>القائمة الموثقة</h2>` + dataTable(items, note));
    }
    writePage(relDir, html);
  }

  const links = [
    ["shopping", "/coffee-roasters-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/coffee-roasters-obour/">محامص العبور — أين تشتري البن الطازج والمكسرات بالأسماء والعناوين الموثقة</a>.</p></section>`],
    ["professional-services", "/digital-marketing-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/digital-marketing-obour/">شركات التسويق الرقمي في العبور — السوشيال والإعلانات الممولة والسيو</a>.</p></section>`],
    ["banks", "/money-transfer-obour/", `<section class="wrap"><p>دليل جديد: <a href="/money-transfer-obour/">تحويل الأموال في العبور — نقاط ويسترن يونيون الموثقة والبدائل البنكية</a>.</p></section>`],
    ["transport", "/charging-stations-obour/", `<section class="wrap"><p>دليل جديد: <a href="/charging-stations-obour/">شحن السيارات الكهربائية في العبور — الشحن العام والمنزلي والتكلفة</a>.</p></section>`],
    ["health", "/doctor-visit-home-obour/", `<section class="wrap"><p>دليل جديد: <a href="/doctor-visit-home-obour/">الكشف المنزلي في العبور — متى تطلب دكتورًا للبيت وكيف تحجز وتتحقق</a>.</p></section>`],
  ];
  for (const [hub, href, block] of links) {
    injectHubLink(hub, href, block);
  }

  console.log(`Daily wave ${TODAY} done: ${PAGES.length} pages`);
  console.log(report.join("\n"));
}

main();
