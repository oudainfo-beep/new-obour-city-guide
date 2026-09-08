/**
 * seo-phase60-footer-money-pages.mjs — رابطا المقالين المرجعيين في الفوتر.
 *
 * يضيف «أفضل شركة عقارية في كل مدينة» و«أقوى 20 شركة عقارات في مصر» إلى قسم
 * «مسارات الدليل» في فوتر كل الصفحات العربية — بعد «دليل المطورين» مباشرة.
 * رابطان فقط: الفوتر لا يُحشى. (الأخبار ودليل شركات التطوير موجودان في المنيو أصلًا.)
 *
 * idempotent: الفحص داخل منطقة <footer> فقط — لا يتأثر بروابط الجسم —
 * ومن لا يملك الرابطين يحصل عليهما، ومن يملكهما يُترك.
 * يعمل آخر سلسلة المراحل فيغطي كل ما تولّد قبله.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const AFTER = '<a href="/developers/">دليل المطورين</a>';
const LINKS = [
  '<a href="/best-developer-by-city/">أفضل شركة في كل مدينة</a>',
  '<a href="/top-20-developers-egypt/">أقوى 20 شركة عقارات</a>',
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["public", "node_modules", "en"].includes(e.name)) continue; // الإنجليزية لها فوتر مترجم
      yield* walk(p);
    } else if (e.name === "index.html") yield p;
  }
}

let added = 0, have = 0, noAnchor = 0;
for (const file of walk(clientDir)) {
  const html = fs.readFileSync(file, "utf8");
  const fStart = html.indexOf("<footer");
  const fEnd = html.indexOf("</footer>");
  if (fStart < 0 || fEnd < 0) continue;
  const footer = html.slice(fStart, fEnd);
  if (LINKS.every((l) => footer.includes(l))) { have++; continue; }
  if (!footer.includes(AFTER)) { noAnchor++; continue; }
  const missing = LINKS.filter((l) => !footer.includes(l));
  const newFooter = footer.replace(AFTER, AFTER + missing.join(""));
  fs.writeFileSync(file, html.slice(0, fStart) + newFooter + html.slice(fEnd), "utf8");
  added++;
}

console.log(`[phase60] footer: أُضيف رابطا المقالين المرجعيين إلى ${added} صفحة (موجودان مسبقًا: ${have}، بلا مرساة: ${noAnchor})`);
