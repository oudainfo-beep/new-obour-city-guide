/**
 * seo-phase-DAILY-20261002.mjs
 * موجة 2026-10-02: 10 مقالات عقارية عربية مبنية على بحث كلمات Google Keyword Planner (مصر، عربي، 2 أكتوبر 2026)
 * — فجوات لا تغطيها صفحات الدليل الحالية (لا تكرار/تنافس مع /apartments-for-rent-obour/ أو /lands/ …).
 *
 *   1) new-obour-city-authority      جهاز مدينة العبور الجديدة (9,900/شهر)
 *   2) amal-area-new-obour           منطقة الأمل وتوفيق الأوضاع
 *   3) janna-obour                   جنة العبور: الكمبوند ومشروع جنة الحكومي (880/شهر)
 *   4) high-city-obour               كمبوند هاي سيتي العبور
 *   5) youth-housing-obour           مساكن الشباب (63/70/90/135 م)
 *   6) rent-from-owner-obour         الإيجار من المالك بدون وسيط
 *   7) budget-rent-obour             الإيجار بميزانية محدودة
 *   8) land-price-per-meter-obour    سعر متر الأرض
 *   9) authority-apartments-obour    شقق الجهاز: الطرح وإعادة البيع
 *  10) property-listings-safety-obour الأمان في إعلانات OLX/دوبيزل
 *
 * القواعد كما في الموجات اليومية: لا أرقام بلا مصدر منشور (قائمة «المصادر» داخل المقال)، idempotent.
 */
import { PAGES, TODAY, loadChrome, writePage, injectHubLink, report } from "./daily-20261002/lib.mjs";
import "./daily-20261002/content-a.mjs";
import "./daily-20261002/content-b.mjs";

const chrome = loadChrome();
for (const { relDir, builder } of PAGES) writePage(relDir, builder(chrome));

const L = (href, text) => `<section class="wrap"><p>دليل جديد: <a href="${href}">${text}</a>.</p></section>`;
const links = [
  ["obour-authority", "/new-obour-city-authority/", L("/new-obour-city-authority/", "تبحث عن جهاز مدينة العبور الجديدة؟ المقر على محور 30 يونيو والخدمات والفرق بين الجهازين")],
  ["procedures", "/new-obour-city-authority/", L("/new-obour-city-authority/", "جهاز مدينة العبور الجديدة — المقر والخدمات وقائمة التجهيز قبل الزيارة")],
  ["procedures", "/amal-area-new-obour/", L("/amal-area-new-obour/", "منطقة الأمل بالعبور الجديدة — توفيق الأوضاع وقرعات التخصيص")],
  ["new-obour-lands", "/amal-area-new-obour/", L("/amal-area-new-obour/", "منطقة الأمل وأراضي توفيق الأوضاع — ما المنشور وما تتحقق منه قبل الشراء")],
  ["compounds", "/janna-obour/", L("/janna-obour/", "جنة العبور — الفرق بين الكمبوند ومشروع جنة الحكومي")],
  ["district-8", "/janna-obour/", L("/janna-obour/", "جنة العبور — الكمبوند ومشروع جنة الحكومي")],
  ["compounds", "/high-city-obour/", L("/high-city-obour/", "كمبوند هاي سيتي العبور — البيانات المنشورة وأسئلة المعاينة")],
  ["best-compounds-obour", "/high-city-obour/", L("/high-city-obour/", "صفحة كمبوند هاي سيتي العبور — البيانات المنشورة وأسئلة الشراء")],
  ["developers/alsafwa", "/high-city-obour/", L("/high-city-obour/", "كمبوند هاي سيتي العبور — دليل المشروع")],
  ["social-housing-obour", "/youth-housing-obour/", L("/youth-housing-obour/", "مساكن الشباب في العبور — الشراء والإيجار والتنازل")],
  ["apartments-for-rent-obour", "/rent-from-owner-obour/", L("/rent-from-owner-obour/", "الإيجار من المالك مباشرة بدون وسيط — خطوات التحقق والعقد")],
  ["apartments-for-rent-obour", "/budget-rent-obour/", L("/budget-rent-obour/", "إيجار شقة بميزانية محدودة في العبور — أين تبحث وكيف تحسب")],
  ["rent", "/rent-from-owner-obour/", L("/rent-from-owner-obour/", "شقق للإيجار في العبور من المالك بدون وسيط")],
  ["rent", "/budget-rent-obour/", L("/budget-rent-obour/", "إيجار شقة رخيصة في العبور — دليل الميزانية")],
  ["lands", "/land-price-per-meter-obour/", L("/land-price-per-meter-obour/", "سعر متر الأرض في العبور والعبور الجديدة — كيف تعرفه بدقة")],
  ["new-obour-lands", "/land-price-per-meter-obour/", L("/land-price-per-meter-obour/", "سعر متر الأرض في العبور الجديدة — الطرح وإعادة البيع")],
  ["sakan-misr-obour", "/authority-apartments-obour/", L("/authority-apartments-obour/", "شقق الجهاز في العبور — الشراء من الطرح أو بالتنازل")],
  ["dar-misr-obour", "/authority-apartments-obour/", L("/authority-apartments-obour/", "شقق الجهاز في العبور — الشراء من الطرح أو بالتنازل")],
  ["new-obour-real-estate", "/authority-apartments-obour/", L("/authority-apartments-obour/", "شقق جهاز العبور والعبور الجديدة — من الطرح أو بالتنازل")],
  ["new-obour-real-estate", "/property-listings-safety-obour/", L("/property-listings-safety-obour/", "إعلانات الشقق على OLX ومواقع الإعلانات — دليل الأمان")],
  ["apartments-for-sale-obour", "/property-listings-safety-obour/", L("/property-listings-safety-obour/", "قبل الاتصال بإعلان شقة: دليل الأمان في إعلانات العقارات")],
  ["apartments-for-sale-obour", "/youth-housing-obour/", L("/youth-housing-obour/", "شقق الشباب للبيع في العبور — الأوراق قبل السعر")],
];
for (const [hub, href, block] of links) injectHubLink(hub, href, block);

console.log(`Daily wave ${TODAY} done: ${PAGES.length} pages`);
console.log(report.join("\n"));
