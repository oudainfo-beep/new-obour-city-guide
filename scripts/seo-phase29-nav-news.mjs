/**
 * seo-phase29-nav-news.mjs
 * المرحلة 29 — إضافة تبويب «الأخبار» لقائمة كل الصفحات القائمة.
 *
 * يمشي على كل client/**​/index.html ويضيف رابط /news/ بعد «الصحة»
 * في القائمتين (desktop وmobile). idempotent: يتخطى من لديه الرابط.
 * يعمل في نهاية سلسلة البناء فيلتقط حتى الصفحات التي أعيد توليدها.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const DESKTOP_ANCHOR = '<div class="nav-item"><a href="/health/">الصحة</a></div>';
const DESKTOP_ADD = `${DESKTOP_ANCHOR}<div class="nav-item"><a href="/news/">الأخبار</a></div>`;
const MOBILE_ANCHOR = '<a class="m-solo" href="/health/">الصحة</a>';
const MOBILE_ADD = `${MOBILE_ANCHOR}<a class="m-solo" href="/news/">الأخبار</a>`;

let updated = 0, skipped = 0, noNav = 0;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (e.name !== "index.html") continue;
    let html = fs.readFileSync(full, "utf8");
    if (html.includes('href="/news/"')) { skipped++; continue; }
    if (!html.includes(DESKTOP_ANCHOR)) { noNav++; continue; }
    html = html.replace(DESKTOP_ANCHOR, DESKTOP_ADD);
    if (html.includes(MOBILE_ANCHOR)) html = html.replace(MOBILE_ANCHOR, MOBILE_ADD);
    fs.writeFileSync(full, html, "utf8");
    updated++;
  }
}

walk(clientDir);
console.log(`Phase 29 nav-news done: ${updated} updated, ${skipped} already linked, ${noNav} without nav marker`);
