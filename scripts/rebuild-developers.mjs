/**
 * جدول المطورين: من اسم واحد + 3 فئات مجهولة، إلى 6 شركات بأسمائها
 * مُقيَّمة على نفس المعايير الخمسة ببيانات منشورة فقط، + قائمة «قيد الاستكمال».
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("developersPending")) throw new Error("الجدول الجديد مضاف بالفعل.");

// 1) استبدال مصفوفة المطورين
const start = s.indexOf("const developers = [");
const end = s.indexOf("\n];", start);
if (start < 0 || end < 0) throw new Error("لم يتم العثور على مصفوفة المطورين.");
s = s.slice(0, start) + fs.readFileSync(path.join(here, "tpl-developers.txt"), "utf8").trimEnd() + s.slice(end + 3);

// 2) المصدر صار HTML — يجب ألا يُهرَّب
// (لا حاجة لتعديل: القالب يستخدم ${d.source} داخل <small> مباشرة)

// 3) استبدال ملاحظة النتيجة القديمة
const noteStart = s.indexOf('<div class="note">ملاحظة على النتيجة:');
const noteEnd = s.indexOf("</div>", noteStart);
if (noteStart < 0 || noteEnd < 0) throw new Error("لم يتم العثور على ملاحظة النتيجة.");
const newNote = `<div class="note"><strong>اقرأ الجدول هكذا:</strong> الدرجة لا تقيس جودة الشركة، بل <em>حجم ما تنشره ويمكنك التحقق منه بنفسك</em>. شركة ممتازة لا تنشر بياناتها تحصل على درجة منخفضة هنا — وهذا مقصود، لأن ما لا يُنشر لا يمكن للمشتري الاعتماد عليه.<br><br>ولهذا لا تتصدر عوده كل المعايير: <strong>فاليرو تتفوق على الجميع في «إدارة ما بعد التسليم» (4.3 مقابل 2.4)</strong> لأنها الوحيدة التي تنشر اسم شركة الإدارة والتشغيل، و<strong>الملتقى الأعلى في الكثافة</strong> بنسبة بناء ومساحات خضراء معلنة، و<strong>الصفوة الأوضح في توثيق التسليم</strong> بعدد وحدات وتاريخ محدد. خمس شركات من الست — ومنها عوده — <strong>لا تنشر جهة إدارة مرافق باسمها ولا عقدًا نموذجيًا</strong>، وهي أكبر فجوة مشتركة في سوق العبور.</div>`;
s = s.slice(0, noteStart) + newNote + s.slice(noteEnd + 6);

// 4) قسم «قيد الاستكمال» بعد الجدول
const pendingAnchor = '<p class="caption">الدرجة من 5 إرشادية';
if (!s.includes(pendingAnchor)) throw new Error("لم يتم العثور على تعليق الجدول.");
const pendingHtml = `<h2 style="margin-top:2.4rem">مطورون آخرون في العبور والعبور الجديدة — قيد الاستكمال</h2><p>هؤلاء لهم مشروعات معلنة داخل المدينتين، لكن ما هو منشور عنهم لم يكفِ بعدُ لتطبيق المعايير الخمسة. ندرجهم بالاسم والمصدر لأن إخفاء اسم مطوّر قائم أسوأ من تقييمه ناقصًا — وأي شركة منهم ترسل بياناتها المنشورة تدخل الجدول الرئيسي.</p><div class="dir-list">\${developersPending.map(([name, projects, site]) => \`<article class="dir-item"><h4>\${site ? \`<a href="\${site}" target="_blank" rel="noopener">\${name}</a>\` : name}</h4><p class="dir-addr">\${projects}</p><small>\${site ? "موقع رسمي منشور" : "لا يوجد موقع رسمي ظاهر — المصدر مصادر صحفية ووسيطة"}</small></article>\`).join("")}</div>` + pendingAnchor;
s = s.replace(pendingAnchor, pendingHtml);

fs.writeFileSync(p, s);
console.log("تم بناء جدول المطورين الجديد.");
