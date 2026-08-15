/**
 * يضيف بحثًا داخليًا بلا خادم + صفحة طوارئ مستقلة.
 * قوالب الصفحتين تُقرأ من ملفات نصية بجوار هذا السكربت حتى لا تتداخل
 * علامات ${...} مع تحليل جافاسكربت.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("searchPage")) throw new Error("مضاف بالفعل.");

const emergencyTpl = fs.readFileSync(path.join(here, "tpl-emergency.txt"), "utf8");
const searchTpl = fs.readFileSync(path.join(here, "tpl-search.txt"), "utf8");

// 1) الهيدر: نموذج بحث بدل زر CTA (النموذج يعمل بدون JavaScript)
const oldCta = '<a class="top-cta" href="/developers/">سجل معايير المطورين ↖</a>';
const newCta = '<form class="site-search" role="search" action="/search/" method="get"><input type="search" name="q" placeholder="ابحث في الدليل…" aria-label="ابحث في الدليل" required><button type="submit" aria-label="بحث">⌕</button></form>';
if (!s.includes(oldCta)) throw new Error("لم يتم العثور على زر الهيدر.");
s = s.replace(oldCta, newCta);

// 2) التنقل: إضافة الطوارئ
const navFrom = '["/health/", "الصحة"],';
if (!s.includes(navFrom)) throw new Error("لم يتم العثور على مدخل الصحة في التنقل.");
s = s.replace(navFrom, '["/health/", "الصحة"], ["/emergency/", "الطوارئ"],');

// 3) صفحة البحث لا تُفهرس
const robotsFrom = '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">';
if (!s.includes(robotsFrom)) throw new Error("لم يتم العثور على وسم robots.");
s = s.replace(robotsFrom, '<meta name="robots" content="${slug === "search" ? "noindex,follow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"}">');

// 4) حقن القالبين
const anchor = "const investPage = ";
if (!s.includes(anchor)) throw new Error("لم يتم العثور على investPage.");
s = s.replace(anchor, `${emergencyTpl}\n${searchTpl}\n${anchor}`);

// 5) تسجيل الصفحتين
const entries = `  ["emergency", "الطوارئ", "أرقام وخدمات الطوارئ في مدينة العبور: الإسعاف والمطافئ والشرطة والكهرباء والمياه والغاز بأزرار اتصال مباشرة.", "طوارئ العبور, اسعاف العبور, ارقام طوارئ العبور, صيدلية ليلية العبور", { "@context":"https://schema.org", "@type":"ItemList", name:"أرقام الطوارئ في العبور", itemListElement: emergency.map((x,i)=>({"@type":"ListItem",position:i+1,name:x[0],description:x[1]})) }, emergencyPage],
  ["search", "البحث", "ابحث في صفحات دليل العبور وفي أدلة المدارس والصيدليات والمطاعم.", "بحث دليل العبور", { "@context":"https://schema.org", "@type":"WebPage", name:"البحث" }, searchPage],
`;
const faqAnchor = `  ["faq", "الأسئلة الشائعة",`;
if (!s.includes(faqAnchor)) throw new Error("لم يتم العثور على مدخل الأسئلة.");
s = s.replace(faqAnchor, entries + faqAnchor);

// 6) استثناء /search/ من خريطة الموقع
const smFrom = "[...pages.map(([slug])=>slug), ...realSchools.map(sc=>`schools/${sc.slug}`)]";
const smTo = '[...pages.map(([slug])=>slug).filter((slug)=>slug !== "search"), ...realSchools.map(sc=>`schools/${sc.slug}`)]';
if (!s.includes(smFrom)) throw new Error("لم يتم العثور على مولد خريطة الموقع.");
s = s.replace(smFrom, smTo);

// 7) توليد فهرس البحث
const idxCode = fs.readFileSync(path.join(here, "tpl-index.txt"), "utf8");
const logAnchor = "console.log(`Rendered ${pages.length} main pages";
s = s.replace(logAnchor, idxCode + "\n" + logAnchor);

fs.writeFileSync(p, s);
console.log("تمت إضافة البحث الداخلي وصفحة الطوارئ.");
