/**
 * seo-phase30-community.mjs
 * المرحلة 30 — مجتمع الأسئلة والأجوبة.
 *
 *  - ينشئ /ask/: لوحة المجتمع (أحدث الأسئلة + موضوعات + شرح المشاركة).
 *  - يضيف صندوق «أسئلة وأجوبة المجتمع» أسفل كل صفحة دليل (data-topic = slug الصفحة).
 *  - يضيف qa.css/qa.js للصفحات. كل الحقن idempotent.
 *  - الواجهة تعمل بلا خادم برسالة لطيفة؛ وتعمل فعليًا عند تشغيل server (راجع docs/DEPLOY-QA.md).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-08-28";
const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const QA_CSS = '<link rel="stylesheet" href="/static/qa.css">';
const QA_JS = '<script src="/static/qa.js" defer></script>';

function loadChrome() {
  const donorPath = path.join(clientDir, "about-us", "index.html");
  const donor = fs.readFileSync(donorPath, "utf8");
  const head = donor.match(/<head>[\s\S]*?<\/head>/)[0];
  const header = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
  const footer = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];
  return { head, header, footer };
}

function buildAskPage(chrome) {
  const url = `${SITE}/ask/`;
  const title = "مجتمع أسئلة العبور: اسأل وأجب عن أي موضوع | دليل العبور";
  const description = "مجتمع دليل العبور للأسئلة والأجوبة: اسأل عن أي موضوع في المدينة — سكن ومدارس وخدمات ومواصلات — وأهالي العبور يجيبونك. القراءة متاحة للجميع.";
  const h1 = "مجتمع أسئلة وأجوبة العبور";
  const schemas = [
    { "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
      name: "دليل العبور والعبور الجديدة", url: SITE + "/", logo: SITE + "/brand/logo.png",
      foundingDate: "2026", publishingPrinciples: SITE + "/editorial-policy/" },
    { "@context": "https://schema.org", "@type": "CollectionPage", name: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY, publisher: { "@id": SITE + "/#org" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "المجتمع", item: url } ] },
  ];
  let head = chrome.head;
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  head = head.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  head = head.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  head = head.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  head = head.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);

  const topics = [
    ["prices", "الأسعار والعقارات"], ["districts", "الأحياء"], ["transport", "المواصلات"],
    ["schools", "المدارس"], ["hospitals", "الصحة"], ["restaurants", "المطاعم"],
    ["jobs-obour", "الوظائف"], ["moving-to-obour", "الانتقال للمدينة"], ["living-guide", "الحياة اليومية"],
  ];
  const chips = topics.map(([s, t]) => `<a class="button button-light" href="/${s}/" style="margin:.25rem">${t}</a>`).join("");

  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ مجتمع المدينة</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>
<h2>كيف يعمل المجتمع؟</h2>
<ul>
<li><strong>اسأل من أي صفحة</strong> — كل دليل على الموقع ينتهي بصندوق «أسئلة وأجوبة المجتمع»: سؤالك يظهر في موضوعه الصحيح تلقائيًا، مثل أسئلة خرائط جوجل.</li>
<li><strong>أجب وصوّت</strong> — الإجابات الأفضل تصعد بالتصويت ▲ كما في Reddit وQuora.</li>
<li><strong>القراءة للجميع</strong> — تصفح بلا تسجيل؛ المشاركة بحساب بسيط (اسم وبريد) لضمان الجودة.</li>
<li><strong>الإشراف قائم</strong> — إدارة الدليل تراجع وتحذف المخالف؛ وللمحتوى الموثق تبقى <a href="/corrections/">صفحة التصحيح</a> هي القناة.</li>
</ul>
<h2>اسأل في موضوع</h2>
<p>اختر الصفحة الأقرب لسؤالك واسأل من صندوقها — هكذا يجد سؤالك خبراء الموضوع:</p>
<p>${chips}</p>
<h2>أحدث الأسئلة في المجتمع</h2>
<div class="qa-box" id="qa-board" data-topic=""><div class="qa-board-latest qa-list"></div></div>
</article><aside class="action-card"><p>جاهز للمشاركة؟</p><a class="button" href="#qa-board">تصفح الأسئلة ↖</a><a class="text-link" href="/news/">أخبار المدينة ↖</a></aside></div></section></main>`;
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">المجتمع</span></li></ol></div></nav>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

function injectWidget() {
  let added = 0, skipped = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (e.name !== "index.html") continue;
      const slug = path.relative(clientDir, path.dirname(full)).split(path.sep).join("/");
      if (["ask", "search", "404", "offline", ""].includes(slug)) continue;
      let html = fs.readFileSync(full, "utf8");
      if (!html.includes("</article>")) continue; // صفحات الدلائل فقط
      if (html.includes('class="qa-box"')) { skipped++; continue; }
      const box = `<div class="qa-box" data-topic="${slug}"></div>`;
      html = html.replace("</article>", box + "</article>");
      if (!html.includes("/static/qa.css")) html = html.replace("</head>", QA_CSS + "</head>");
      if (!html.includes("/static/qa.js")) html = html.replace("</body>", QA_JS + "</body>");
      fs.writeFileSync(full, html, "utf8");
      added++;
    }
  };
  walk(clientDir);
  rep("OK", `qa widget injected into ${added} pages (${skipped} already had it)`);
}

function addNavLink() {
  const anchor = '<div class="nav-item"><a href="/news/">الأخبار</a></div>';
  const add = anchor + '<div class="nav-item"><a href="/ask/">المجتمع</a></div>';
  const walk = (dir) => {
    let n = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { n += walk(full); continue; }
      if (e.name !== "index.html") continue;
      let html = fs.readFileSync(full, "utf8");
      if (html.includes('href="/ask/"') || !html.includes(anchor)) continue;
      html = html.replace(anchor, add);
      fs.writeFileSync(full, html, "utf8");
      n++;
    }
    return n;
  };
  rep("OK", `nav /ask/ added to ${walk(clientDir)} pages`);
}

function main() {
  const chrome = loadChrome();
  const outDir = path.join(clientDir, "ask");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), buildAskPage(chrome), "utf8");
  rep("OK", "wrote /ask/");
  injectWidget();
  addNavLink();
  console.log("Phase 30 community done");
  console.log(report.join("\n"));
}

main();
