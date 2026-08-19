/**
 * seo-phase7-updates-enrich.mjs
 * توسيع صفحة /updates/ بمحتوى إضافي و FAQPage schema.
 *
 * idempotent: محمي بعلامة <!-- phase7-updates-enrich -->.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const pagePath = path.join(clientDir, "updates", "index.html");
const SITE = "https://obourguide.com";
const DEFAULT_LASTMOD = "2026-08";

const MARKER = "<!-- phase7-updates-enrich -->";

const FAQ = [
  { q: "ما نوع التحديثات التي تُنشر هنا؟", a: "تحديثات تتعلق بالبيانات المنشورة في الدليل: عناوين، هواتف، مواعيد، مصادر رسمية، أو تغييرات في خدمات عامة. لا ننشر أخبارًا تسويقية أو إعلانات." },
  { q: "كيف أُبلّغ عن تحديث موثّق؟", a: "أرسل لنا عبر <a href='/contact/'>صفحة التواصل</a> مع رابط المصدر الرسمي أو المستند القابل للتحقق. التصحيحات المُرفقة بمصدر تُراجع أولًا." },
  { q: "هل يمكنني متابعة التحديثات بدون زيارة الموقع؟", a: "نعم. اشترك عبر ملف <a href='/feed.xml'>feed.xml</a> باستخدام أي قارئ RSS. الملف يُحدّث تلقائيًا مع كل build." },
  { q: "لماذا الصفحة فارغة أحيانًا؟", a: "الصفحة تعرض فقط التحديثات المُوثّقة في data/updates.json. إذا لم تتوفر تحديثات موثّقة، نفضّل ترك الصفحة فارغة بدل نشر معلومات غير مؤكدة." },
];

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };
}

function main() {
  let html = fs.readFileSync(pagePath, "utf8");

  if (html.includes(MARKER)) {
    console.log("[SKIP] /updates/ already enriched");
    return;
  }

  const enrichBlock = `${MARKER}
<div class="phase7-updates-enrich wrap">
<h2>كيف تُدار التحديثات في هذا الدليل؟</h2>
<p>دليل العبور والعبور الجديدة لا يعتمد على «التحديثات الفورية» من مصادر مجهولة. كل تعديل يمر بخطوة واحدة: التحقق من مصدر منشور. المصدر قد يكون موقعًا رسميًا لجهة حكومية، أو موقع مطوّر عقاري، أو دليلًا تجاريًا معروفًا، أو اتصالًا مباشرًا بالمنشأة مع تسجيل التاريخ.</p>
<p>هذا يعني أن الصفحة قد تبدو فارغة لفترات، وهذا مقصود. المعلومة الخاطئة أضرّ من غياب المعلومة، خاصة عندما يتعلق الأمر بعناوين طوارئ أو مواعيد جهات حكومية أو أرقام هواتف.</p>

<h2>ماذا يجب أن يتضمن اقتراح التحديث؟</h2>
<ul>
<li>رابط الصفحة التي تريد تحديثها.</li>
<li>المعلومة الجديدة بوضوح.</li>
<li>رابط المصدر المنشور أو وثيقة قابلة للتحقق.</li>
<li>تاريخ الاطلاع على المصدر إن أمكن.</li>
</ul>
<p>التصحيحات التي لا تتضمن مصدرًا تُراجع لكنها قد تستغرق وقتًا أطول؛ الأولوية دائمًا للتصحيحات المُرفقة بمصدر.</p>

<h2>اشترك في التحديثات</h2>
<p>ملف <a href="/feed.xml">RSS</a> يتيح لك متابعة التحديثات المنشورة دون الحاجة لزيارة الموقع يدويًا. يعمل مع قارئات RSS العادية ومع بعض تطبيقات البريد.</p>

<h2>أسئلة شائعة</h2>
<div class="faq-block">
${FAQ.map(q => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`).join('')}
</div>
</div>`;

  // Insert before closing </div></section> of paper section
  html = html.replace(
    /<p>لا توجد تحديثات منشورة حاليًا[\s\S]*?<\/p>/,
    (m) => `${m}\n${enrichBlock}`
  );

  // Append FAQPage schema before </head>
  const faqScript = `<script type="application/ld+json">${JSON.stringify(faqSchema())}</script>`;
  html = html.replace("</head>", `${faqScript}</head>`);

  fs.writeFileSync(pagePath, html, "utf8");
  console.log("[OK] /updates/ enriched with FAQPage schema and methodology");
  rebuildSitemap();
}

// ---------------------------------------------------------------------------
// إعادة بناء sitemap بعد التعديل على /updates/
// ---------------------------------------------------------------------------
const AR_MONTHS = {
  "يناير": "01", "فبراير": "02", "مارس": "03", "ابريل": "04", "أبريل": "04",
  "مايو": "05", "يونيو": "06", "يوليو": "07", "أغسطس": "08", "اغسطس": "08",
  "سبتمبر": "09", "أكتوبر": "10", "نوفمبر": "11", "ديسمبر": "12",
};
const SITEMAP_EXCLUDE = new Set(["/404/", "/search/"]);

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
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml);
  console.log(`[OK] sitemap.xml rebuilt: ${entries.length} pages`);
}

main();
