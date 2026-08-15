import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("schoolsFullList")) throw new Error("قائمة المدارس الكاملة مضافة بالفعل.");

// دالة تبني قسم القائمة الكاملة من بيانات الإكسل
const helper = `const schoolsFullList = () => {
  const d = dirBySlug["schools-all"];
  return \`<section class="cream section"><div class="wrap"><p class="eyebrow">\${d.items.length} مدرسة · مراجعة أغسطس 2026</p><h2>كل مدارس مدينة العبور — القائمة الكاملة</h2><p class="wide-copy">القائمة أعلاه هي المدارس التي تحققنا من موقعها ونوعها ولها صفحات تفصيلية. أما هذه فقائمة أوسع لكل ما هو مُدرج في الأدلة التعليمية والتجارية لمدينة العبور: حكومي وخاص ودولي ولغات وأزهري. الاسم والنوع والعنوان كما وردت في المصدر، بلا ترتيب ولا تقييم.</p>\${dirGroups(d)}</div></section>\`;
};

`;

const anchor = "const investPage = ";
if (!s.includes(anchor)) throw new Error("لم يتم العثور على investPage.");
s = s.replace(anchor, helper + anchor);

// إدراج القسم داخل صفحة المدارس قبل قسم «كيف تستخدم الدليل»
const marker = '<section class="cream section"><div class="wrap content-grid"><article><h2>كيف تستخدم الدليل دون الوقوع في خطأ الموقع؟</h2>';
if (!s.includes(marker)) throw new Error("لم يتم العثور على قسم «كيف تستخدم الدليل».");
s = s.replace(marker, "${schoolsFullList()}" + marker);

fs.writeFileSync(p, s);
console.log("تمت إضافة القائمة الكاملة للمدارس داخل صفحة المدارس.");
