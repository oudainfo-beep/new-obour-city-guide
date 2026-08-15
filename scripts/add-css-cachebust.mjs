/**
 * ملفات CSS تُقدَّم بكاش 4 ساعات بينما HTML بلا كاش، فيحدث أن يرى الزائر
 * صفحة جديدة بأنماط قديمة (ظهر فعليًا: القوائم المنسدلة مفتوحة كلها في كروم).
 * الحل: بصمة محتوى في رابط الملف، فأي تعديل ينتج رابطًا جديدًا يتخطى الكاش.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("cssVer")) throw new Error("بصمة الكاش مضافة بالفعل.");

// 1) استيراد crypto وحساب البصمة
const importAnchor = 'import path from "node:path";';
if (!s.includes(importAnchor)) throw new Error("لم يتم العثور على استيراد path.");
s = s.replace(importAnchor, `${importAnchor}\nimport crypto from "node:crypto";`);

const rootAnchor = 'const client = path.join(root, "client");';
if (!s.includes(rootAnchor)) throw new Error("لم يتم العثور على تعريف client.");
s = s.replace(rootAnchor, `${rootAnchor}
const cssVer = (file) => {
  const full = path.join(root, "client", "public", "static", file);
  return crypto.createHash("md5").update(fs.readFileSync(full)).digest("hex").slice(0, 8);
};
const siteCssVer = cssVer("site.css");
const schoolsCssVer = cssVer("schools-directory.css");`);

// 2) روابط الأنماط ببصمة
const linkFrom = '<link rel="stylesheet" href="/static/site.css"><link rel="stylesheet" href="/static/schools-directory.css">';
const linkTo = '<link rel="stylesheet" href="/static/site.css?v=${siteCssVer}"><link rel="stylesheet" href="/static/schools-directory.css?v=${schoolsCssVer}">';
if (!s.includes(linkFrom)) throw new Error("لم يتم العثور على روابط الأنماط.");
s = s.replace(linkFrom, linkTo);

fs.writeFileSync(p, s);
console.log("تمت إضافة بصمة المحتوى لروابط CSS.");
