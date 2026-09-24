/**
 * seo-phase73-qa-offline.mjs
 * ==========================
 * مفتاح مجتمع الأسئلة (qa) في البناء — يعمل آخر السلسلة على الناتج النهائي (idempotent).
 *
 * الوضع الافتراضي (QA_API غير مضبوط = المجتمع غير مُشغَّل على Cloudflare Pages):
 *  - يحذف صندوق «أسئلة وأجوبة المجتمع» الفارغ (<div class="qa-box">) من كل الصفحات —
 *    كان يعرض «المجتمع يبدأ قريبًا» في ~280 صفحة، إشارة جودة سلبية للزائر ولمحركات البحث.
 *  - يحذف qa.js وqa.css من كل الصفحات (كانت تطلق /api/qa → 404 على كل صفحة).
 *  - يحذف رابط «اسأل وأجب — مجتمع العبور» من قائمة «المجتمع» في التنقل (سطح المكتب والموبايل).
 *  - /ask/: إشعار واضح «المجتمع قيد التجهيز» + noindex,follow + إزالته من sitemap.xml.
 *
 * QA_API=on (بعد نشر خادم /api/qa — راجع docs/DEPLOY-QA.md):
 *  - يبقي الصناديق والروابط والفهرسة، يُرقّم وسم qa.js (?v=md5) لأن /static/* مخزَّن سنة
 *    immutable، ويضيف data-qa-api="on" إلى <html> حتى يعمل qa.js فعليًا.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const QA_ON = process.env.QA_API === "on";

const qaJsPath = path.join(publicDir, "static", "qa.js");
const ver = crypto.createHash("md5").update(fs.readFileSync(qaJsPath)).digest("hex").slice(0, 8);

const JS_RE = /<script src="\/static\/qa\.js(?:\?v=[a-z0-9]+)?" defer><\/script>/g;
const CSS_RE = /<link rel="stylesheet" href="\/static\/qa\.css(?:\?v=[a-z0-9]+)?">/g;
const BOX_RE = /<div class="qa-box"[^>]*><\/div>/g;
const NAV_ASK_RE = /<a href="\/ask\/">اسأل وأجب — مجتمع العبور<\/a>/g;
const JS_TAG = `<script src="/static/qa.js?v=${ver}" defer></script>`;

const ASK_NOTICE_ID = "qa-offline-notice";
const ASK_NOTICE =
  `<div id="${ASK_NOTICE_ID}" class="notice" style="margin:1.2rem 0;padding:1rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc">` +
  `<strong>المجتمع قيد التجهيز.</strong> سيُفتح باب الأسئلة والإجابات هنا قريبًا. حتى ذلك الحين: ` +
  `<a href="/faq/">الأسئلة الشائعة</a> تجيب عن أكثر ما يُسأل، و<a href="/corrections/">سجل التصحيحات</a> هو قناة أي ملاحظة موثقة.` +
  `</div>`;
const NOINDEX = '<meta name="robots" content="noindex,follow">';
const ROBOTS_RE = /<meta name="robots" content="[^"]*">/;
// لوحة /ask/: العنوان يُخفى وهي معطّلة (اللوحة نفسها تبقى في الصفحة لأن phase30 لا يعيد إنشاء /ask/ إن وُجدت)
const BOARD_H2 = "<h2>أحدث الأسئلة في المجتمع</h2>\n";
const BOARD_OPEN = '<div class="qa-box" id="qa-board"';

const stats = { boxes: 0, tags: 0, nav: 0, pages: 0 };

function processPage(full, html) {
  const isAsk = path.relative(clientDir, path.dirname(full)).split(path.sep).join("/") === "ask";
  let out = html;
  if (QA_ON) {
    out = out.replace(JS_RE, JS_TAG);
    if (!/<html [^>]*data-qa-api=/.test(out)) out = out.replace(/<html /, '<html data-qa-api="on" ');
    if (isAsk) {
      out = out.replace(new RegExp(`<div id="${ASK_NOTICE_ID}"[\\s\\S]*?<\\/div>`), "");
      out = out.replace(NOINDEX, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">');
      if (!out.includes(BOARD_H2) && out.includes(BOARD_OPEN)) out = out.replace(BOARD_OPEN, BOARD_H2 + BOARD_OPEN);
    }
  } else {
    out = out.replace(BOX_RE, () => { stats.boxes++; return ""; });
    out = out.replace(JS_RE, () => { stats.tags++; return ""; }).replace(CSS_RE, () => { stats.tags++; return ""; });
    out = out.replace(NAV_ASK_RE, () => { stats.nav++; return ""; });
    out = out.replace(/<html ([^>]*)\sdata-qa-api="on"/, "<html $1");
    if (isAsk) {
      if (!out.includes(ASK_NOTICE_ID)) out = out.replace(/(<main[^>]*>)/, `$1${ASK_NOTICE}`);
      out = out.replace(ROBOTS_RE, NOINDEX);
      out = out.replace(BOARD_H2 + BOARD_OPEN, BOARD_OPEN);
    }
  }
  return out;
}

const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (e.name !== "index.html") continue;
    const html = fs.readFileSync(full, "utf8");
    const out = processPage(full, html);
    if (out === html) continue;
    fs.writeFileSync(full, out, "utf8");
    stats.pages++;
  }
};
walk(clientDir);

// sitemap.xml: /ask/ يخرج من الخريطة وهو noindex، ويعود معها عند التشغيل (المراحل السابقة تعيد توليده)
const sitemapPath = path.join(publicDir, "sitemap.xml");
let sitemapNote = "";
if (!QA_ON && fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const cleaned = xml.replace(/<url><loc>https:\/\/obourguide\.com\/ask\/<\/loc>[^]*?<\/url>\n?/g, "");
  if (cleaned !== xml) { fs.writeFileSync(sitemapPath, cleaned, "utf8"); sitemapNote = " | /ask/ removed from sitemap"; }
}

console.log(
  QA_ON
    ? `phase73 (qa ON): qa.js?v=${ver} — ${stats.pages} pages updated (data-qa-api=on, versioned tag)`
    : `phase73 (qa OFF): ${stats.pages} pages touched — boxes removed ${stats.boxes}, qa tags removed ${stats.tags}, nav links removed ${stats.nav}${sitemapNote}`
);
