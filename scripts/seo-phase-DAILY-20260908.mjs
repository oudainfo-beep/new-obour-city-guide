/**
 * seo-phase-DAILY-20260908.mjs
 * المهمة اليومية (2026-09-08): 5 مقالات عربية جديدة.
 *
 * الصفحات (تدوير الفئات: طعام / خدمات صناعية / تسوق / خدمات مهنية / مواصلات):
 *   1) fast-food-obour            — مطاعم الوجبات السريعة (قائمة موثقة: restaurants.json «وجبات سريعة»)
 *   2) fire-safety-obour          — أنظمة الإطفاء ومكافحة الحريق (قائمة موثقة: government-services.json «إطفاء وحريق»)
 *   3) hardware-stores-obour      — محلات العدد والأدوات (قائمة موثقة: shopping.json «عدد وأدوات بناء»)
 *   4) advertising-agencies-obour — مكاتب الإعلان والدعاية (قائمة موثقة: professional-services.json «إعلان»)
 *   5) travel-buses-obour         — أتوبيسات السفر من العبور للمحافظات — نثري إرشادي
 *
 * القواعد: idempotent، لا حقائق مخترعة (نطاقات + تنبيه تحقق + «غير منشور»)،
 * نمط loadChrome/buildHead من about-us كما في seo-phase24-ar-wave2-20260828.mjs،
 * JSON-LD: WebPage + FAQPage + BreadcrumbList + Organization، عربي lang=rtl،
 * عنوان <60 حرفًا، وصف 150-160 حرفًا (يُفحص ويُسجَّل في التقرير)، FAQ ≥3،
 * روابط داخلية لمسارات حقيقية، وبطاقة تصحيح /corrections/ في القالب.
 *
 * البنية: هذا الملف منسّق فقط — البنية المشتركة في daily-20260908/lib.mjs،
 * وتسجيل الصفحات في daily-20260908/content-*.mjs (نفس قالب الموجات اليومية).
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
} from "./daily-20260908/lib.mjs";
import { LISTICLES } from "./daily-20260908/content-listicles.mjs";
import "./daily-20260908/content-buses.mjs";

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
    ["restaurants", "/fast-food-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/fast-food-obour/">مطاعم الوجبات السريعة في العبور — الأسماء والعناوين الموثقة</a>.</p></section>`],
    ["industrial-zone", "/fire-safety-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/fire-safety-obour/">شركات أنظمة الإطفاء ومكافحة الحريق في العبور</a>.</p></section>`],
    ["shopping", "/hardware-stores-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/hardware-stores-obour/">محلات العدد والأدوات في العبور</a>.</p></section>`],
    ["professional-services", "/advertising-agencies-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/advertising-agencies-obour/">مكاتب الإعلان والدعاية في العبور</a>.</p></section>`],
    ["transport", "/travel-buses-obour/", `<section class="wrap"><p>دليل جديد: <a href="/travel-buses-obour/">أتوبيسات السفر من العبور للمحافظات</a>.</p></section>`],
  ];
  for (const [hub, href, block] of links) {
    injectHubLink(hub, href, block);
  }

  console.log(`Daily wave ${TODAY} done: ${PAGES.length} pages`);
  console.log(report.join("\n"));
}

main();
