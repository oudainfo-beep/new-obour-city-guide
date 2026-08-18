/**
 * seo-phase6-schools.mjs
 * المرحلة السادسة (6.4): تحديث 3 صفحات مدارس ببيانات موثقة.
 *
 * المدارس المحدثة:
 *   1. /schools/nile-egyptian-school-obour/
 *   2. /schools/international-public-school-obour/
 *   3. /schools/egyptian-japanese-school-obour/
 *
 * المبادئ:
 *   - idempotent: marker <!-- phase6.4-school-update --> يمنع التكرار.
 *   - لا تعديل لباقي المدارس السبع.
 *   - الحقول غير الموثقة تبقى «غير منشور».
 *   - المصادر المذكورة هي المصادر الوحيدة المسموح بالاستناد إليها.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const MARKER = "<!-- phase6.4-school-update -->";

const UPDATES = [
  {
    slug: "nile-egyptian-school-obour",
    tableChanges: [
      { label: "العنوان", value: "13 شارع مبارك مهران، الحي السابع، مدينة العبور" },
      { label: "الهاتف", value: "01007189791" },
      { label: "البريد الإلكتروني", value: "info.obour@nes.moe.edu.eg" },
    ],
    captionSource: {
      text: "تحديث أغسطس 2026: العنوان والهاتف والبريد منقولون عن الموقع الرسمي لمدارس النيل المصرية الدولية.",
      url: "https://nes.moe.gov.eg",
      urlText: "الموقع الرسمي nes.moe.gov.eg ↖",
    },
  },
  {
    slug: "international-public-school-obour",
    tableChanges: [
      { label: "الهاتف", value: "01021806667" },
      { label: "رسوم إرشادية", value: "FS: حدود 22,425 ج / Year 1–6: حدود 28,750 ج — رسوم منشورة في دليل مدارس خارجي (يناير 2026)، تحقق مباشرة من المدرسة" },
    ],
    captionSource: {
      text: "تحديث أغسطس 2026: الهاتف منقول عن الموقع الرسمي لمؤسسة المدارس الدولية في مصر. الرسوم الإرشادية من دليل مدارس خارجي (يناير 2026) — يجب التحقق منها مباشرة قبل التقديم.",
      url: "https://fise-eg.org/ips/",
      urlText: "الموقع الرسمي fise-eg.org ↖",
    },
  },
  {
    slug: "egyptian-japanese-school-obour",
    tableChanges: [
      { label: "النظام التعليمي", value: "مدارس مصرية يابانية حكومية — التقديم عبر البوابة الرسمية ejs.moe.gov.eg" },
      { label: "رسوم إرشادية", value: "KG: حدود 18,400 ج / G1–5: حدود 16,215 ج — رسوم منشورة في دليل مدارس خارجي (يناير 2026)، تحقق مباشرة من المدرسة" },
    ],
    captionSource: {
      text: "تحديث أغسطس 2026: النظام والتقديم منقولان عن البوابة الرسمية للمدارس المصرية اليابانية. الرسوم الإرشادية من دليل مدارس خارجي (يناير 2026) — يجب التحقق منها مباشرة قبل التقديم.",
      url: "https://ejs.moe.gov.eg",
      urlText: "البوابة الرسمية ejs.moe.gov.eg ↖",
    },
  },
];

function addRowsToTable(html, rows) {
  // Find the table body: starts after <div><b>البند</b><b>التفاصيل</b></div>
  const tableStart = html.indexOf('<div><b>البند</b><b>التفاصيل</b></div>');
  if (tableStart === -1) return { html, added: false };

  // Find the end of the table: the closing </div> before the caption <p class="caption">
  const captionIdx = html.indexOf('<p class="caption">', tableStart);
  if (captionIdx === -1) return { html, added: false };

  let inserted = 0;
  let tableSegment = html.slice(tableStart, captionIdx);

  for (const row of rows) {
    const rowHtml = `<div><span>${row.label}</span><span>${row.value}</span></div>`;
    if (tableSegment.includes(`<span>${row.label}</span>`)) {
      // Replace existing row value
      const re = new RegExp(`<div><span>${row.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</span><span>[^<]*</span></div>`);
      const updated = tableSegment.replace(re, rowHtml);
      if (updated !== tableSegment) {
        tableSegment = updated;
        inserted++;
      }
    } else {
      tableSegment += rowHtml;
      inserted++;
    }
  }

  const newHtml = html.slice(0, tableStart) + tableSegment + html.slice(captionIdx);
  return { html: newHtml, added: inserted > 0 };
}

function updateCaption(html, source) {
  // Add/update caption paragraph after the table
  const captionRe = /<p class="caption">[\s\S]*?<\/p>/;
  const newCaption = `<p class="caption">${source.text} <a href="${source.url}" target="_blank" rel="noopener">${source.urlText}</a></p>`;
  if (captionRe.test(html)) {
    return html.replace(captionRe, newCaption);
  }
  // If no caption, insert before first <h2> after table
  return html.replace(/(<p class="caption">[\s\S]*?<\/p>)/, newCaption);
}

function updateSchool(slug, changes) {
  const file = path.join(clientDir, "schools", slug, "index.html");
  if (!fs.existsSync(file)) {
    rep("missing", `صفحة /schools/${slug}/ غير موجودة`);
    return { status: "missing", slug };
  }
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) {
    rep("skipped", `/schools/${slug}/ مُحدَّثة مسبقًا`);
    return { status: "skipped", slug };
  }

  const { html: html2, added } = addRowsToTable(html, changes.tableChanges);
  if (!added) {
    rep("warn", `/schools/${slug}/: لم يُضف أي صف للجدول`);
  }
  let html3 = updateCaption(html2, changes.captionSource);

  // Add marker before </article>
  html3 = html3.replace("</article>", `${MARKER}\n</article>`);

  fs.writeFileSync(file, html3);
  rep("updated", `/schools/${slug}/: أُضيف/أُحدث ${changes.tableChanges.length} بند`);
  return { status: "updated", slug };
}

function main() {
  for (const u of UPDATES) {
    updateSchool(u.slug, u);
  }

  console.log("=== تقرير المرحلة السادسة: تحديث المدارس (6.4) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
