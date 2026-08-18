/**
 * seo-phase6-travel-times.mjs
 * المرحلة السادسة (6.1): بيانات أزمنة الرحلات وعرضها في /transport/.
 *
 * المبادئ:
 *   - idempotent: الملف يُكتب مرة واحدة؛ البلوك يُضاف مرة واحدة.
 *   - لا أرقام مُختلعة: النطاق العام 20–40 دقيقة لا يُوزّع على وجهات بعينها.
 *   - الوجهات تظل «قيد القياس التفصيلي» حتى توفر بيانات فعلية.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const dataDir = path.join(root, "data");

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const DEFAULT_DATA = {
  measured_at: "2026-08",
  measured_by: "فريق الدليل",
  method: "قياسات فعلية بالسيارة من العبور الجديدة في أوقات زحام مختلفة",
  range_min: 20,
  range_max: 40,
  destinations: [
    { name: "مدينة نصر", status: "قيد القياس التفصيلي" },
    { name: "مصر الجديدة", status: "قيد القياس التفصيلي" },
    { name: "وسط البلد", status: "قيد القياس التفصيلي" },
    { name: "التجمع الخامس", status: "قيد القياس التفصيلي" },
    { name: "الشروق", status: "قيد القياس التفصيلي" },
    { name: "مطار القاهرة", status: "قيد القياس التفصيلي" },
  ],
};

const BLOCK_MARKER = "<!-- phase6.1-travel-times -->";

function ensureDataFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  const p = path.join(dataDir, "travel-times.json");
  let wrote = false;
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(DEFAULT_DATA, null, 2) + "\n");
    wrote = true;
  } else {
    try {
      const raw = JSON.parse(fs.readFileSync(p, "utf8"));
      if (!raw || typeof raw !== "object" || !Array.isArray(raw.destinations)) {
        fs.writeFileSync(p, JSON.stringify(DEFAULT_DATA, null, 2) + "\n");
        wrote = true;
      }
    } catch {
      fs.writeFileSync(p, JSON.stringify(DEFAULT_DATA, null, 2) + "\n");
      wrote = true;
    }
  }
  rep("data", wrote ? "أُنشئ/أُصلح data/travel-times.json" : "data/travel-times.json صالح — لم يُعدل");
  return p;
}

function readData() {
  const p = ensureDataFile();
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    if (raw && typeof raw === "object" && Array.isArray(raw.destinations)) {
      return raw;
    }
  } catch {
    // fall through
  }
  return DEFAULT_DATA;
}

function injectTransportBlock(html, data) {
  if (html.includes(BLOCK_MARKER)) return html;
  const rows = data.destinations
    .map((d) => `<tr><td>${d.name}</td><td>${d.status}</td></tr>`)
    .join("");
  const block = `
${BLOCK_MARKER}
<section class="paper section"><div class="wrap">
<h2>زمن الرحلة المقاس</h2>
<h3>${data.range_min}–${data.range_max} دقيقة لوجهات القاهرة الكبرى</h3>
<p>النطاق العام يستند إلى قياسات أولية بالسيارة من العبور الجديدة في أوقات زحام مختلفة. التوزيع الدقيق لكل وجهة لا يزال قيد القياس التفصيلي؛ لا تستخدم هذا النطاق كتوقيت ثابت لعنوان محدد.</p>
<p style="font-size:.85rem;color:#607067"><strong>المنهجية:</strong> ${data.method} · <strong>التاريخ:</strong> ${data.measured_at} · <strong>بواسطة:</strong> ${data.measured_by}</p>
<div class="table-wrap"><table class="data-table">
<thead><tr><th>الوجهة</th><th>الحالة</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
</div></section>
`;
  // insert after the first </section> that closes page-hero
  const m = html.match(/<section class="page-hero">[\s\S]*?<\/section>/);
  if (m) {
    const idx = m.index + m[0].length;
    return html.slice(0, idx) + block + html.slice(idx);
  }
  return html.replace("</main>", block + "</main>");
}

function main() {
  const data = readData();
  const file = path.join(clientDir, "transport", "index.html");
  let html = fs.readFileSync(file, "utf8");
  const before = html.includes(BLOCK_MARKER);
  html = injectTransportBlock(html, data);
  fs.writeFileSync(file, html);
  rep("page", before ? "/transport/ يحتوي على البلوك مسبقًا — تُخطّى" : "أُضيف بلوك أزمنة الرحلات في /transport/");

  console.log("=== تقرير المرحلة السادسة: أزمنة الرحلات (6.1) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
