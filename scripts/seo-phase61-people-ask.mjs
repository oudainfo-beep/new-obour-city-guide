/**
 * seo-phase61-people-ask.mjs — «أسئلة بيسألها أهل العبور».
 *
 * أسئلة حقيقية بتتسأل في جروبات العبور (مدارس، إيجارات، مواصلات، خدمات)
 * بإجابات قصيرة بالمصري — بصوت الدليل نفسه (فريق التحرير)، لا حسابات وهمية:
 * هوية الموقع كله «موثق وقابل للفحص»، والمحتوى ده يكسب People-Also-Ask.
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

/* سؤال + إجابة قصيرة بالمصري + رابط داخلي. الإجابات من محتوى الدليل الموثق — بلا أرقام مخترعة. */
const QA = [
  { q: "أحسن مدرسة قريبة من الحي التاسع؟",
    a: "عندك في قلب التاسع <strong>أكسفورد مودرن</strong> (منطقة 16، متفرع من شارع الجامعة)، ولو ابنك متفوق فيه <strong>مدرسة العبور STEM للمتفوقين</strong> حكومية داخلية في نفس الحي. القائمة الكاملة بالعناوين والتليفونات في <a href=\"/schools/\">دليل المدارس</a>.",
    link: ["/schools/", "دليل المدارس"] },
  { q: "الحي 25 في العبور الجديدة فيه خدمات؟",
    a: "الحي 25 (بيت الوطن) لسه في مرحلة التكوين — الخدمات والمحلات بتفتح تباعًا مع زيادة السكان، ومش زي أحياء العبور القديمة لسه. تابع التطور أول بأول في <a href=\"/tracker/\">متابعة العبور الجديدة</a>.",
    link: ["/tracker/", "متابعة العبور الجديدة"] },
  { q: "المواصلات من العبور للعاصمة الإدارية؟",
    a: "الأريح دلوقتي عربيتك أو أوبر: من الدائري الأوسطي أو الإقليمي المشوار حوالي نص ساعة بره الذروة. المواصلات العامة المباشرة لسه محدودة، فلو شغلك يومي هناك احسبها كويس قبل ما تسكن. التفاصيل في <a href=\"/transport/\">دليل المواصلات</a>.",
    link: ["/transport/", "دليل المواصلات"] },
  { q: "أسعار الإيجار في الحي الأول كام؟",
    a: "مفيش رقم واحد ثابت — بيفرق التشطيب والمساحة وقربك من الجامعة ومحور السادات، والسوق بيتحرك بسرعة. القاعدة: قارن 3 وحدات على الأقل قبل ما تمضي. خطوات المقارنة الذكية في <a href=\"/rent/\">دليل الإيجار</a>.",
    link: ["/rent/", "دليل الإيجار"] },
  { q: "أحسن كمبوند في العبور إيه؟",
    a: "اختيارنا الموثق رقم 1 هو <strong>جولف سيتي</strong>: موقع مدخل على طريق إسماعيلية، وحدات جاهزة للتسليم، ومول وسينما جواه. المقارنة الكاملة بالأسباب في <a href=\"/best-compounds-obour/\">أفضل كمبوندات العبور</a>.",
    link: ["/best-compounds-obour/", "أفضل كمبوندات العبور"] },
  { q: "فيه صيدلية بتفتح بالليل في العبور؟",
    a: "أيوه — في صيدليات مناوبة بتشتغل 24 ساعة وبتوصّل لحد البيت. الأسماء والتليفونات محدثة في <a href=\"/pharmacies-24-hours/\">صيدليات المناوبة</a>.",
    link: ["/pharmacies-24-hours/", "صيدليات مناوبة 24 ساعة"] },
  { q: "أقرب مستشفى طوارئ ليا في العبور؟",
    a: "العبور فيها مستشفيات ومراكز طوارئ بتشتغل 24 ساعة — القائمة بالعناوين والتليفونات في <a href=\"/hospital-24-hours/\">الخدمات الطبية 24 ساعة</a>. وفي الطوارئ الحرجة اتصل بالإسعاف 123 على طول. الأرقام كلها في <a href=\"/emergency/\">صفحة الطوارئ</a>.",
    link: ["/emergency/", "دليل الطوارئ"] },
  { q: "الدليفري بيوصل لحد الحي السادس؟",
    a: "أغلب تطبيقات الأكل ومطاعم المدينة بتغطي كل الأحياء مش بس التاسع — بس وقت الذروة ممكن يطوّل. الأماكن والأرقام في <a href=\"/food-delivery/\">دليل الدليفري</a>.",
    link: ["/food-delivery/", "دليفري العبور"] },
  { q: "النت في العبور كويس ولا بيعلق؟",
    a: "بيفرق من حي لحي ومن شركة لشركة — قبل ما تشترك اسأل جيرانك في نفس العمارة عن السرعة الحقيقية. مقارنة الشركات والباقات في <a href=\"/telecom-obour/\">دليل النت والاتصالات</a>.",
    link: ["/telecom-obour/", "الإنترنت والاتصالات"] },
  { q: "سوق الجمعة لسه موجود؟ وبيستاهل؟",
    a: "موجود وشغال — هتلاقي فيه الخضار والفراخ والأدوات المنزلية بأسعار أقل من المحلات، بس روح بدري عشان تلحق الحاجة الكويسة. التفاصيل في <a href=\"/friday-market/\">دليل سوق الجمعة</a>.",
    link: ["/friday-market/", "سوق الجمعة"] },
  { q: "أحسن حي لعيلة صغيرة لسه بتبدأ؟",
    a: "على حسب أولويتك: قرب المدارس ولا الهدوء ولا السعر. عملنا مقارنة صريحة لكل الأحياء التسعة حسب الاحتياج في <a href=\"/best-districts/\">أفضل أحياء العبور</a>.",
    link: ["/best-districts/", "أفضل الأحياء"] },
  { q: "العبور الجديدة تستاهل أشتري فيها دلوقتي؟",
    a: "لو بتدور على سعر أقل ونمو قدام — أيوه المنطقة واعدة، بس بشرط تتحقق من المطور نفسه كويس. الأرقام المحدثة في <a href=\"/prices/\">دليل الأسعار</a> وقواعد الشراء الآمن في <a href=\"/buying-guide/\">دليل الشراء</a>.",
    link: ["/prices/", "أسعار العقارات"] },
  { q: "فيه جيم محترم في العبور؟",
    a: "في كذا جيم منتشر في الأحياء — منهم اللي فيه أقسام للسيدات وأجهزة حديثة. القائمة الموثقة بالعناوين في <a href=\"/best-gyms-obour/\">أفضل الجيمات</a>.",
    link: ["/best-gyms-obour/", "أفضل الجيمات"] },
  { q: "مدارس انترناشونال قريبة من العبور؟",
    a: "في مدارس لغات ودولية جوه المدينة نفسها — مش لازم تودي ولادك التجمع. القائمة بالأقسام والعناوين في <a href=\"/language-schools/\">دليل مدارس اللغات</a>.",
    link: ["/language-schools/", "مدارس اللغات"] },
  { q: "المواصلات من العبور للقاهرة الصبح؟",
    a: "فيه خطوط ميكروباص وأوتوبيسات بتتحرك من مواقف المدينة ناحية القاهرة من بدري — بس في الذروة احسب وقت زيادة. الخطوط والمواقف في <a href=\"/transport-from-cairo/\">مواصلات القاهرة-العبور</a>.",
    link: ["/transport-from-cairo/", "مواصلات القاهرة-العبور"] },
  { q: "أقرب ماكينة ATM ليا فين؟",
    a: "البنوك وماكيناتها منتشرة حوالين محاور المدينة والمناطق التجارية — الخريطة الكاملة في <a href=\"/atm-obour/\">دليل ماكينات الـ ATM</a> و<a href=\"/banks/\">دليل البنوك</a>.",
    link: ["/banks/", "البنوك والصرافات"] },
];

const title = "أسئلة أهل العبور: إجابات قصيرة بالمصري عن المدارس والإيجار والمواصلات | دليل العبور";
const description = "الأسئلة اللي أهل العبور بيسألوها كل يوم — أحسن مدرسة قرب التاسع؟ خدمات الحي 25؟ مواصلات العاصمة؟ إيجار الحي الأول؟ — بإجابات قصيرة صريحة وروابط الأدلة الموثقة.";
const h1 = "أسئلة بيسألها أهل العبور — وإجابات قصيرة على الماشي";
const url = `${SITE}/people-ask-obour/`;

function main() {
  const chrome = loadChrome();

  const cards = QA.map((item, i) =>
    `<h2 id="q${i + 1}">${item.q}</h2>\n<p>${item.a}</p>`).join("\n");

  const schemas = [
    orgNode(),
    { "@context": "https://schema.org", "@type": "Article", headline: h1, url, description,
      inLanguage: "ar-EG", datePublished: TODAY, dateModified: TODAY,
      publisher: { "@id": SITE + "/#org" }, author: { "@id": SITE + "/#org" }, mainEntityOfPage: url,
      about: { "@type": "Thing", name: "أسئلة شائعة عن السكن والخدمات في مدينة العبور" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "المجتمع", item: SITE + "/ask/" },
      { "@type": "ListItem", position: 3, name: "أسئلة أهل العبور", item: url } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: QA.map((item) => ({
      "@type": "Question", name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() } })) },
  ];

  const head = buildHead(chrome.head, { title, description, url, schemas });
  const crumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol><li><a href="/">الرئيسية</a></li><li class="sep">›</li><li><a href="/ask/">المجتمع</a></li><li class="sep">›</li><li><span aria-current="page">أسئلة أهل العبور</span></li></ol></div></nav>`;

  const body = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ من أسئلة الناس · ${QA.length} سؤال</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article data-rich="61">
<p>دي الأسئلة اللي بنشوفها بتتكرر في جروبات أهل العبور ورسايل الصفحة — عن المدارس والإيجار والمواصلات والخدمات. جاوبنا عليها باختصار وبصراحة، وكل إجابة وراها لينك الدليل الموثق اللي فيه التفاصيل والأسماء والتليفونات. عندك سؤال مش هنا؟ اكتبه في <a href="/ask/">مجتمع أسئلة العبور</a> وفريق الدليل هيرد عليه.</p>
${cards}
<p class="caption">الإجابات من محتوى دليل العبور الموثق بالمصادر المنشورة — والسوق والخدمات بتتغير، فاللينكات فيها الأحدث دايمًا.</p>
</article><aside class="action-card"><p>عندك سؤال تاني؟</p><a class="button" href="/ask/">اسأل مجتمع العبور ↖</a><a class="text-link" href="/faq/">الأسئلة الشائعة الكاملة ↖</a><a class="text-link" href="/directory/">دليل الخدمات ↖</a></aside></div></section>
<section class="section"><div class="wrap"><h2>أدلة ذات صلة</h2><ul><li><a href="/ask/">مجتمع أسئلة وأجوبة العبور</a></li><li><a href="/faq/">الأسئلة الشائعة</a></li><li><a href="/districts/">دليل الأحياء</a></li><li><a href="/moving-to-obour/">خطة الانتقال للعبور</a></li><li><a href="/news/">أخبار المدينة</a></li></ul></div></section></main>`;

  const outDir = path.join(clientDir, "people-ask-obour");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"),
    `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${crumb}${body}${chrome.footer}</body></html>`, "utf8");
  console.log(`[phase61] /people-ask-obour/ — ${QA.length} سؤال وجواب بالمصري بصوت الدليل`);
}

main();
