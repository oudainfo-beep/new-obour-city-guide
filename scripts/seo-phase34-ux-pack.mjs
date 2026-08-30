/**
 * المرحلة 34 — حزمة تحسينات تجربة الاستخدام (UX Pack)
 * تحقن رابط /static/ux-pack.css في <head> وسكربت /static/ux-pack.js قبل </body>
 * في كل صفحات client/**\/index.html، ببصمة محتوى (?v=md5) لكسر الكاش —
 * نفس نمط add-css-cachebust. السكربت idempotent: لا يكرر الحقن.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "client");

const ver = (file) =>
  crypto
    .createHash("md5")
    .update(fs.readFileSync(path.join(client, "public", "static", file)))
    .digest("hex")
    .slice(0, 8);

const cssTag = `<link rel="stylesheet" href="/static/ux-pack.css?v=${ver("ux-pack.css")}">`;
const jsTag = `<script src="/static/ux-pack.js?v=${ver("ux-pack.js")}" defer></script>`;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "src" || e.name === "public") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.name === "index.html") yield full;
  }
}

let patched = 0, skipped = 0;
for (const file of walk(client)) {
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("/static/ux-pack.css")) { skipped++; continue; }

  // حقن CSS بعد رابط site.css مباشرة، وإلا قبل </head>
  if (s.includes('href="/static/site.css')) {
    s = s.replace(/<link rel="stylesheet" href="\/static\/site\.css[^"]*">/, (m) => m + cssTag);
  } else if (s.includes("</head>")) {
    s = s.replace("</head>", cssTag + "</head>");
  } else { skipped++; continue; }

  // حقن JS بعد سكربت ui.js مباشرة، وإلا قبل </body>
  if (s.includes('src="/static/ui.js')) {
    s = s.replace(/<script src="\/static\/ui\.js[^"]*" defer><\/script>/, (m) => m + jsTag);
  } else if (s.includes("</body>")) {
    s = s.replace("</body>", jsTag + "</body>");
  }

  fs.writeFileSync(file, s);
  patched++;
}

console.log(`UX Pack: حُقنت الإضافات في ${patched} صفحة (تُخطّي ${skipped} صفحة محقونة مسبقًا).`);
