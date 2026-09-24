/**
 * seo-phase74-badge.mjs
 * =====================
 * صفحة /badge/ — شارة «مُدرج في دليل العبور» لأصحاب المنشآت المُدرجة.
 *
 * لماذا؟ الدليل يُدرج مئات المنشآت في العبور والعبور الجديدة. الشارة (مع كود تضمين يربط
 * بصفحة المنشأة في الدليل) تمنح كل منشأة سببًا طبيعيًا لوضع رابط إلى الدليل على موقعها
 * أو صفحتها — روابط محلية حقيقية لا يملكها أي منافس. الصفحة تشرح الشروط وكود التضمين.
 *
 * الأصول: /brand/badge-listed.svg (للمواقع) و /brand/badge-listed.png (720×192 لفيسبوك/واتساب).
 * الهيكل (head/header/footer) يُستعار من /about-us/ كما تفعل phase30 — لذلك تعمل هذه المرحلة
 * آخر السلسلة بعد phase73. idempotent: تعيد كتابة /badge/ في كل بناء وتضيفها إلى sitemap.xml.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const SITE = "https://obourguide.com";
const PUBLISHED = "2026-09-25";
const TODAY = new Date().toISOString().slice(0, 10);

function loadChrome() {
  const donor = fs.readFileSync(path.join(clientDir, "about-us", "index.html"), "utf8");
  const head = donor.match(/<head>[\s\S]*?<\/head>/)[0];
  const header = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
  const footer = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];
  return { head, header, footer };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildPage(chrome) {
  const url = `${SITE}/badge/`;
  const title = "شارة «مُدرج في دليل العبور» لأصحاب المنشآت | دليل العبور";
  const description = "منشأتك مُدرجة في دليل العبور والعبور الجديدة؟ ضع شارة «مُدرج في دليل العبور» على موقعك أو صفحتك مع رابط صفحة منشأتك في الدليل — مجانًا وبلا شروط خفية.";
  const h1 = "شارة «مُدرج في دليل العبور»";
  const snippet =
    `<a href="${SITE}/اسم-الصفحة/" title="مُدرج في دليل العبور والعبور الجديدة">` +
    `<img src="${SITE}/brand/badge-listed.svg" alt="مُدرج في دليل العبور والعبور الجديدة" width="180" height="48" loading="lazy"></a>`;
  const schemas = [
    { "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
      name: "دليل العبور والعبور الجديدة", url: SITE + "/", logo: SITE + "/brand/logo.png",
      foundingDate: "2026", publishingPrinciples: SITE + "/editorial-policy/" },
    { "@context": "https://schema.org", "@type": "WebPage", name: h1, url, description,
      inLanguage: "ar-EG", datePublished: PUBLISHED, dateModified: TODAY, publisher: { "@id": SITE + "/#org" },
      primaryImageOfPage: { "@type": "ImageObject", url: SITE + "/brand/badge-listed.png", width: 720, height: 192 } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "الشارة", item: url } ] },
  ];
  let head = chrome.head;
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  head = head.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">');
  head = head.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  head = head.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  head = head.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  head = head.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  head = head.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${SITE}/brand/badge-listed.png">`);
  head = head.replace(/<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="720">');
  head = head.replace(/<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="192">');
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  head = head.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);

  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ لأصحاب المنشآت</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>
<h2>ما هي الشارة؟</h2>
<p>علامة صغيرة تضعها المنشأة المُدرجة في الدليل على موقعها الإلكتروني أو صفحتها على فيسبوك وإنستغرام، تقول لزبائنها: «نحن مُدرجون في دليل العبور والعبور الجديدة» — وتربطهم مباشرة بصفحة المنشأة في الدليل حيث العنوان والمواعيد وأرقام التواصل.</p>
<p style="text-align:center;margin:1.4rem 0"><img src="/brand/badge-listed.svg" alt="مُدرج في دليل العبور والعبور الجديدة" width="360" height="96" style="max-width:100%;height:auto;border-radius:18px"></p>
<h2>كود التضمين لموقعك</h2>
<p>انسخ الكود التالي إلى موقعك (في التذييل أو صفحة «من نحن»)، واستبدل <code>اسم-الصفحة</code> برابط صفحة منشأتك في الدليل — تجده في شريط العنوان عند فتح صفحتك على obourguide.com:</p>
<pre style="direction:ltr;text-align:left;white-space:pre-wrap;word-break:break-all;background:#0f172a;color:#e2e8f0;padding:1rem 1.2rem;border-radius:12px;font-size:.88rem"><code>${esc(snippet)}</code></pre>
<p>الشارة بصيغة SVG تظهر حادّة على كل الشاشات. للصفحات التي لا تقبل HTML (فيسبوك، واتساب للأعمال، إنستغرام) استخدم <a href="/brand/badge-listed.png" download>نسخة PNG (720×192)</a> وضع رابط صفحتك في الدليل في وصف المنشور أو في «الموقع الإلكتروني».</p>
<h2>الشروط — ثلاثة فقط</h2>
<ul>
<li><strong>للمنشآت المُدرجة فعلًا.</strong> الشارة لمن له صفحة في الدليل. غير مُدرج بعد؟ <a href="/contact/">اطلب الإدراج</a> — مجانًا، والقرار بمعايير الدليل المنشورة لا بمقابل.</li>
<li><strong>الرابط إلى صفحتك في الدليل.</strong> لا إلى الصفحة الرئيسية ولا إلى صفحة منشأة أخرى.</li>
<li><strong>لا تعديل على الشارة.</strong> لا تغيير في الألوان أو النص أو التناسب؛ يمكن تصغيرها فقط.</li>
</ul>
<p>الشارة ليست تقييمًا ولا توصية — هي إعلان إدراج فقط. التقييمات (إن وُجدت لفئة منشأتك) تبقى بمعايير <a href="/methodology/">منهجية التقييم</a> المنشورة، ولا تتأثر بوضع الشارة أو عدمه.</p>
<h2>لماذا تضعها؟</h2>
<ul>
<li>زبائنك يجدون عنوانك ومواعيدك وأرقامك في مكان محايد ومُحدَّث.</li>
<li>صفحتك في الدليل تظهر في بحث جوجل ومحركات الإجابات عند السؤال عن خدمتك في العبور.</li>
<li>أي تصحيح لبياناتك يصلنا عبر <a href="/corrections/">سجل التصحيحات</a> ويُنشر مع توثيقه.</li>
</ul>
</article><aside class="action-card"><p>منشأتك غير مُدرجة بعد؟</p><a class="button" href="/contact/">اطلب الإدراج مجانًا ↖</a><a class="text-link" href="/directory/">تصفح دليل الخدمات ↖</a></aside></div></section></main>`;
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">الشارة</span></li></ol></div></nav>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

function addToSitemap() {
  const file = path.join(publicDir, "sitemap.xml");
  if (!fs.existsSync(file)) return "sitemap missing — skipped";
  const xml = fs.readFileSync(file, "utf8");
  if (xml.includes(`<loc>${SITE}/badge/</loc>`)) return "sitemap: /badge/ already listed";
  const entry = `  <url><loc>${SITE}/badge/</loc><lastmod>${TODAY}</lastmod></url>\n`;
  fs.writeFileSync(file, xml.replace("</urlset>", entry + "</urlset>"), "utf8");
  return "sitemap: /badge/ added";
}

function main() {
  for (const asset of ["badge-listed.svg", "badge-listed.png"]) {
    if (!fs.existsSync(path.join(publicDir, "brand", asset))) { console.error(`phase74: missing client/public/brand/${asset}`); process.exit(1); }
  }
  const chrome = loadChrome();
  const outDir = path.join(clientDir, "badge");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), buildPage(chrome), "utf8");
  console.log(`phase74 (badge): wrote /badge/ — ${addToSitemap()}`);
}

main();
