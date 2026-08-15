import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("navGroups")) throw new Error("التنقل الجديد مضاف بالفعل.");

// 1) حقن بناء القوائم بعد dirManifest مباشرة (يحتاجه)
const anchorAfter = 'const dirManifest = JSON.parse(fs.readFileSync(path.join(root, "data", "directories", "index.json"), "utf8"));';
if (!s.includes(anchorAfter)) throw new Error("لم يتم العثور على dirManifest.");
s = s.replace(anchorAfter, anchorAfter + "\n\n" + fs.readFileSync(path.join(here, "tpl-nav.txt"), "utf8"));

// 2) استبدال دالة الهيدر بالكامل
const start = s.indexOf("function header(active) {");
if (start < 0) throw new Error("لم يتم العثور على دالة الهيدر.");
const end = s.indexOf("\nfunction footer()", start);
if (end < 0) throw new Error("لم يتم العثور على نهاية دالة الهيدر.");

const newHeader = `function header(active) { return \`<header class="site-header"><div class="wrap header-row"><a class="brand" href="/"><img src="\${logo}" width="46" height="46" alt="رمز دليل مدينة العبور الجديدة"><span><b>دليل مدينة</b><em>العبور الجديدة</em><small>مرجع مدني · 2026</small></span></a><nav class="desktop-nav" aria-label="التنقل الرئيسي">\${navHtml(active)}</nav><form class="site-search" role="search" action="/search/" method="get"><input type="search" name="q" placeholder="ابحث…" aria-label="ابحث في الدليل" required><button type="submit" aria-label="بحث">⌕</button></form><details class="mobile-menu"><summary aria-label="فتح قائمة التنقل">☰</summary><nav aria-label="التنقل الرئيسي للموبايل"><form class="m-search" role="search" action="/search/" method="get"><input type="search" name="q" placeholder="ابحث في الدليل…" aria-label="ابحث في الدليل" required><button type="submit">⌕</button></form>\${mobileNavHtml(active)}</nav></details></div></header>\`; }`;

s = s.slice(0, start) + newHeader + s.slice(end);

// 3) الفوتر: روابط من المجموعات بدل nav القديمة
const footFrom = "${nav.slice(1, 6).map(([href,label])=>`<a href=\"${href}\">${label}</a>`).join(\"\")}";
if (s.includes(footFrom)) {
  s = s.replace(footFrom, '${[["/directory/","دليل الخدمات"],["/districts/","الأحياء"],["/prices/","الأسعار"],["/developers/","دليل المطورين"],["/emergency/","الطوارئ"],["/search/","بحث"]].map(([href,label])=>`<a href="${href}">${label}</a>`).join("")}');
}

fs.writeFileSync(p, s);
console.log("تمت إعادة بناء التنقل بقوائم منسدلة.");
