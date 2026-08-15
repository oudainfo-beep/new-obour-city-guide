/**
 * صفحات هبوط للفئات الأكثر بحثًا، مبنية من نفس بيانات الأدلة
 * بمقدمة مكتوبة يدويًا لكل صفحة (لا نص مُولَّد بقالب واحد).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("const landings")) throw new Error("صفحات الهبوط مضافة بالفعل.");

// 1) حقن التعريفات + مولد الصفحة بعد كتلة الأدلة
const landingTpl = fs.readFileSync(path.join(here, "tpl-landing.txt"), "utf8");
const builder = `
function landingPage(L) {
  const d = dirBySlug[L.parent];
  const items = d.items.filter((it) => it.c === L.sub);
  const others = landings.filter((x) => x.slug !== L.slug && x.parent === L.parent);
  const cross = (others.length ? others : landings.filter((x) => x.slug !== L.slug)).slice(0, 4);
  return \`<main>\${pageHero({tag: L.title, eyebrow: "دليل فرعي · أسماء وعناوين وأرقام", title: L.title, description: L.desc})}<section class="paper section"><div class="wrap"><nav class="crumbs"><a href="/directory/">دليل الخدمات</a> ← <a href="/\${L.parent}/">\${d.title}</a> ← <span>\${L.sub}</span></nav><p class="eyebrow">\${items.length} مدخلًا · \${items.filter((i) => i.t).length} منها برقم هاتف · مراجعة أغسطس 2026</p><h2>\${L.title} — القائمة الكاملة</h2><p class="wide-copy">\${L.p1}</p><p class="wide-copy">\${L.p2}</p><div class="dir-list">\${items.map(dirItem).join("")}</div><p class="caption">المدخل بلا رقم يعني أن الرقم غير متاح في المصدر، لا أن المكان بلا هاتف. العناوين منقولة كما وردت وبعضها مترجم آليًا — عند الالتباس ابحث بالاسم الإنجليزي على خرائط جوجل.</p></div></section><section class="cream section"><div class="wrap content-grid"><article><h2>أدلة قد تحتاجها بعد هذه</h2><p>هذه الصفحة جزء من دليل خدمات أوسع لمدينة العبور والعبور الجديدة، يضم أكثر من 1,300 مدخل موزعة على 16 دليلًا متخصصًا — كلها بالاسم والعنوان والهاتف والمصدر، وبلا ترتيب ولا تقييم ولا إعلانات.</p><div class="related">\${cross.map((x) => \`<a href="/\${x.parent}/\${x.slug}/">\${x.title} ↖</a>\`).join("")}<a href="/\${L.parent}/">\${d.title} كاملًا ↖</a><a href="/directory/">كل الأدلة ↖</a></div></article><aside class="action-card"><p>الأقرب إليك</p><a class="button" href="/\${L.parent}/">\${d.title} (\${d.items.length}) ↖</a><a class="text-link" href="/emergency/">أرقام الطوارئ ↖</a><a class="text-link" href="/search/">ابحث في كل الأدلة ↖</a></aside></div></section>\${refsHtml()}</main>\`;
}
`;
const anchor = "function renderSchoolDirectory() {";
if (!s.includes(anchor)) throw new Error("لم يتم العثور على مرساة الحقن.");
s = s.replace(anchor, landingTpl + builder + "\n" + anchor);

// 2) تسجيل الصفحات
const pagesCode = `
// صفحات الهبوط الفرعية
for (const L of landings) {
  const d = dirBySlug[L.parent];
  const items = d.items.filter((it) => it.c === L.sub);
  pages.push([
    \`\${L.parent}/\${L.slug}\`,
    L.title,
    L.desc,
    L.kw,
    { "@context": "https://schema.org", "@type": "ItemList", name: L.title, numberOfItems: items.length,
      itemListElement: items.slice(0, 40).map((it, i) => ({ "@type": "ListItem", position: i + 1,
        item: { "@type": "LocalBusiness", name: it.n, ...(it.t ? { telephone: it.t } : {}),
          address: { "@type": "PostalAddress", streetAddress: it.a || "مدينة العبور", addressLocality: "مدينة العبور", addressRegion: "القليوبية", addressCountry: "EG" } } })) },
    landingPage(L),
  ]);
}

`;
const writeAnchor = "for (const [slug, title, description, keywords, schema, body] of pages) write(slug,";
if (!s.includes(writeAnchor)) throw new Error("لم يتم العثور على حلقة الكتابة.");
s = s.replace(writeAnchor, pagesCode + writeAnchor);

// 3) روابط صفحات الهبوط داخل شرائح الدليل الأب
const chipFrom = 'const chips = d.subs.map((s, i) => `<a href="#g${i}">${s} <b>${d.items.filter((it) => it.c === s).length}</b></a>`).join("");';
const chipTo = 'const chips = d.subs.map((s, i) => { const L = landings.find((x) => x.parent === d.slug && x.sub === s); const href = L ? `/${L.parent}/${L.slug}/` : `#g${i}`; return `<a href="${href}">${s} <b>${d.items.filter((it) => it.c === s).length}</b></a>`; }).join("");';
if (!s.includes(chipFrom)) throw new Error("لم يتم العثور على شرائح الفئات.");
s = s.replace(chipFrom, chipTo);

// 4) فهرس البحث: إضافة صفحات الهبوط
const idxAnchor = "  ...directories.filter((d) => d.slug !== \"schools-all\").flatMap((d) =>";
if (!s.includes(idxAnchor)) throw new Error("لم يتم العثور على فهرس البحث.");
s = s.replace(idxAnchor, `  ...landings.map((L) => ({ n: L.title, d: L.desc, u: \`/\${L.parent}/\${L.slug}/\`, k: "صفحة" })),\n${idxAnchor}`);

fs.writeFileSync(p, s);

// 5) أنماط مسار التنقل
const cssPath = path.join(root, "client", "public", "static", "site.css");
let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(".crumbs")) {
  css += `
.crumbs{font-size:.8rem;color:var(--muted);margin-bottom:1rem}
.crumbs a{color:#285535;text-decoration:none;border-bottom:1px solid #a9c4b0;font-weight:700}
.crumbs span{font-weight:800;color:var(--deep)}
`;
  fs.writeFileSync(cssPath, css);
}

console.log("تمت إضافة صفحات الهبوط.");
