/**
 * seo-phase-DAILY-20261104.mjs
 * موجة 2026-11-04: 5 مقالات عربية جديدة بتدوير الفئات (عقارات، صحة، طعام، تعليم، خدمات)
 * — لا تكرار لأي slug أو كلمة أساسية مستخدمة، والتحقق من client/ هو المرجع.
 *
 *   1) hotel-apartments-obour     الشقق الفندقية في العبور (عقارات/سكن)
 *   2) ophthalmologists-obour     أطباء العيون في العبور (صحة)
 *   3) ice-cream-obour            محلات الآيس كريم في العبور (طعام)
 *   4) american-diploma-obour     الدبلومة الأمريكية في العبور (تعليم)
 *   5) engineering-offices-obour  مكاتب هندسية في العبور (خدمات)
 *
 * القواعد كما في الموجات اليومية (نمط seo-phase24-ar-wave2-20260828.mjs):
 * loadChrome/buildHead من about-us، JSON-LD: Article+FAQPage+BreadcrumbList+Organization،
 * عنوان <60 ووصف 150-160، FAQ ≥3، 500-900 كلمة، جداول من data/directories فقط
 * (لا كيانات مخترعة، «غير منشور» للحقول الناقصة)، نطاقات + ملاحظات تحقق بدل الأرقام
 * المخترعة، بطاقة /corrections/، idempotent.
 */
import { PAGES, TODAY, loadChrome, writePage, report } from "./daily-20261104/lib.mjs";
import "./daily-20261104/content-a.mjs";
import "./daily-20261104/content-b.mjs";
import "./daily-20261104/content-c.mjs";

const chrome = loadChrome();
for (const { relDir, builder } of PAGES) writePage(relDir, builder(chrome));

console.log(`Daily wave ${TODAY} done: ${PAGES.length} pages`);
console.log(report.join("\n"));
