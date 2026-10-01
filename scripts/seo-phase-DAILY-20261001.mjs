/**
 * seo-phase-DAILY-20261001.mjs
 * المهمة اليومية (2026-10-01): 5 مقالات عربية جديدة.
 *
 * الصفحات (تدوير الفئات: تسوق وأغذية / تعليم / خدمات مهنية / عقارات وإجراءات / صحة):
 *   1) bakeries-obour              — مخابز وحلوانيات العبور (قائمة موثقة: restaurants.json «مخابز وحلويات»)
 *   2) igcse-schools-obour         — مدارس IGCSE والأقسام الدولية (قائمة موثقة: schools-all.json الأقسام الدولية)
 *   3) architects-obour            — مهندسون معماريون ومكاتب استشارات (قائمة موثقة: professional-services.json «معماريون»+«مهندسون»)
 *   4) building-violations-obour   — التصالح في مخالفات البناء — نثري إجرائي
 *   5) health-insurance-obour      — التأمين الصحي لسكان العبور — نثري إرشادي
 *
 * القواعد: idempotent، لا حقائق مخترعة (نطاقات + تنبيه تحقق + «غير منشور»)،
 * نمط loadChrome/buildHead من about-us كما في seo-phase24-ar-wave2-20260828.mjs،
 * JSON-LD: WebPage + FAQPage + BreadcrumbList + Organization، عربي lang=rtl،
 * عنوان <60 حرفًا، وصف 150-160 حرفًا (يُفحص ويُسجَّل في التقرير)، FAQ ≥3،
 * روابط داخلية لمسارات حقيقية، وبطاقة تصحيح /corrections/ في القالب.
 *
 * البنية: هذا الملف منسّق فقط — البنية المشتركة في daily-20261001/lib.mjs،
 * وتسجيل الصفحات في daily-20261001/content-*.mjs (نفس قالب الموجات اليومية).
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
} from "./daily-20261001/lib.mjs";
import { LISTICLES } from "./daily-20261001/content-listicles.mjs";
import "./daily-20261001/content-prose.mjs";

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
    ["dining-guide", "/bakeries-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/bakeries-obour/">مخابز وحلوانيات العبور — العيش الطازج والكنافة والتورت بالأسماء والعناوين الموثقة</a>.</p></section>`],
    ["education-guide", "/igcse-schools-obour/", `<section class="wrap"><p>دليل جديد: <a href="/igcse-schools-obour/">مدارس IGCSE والأقسام الدولية في العبور — القائمة الموثقة والمعادلة وأسئلة المقابلة</a>.</p></section>`],
    ["professional-services", "/architects-obour/", `<section class="wrap"><p>قائمة جديدة: <a href="/architects-obour/">مهندسون معماريون ومكاتب استشارات في العبور — للتراخيص والرسومات والتشطيب</a>.</p></section>`],
    ["procedures", "/building-violations-obour/", `<section class="wrap"><p>دليل جديد: <a href="/building-violations-obour/">التصالح في مخالفات البناء بالعبور — الخطوات والمستندات وحالات الرفض</a>.</p></section>`],
    ["health", "/health-insurance-obour/", `<section class="wrap"><p>دليل جديد: <a href="/health-insurance-obour/">التأمين الصحي في العبور — الشبكات والموافقات المسبقة ونصائح الشراء</a>.</p></section>`],
  ];
  for (const [hub, href, block] of links) {
    injectHubLink(hub, href, block);
  }

  console.log(`Daily wave ${TODAY} done: ${PAGES.length} pages`);
  console.log(report.join("\n"));
}

main();
