/**
 * seo-phase6-mortgage.mjs
 * المرحلة السادسة (6.5): تحديث /tools/mortgage-affordability/ بجدول
 * شروط التمويل العقاري المنشورة رسميًا + SoftwareApplication schema.
 *
 * المبادئ:
 *   - idempotent: marker <!-- phase6.5-mortgage-table --> يمنع التكرار.
 *   - روابط البنوك الخارجية nofollow.
 *   - ما لا يُجد رابطًا رسميًا يعمل = «غير منشور».
 *   - لا أرقام أو شروط غير منشورة في المتن.
 *
 * الروابط أدناه تم التحقق منها (200 OK) من نقطة الوصول الحالية خلال أغسطس 2026.
 * ملاحظة: موقع hdb-egy.com يستخدم شهادة TLS فيها تحذير، لكن الصفحة نفسها متاحة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const CHECKED_AT = "2026-08";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const MARKER = "<!-- phase6.5-mortgage-table -->";

const BANKS = [
  {
    name: "بنك التعمير والإسكان (HDB)",
    product: "برنامج التمويل العقاري",
    url: "https://www.hdb-egy.com/loans/page.php?permalink=mortgage-financing-program",
    note: "تحقق من الشروط والمستندات المطلوبة مباشرة",
    status: "رابط رسمي يعمل",
  },
  {
    name: "البنك التجاري الدولي (CIB)",
    product: "Mortgages",
    url: "https://www.cibeg.com/en/personal/mortgages",
    note: "صفحة التمويل العقاري الرسمية",
    status: "رابط رسمي يعمل",
  },
  {
    name: "الأهلي لتمويل العقارات (AMF)",
    product: "تمويل عقاري سكني وتجاري",
    url: "https://www.amf.com.eg/en",
    note: "شركة تمويل عقاري تابعة للبنك الأهلي المصري",
    status: "رابط رسمي يعمل",
  },
  {
    name: "بنك مصر",
    product: "بروتوكول تعاون مع جهاز المجتمعات العمرانية",
    url: "https://www.banquemisr.com/ABOUT-US/News/Banque-Misr-signs-a-cooperation-protocol-with-the-New-Urban-Communities-Authority",
    note: "خبر رسمي عن تفعيل نظام التمويل العقاري في السوق المفتوحة",
    status: "رابط رسمي يعمل",
  },
  {
    name: "البنك الأهلي المصري (NBE)",
    product: "غير منشور",
    url: null,
    note: "لم يُتحقق من صفحة رسمية مباشرة لبرنامج التمويل العقاري من نقطة الوصول الحالية",
    status: "غير منشور",
  },
  {
    name: "بنك QNB مصر",
    product: "غير منشور",
    url: null,
    note: "لم يُتحقق من صفحة رسمية مباشرة لبرنامج التمويل العقاري من نقطة الوصول الحالية",
    status: "غير منشور",
  },
];

function buildTable() {
  const rows = BANKS.map((b) => {
    const link = b.url
      ? `<a href="${b.url}" target="_blank" rel="nofollow noopener">${b.product} ↗</a>`
      : b.product;
    return `<tr><td>${b.name}</td><td>${link}</td><td>${b.status}</td><td>${b.note}</td></tr>`;
  }).join("");
  return `
${MARKER}
<h2>شروط التمويل العقاري المنشورة رسميًا</h2>
<p>الجدول أدناه يضم جهات وُجد لها رابط رسمي يعمل وقت المراجعة. لا يحتوي على أسعار فائدة أو نسب تمويل لم تُنشر رسميًا؛ أي تفصيل مالي يجب التحقق منه مباشرة مع الجهة قبل التعاقد.</p>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>الجهة / البنك</th><th>المنتج</th><th>الحالة</th><th>ملاحظة</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p style="font-size:.82rem;color:#607067">تاريخ التحقق من الروابط: ${CHECKED_AT}. الروابط خارجية nofollow؛ الدليل لا يتلقى أي مقابل عن إدراجها.</p>
`;
}

function addSoftwareSchema(html) {
  if (html.includes('"@type":"SoftwareApplication"')) return html;
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "حاسبة قسط التمويل العقاري",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EGP",
    },
    "description": "حاسبة تقديرية لأقصى قسط شهري ومبلغ قرض عقاري بناءً على الدخل والمصروفات.",
    "url": `${SITE}/tools/mortgage-affordability/`,
  };
  const script = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  return html.replace("</head>", `${script}</head>`);
}

function main() {
  const file = path.join(clientDir, "tools", "mortgage-affordability", "index.html");
  let html = fs.readFileSync(file, "utf8");

  if (html.includes(MARKER)) {
    rep("table", "/tools/mortgage-affordability/: الجدول موجود مسبقًا — تُخطّى");
  } else {
    html = html.replace("</article>", `${buildTable()}\n</article>`);
    rep("table", "أُضيف جدول شروط التمويل العقاري في /tools/mortgage-affordability/");
  }

  const beforeSchema = html.includes('"@type":"SoftwareApplication"');
  html = addSoftwareSchema(html);
  if (!beforeSchema) {
    rep("schema", "أُضيف SoftwareApplication schema");
  } else {
    rep("schema", "SoftwareApplication schema موجود مسبقًا — تُخطّى");
  }

  fs.writeFileSync(file, html);

  console.log("=== تقرير المرحلة السادسة: تحديث حاسبة التمويل العقاري (6.5) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
