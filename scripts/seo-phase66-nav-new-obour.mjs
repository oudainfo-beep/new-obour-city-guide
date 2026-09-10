/**
 * seo-phase66-nav-new-obour.mjs — رابط «أحياء العبور الجديدة» في المنيو.
 *
 * يضيف رابط /new-obour-districts/ إلى قائمة «السكن والأسعار» (ديسكتوب وموبايل)
 * في كل الصفحات العربية — بوابة اكتشاف لصفحات الحي 24 والحي 25 وسلسلة الأحياء.
 * idempotent: الفحص داخل منطقة <header> فقط.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const ANCHOR = '<a href="/mistakes/">أخطاء شائعة</a></div></div>';
const ADD = '<a href="/mistakes/">أخطاء شائعة</a><a href="/new-obour-districts/">أحياء العبور الجديدة</a></div></div>';
const MOBILE_ANCHOR = '<a href="/mistakes/">أخطاء شائعة</a></div></details>';
const MOBILE_ADD = '<a href="/mistakes/">أخطاء شائعة</a><a href="/new-obour-districts/">أحياء العبور الجديدة</a></div></details>';

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["public", "node_modules", "en"].includes(e.name)) continue;
      yield* walk(p);
    } else if (e.name === "index.html") yield p;
  }
}

let added = 0, have = 0, noAnchor = 0;
for (const file of walk(clientDir)) {
  const html = fs.readFileSync(file, "utf8");
  const hStart = html.indexOf("<header");
  const hEnd = html.indexOf("</header>");
  if (hStart < 0 || hEnd < 0) continue;
  const header = html.slice(hStart, hEnd);
  if (header.includes('href="/new-obour-districts/"')) { have++; continue; }
  let out = header;
  let touched = false;
  if (out.includes(ANCHOR)) { out = out.replaceAll(ANCHOR, ADD); touched = true; }
  if (out.includes(MOBILE_ANCHOR)) { out = out.replaceAll(MOBILE_ANCHOR, MOBILE_ADD); touched = true; }
  if (!touched) { noAnchor++; continue; }
  fs.writeFileSync(file, html.slice(0, hStart) + out + html.slice(hEnd), "utf8");
  added++;
}

console.log(`[phase66] nav: «أحياء العبور الجديدة» أُضيفت إلى ${added} صفحة (موجودة: ${have}، بلا مرساة: ${noAnchor})`);
