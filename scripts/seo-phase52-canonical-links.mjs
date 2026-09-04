/**
 * seo-phase52-canonical-links.mjs — لا روابط لإعادة توجيه.
 *
 * بعض مراحل التوليد ما زالت تحمل أدلّة slugs قديمة في خرائط الروابط
 * (health-guide → health، dining-guide → restaurants، shopping-guide → shopping).
 * هذه المرحلة تعمل آخر السلسلة قبل أرشفة البحث/IndexNow، وتعيد كتابة أي
 * href يشير لمسار مُعاد توجيهه إلى عنوانه النهائي — في كل صفحات الموقع.
 * idempotent: الصفحة تُعاد كتابتها كل build، ولا تغيّر شيئًا إن لم توجد روابط قديمة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

// slug قديم (301) → الوجهة النهائية
const REDIRECTS = {
  "health-guide": "health",
  "dining-guide": "restaurants",
  "shopping-guide": "shopping",
};

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      yield* walk(p);
    } else if (e.name === "index.html") yield p;
  }
}

let touched = 0;
let fixed = 0;
for (const file of walk(clientDir)) {
  let html = fs.readFileSync(file, "utf8");
  let out = html;
  for (const [from, to] of Object.entries(REDIRECTS)) {
    // روابط داخلية فقط: href="/health-guide/" أو href="https://obourguide.com/health-guide/…"
    out = out
      .replaceAll(`href="/${from}/"`, `href="/${to}/"`)
      .replaceAll(`href="https://obourguide.com/${from}/"`, `href="https://obourguide.com/${to}/"`);
  }
  if (out !== html) {
    const n = (html.match(/href="(?:https:\/\/obourguide\.com)?\/(?:health-guide|dining-guide|shopping-guide)\//g) || []).length;
    fs.writeFileSync(file, out);
    touched++;
    fixed += n;
  }
}

console.log(`[phase52] canonical links: ${fixed} redirect-hop hrefs fixed across ${touched} pages`);
