/**
 * seo-phase-DAILY-20260907.mjs
 * المهمة اليومية (2026-09-07): 5 مقالات عربية جديدة.
 *
 * الصفحات (تدوير الفئات: صحة / تعليم / عقارات / معيشة / تسوق):
 *   1) medical-supplies-obour — محلات المستلزمات الطبية (قائمة موثقة: clinics.json «مستلزمات طبية»)
 *   2) academies-obour        — الأكاديميات ومراكز التدريب المتخصصة (قائمة موثقة: nurseries.json «أكاديميات ومراكز تدريب متخصصة»)
 *   3) negotiate-price-obour  — كيف تفاوض على سعر العقار — نثري إرشادي
 *   4) work-from-home-obour   — العمل من المنزل في العبور — نثري معيشي
 *   5) baby-products-obour    — مستلزمات الأطفال الرضع — نثري شرائي
 *
 * القواعد: idempotent، لا حقائق مخترعة (نطاقات + تنبيه تحقق + «غير منشور»)،
 * نمط loadChrome/buildHead من about-us كما في seo-phase24-ar-wave2-20260828.mjs،
 * JSON-LD: WebPage + FAQPage + BreadcrumbList + Organization، عربي lang=rtl،
 * عنوان <60 حرفًا، وصف 150-160 حرفًا (يُفحص ويُسجَّل في التقرير)، FAQ ≥3،
 * روابط داخلية لمسارات حقيقية، وبطاقة تصحيح /corrections/ في القالب.
 *
 * البنية: هذا الملف منسّق فقط — البنية المشتركة في daily-20260907/lib.mjs،
 * وتسجيل الصفحات في daily-20260907/content-*.mjs (نفس قالب الموجات اليومية).
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
} from "./daily-20260907/lib.mjs";
import { LISTICLES } from "./daily-20260907/content-listicles.mjs";
import "./daily-20260907/content-negotiate.mjs";
import "./daily-20260907/content-wfh.mjs";
import "./daily-20260907/content-baby.mjs";

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
    ["clinics", "/medical-supplies-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/medical-supplies-obour/">محلات المستلزمات الطبية في العبور — الأسماء والعناوين الموثقة</a>.</p></section>`],
    ["education-guide", "/academies-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/academies-obour/">الأكاديميات ومراكز التدريب المتخصصة في العبور</a>.</p></section>`],
    ["buying-guide", "/negotiate-price-obour/", `<section class="wrap"><p>دليل جديد: <a href="/negotiate-price-obour/">كيف تفاوض على سعر العقار في العبور</a>.</p></section>`],
    ["living-guide", "/work-from-home-obour/", `<section class="wrap"><p>دليل جديد: <a href="/work-from-home-obour/">العمل من المنزل في العبور — تجهيزات وحلول</a>.</p></section>`],
    ["shopping-guide", "/baby-products-obour/", `<section class="wrap"><p>دليل جديد: <a href="/baby-products-obour/">مستلزمات الأطفال الرضع في العبور — دليل الشراء</a>.</p></section>`],
  ];
  for (const [hub, href, block] of links) {
    injectHubLink(hub, href, block);
  }

  console.log(`Daily wave ${TODAY} done: ${PAGES.length} pages`);
  console.log(report.join("\n"));
}

main();
