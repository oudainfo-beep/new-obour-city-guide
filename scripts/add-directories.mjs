/**
 * يربط أدلة data/directories/*.json بالمولد: صفحة لكل دليل + صفحة تجميع /directory/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("directoryHub")) throw new Error("الأدلة مربوطة بالفعل.");

// 1) جذر المشروع متاح للمولد
if (!s.includes("const projectRoot")) {
  s = s.replace('const client = path.join(root, "client");', 'const client = path.join(root, "client");\nconst projectRoot = root;');
}

// 2) حقن القوالب قبل investPage
const tpl = fs.readFileSync(path.join(here, "tpl-directory.txt"), "utf8");
const anchor = "const investPage = ";
if (!s.includes(anchor)) throw new Error("لم يتم العثور على investPage.");
s = s.replace(anchor, `${tpl}\n${anchor}`);

// 3) التنقل: استبدال الصيدليات والمطاعم بمدخل «دليل الخدمات»
const navFrom = '["/pharmacies/", "الصيدليات"], ["/restaurants/", "المطاعم"],';
if (!s.includes(navFrom)) throw new Error("لم يتم العثور على مدخلي الصيدليات والمطاعم في التنقل.");
s = s.replace(navFrom, '["/directory/", "دليل الخدمات"],');

// 4) إزالة صفحتي الصيدليات والمطاعم القديمتين من مصفوفة pages (ستُبنى من البيانات)
s = s.replace(/^ {2}\["pharmacies",[\s\S]*?pharmaciesPage\],\n/m, "");
s = s.replace(/^ {2}\["restaurants",[\s\S]*?restaurantsPage\],\n/m, "");
if (s.includes("pharmaciesPage],") || s.includes("restaurantsPage],")) {
  throw new Error("لم تُحذف الصفحتان القديمتان من مصفوفة pages.");
}

// 5) إضافة صفحة التجميع + صفحات الأدلة إلى pages
const hubEntry = `  ["directory", "دليل خدمات العبور", "أكثر من ألف مدخل موثّق: صيدليات ومستشفيات وعيادات ومطاعم وتسوق وخدمات منزلية ومهنية في مدينة العبور، بالاسم والعنوان والهاتف والمصدر.", "دليل العبور, خدمات العبور, ارقام العبور, دليل مدينة العبور", { "@context":"https://schema.org", "@type":"CollectionPage", name:"دليل خدمات العبور" }, directoryHub],
`;
const faqAnchor = `  ["faq", "الأسئلة الشائعة",`;
if (!s.includes(faqAnchor)) throw new Error("لم يتم العثور على مدخل الأسئلة.");
s = s.replace(faqAnchor, hubEntry + faqAnchor);

const dirPages = `
// صفحة لكل دليل بيانات (عدا schools-all فهي قسم داخل صفحة المدارس)
for (const d of directories) {
  if (d.slug === "schools-all") continue;
  pages.push([
    d.slug,
    d.title,
    \`\${d.title} في مدينة العبور: \${d.items.length} مدخلًا بالاسم والعنوان ورقم الهاتف ومصدر قابل للمراجعة. \${d.lead}\`,
    \`\${d.title} العبور, \${d.title} مدينة العبور, دليل \${d.title} العبور, ارقام \${d.title} العبور\`,
    { "@context": "https://schema.org", "@type": "ItemList", name: \`\${d.title} في مدينة العبور\`,
      numberOfItems: d.items.length,
      itemListElement: d.items.slice(0, 60).map((it, i) => ({
        "@type": "ListItem", position: i + 1,
        item: {
          "@type": "LocalBusiness", name: it.n,
          ...(it.c ? { description: it.c } : {}),
          ...(it.t ? { telephone: it.t } : {}),
          address: { "@type": "PostalAddress", streetAddress: it.a || "مدينة العبور", addressLocality: "مدينة العبور", addressRegion: "القليوبية", addressCountry: "EG" },
        },
      })) },
    directoryPage(d),
  ]);
}

`;
const writeAnchor = "for (const [slug, title, description, keywords, schema, body] of pages) write(slug,";
if (!s.includes(writeAnchor)) throw new Error("لم يتم العثور على حلقة الكتابة.");
s = s.replace(writeAnchor, dirPages + writeAnchor);

// 6) فهرس البحث: كل مداخل الأدلة
const idxFrom = `  ...pharmacies.map((x) => ({ n: x.name, a: x.area, t: x.type, u: "/pharmacies/", k: "صيدلية" })),
  ...restaurants.map((x) => ({ n: x.name, a: x.area, t: x.type, u: "/restaurants/", k: "مطعم" })),`;
const idxTo = `  ...directories.filter((d) => d.slug !== "schools-all").flatMap((d) =>
    d.items.map((it) => ({ n: it.n, a: it.a, t: it.c, u: \`/\${d.slug}/\`, k: d.one }))),
  ...dirBySlug["schools-all"].items.map((it) => ({ n: it.n, a: it.a, t: it.c, u: "/schools/", k: "مدرسة" })),`;
if (!s.includes(idxFrom)) throw new Error("لم يتم العثور على مولد فهرس البحث.");
s = s.replace(idxFrom, idxTo);

fs.writeFileSync(p, s);
console.log("تم ربط الأدلة وصفحة التجميع.");
