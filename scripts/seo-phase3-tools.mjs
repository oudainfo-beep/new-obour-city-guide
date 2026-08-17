/**
 * seo-phase3-tools.mjs
 * المرحلة الثالثة (3.8): صفحات الأدوات الحسابية — حاسبة التمويل، حاسبة المواصلات، حاسبة المصروفات الدراسية.
 *
 * يعمل بعد render-static.mjs وseo-phase1-postprocess.mjs (ويمكن أن يعمل بعد المرحلة الثانية أيضًا):
 *   node scripts/render-static.mjs && node scripts/seo-phase1-postprocess.mjs \
 *     && node scripts/seo-phase3-tools.mjs && npx vite build
 *
 * المبادئ الملزمة:
 *  - لا أرقام افتراضية تُقدَّم كتوصية مالية؛ كل القيم يدخلها المستخدم.
 *  - كل النتائج إرشادية وتتضمن إخلاء مسؤولية واضح.
 *  - صفحات HTML ثابتة بـ JavaScript مضمّن، بلا React ولا خطوة build إضافية.
 *  - idempotent: تُعاد كتابة الملفات بالكامل في كل تشغيل.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

// ---------------------------------------------------------------------------
// قالب الصفحة: يستعير الهيكل من صفحة ناشر مبنية بالفعل
// ---------------------------------------------------------------------------
function loadChrome() {
  const donorPath = path.join(clientDir, "about-us", "index.html");
  const donor = fs.readFileSync(donorPath, "utf8");
  const head = donor.match(/<head>[\s\S]*?<\/head>/)[0];
  const header = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
  const footer = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];
  return { head, header, footer };
}

function orgNode() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": SITE + "/#org",
    "name": "دليل العبور والعبور الجديدة",
    "url": SITE + "/",
    "logo": "https://obourguide.com/brand/logo.png",
    "foundingDate": "2026",
    "publishingPrinciples": SITE + "/editorial-policy/",
  };
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

function makeSchemas({ h1, url, breadcrumbItems }) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": h1,
      "url": url,
      "inLanguage": "ar-EG",
      "datePublished": DEFAULT_LASTMOD,
      "dateModified": DEFAULT_LASTMOD,
      "publisher": { "@id": SITE + "/#org" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((it, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": it.name,
        "item": it.item,
      })),
    },
    orgNode(),
  ];
}

function pageShell(chrome, { title, description, url, h1, tag, breadcrumbItems, body, aside }) {
  const schemas = makeSchemas({ h1, url, breadcrumbItems });
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${breadcrumbItems
    .map((it, i) => {
      if (i === breadcrumbItems.length - 1) {
        return `<li><span aria-current="page">${it.name}</span></li>`;
      }
      return `<li><a href="${it.item}">${it.name}</a></li><li class="sep">›</li>`;
    })
    .join("")}</ol></div></nav>`;
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">⌖ ${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}</article>${aside}</div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumb}${main}${chrome.footer}</body></html>`;
}

// ---------------------------------------------------------------------------
// عناصر مشتركة
// ---------------------------------------------------------------------------
const CALC_STYLES = `<style>
.calc-form{display:grid;gap:1rem;margin:1.4rem 0}
.calc-row{display:grid;gap:.35rem}
.calc-row label{font-weight:800;font-size:.9rem;color:var(--deep)}
.calc-row small{color:var(--muted);font-size:.78rem}
.calc-row input,.calc-row select{border:1px solid #b6c9ba;background:#fbfaf4;padding:.75rem 1rem;font:600 1rem Tajawal,Arial,sans-serif;color:var(--ink);border-radius:6px}
.calc-row input:focus,.calc-row select:focus{outline:2px solid var(--olive);outline-offset:2px}
.calc-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem}
.calc-actions .button{cursor:pointer;border:0}
.calc-result{background:#fbfaf4;border:1px solid var(--line);border-radius:8px;padding:1.1rem 1.2rem;margin-top:1.2rem}
.calc-result h3{margin:0 0 .6rem;font:800 1.1rem Cairo,Arial,sans-serif;color:var(--deep)}
.calc-result .result-line{display:flex;justify-content:space-between;gap:1rem;padding:.55rem 0;border-bottom:1px dashed #dbe3da}
.calc-result .result-line:last-child{border-bottom:0}
.calc-result .result-line strong{color:var(--olive);font-size:1.05rem}
.disclaimer{background:#f3ead8;border-right:4px solid #c69148;padding:1rem 1.1rem;margin-top:1.2rem;font-size:.86rem;line-height:1.9;color:#5c4a30}
.disclaimer strong{color:#7a5a26}
.calc-note{margin-top:1rem;font-size:.84rem;color:var(--muted)}
</style>`;

const ASIDE_TOOLS = `<aside class="action-card"><p>الأدوات الحسابية</p><a class="text-link" href="/tools/">كل الأدوات ↖</a><a class="text-link" href="/tools/mortgage-affordability/">حاسبة قسط التمويل ↖</a><a class="text-link" href="/tools/commute-cost/">حاسبة تكلفة المواصلات ↖</a><a class="text-link" href="/tools/school-fees/">حاسبة المصروفات الدراسية ↖</a><a class="text-link" href="/buying-guide/">دليل الشراء ↖</a><a class="text-link" href="/prices/">أسعار العقارات ↖</a></aside>`;

const ASIDE_HUB = `<aside class="action-card"><p>مسارات مرتبطة</p><a class="text-link" href="/buying-guide/">دليل الشراء ↖</a><a class="text-link" href="/prices/">أسعار العقارات ↖</a><a class="text-link" href="/cost-of-living/">تكلفة المعيشة ↖</a><a class="text-link" href="/districts/">الأحياء والمناطق ↖</a></aside>`;

function fmtMoney(n) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("ar-EG", { maximumFractionDigits: 0 }) + " ج.م";
}

function fmtNumber(n, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("ar-EG", { maximumFractionDigits: digits });
}

// ---------------------------------------------------------------------------
// 1) صفحة الأدوات الرئيسية
// ---------------------------------------------------------------------------
function toolsHubPage(chrome) {
  const url = `${SITE}/tools/`;
  const title = "أدوات حسابية قبل شراء أو انتقال | دليل العبور";
  const description = "أدوات حسابية تفاعلية لمساعدتك في تقدير قسط التمويل العقاري، وتكلفة المواصلات اليومية، والمصروفات الدراسية قبل الانتقال إلى العبور أو العبور الجديدة.";
  const h1 = "أدوات حسابية قبل شراء أو انتقال";
  const body = `
<p>استخدم هذه الحاسبات لتقدير النفقات الرئيسية قبل اتخاذ قرار الشراء أو الانتقال. كل الأرقام تعتمد على ما تدخله بنفسك، والنتائج إرشادية فقط.</p>
<div class="dir-hub" style="margin-top:1.8rem">
  <a class="dir-hub-card" href="/tools/mortgage-affordability/">
    <small>حاسبة</small>
    <b>قسط التمويل العقاري</b>
    <span>أدخل دخلك الشهري ومصروفاتك ومعدل الفائدة والدفعة المقدمة لتقدير أقصى قسط وقيمة وحدة مناسبة.</span>
    <i>افتح الحاسبة ←</i>
  </a>
  <a class="dir-hub-card" href="/tools/commute-cost/">
    <small>حاسبة</small>
    <b>تكلفة المواصلات اليومية</b>
    <span>قارن بين تكلفة السيارة (بنزين واستهلاك) والمواصلات العامة على أساس عدد أيام التنقل شهريًا.</span>
    <i>افتح الحاسبة ←</i>
  </a>
  <a class="dir-hub-card" href="/tools/school-fees/">
    <small>حاسبة</small>
    <b>المصروفات الدراسية</b>
    <span>احسب إجمالي تكلفة الدراسة على مدى سنوات، شاملة المصروفات السنوية والمواصلات والأنشطة والزي والكتب.</span>
    <i>افتح الحاسبة ←</i>
  </a>
</div>
<div class="disclaimer">
  <strong>تنبيه:</strong> هذه الأدوات لا تقدم توصية مالية أو استثمارية أو تعليمية. النتائج تعتمد على بياناتك أنت، وقد تختلف الأسعار والمصاريف الفعلية لدى البنوك والمدارس ومحطات الوقود. تحقق دائمًا من المصادر قبل أي قرار.
</div>`;

  return pageShell(chrome, {
    title,
    description,
    url,
    h1,
    tag: "أدوات الدليل",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "الأدوات الحسابية", item: url },
    ],
    body,
    aside: ASIDE_HUB,
  });
}

// ---------------------------------------------------------------------------
// 2) حاسبة قسط التمويل العقاري
// ---------------------------------------------------------------------------
function mortgagePage(chrome) {
  const url = `${SITE}/tools/mortgage-affordability/`;
  const title = "حاسبة قسط التمويل العقاري | دليل العبور";
  const description = "احسب أقصى قسط شهري تستطيع تحمله، والقرض المقدر، ومدى سعر الوحدة بناءً على دخلك ومصروفاتك ومعدل الفائدة والدفعة المقدمة.";
  const h1 = "حاسبة قسط التمويل العقاري";
  const body = `
<p>أدخل بياناتك المالية لتقدير أقصى قسط شهري يمكنك تحمله، ثم حساب قيمة القرض والوحدة تقريبًا. لا تُستخدم النتيجة كعروض بنكية؛ راجع البنك للأرقام النهائية.</p>
${CALC_STYLES}
<form class="calc-form" id="mortgage-form" onsubmit="return false;">
  <div class="calc-row">
    <label for="income">الدخل الشهري الصافي</label>
    <input type="number" min="0" step="100" id="income" placeholder="مثال: 25000" required>
    <small>المبلغ الذي يدخل حسابك شهريًا بعد الضرائب والتأمينات.</small>
  </div>
  <div class="calc-row">
    <label for="expenses">المصروفات الشهرية الأساسية</label>
    <input type="number" min="0" step="100" id="expenses" placeholder="مثال: 10000" required>
    <small>الإيجار الحالي أو المعيشة والمواصلات والالتزامات الأخرى.</small>
  </div>
  <div class="calc-row">
    <label for="down">نسبة الدفعة المقدمة (%)</label>
    <input type="number" min="0" max="100" step="1" id="down" placeholder="مثال: 20" required>
    <small>نسبة من إجمالي سعر الوحدة تدفعها مقدمًا.</small>
  </div>
  <div class="calc-row">
    <label for="rate">معدل الفائدة السنوي (%)</label>
    <input type="number" min="0" max="50" step="0.1" id="rate" placeholder="مثال: 12" required>
    <small>المعدل السنوي الذي يعرضه البنك (ليس العائد السنوي بالضرورة).</small>
  </div>
  <div class="calc-row">
    <label for="years">مدة القرض (سنوات)</label>
    <input type="number" min="1" max="40" step="1" id="years" placeholder="مثال: 20" required>
  </div>
  <div class="calc-actions">
    <button class="button" type="button" id="mortgage-calc">احسب</button>
    <button class="button" type="reset" id="mortgage-reset" style="background:transparent;color:var(--olive)">امسح</button>
  </div>
</form>
<div class="calc-result" id="mortgage-result" style="display:none">
  <h3>النتيجة التقديرية</h3>
  <div class="result-line"><span>القسط الشهري الأقصى المقترح</span><strong id="res-payment">—</strong></div>
  <div class="result-line"><span>مبلغ القرض المقدر</span><strong id="res-loan">—</strong></div>
  <div class="result-line"><span>تقدير أقصى سعر للوحدة</span><strong id="res-price">—</strong></div>
  <div class="result-line"><span>الدفعة المقدرة مقدمًا</span><strong id="res-down">—</strong></div>
</div>
<div class="disclaimer">
  <strong>إخلاء مسؤولية:</strong> هذه الحاسبة تعطي تقديرًا رياضيًا بسيطًا بناءً على بياناتك فقط. لا تأخذ في الاعتبار التزاماتك الائتمانية الأخرى، ولا شروط البنك، ولا مصاريف التقييم والتأمين والتسجيل. تحقق من العرض الرسمي لدى البنك أو الوسيط المعتمد قبل التعاقد.
</div>
<script>
(function(){
  const $ = id => document.getElementById(id);
  function calc(){
    const income = parseFloat($('income').value) || 0;
    const expenses = parseFloat($('expenses').value) || 0;
    const downPct = parseFloat($('down').value) || 0;
    const rate = parseFloat($('rate').value) || 0;
    const years = parseFloat($('years').value) || 0;
    if(income <= 0 || years <= 0) return;
    const available = Math.max(0, income - expenses);
    const suggestedPayment = available * 0.45; // نسبة احتياطية تحمي من ارتفاع المصروفات
    const r = rate / 100 / 12;
    const n = years * 12;
    let loan = 0;
    if(r > 0 && n > 0){
      loan = suggestedPayment * (1 - Math.pow(1 + r, -n)) / r;
    } else if(n > 0){
      loan = suggestedPayment * n;
    }
    const maxPrice = downPct >= 100 ? loan : loan / (1 - downPct / 100);
    const downAmount = maxPrice - loan;
    $('res-payment').textContent = suggestedPayment.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('res-loan').textContent = loan.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('res-price').textContent = maxPrice.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('res-down').textContent = downAmount.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('mortgage-result').style.display = 'block';
  }
  $('mortgage-calc').addEventListener('click', calc);
  $('mortgage-reset').addEventListener('click', () => { $('mortgage-result').style.display = 'none'; });
})();
</script>`;

  return pageShell(chrome, {
    title,
    description,
    url,
    h1,
    tag: "أدوات الشراء",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "الأدوات الحسابية", item: SITE + "/tools/" },
      { name: "حاسبة قسط التمويل", item: url },
    ],
    body,
    aside: ASIDE_TOOLS,
  });
}

// ---------------------------------------------------------------------------
// 3) حاسبة تكلفة المواصلات
// ---------------------------------------------------------------------------
function commutePage(chrome) {
  const url = `${SITE}/tools/commute-cost/`;
  const title = "حاسبة تكلفة المواصلات اليومية | دليل العبور";
  const description = "قارن بين تكلفة استخدام السيارة والمواصلات العامة شهريًا حسب عدد أيام التنقل والمسافة وأسعار الوقود.";
  const h1 = "حاسبة تكلفة المواصلات";
  const body = `
<p>احسب تكلفة تنقلك الشهرية بالسيارة أو بالمواصلات العامة (أو كليهما). الأرقام تعتمد على بياناتك وأسعار الوقود الحالية.</p>
${CALC_STYLES}
<form class="calc-form" id="commute-form" onsubmit="return false;">
  <div class="calc-row">
    <label for="days">أيام التنقل في الأسبوع</label>
    <input type="number" min="0" max="7" step="1" id="days" placeholder="مثال: 5" required>
  </div>
  <div class="calc-row">
    <label for="mode">طريقة التنقل</label>
    <select id="mode" required>
      <option value="car">سيارة خاصة</option>
      <option value="public">مواصلات عامة</option>
      <option value="both">كلاهما</option>
    </select>
  </div>
  <div class="calc-row" id="car-block">
    <label for="fuel">سعر لتر البنزين (ج.م)</label>
    <input type="number" min="0" step="0.1" id="fuel" placeholder="مثال: 12.5">
    <label for="consumption" style="margin-top:.5rem">متوسط استهلاك السيارة (كم/لتر)</label>
    <input type="number" min="0" step="0.1" id="consumption" placeholder="مثال: 12">
    <label for="distance" style="margin-top:.5rem">المسافة ذهابًا (كم)</label>
    <input type="number" min="0" step="0.1" id="distance" placeholder="مثال: 25">
  </div>
  <div class="calc-row" id="public-block">
    <label for="public-cost">تكلفة المواصلات العامة شهريًا (ج.م)</label>
    <input type="number" min="0" step="50" id="public-cost" placeholder="مثال: 600">
    <small>اشتراك النقل العام أو تكلفة الرحلات اليومية × أيام العمل.</small>
  </div>
  <div class="calc-actions">
    <button class="button" type="button" id="commute-calc">احسب</button>
    <button class="button" type="reset" id="commute-reset" style="background:transparent;color:var(--olive)">امسح</button>
  </div>
</form>
<div class="calc-result" id="commute-result" style="display:none">
  <h3>التكلفة الشهرية التقديرية</h3>
  <div class="result-line"><span>تكلفة السيارة</span><strong id="res-car">—</strong></div>
  <div class="result-line"><span>تكلفة المواصلات العامة</span><strong id="res-public">—</strong></div>
  <div class="result-line"><span>الإجمالي</span><strong id="res-total">—</strong></div>
</div>
<div class="disclaimer">
  <strong>إخلاء مسؤولية:</strong> الحاسبة لا تأخذ في الاعتبار مصاريف صيانة السيارة أو التأمين أو الزحام أو تذاكر المواصلات المتغيرة. استخدمها كتقدير أولي فقط وتحقق من الأسعار الفعلية.
</div>
<script>
(function(){
  const $ = id => document.getElementById(id);
  function toggleBlocks(){
    const mode = $('mode').value;
    $('car-block').style.display = (mode === 'car' || mode === 'both') ? 'grid' : 'none';
    $('public-block').style.display = (mode === 'public' || mode === 'both') ? 'grid' : 'none';
  }
  function calc(){
    const days = parseFloat($('days').value) || 0;
    const mode = $('mode').value;
    const weeksPerMonth = 4.345;
    let carCost = 0, publicCost = 0;
    if(mode === 'car' || mode === 'both'){
      const fuel = parseFloat($('fuel').value) || 0;
      const consumption = parseFloat($('consumption').value) || 0;
      const distance = parseFloat($('distance').value) || 0;
      if(consumption > 0){
        const monthlyKm = days * 2 * distance * weeksPerMonth;
        carCost = (monthlyKm / consumption) * fuel;
      }
    }
    if(mode === 'public' || mode === 'both'){
      publicCost = parseFloat($('public-cost').value) || 0;
    }
    $('res-car').textContent = carCost.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('res-public').textContent = publicCost.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('res-total').textContent = (carCost + publicCost).toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('commute-result').style.display = 'block';
  }
  $('mode').addEventListener('change', toggleBlocks);
  $('commute-calc').addEventListener('click', calc);
  $('commute-reset').addEventListener('click', () => { $('commute-result').style.display = 'none'; toggleBlocks(); });
  toggleBlocks();
})();
</script>`;

  return pageShell(chrome, {
    title,
    description,
    url,
    h1,
    tag: "أدوات المعيشة",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "الأدوات الحسابية", item: SITE + "/tools/" },
      { name: "حاسبة تكلفة المواصلات", item: url },
    ],
    body,
    aside: ASIDE_TOOLS,
  });
}

// ---------------------------------------------------------------------------
// 4) حاسبة المصروفات الدراسية
// ---------------------------------------------------------------------------
function schoolFeesPage(chrome) {
  const url = `${SITE}/tools/school-fees/`;
  const title = "حاسبة المصروفات الدراسية | دليل العبور";
  const description = "احسب إجمالي تكلفة الدراسة على مدى سنوات، شاملة المصروفات السنوية والمواصلات والأنشطة والزي والكتب.";
  const h1 = "حاسبة المصروفات الدراسية";
  const body = `
<p>أدخل المصروفات السنوية للطفل الواحد ثم عدد الأطفال والسنوات لمعرفة التكلفة الإجمالية المتوقعة. النتيجة تقديرية وتعتمد على بياناتك.</p>
${CALC_STYLES}
<form class="calc-form" id="school-form" onsubmit="return false;">
  <div class="calc-row">
    <label for="tuition">الرسوم الدراسية السنوية لطفل واحد (ج.م)</label>
    <input type="number" min="0" step="500" id="tuition" placeholder="مثال: 45000" required>
  </div>
  <div class="calc-row">
    <label for="children">عدد الأطفال</label>
    <input type="number" min="1" step="1" id="children" placeholder="مثال: 2" required>
  </div>
  <div class="calc-row">
    <label for="years">عدد السنوات</label>
    <input type="number" min="1" step="1" id="years" placeholder="مثال: 12" required>
    <small>يمكن أن تكون فترة الدراسة المتوقعة من الابتدائي حتى الثانوي.</small>
  </div>
  <div class="calc-row">
    <label for="bus">رسوم المواصلات/الباص شهريًا (ج.م)</label>
    <input type="number" min="0" step="100" id="bus" placeholder="مثال: 800">
  </div>
  <div class="calc-row">
    <label for="activities">الأنشطة والرحلات سنويًا (ج.م)</label>
    <input type="number" min="0" step="500" id="activities" placeholder="مثال: 3000">
  </div>
  <div class="calc-row">
    <label for="books">الكتب والزي والقرطاسية سنويًا (ج.م)</label>
    <input type="number" min="0" step="500" id="books" placeholder="مثال: 4000">
  </div>
  <div class="calc-actions">
    <button class="button" type="button" id="school-calc">احسب</button>
    <button class="button" type="reset" id="school-reset" style="background:transparent;color:var(--olive)">امسح</button>
  </div>
</form>
<div class="calc-result" id="school-result" style="display:none">
  <h3>التكلفة الإجمالية التقديرية</h3>
  <div class="result-line"><span>التكلفة السنوية لطفل واحد</span><strong id="res-annual-child">—</strong></div>
  <div class="result-line"><span>التكلفة السنوية لجميع الأطفال</span><strong id="res-annual-all">—</strong></div>
  <div class="result-line"><span>الإجمالي على مدى السنوات</span><strong id="res-total">—</strong></div>
</div>
<div class="disclaimer">
  <strong>إخلاء مسؤولية:</strong> الحاسبة لا تأخذ في الاعتبار الزيادات السنوية في الرسوم، أو المصاريف الإضافية غير المتوقعة، أو الاختلاف بين الصفوف الدراسية. تحقق من المدارس مباشرة للحصول على الرسوم الرسمية.
</div>
<script>
(function(){
  const $ = id => document.getElementById(id);
  function calc(){
    const tuition = parseFloat($('tuition').value) || 0;
    const children = parseFloat($('children').value) || 0;
    const years = parseFloat($('years').value) || 0;
    const bus = parseFloat($('bus').value) || 0;
    const activities = parseFloat($('activities').value) || 0;
    const books = parseFloat($('books').value) || 0;
    if(children <= 0 || years <= 0) return;
    const annualPerChild = tuition + (bus * 12) + activities + books;
    const annualAll = annualPerChild * children;
    const total = annualAll * years;
    $('res-annual-child').textContent = annualPerChild.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('res-annual-all').textContent = annualAll.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('res-total').textContent = total.toLocaleString('ar-EG',{maximumFractionDigits:0}) + ' ج.م';
    $('school-result').style.display = 'block';
  }
  $('school-calc').addEventListener('click', calc);
  $('school-reset').addEventListener('click', () => { $('school-result').style.display = 'none'; });
})();
</script>`;

  return pageShell(chrome, {
    title,
    description,
    url,
    h1,
    tag: "أدوات المعيشة",
    breadcrumbItems: [
      { name: "الرئيسية", item: SITE + "/" },
      { name: "الأدوات الحسابية", item: SITE + "/tools/" },
      { name: "حاسبة المصروفات الدراسية", item: url },
    ],
    body,
    aside: ASIDE_TOOLS,
  });
}

// ---------------------------------------------------------------------------
// إعادة بناء sitemap
// ---------------------------------------------------------------------------
const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "أبريل": "04", "ابريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};
const SITEMAP_EXCLUDE = new Set(["/404/", "/search/", "/dining-guide/", "/shopping-guide/", "/health-guide/"]);

function listPageFiles() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "public" || e.name === "src") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "index.html") out.push(full);
    }
  };
  walk(clientDir);
  return out;
}
function slugOf(file) {
  const rel = path.relative(clientDir, file).replace(/\\/g, "/");
  return rel === "index.html" ? "/" : "/" + rel.replace(/\/index\.html$/, "") + "/";
}
function pageLastmod(html) {
  const m = html.match(/آخر تحديث: ([\u0600-\u06FF]+) (\d{4})/);
  if (!m) return DEFAULT_LASTMOD;
  const mm = AR_MONTHS[m[1]];
  return mm ? `${m[2]}-${mm}` : DEFAULT_LASTMOD;
}
function rebuildSitemap() {
  const entries = [];
  for (const f of listPageFiles()) {
    const slug = slugOf(f);
    if (SITEMAP_EXCLUDE.has(slug)) continue;
    entries.push({ slug, lastmod: pageLastmod(fs.readFileSync(f, "utf8")) });
  }
  entries.sort((a, b) => (a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.slug.localeCompare(b.slug)));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${SITE}${e.slug}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(clientDir, "public", "sitemap.xml"), xml);
  rep("sitemap", `أُعيد بناء sitemap.xml: ${entries.length} صفحة (شاملة أدوات المرحلة الثالثة)`);
}

// ---------------------------------------------------------------------------
function main() {
  const chrome = loadChrome();

  const pages = [
    { slug: "tools/index", builder: toolsHubPage },
    { slug: "tools/mortgage-affordability/index", builder: mortgagePage },
    { slug: "tools/commute-cost/index", builder: commutePage },
    { slug: "tools/school-fees/index", builder: schoolFeesPage },
  ];

  for (const p of pages) {
    const file = path.join(clientDir, ...p.slug.split("/")) + ".html";
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, p.builder(chrome));
    rep("page", `/${p.slug.replace("/index", "")}/ أُنشئت`);
  }

  rebuildSitemap();

  console.log("=== تقرير المرحلة الثالثة: أدوات حسابية (3.8) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
