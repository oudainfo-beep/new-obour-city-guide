/**
 * seo-phase73-qa-offline.mjs
 * ==========================
 * مجتمع الأسئلة (qa.js) بلا خادم على Cloudflare Pages — تنظيف ما كان يطلق 404 على كل صفحة.
 *
 * ماذا يفعل (idempotent — يعمل في نهاية السلسلة على الناتج النهائي):
 *  - يحوّل وسم /static/qa.js إلى نسخة مُرقّمة (?v=md5) لأن /static/* مخزَّن سنة immutable؛
 *    بدون رقم جديد يبقى المتصفح وGooglebot على النسخة القديمة التي تستدعي /api/qa.
 *  - يحذف qa.js وqa.css من الصفحات التي لا تحوي صندوق qa-box ولا لوحة qa-board
 *    (497 صفحة كانت تحمّل السكربت وتطلق /api/qa/me بلا أي صندوق).
 *
 * التفعيل الفعلي للمجتمع لاحقًا: docs/DEPLOY-QA.md (data-qa-api="on").
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const qaJsPath = path.join(clientDir, "public", "static", "qa.js");
const ver = crypto.createHash("md5").update(fs.readFileSync(qaJsPath)).digest("hex").slice(0, 8);

const JS_RE = /<script src="\/static\/qa\.js(?:\?v=[a-z0-9]+)?" defer><\/script>/g;
const CSS_RE = /<link rel="stylesheet" href="\/static\/qa\.css(?:\?v=[a-z0-9]+)?">/g;
const JS_TAG = `<script src="/static/qa.js?v=${ver}" defer></script>`;

let versioned = 0, stripped = 0, untouched = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (e.name !== "index.html") continue;
    const html = fs.readFileSync(full, "utf8");
    if (!html.includes("/static/qa.")) continue;
    const usesQa = html.includes('class="qa-box"') || html.includes('id="qa-board"');
    const out = usesQa ? html.replace(JS_RE, JS_TAG) : html.replace(JS_RE, "").replace(CSS_RE, "");
    if (out === html) { untouched++; continue; }
    fs.writeFileSync(full, out, "utf8");
    if (usesQa) versioned++; else stripped++;
  }
};
walk(clientDir);
console.log(`phase73 (qa offline): qa.js?v=${ver} — versioned ${versioned} | stripped from ${stripped} pages without qa-box | untouched ${untouched}`);
