/**
 * إزالة ذكر الناشر بناءً على طلب المالك.
 * وبما أن الإفصاح يُزال، تُزال معه ادعاءات «الاستقلال» و«الحياد» —
 * فالسكوت عن الملكية شيء، وادعاء الاستقلال مع إخفائها شيء آخر تمامًا.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

const OUDA = "https://ouda-developments.com/";

// 1) شريط الفوتر
const footFrom = `<span>معلوماتي · قابل للمراجعة · يصدر عن <a class="footer-pub" href="/about/#publisher">عوده للتطوير العقاري</a></span>`;
const footTo = "<span>معلوماتي · قابل للمراجعة · مصادر منشورة</span>";
if (!s.includes(footFrom)) throw new Error("لم يتم العثور على شريط الفوتر.");
s = s.replace(footFrom, footTo);

// 2) فقرة الفوتر
const introFrom = `<p>هذا الدليل والتقييمات والمقارنات مبنية على معايير منشورة قابلة للتحقق، ونرحّب بأي تصحيح موثّق. يصدر الدليل عن <a class="footer-pub" href="${OUDA}" target="_blank" rel="noopener">عوده للتطوير العقاري</a> — <a class="footer-pub" href="/about/#publisher">اقرأ الإفصاح كاملًا</a>.</p>`;
const introTo = "<p>هذا الدليل والتقييمات والمقارنات مبنية على معايير منشورة قابلة للتحقق، ونرحّب بأي تصحيح موثّق.</p>";
if (!s.includes(introFrom)) throw new Error("لم يتم العثور على فقرة الفوتر.");
s = s.replace(introFrom, introTo);

// 3) قسم «من ينشر هذا الدليل» في صفحة عن المدينة
const secStart = s.indexOf('</div></section><section class="cream section" id="publisher">');
const secEnd = s.indexOf('<div class="related"><a href="/transport/">', secStart);
if (secStart < 0 || secEnd < 0) throw new Error("لم يتم العثور على قسم الناشر.");
s = s.slice(0, secStart) + s.slice(secEnd);

// 4) صندوق الإفصاح فوق جدول المطورين
const boxStart = s.indexOf('<div class="disclosure">');
const boxEnd = s.indexOf('<p class="caption">الدرجة من 5 إرشادية', boxStart);
if (boxStart < 0 || boxEnd < 0) throw new Error("لم يتم العثور على صندوق الإفصاح.");
s = s.slice(0, boxStart) + s.slice(boxEnd);

// 5) إزالة ادعاءات الاستقلال والحياد — لا يجوز الاحتفاظ بها مع إخفاء الملكية
const claims = [
  ["مرجع عربي محايد للسكن والاستثمار في العبور الجديدة.",
   "دليل عربي للسكن والاستثمار في العبور الجديدة، مبني على مصادر منشورة قابلة للتحقق."],
  ["دليل معلوماتي مستقل عن مدينة العبور الجديدة.",
   "دليل معلوماتي عن مدينة العبور الجديدة."],
  ["دليل عربي مستقل عن مدينة العبور الجديدة: الأحياء والأسعار والمواصلات والمطورون وخطوات الشراء، مع مصادر ومعايير قابلة للتحقق.",
   "دليل عربي شامل عن مدينة العبور الجديدة: الأحياء والأسعار والمواصلات والمطورون وخطوات الشراء، مع مصادر ومعايير قابلة للتحقق."],
];
for (const [from, to] of claims) {
  if (!s.includes(from)) throw new Error(`لم يتم العثور على: ${from.slice(0, 40)}`);
  s = s.replace(from, to);
}

if (s.includes("ouda-developments.com")) {
  console.log("تنبيه: ما زال هناك رابط لموقع عوده في صفحة المطورين (كان موجودًا قبل اليوم).");
}

fs.writeFileSync(p, s);
console.log("تمت إزالة ذكر الناشر وادعاءات الاستقلال.");
