/**
 * seo-phase41-developers-directory.mjs
 * المرحلة 41 — دليل شركات التطوير الكامل: صفحة هبوط لكل مطور.
 *
 * البيانات: ملفات تعريف منشورة على newaqar.net (مشاريع، مدن، وحدات، سداد).
 * القاعدة التحريرية: إعادة صياغة كاملة من الوقائع — لا نسخ نصوص أبدًا.
 *   الحقائق (أسماء مشاريع، مدن، سنوات) ملك للجميع؛ الصياغة لنا وحدنا.
 * الهاتف المشترك في المصدر هو خط مبيعات المنصة — لا يُنشر كهاتف مطور.
 * idempotent: يعاد توليده كل build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data", "directories");
const SITE = "https://obourguide.com";
const TODAY = "2026-08-28";
const DEVS = JSON.parse(fs.readFileSync(path.join(root, "data", "raw", "developers-source.json"), "utf8"));

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

function loadChrome() {
  const donorPath = path.join(clientDir, "about-us", "index.html");
  const donor = fs.readFileSync(donorPath, "utf8");
  const head = donor.match(/<head>[\s\S]*?<\/head>/)[0];
  const header = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
  const footer = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];
  return { head, header, footer };
}
function orgNode() {
  return { "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
    name: "دليل العبور والعبور الجديدة", url: SITE + "/", logo: SITE + "/brand/logo.png",
    foundingDate: "2026", publishingPrinciples: SITE + "/editorial-policy/" };
}
function buildHead(head, { title, description, url, schemas }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}
function faqSchema(qs) {
  return { "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: qs.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) };
}
function faqHtml(qs) {
  return `<div class="faq-block">${qs.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("")}</div>`;
}
function writePage(relDir, html) {
  const outDir = path.join(clientDir, relDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
}
function slugify(name, url) {
  const m = url.match(/\/developer\/([a-z0-9-]+)/);
  if (m) return m[1];
  return name.replace(/[^\w؀-ۿ]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

// إعادة صياغة وصف المطور من الوقائع — صياغة أصلية دائمًا
function paraphraseDesc(d) {
  const name = d.name;
  const facts = [];
  if (d.n_projects) facts.push(`${d.n_projects} مشروع${d.n_projects > 1 ? "ًا" : ""} منشورًا`);
  if (d.n_cities) facts.push(`حضور في ${d.n_cities} ${d.n_cities > 1 ? "مدن" : "مدينة"}`);
  if (d.n_units) facts.push(`${d.n_units} وحدة معلنة`);
  const focus = d.projects.length ? d.projects[0].loc.split(",")[1]?.trim() || "" : "";
  const variants = [
    `${name} ضمن شركات التطوير العاملة في السوق المصرية، بسجل منشور يضم ${facts.join(" و") || "مشروعات معلنة"}. تُتابع صفحاتها ما تنشره الشركة من مشروعات وأنظمة سداد — وتُقرأ بالتحقق المعتاد: سجل التسليم الفعلي قبل كل شيء.`,
    `تنشط ${name} في التطوير العقاري المصري${focus ? ` بمشروعات منها ما يقع في ${focus}` : ""}. ${facts.length ? "الأرقام المنشورة عنها: " + facts.join("، ") + "." : ""} التقييم الجاد لأي مطور يبدأ من مشاريعه المُسلّمة لا المُعلنة.`,
    `من الشركات المدرجة في أدلة التطوير المصرية: ${name}. ${facts.join("، ") || "بياناتها تُتابع من مصادرها المنشورة"}. القاعدة معها كما مع غيرها — الوثائق والتسليمات السابقة قبل أي حجز.`,
    `${name} تعمل في قطاع التطوير بمصر${focus ? `، وبين مشروعاتها المنشورة مواقع في ${focus}` : ""}. ${facts.join("، ") || "سجلها يُتابع من المنشور"}. قراءتها كأي مطور: بمنهجية المعايير الخمسة لا بالدعاية.`,
  ];
  return variants[d.name.length % variants.length];
}

const EVAL_TIPS = [
  ["اسأل عن مشروع مُسلَّم فعلًا وزره بنفسك", "سجل التسليم يتفوق على سنوات الخبرة المعلنة"],
  ["اطلب صورة تخصيص الأرض والترخيص كتابة", "الوثائق قبل الدعاية — دائمًا"],
  ["بند التأخير في العقد بتعويض واضح", "«2028 تقريبًا» ليست تاريخًا"],
  ["قارن نظام السداد بإجمالي لا بقسط", "المقدم الصغير قد يخفي سعرًا مضخمًا"],
  ["تحقق من الجهة المالكة فعليًا", "اسم المشروع قد يختلف عن الكيان القانوني"],
  ["اسأل سكان مشروع سابق لهم", "إجابة السكان أصدق مؤشر متاح"],
];

function buildDevPage(chrome, d) {
  const slug = "dev-" + slugify(d.name, d.url);
  const url = `${SITE}/developers-directory/${slug}/`;
  const name = d.name;
  const title = `${name.slice(0, 42)}: المشاريع وأنظمة السداد | دليل العبور`;
  const statsLine = [
    d.n_projects ? `${d.n_projects} مشروع` : "",
    d.n_cities ? `${d.n_cities} مدينة` : "",
    d.n_units ? `${d.n_units} وحدة` : "",
  ].filter(Boolean).join(" · ");
  const description = `${name}: ${statsLine || "ملف مطور"} — مشاريعها المنشورة وأنظمة سدادها وتقييمها بمعايير التحقق الخمسة. مصدر البيانات: أدلة منشورة قابلة للفحص.`;

  const intro = paraphraseDesc(d);
  const stats = `
<div class="table-wrap"><table><thead><tr><th>المؤشر</th><th>القيمة المنشورة</th></tr></thead><tbody>
${d.n_projects ? `<tr><td>عدد المشاريع</td><td><strong>${d.n_projects}</strong></td></tr>` : ""}
${d.n_units ? `<tr><td>الوحدات المعلنة</td><td>${d.n_units}</td></tr>` : ""}
${d.n_cities ? `<tr><td>المدن</td><td>${d.n_cities}</td></tr>` : ""}
${d.cities.length ? `<tr><td>مناطق العمل</td><td>${d.cities.join("، ")}</td></tr>` : ""}
</tbody></table></div>`;

  const projTable = d.projects.length ? `
<h2>مشاريع ${name} المنشورة</h2>
<div class="table-wrap"><table><thead><tr><th>المشروع</th><th>الموقع</th><th>الاستلام</th></tr></thead><tbody>
${d.projects.map((p) => `<tr><td><strong>${p.name}</strong></td><td>${p.loc}</td><td>${p.year}</td></tr>`).join("")}
</tbody></table></div>
${d.pay.length ? `<p>أنظمة السداد المعلنة في المصدر: مقدم من ${d.pay[0][0]}% وتقسيط حتى ${d.pay[0][1]}${d.pay[0][2] ? `، وأسعار تبدأ من ${d.pay[0][2]}` : ""}. تحقق من الأسعار الحالية من قنوات الشركة الرسمية — الأسعار تتغير مع مراحل البيع.</p>` : ""}` : "";

  const tips = EVAL_TIPS[name.length % EVAL_TIPS.length];
  const faq = [
    { q: `ما مشاريع ${name}؟`, a: d.projects.length ? `من مشاريعها المنشورة: ${d.projects.map((p) => p.name).join("، ")}${d.cities.length ? ` — في ${d.cities.join(" و")}` : ""}. تحقق من حالة كل مشروع ومرحلته الفعلية من قنوات الشركة الرسمية قبل أي قرار.` : `الأرقام المنشورة عنها: ${statsLine || "سجل متابعة"}. تُتابع مشاريعها من مصادرها الرسمية — ويُنصح بالتحقق من التسليمات السابقة قبل أي التزام.` },
    { q: `هل ${name} شركة موثوقة؟`, a: `الثقة تُبنى بالوثائق لا بالسمعة: مشروع مُسلَّم يمكن زيارته، وتخصيص أرض وترخيص مكتوبان، وبند تأخير بتعويض واضح في العقد. طبّق معايير التحقق الخمسة من دليل المطورين على موقعنا قبل أي دفعة — هذه القاعدة لكل مطور بلا استثناء.` },
    { q: `كيف أتواصل مع ${name}؟`, a: "عبر قنواتها الرسمية المنشورة (موقعها أو صفحاتها الموثقة). لا تعتمد على أرقام متداولة في منصات الوسطاء — اطلب الرقم الرسمي من موقع الشركة نفسها وتحقق من الكيان القانوني قبل أي تحويل." },
  ];

  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: name, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY, publisher: { "@id": SITE + "/#org" },
      author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: { "@type": "Organization", name } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "دليل المطورين", item: SITE + "/developers-directory/" },
      { "@type": "ListItem", position: 3, name, item: url } ] },
    faqSchema(faq),
  ];
  let head = buildHead(chrome.head, { title, description, url, schemas });

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ملف مطور</span><h1>${name}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>
<p>${intro}</p>
<p class="caption">مصدر البيانات: أدلة عقارية منشورة (منها newaqar.net) — الحقائق تُنسب لمصادرها، والصياغة والتحليل لدليل العبور. تحقق من الأرقام الحالية من قنوات الشركة قبل أي قرار.</p>
${stats}
${projTable}
<h2>كيف تقيّم ${name} قبل التعامل؟</h2>
<ul>
<li><strong>${tips[0]}</strong></li>
<li><strong>${tips[1]}</strong></li>
<li>قارنها بالبدائل في <a href="/developers/">دليل المطورين</a> و<a href="/best-compounds-obour/">كمبوندات العبور</a></li>
</ul>
<h2>أسئلة شائعة</h2>${faqHtml(faq)}
</article><aside class="action-card"><p>صحّح أو حدّث بيانات هذا الملف</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a><a class="text-link" href="/developers-directory/">كل المطورين ↖</a></aside></div></section></main>`;
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/developers-directory/">دليل المطورين</a></li><li class="sep">›</li><li><span aria-current="page">${name}</span></li></ol></div></nav>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`;
}

function buildHub(chrome) {
  const url = `${SITE}/developers-directory/`;
  const title = `دليل شركات التطوير العقاري: ${DEVS.length} مطورًا بالمشاريع والسداد | دليل العبور`;
  const description = `دليل شامل لشركات التطوير العقاري العاملة في مصر: ${DEVS.length} شركة بمشاريعها المنشورة وأنظمة سدادها ومناطق عملها — بيانات من مصادر منشورة مع منهجية التحقق الخمسة.`;
  const rows = DEVS.map((d) => {
    const slug = "dev-" + slugify(d.name, d.url);
    return `<tr><td><a href="/developers-directory/${slug}/"><strong>${d.name}</strong></a></td><td>${d.n_projects || "—"}</td><td>${d.cities.join("، ") || "—"}</td><td>${d.projects.map((p) => p.name).slice(0, 2).join("، ") || "—"}</td></tr>`;
  }).join("");
  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "CollectionPage", name: "دليل شركات التطوير", url, description, inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY, publisher: { "@id": SITE + "/#org" } },
    { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: DEVS.length,
      itemListElement: DEVS.slice(0, 50).map((d, i) => ({ "@type": "ListItem", position: i + 1, name: d.name })) },
  ];
  let head = buildHead(chrome.head, { title, description, url, schemas });
  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ دليل شامل</span><h1>دليل شركات التطوير العقاري</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>
<p>هذا الدليل يجمع ${DEVS.length} شركة تطوير عاملة في السوق المصرية — بمشاريعها المنشورة ومناطق عملها وأنظمة سدادها المعلنة. البيانات من مصادر منشورة قابلة للفحص، والتقييم يتم بـ<a href="/methodology/">منهجية المعايير الخمسة</a>: التسليم الفعلي قبل كل شيء.</p>
<p>لكل شركة صفحة هبوط مستقلة بتفاصيلها. لقرارات الشراء في العبور تحديدًا راجع <a href="/developers/">مقارنة مطوري العبور</a> و<a href="/price-report-q3-2026/">تقرير الأسعار</a>.</p>
<div class="table-wrap"><table><thead><tr><th>الشركة</th><th>مشاريع</th><th>المناطق</th><th>أبرز المشاريع</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="caption">القائمة من مصادر منشورة وتُحدَّث دوريًا. لتصحيح أو إضافة شركة: <a href="/corrections/">صفحة التصحيح</a>.</p>
</article><aside class="action-card"><p>تقييم مطور بعينه؟</p><a class="button" href="/developers/">معايير التحقق الخمسة ↖</a><a class="text-link" href="/ask/">اسأل المجتمع ↖</a></aside></div></section></main>`;
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><span aria-current="page">دليل المطورين</span></li></ol></div></nav>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`;
}

function main() {
  const chrome = loadChrome();
  // data file
  fs.mkdirSync(dataDir, { recursive: true });
  const items = DEVS.map((d) => ({
    n: d.name,
    c: "شركات تطوير عقاري",
    a: d.cities.join("، ") || "مصر",
    t: "",
    e: "المصدر: أدلة عقارية منشورة",
    p: d.n_projects || 0,
    projs: d.projects.map((p) => p.name),
  }));
  fs.writeFileSync(path.join(dataDir, "developers-all.json"), JSON.stringify({ items }, null, 1));
  rep("OK", `data file: ${items.length} developers`);

  // hub
  writePage("developers-directory", buildHub(chrome));
  rep("OK", "hub page written");

  // landing pages
  let n = 0;
  for (const d of DEVS) {
    writePage(path.join("developers-directory", "dev-" + slugify(d.name, d.url)), buildDevPage(chrome, d));
    n++;
  }
  rep("OK", `${n} developer landing pages`);
  console.log("Phase 41 developers directory done");
  console.log(report.join("\n"));
}

main();
