/**
 * seo-phase59-top20-developers.mjs — مقال مرجعي: أقوى 20 شركة عقارات في مصر.
 *
 * ترتيب واحد شامل بكلمات موجزة لكل شركة + 3 إنفوجرافيكات (/public/infographics/) —
 * عودة للتطوير العقاري في المركز 14 وإبداع في 19 (بأرقامهما المنشورة).
 * سكيمات: Article (بصور) + ItemList بعشرين مركزًا + FAQPage + BreadcrumbList.
 * الصفحة تُعاد كتابتها كل build — idempotent بالكتابة الكاملة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-09-08";

function loadChrome() {
  const donor = fs.readFileSync(path.join(clientDir, "about-us", "index.html"), "utf8");
  return {
    head: donor.match(/<head>[\s\S]*?<\/head>/)[0],
    header: donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1],
    footer: donor.match(/<\/main>([\s\S]*?)<\/body>/)[1],
  };
}
function orgNode() {
  return { "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#org",
    name: "دليل العبور والعبور الجديدة", url: SITE + "/", logo: SITE + "/brand/logo.png",
    foundingDate: "2026", publishingPrinciples: SITE + "/editorial-policy/" };
}
function buildHead(head, { title, description, url, schemas, ogImage }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  if (ogImage) {
    h = h.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${ogImage}">`);
    h = h.replace(/<meta property="og:image:width" content="[^"]*">/, `<meta property="og:image:width" content="1080">`);
    h = h.replace(/<meta property="og:image:height" content="[^"]*">/, `<meta property="og:image:height" content="1620">`);
  }
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

/* الشركات العشرون — blurb قصير موثق لكل شركة (كلمتين لا أكثر) */
const COMPANIES = [
  { rank: 1, name: "طلعت مصطفى القابضة (TMG)", projects: "مدينتي · الرحاب · نور",
    cities: "شرق القاهرة والعاصمة",
    blurb: "أكبر محفظة مشاريع في مصر وأكثرها مبيعات — صانعة المدن المتكاملة: من الرحاب إلى مدينتي إلى «نور» في العاصمة الجديدة. عندما يقول السوق «الكبير» فهو يقصد طلعت مصطفى." },
  { rank: 2, name: "سوديك SODIC", projects: "بيفرلي هيلز · أليجريا · سوديك إيست",
    cities: "زايد · الشروق · التجمع",
    blurb: "أكثر من عشرين عامًا من التسليمات الموثقة، من بيفرلي هيلز الذي صنع اسمها في زايد إلى أليجريا وسوديك إيست في الشروق — ومقرها الرئيسي نفسه في الشيخ زايد." },
  { rank: 3, name: "إعمار مصر", projects: "ميفيدا · أب تاون · مراسي",
    cities: "التجمع · المقطم · الساحل",
    blurb: "الذراع المصرية لعملاق برج خليفة. مشروعها ميفيدا (نحو 890 فدانًا بين شارعي التسعين) يُقاس عليه كل مشروع جديد في التجمع الخامس — ومراسي غيّرت خريطة الساحل." },
  { rank: 4, name: "بالم هيلز للتعمير", projects: "بادية · بالم هيلز أكتوبر · نيو كايرو",
    cities: "أكتوبر · التجمع · الساحل",
    blurb: "محفظة تغطي غرب القاهرة وشرقها وساحلها: بادية وذا كراون وبالم هيلز أكتوبر غربًا، وبالما هيلز نيو كايرو (500 فدان بتصميم SWA الأمريكية) شرقًا." },
  { rank: 5, name: "ماونتن فيو", projects: "iCity أكتوبر · iCity التجمع",
    cities: "أكتوبر · التجمع · الساحل",
    blurb: "بنت سمعتها على الالتزام بمواعيد التسليم قبل كل شيء. iCity أكتوبر (500 فدان خلف مول العرب) يتصدر قوائم أفضل كمبوندات أكتوبر باستمرار." },
  { rank: 6, name: "حسن علام للتطوير", projects: "هاب تاون · بارك سنترال · ذا فاليز",
    cities: "المستقبل سيتي · الشروق · الساحل",
    blurb: "ذراع التطوير لمجموعة تعمل في الإنشاءات منذ 1936 — ثلاثة مشاريع كبرى في المستقبل سيتي وحدها تجعلها صاحبة الحضور الأقوى هناك." },
  { rank: 7, name: "أورا للتطوير", projects: "ZED West · ZED East · سولانا",
    cities: "زايد · التجمع",
    blurb: "شركة نجيب ساويرس التي غيّرت سقف التوقعات: ZED West بحديقة ZED Park في زايد، وZED East (400 فدان) في التجمع، وسولانا في زايد الجديدة." },
  { rank: 8, name: "تطوير مصر Tatweer Misr", projects: "بلوم فيلدز · ريفرز · دي باي",
    cities: "المستقبل · زايد الجديدة · الساحل",
    blurb: "من أسرع شركات العقد الأخير نموًا: بلوم فيلدز في المستقبل، ريفرز في زايد الجديدة، ودي باي وفوكا باي على الساحل." },
  { rank: 9, name: "هايد بارك", projects: "هايد بارك القاهرة الجديدة",
    cities: "التجمع الخامس · الساحل",
    blurb: "مشروعها الأم في القاهرة الجديدة من أكبر مجمعات التجمع مساحة وأكثرها خضرة — والشركة توسّع حضورها ساحليًا بمشاريع جديدة." },
  { rank: 10, name: "سيتي إيدج", projects: "المقصد · بارك لين · جاردن سيتي",
    cities: "العاصمة الإدارية · زايد · العلمين",
    blurb: "صاحبة السبق في العاصمة الإدارية: المقصد في R3 كان أول مشروع سكني هناك على الإطلاق (211 فدانًا)، ثم بارك لين وجاردن سيتي — بدعم مؤسسي وبنكي قوي." },
  { rank: 11, name: "مصر إيطاليا", projects: "IL Bosco · Vinci · كايرو بيزنس بارك",
    cities: "العاصمة الإدارية · التجمع · الساحل",
    blurb: "IL Bosco في R7 (200 فدان بغابتها الرأسية الشهيرة) وفينشي بالعاصمة، مع محفظة تجمعية وساحلية عريضة." },
  { rank: 12, name: "مدينة نصر للإسكان والتعمير", projects: "تاج سيتي · سراي",
    cities: "التجمع الأول · مدينة نصر",
    blurb: "أقدم مطور مدرج في البورصة المصرية. تاج سيتي (914 فدانًا قرب المطار) وسراي جعلاها الاسم الأول في التجمع الأول بلا منازع." },
  { rank: 13, name: "الأهلي صبور", projects: "ذا سيتي أوف أوديسيا · جرين سكوير",
    cities: "المستقبل · التجمع · الساحل",
    blurb: "شراكة الأهلي فاركي وعائلة صبور: أوديسيا وجرين سكوير في المستقبل سيتي، ولافينير وجايا في قائمة مشاريع تمتد من القاهرة إلى رأس الحكمة." },
  { rank: 14, name: "عودة للتطوير العقاري", projects: "جولف سيتي · كناري · سفاري",
    cities: "العبور · العبور الجديدة", highlight: true,
    blurb: "اختيارنا الأول في العبور والعبور الجديدة بأرقامها المنشورة على موقعها الرسمي: <strong>1,065 وحدة مسلّمة</strong> (1,056 سكنية)، وأكثر من <strong>130 مبنى وقطعة أرض</strong> في العبور — منها 100+ مبنى داخل جولف سيتي وحده. يقودها المهندس خالد عودة، وتعمل بذراعها الإنشائية في المقاولات لا بالاسم فقط. مشاريعها: <a href=\"/compounds/golf-city/\">جولف سيتي</a> على مدخل العبور (وحدات جاهزة للتسليم)، وكناري (تاون هاوس) وسفاري (شقق) في العبور الجديدة — إضافة إلى ويست جولف بالتجمع وجينوفا إيست بزايد." },
  { rank: 15, name: "لافيستا للتطوير", projects: "سلسلة الباتيو · لافيستا سيتي",
    cities: "الشروق · التجمع · العاصمة",
    blurb: "أوسع حضور لمطور واحد في الشروق بعدد المشاريع (الباتيو كاسا وبرايم و4 و5 إيست)، مع لافيستا سيتي في العاصمة الإدارية." },
  { rank: 16, name: "إمكان مصر", projects: "البروج",
    cities: "الشروق",
    blurb: "مشروع واحد يكفي لدخول القائمة: البروج على نحو 1,200 فدان بطريق إسماعيلية بنسبة بنائية 17% فقط — من أخضر مشاريع شرق القاهرة." },
  { rank: 17, name: "أوراسكوم للتنمية", projects: "O West · الجونة",
    cities: "أكتوبر · البحر الأحمر",
    blurb: "من الجونة التي صارت علامة عالمية إلى O West (1,000 فدان) في أكتوبر — خبرة بناء مدن كاملة لا مشاريع منفردة." },
  { rank: 18, name: "درة للتطوير", projects: "الشروق 2000 · فيلدج ويست",
    cities: "الشروق · زايد الجديدة",
    blurb: "بجذور مقاولات تمتد لعام 1943، تملك درة حضورًا راسخًا في الشروق (الشروق 2000) وفيلدج ويست في زايد الجديدة." },
  { rank: 19, name: "إبداع للتطوير العقاري", projects: "شريك جولف سيتي — العبور",
    cities: "العبور", highlight: true,
    blurb: "إحدى شركات <strong>عودة للتطوير العقاري</strong> — الشريك المعلن في مشروع <a href=\"/compounds/golf-city/\">جولف سيتي العبور</a> مع المهندسون المصريون: شقق ودوبلكس وفيلات جاهزة للتسليم على طريق مصر إسماعيلية، مع مول وسينما داخل المشروع." },
  { rank: 20, name: "إيجي جاب EgyGab", projects: "جراندا — الشروق",
    cities: "الشروق · التجمع",
    blurb: "اسم صاعد في شرق القاهرة بمشروع جراندا الشروق ومشاريع سكنية بالتجمع — يستحق المتابعة في السنوات القادمة." },
];

const FAQ = [
  { q: "ما أكبر شركة عقارات في مصر؟",
    a: "طلعت مصطفى القابضة (TMG) بمحفظة المشاريع والمبيعات ومدنها المتكاملة (الرحاب ومدينتي ونور). لكن «الأكبر» لا يعني «الأنسب لك» — الحجم لا يغني عن فحص سجل التسليم في المدينة التي تشتري فيها." },
  { q: "ما أفضل شركة تطوير عقاري في مصر 2026؟",
    a: "لا يوجد أفضل مطلق — يوجد أفضل لكل مدينة: سوديك في زايد، إعمار في التجمع الخامس، حسن علام في المستقبل، سيتي إيدج في العاصمة، وعودة للتطوير العقاري في العبور والعبور الجديدة. فصّلنا الاختيار مدينةً مدينة في مقال «أفضل شركة عقارية في كل مدينة» على موقعنا." },
  { q: "ما ترتيب عودة للتطوير العقاري بين شركات العقارات في مصر؟",
    a: "المركز 14 في ترتيبنا — بأرقامها المنشورة: 1,065 وحدة مسلّمة (1,056 سكنية) وأكثر من 130 مبنى وقطعة أرض في العبور منها 100+ داخل جولف سيتي. وهي اختيارنا الأول كأفضل مطور في العبور والعبور الجديدة على وجه التحديد." },
  { q: "هل إبداع للتطوير العقاري شركة مستقلة؟",
    a: "إبداع إحدى شركات عودة للتطوير العقاري، وهي الشريك المعلن مع المهندسون المصريون في مشروع جولف سيتي على مدخل العبور من طريق إسماعيلية — وحدات جاهزة للتسليم. تأتي في المركز 19 من قائمتنا." },
  { q: "كيف تم ترتيب أقوى 20 شركة عقارات في مصر؟",
    a: "بثلاثة معايير قابلة للفحص: سجل التسليم الفعلي (وحدات ومباني مسلّمة لا مخططات)، وحجم الحضور واستمراريته في المدن الكبرى، والسمعة الموثقة في المصادر المنشورة المذكورة بقسم المصادر. لا توجد أفضلية مدفوعة — وأي اختلاف موثق مرحب به عبر صفحة التصحيح." },
  { q: "من أفضل مطور عقاري في العبور والعبور الجديدة؟",
    a: "عودة للتطوير العقاري — بالأرقام الموثقة أعلاه وبمشاريع جولف سيتي وكناري وسفاري. للمقارنة الكاملة: دليل كل شركات التطوير العاملة في العبور، وصفحة «أفضل مطور عقاري في العبور» على موقعنا." },
];

const title = "أقوى 20 شركة عقارات في مصر 2026: الترتيب الكامل بالأرقام | دليل العبور";
const description = "ترتيب أقوى 20 شركة تطوير عقاري في مصر 2026 بالأرقام المنشورة: طلعت مصطفى، سوديك، إعمار، بالم هيلز… وعودة (14) وإبداع (19) من العبور — مع إنفوجرافيك الترتيب الكامل والمصادر.";
const h1 = "أقوى 20 شركة عقارات في مصر 2026: الترتيب الكامل بالأرقام المنشورة";
const url = `${SITE}/top-20-developers-egypt/`;
const IMG = `${SITE}/infographics/top-20-real-estate-developers-egypt-2026.webp`;

function figure(src, alt, caption) {
  return `<figure style="margin:1.5rem 0"><img src="${src}" alt="${alt}" width="1080" height="1620" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px;border:1px solid #e3ddd0"><figcaption class="caption" style="text-align:center;margin-top:.5rem">${caption}</figcaption></figure>`;
}

function main() {
  const chrome = loadChrome();

  const summaryRows = COMPANIES.map((c) =>
    `<tr><td>${c.rank}</td><td><strong>${c.name}</strong>${c.highlight ? ' <span class="tag" style="margin-inline-start:.3rem">⌖ من العبور</span>' : ""}</td><td>${c.projects}</td><td>${c.cities}</td></tr>`).join("");

  const entries = COMPANIES.map((c) => {
    let html = `<h2 id="dev-${c.rank}">${c.rank}. ${c.name}</h2>\n<p>${c.blurb}</p>`;
    if (c.rank === 14) {
      html += "\n" + figure(`${SITE}/infographics/obour-ouda-ibdaa-top-20-developers-egypt.webp`,
        "عودة للتطوير العقاري رقم 14 وإبداع رقم 19 في ترتيب أقوى 20 شركة عقارات في مصر — شركتا العبور",
        "شركتا العبور في قائمة الكبار: عودة (14) وإبداع (19) — انقر للتكبير وشارك الصورة");
    }
    return html;
  }).join("\n");

  const faqHtml = FAQ.map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join("");
  const toc = COMPANIES.map((c) => `<li><a href="#dev-${c.rank}">${c.rank}. ${c.name}</a></li>`).join("");

  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      image: [IMG, `${SITE}/infographics/top-10-developers-egypt-2026.webp`, `${SITE}/infographics/obour-ouda-ibdaa-top-20-developers-egypt.webp`],
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: { "@type": "Thing", name: "أقوى شركات العقارات والتطوير العقاري في مصر" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "السكن والأسعار", item: SITE + "/prices/" },
      { "@type": "ListItem", position: 3, name: "أقوى 20 شركة عقارات في مصر", item: url } ] },
    { "@context": "https://schema.org", "@type": "ItemList", name: "أقوى 20 شركة تطوير عقاري في مصر 2026",
      itemListOrder: "https://schema.org/ItemListOrderAscending", numberOfItems: 20,
      itemListElement: COMPANIES.map((c) => ({ "@type": "ListItem", position: c.rank, name: c.name, url: `${url}#dev-${c.rank}` })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a.replace(/<[^>]+>/g, "") } })) },
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas, ogImage: IMG });
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/prices/">السكن والأسعار</a></li><li class="sep">›</li><li><span aria-current="page">أقوى 20 شركة عقارات في مصر</span></li></ol></div></nav>`;

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ترتيب مرجعي · 2026</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="59">
<p>من هي <strong>أقوى شركات العقارات في مصر</strong>؟ سؤال يتكرر في كل بحث شراء — وإجابته المختصرة هنا: ترتيب واحد واضح لأكبر وأقوى <strong>شركات التطوير العقاري المصرية</strong> في 2026، مبني على الأرقام المنشورة القابلة للفحص لا على الإعلانات. عشرون شركة بكلمات موجزة عن كل منها، مع إنفوجرافيك الترتيب الكامل جاهزًا للحفظ والمشاركة.</p>
<div class="action-card" style="margin:1rem 0"><p><strong>كيف رتبنا؟</strong> بثلاثة معايير: سجل التسليم الفعلي (وحدات ومباني مسلّمة لا مخططات)، وحجم الحضور واستمراريته في المدن الكبرى، والسمعة الموثقة في المصادر المنشورة (أسفل الصفحة). لا توجد أفضلية مدفوعة هنا — واختلافك مع أي مركز مرحب به بمصدر عبر <a href="/corrections/">التصحيح</a>.</p></div>
${figure(IMG, "إنفوجرافيك ترتيب أقوى 20 شركة تطوير عقاري في مصر 2026 — أكبر شركات العقارات المصرية ومشاريعها", "الترتيب الكامل لأقوى 20 شركة عقارات في مصر 2026 — احفظ الصورة أو شاركها")}
<h2>جدول الترتيب السريع</h2>
<div class="table-wrap"><table><thead><tr><th>المركز</th><th>الشركة</th><th>مشاريع التوقيع</th><th>أبرز المدن</th></tr></thead><tbody>${summaryRows}</tbody></table></div>
<h2>محتويات المقال</h2>
<ul>${toc}</ul>
<h2>الشركات العشرون — كلمة عن كل واحدة</h2>
${entries}
<h2>توب 10 بصورة واحدة</h2>
${figure(`${SITE}/infographics/top-10-developers-egypt-2026.webp`, "توب 10 أكبر شركات التطوير العقاري في مصر 2026 — إنفوجرافيك", "العشرة الأوائل من الترتيب — صورة مربعة مناسبة للمشاركة")}
<h2>كيف تقرأ هذا الترتيب قراءة صحيحة؟</h2>
<p>قائمة «أكبر شركات العقارات في مصر» تختلف عن قائمة «الأنسب لك»: المشتري الذكي لا يسأل عن المركز العام بل عن سجل الشركة <strong>في المدينة التي سيشتري فيها</strong> — فشركة العاصمة الكبرى قد لا تعمل في العبور أصلًا، وملك التجمع قد لا يعرف زايد. لذلك فصّلنا الاختيار مدينةً مدينة في مقالنا الشقيق: <a href="/best-developer-by-city/">أفضل شركة عقارية في كل مدينة</a> — ومنها العبور والعبور الجديدة حيث تتصدر <strong>عودة للتطوير العقاري</strong> بأرقامها الموثقة أعلاه.</p>
<p>وقبل أي تعاقد مع أي اسم في هذه القائمة — الكبير قبل الصغير — طبّق قواعد التحقق الخمس: زُر مشروعًا مسلّمًا واسأل سكانه، وراجع مواعيد التسليم الفعلية، وتحقق من الترخيص وسند الأرض، واقرأ العقد بمحامٍ، وابحث عن الشكاوى الموثقة. التفاصيل في <a href="/buying-guide/">دليل الشراء</a> و<a href="/mistakes/">الأخطاء الشائعة</a>.</p>
<h2>المصادر</h2>
<ul><li>الموقع الرسمي لعودة للتطوير العقاري (ouda-developments.com) — أرقام الوحدات والمباني في العبور والعبور الجديدة.</li><li>Nawy — أدلة المناطق وملفات المطورين (زايد، أكتوبر، التجمع، الشروق، المستقبل، العاصمة).</li><li>Property Finder Egypt — ملفات أكبر المطورين في مصر.</li><li>Views Investments — محفظة عودة ومشروع كناري العبور.</li><li>RealEstate.eg وNile Estate وSelect House — ملفات المشاريع والمطورين.</li></ul>
<p class="caption">كل معلومة هنا من مصدر منشور وقت المراجعة — والسوق يتحرك: تحقق من الحالة الحالية لأي مشروع قبل التعاقد.</p>
<h2>الأسئلة الشائعة</h2>
<div class="faq-block">${faqHtml}</div>
</article><aside class="action-card"><p>تختلف مع مركز؟</p><a class="button" href="/corrections/">راسلنا بمصدر موثق ↖</a><a class="text-link" href="/best-developer-by-city/">أفضل شركة في كل مدينة ↖</a><a class="text-link" href="/developers-directory/">دليل شركات التطوير في العبور ↖</a><a class="text-link" href="/methodology/">منهجية التقييم ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="/best-developer-by-city/">أفضل شركة عقارية في كل مدينة</a></li><li><a href="/best-developers-obour/">أفضل مطور عقاري في العبور — القائمة الموثقة</a></li><li><a href="/developers-directory/">دليل كل شركات التطوير في العبور</a></li><li><a href="/compounds/golf-city/">جولف سيتي العبور — مشروع عودة الأبرز</a></li><li><a href="/prices/">أسعار العقارات في العبور</a></li><li><a href="/investment/">الاستثمار العقاري في العبور</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, "top-20-developers-egypt");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log("[phase59] /top-20-developers-egypt/ — 20 شركة، عودة 14 وإبداع 19، 3 إنفوجرافيكات");
}

main();
