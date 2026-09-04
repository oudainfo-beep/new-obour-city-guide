/**
 * seo-phase50-hreflang-fix.mjs
 * المرحلة 50 — إصلاح hreflang المتبادل: الصفحات العربية تفتقد روابط /en/.
 *
 * القاعدة الصحيحة: كل صفحة عربية لها نسخة إنجليزية يجب أن تحمل:
 *   <link rel="alternate" hreflang="ar" href="AR_URL">
 *   <link rel="alternate" hreflang="en" href="EN_URL">
 *   <link rel="alternate" hreflang="x-default" href="AR_URL">
 * idempotent: يتخطى من لديه hreflang بالفعل.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}

function main() {
  const arPages = walk(clientDir).filter((f) => !f.includes(`${path.sep}en${path.sep}`));
  let fixed = 0, skipped = 0, noEn = 0;

  for (const arPath of arPages) {
    const rel = path.relative(clientDir, path.dirname(arPath)).split(path.sep).join("/");
    if (!rel || rel === "." || rel === "404" || rel === "search" || rel === "offline") continue;
    const enPath = path.join(clientDir, "en", rel, "index.html");
    if (!fs.existsSync(enPath)) { noEn++; continue; }

    let html = fs.readFileSync(arPath, "utf8");
    if (html.includes('hreflang="en"')) { skipped++; continue; }

    const arUrl = `${SITE}/${rel}/`;
    const enUrl = `${SITE}/en/${rel}/`;
    const links = `<link rel="alternate" hreflang="ar" href="${arUrl}"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="x-default" href="${arUrl}">`;
    html = html.replace("</head>", links + "</head>");
    fs.writeFileSync(arPath, html, "utf8");
    fixed++;
  }

  console.log(`Phase 50 hreflang fix: ${fixed} AR pages got reciprocal links, ${skipped} already had, ${noEn} have no EN counterpart`);
}

main();
