/**
 * seo-phase5-qa-blocks.mjs
 * المرحلة الخامسة (5.2): بلوك سؤال/إجابة + حقائق سريعة + FAQPage schema
 * لصفحات الكيانات: المطورين، الأحياء، الكمبوندات.
 *
 * المبادئ:
 *   - idempotent: marker <!-- phase5.2-qa-block --> يمنع التكرار.
 *   - لا معلومات مُختلعة: كل إجابة من النص المنشور في الصفحة نفسها.
 *   - صفحة عوده: الإفصاح إلزامي في الإجابة.
 *   - لا روابط خارجية جديدة ولا schema تقييمات.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const MARKER = "<!-- phase5.2-qa-block -->";

// ---------------------------------------------------------------------------
// استخراج بيانات من الصفحة
// ---------------------------------------------------------------------------
function extractTextBetween(html, start, end) {
  const m = html.match(new RegExp(`${start}([\\s\\S]*?)${end}`));
  return m ? m[1].trim() : "";
}

function cleanText(text) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? cleanText(m[1]) : "";
}

function extractDeveloperData(html) {
  const h1 = extractH1(html);
  const name = h1.replace(/ في العبور.*$/, "").replace(/:.*$/, "").trim();
  const table = extractTextBetween(html, "الدرجة من البيانات المنشورة", "<h2");
  const rows = [...table.matchAll(/<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g)];
  const scores = {};
  for (const r of rows) {
    const label = cleanText(r[1]).replace(/\s*\/5$/, "").trim();
    const val = cleanText(r[2]).replace("/5", "").trim();
    scores[label] = val;
  }
  const published = extractTextBetween(html, "ما هو منشور وقابل للفحص", "ما هو ناقص");
  const isOuda = name.includes("عوده") || html.includes("دليل العبور يرتبط بعلاقة مع عوده");
  return { name, scores, published: cleanText(published).slice(0, 200), isOuda };
}

function extractDistrictData(html) {
  const h1 = extractH1(html);
  const name = h1.replace(/ في العبور.*$/, "").replace(/:.*$/, "").trim();
  const table = extractTextBetween(html, "ملخص الحي من البيانات المنشورة", "<h2");
  const rows = [...table.matchAll(/<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g)];
  const facts = {};
  for (const r of rows) {
    facts[cleanText(r[1])] = cleanText(r[2]);
  }
  return { name, facts };
}

function extractCompoundData(html) {
  const h1 = extractH1(html);
  const name = h1.replace(/ في العبور.*$/, "").replace(/:.*$/, "").trim();
  const table = extractTextBetween(html, "ملخص المشروع من البيانات المنشورة", "<h2");
  const rows = [...table.matchAll(/<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g)];
  const facts = {};
  for (const r of rows) {
    facts[cleanText(r[1])] = cleanText(r[2]);
  }
  const published = extractTextBetween(html, "ما هو منشور وقابل للفحص", "ما هو ناقص");
  const isOuda = html.includes("دليل العبور يرتبط بعلاقة مع عوده");
  return { name, facts, published: cleanText(published).slice(0, 200), isOuda };
}

// ---------------------------------------------------------------------------
// بناء البلوك
// ---------------------------------------------------------------------------
function buildQuickFactsTable(facts) {
  const rows = Object.entries(facts)
    .map(([k, v]) => `<tr><th>${k}</th><td>${v || "غير منشور"}</td></tr>`)
    .join("");
  return `<div class="table-wrap"><table class="data-table">${rows}</table></div>`;
}

function buildDeveloperQABlock(data) {
  const scoreKeys = Object.keys(data.scores);
  const total = data.scores["المجموع"] || "";
  const top = scoreKeys.filter((k) => k !== "المجموع" && data.scores[k]).slice(0, 2);
  const topText = top.map((k) => `${k} (${data.scores[k]}/5)`).join("، ");
  const oudaNote = data.isOuda
    ? " تنبيه تحريري: الدليل يرتبط بعلاقة مع عوده للتطوير العقاري، ودرجتها محسوبة بنفس المعايير المنشورة المطبقة على الجميع."
    : "";
  const answer = `أبرز ما هو منشور عن ${data.name}: المجموع ${total}/5، وأعلى معيارين ${topText}.${oudaNote}`.replace(/\s+/g, " ").trim();
  const source = `مصدر: البيانات المنشورة في صفحة ${data.name} بالدليل.`;
  return { question: `ما أبرز ما هو منشور عن ${data.name}؟`, answer, source, facts: data.scores };
}

function buildDistrictQABlock(data) {
  const phase = data.facts["المرحلة"] || "غير منشور";
  const goal = data.facts["نوع الهدف المناسب"] || "غير منشور";
  const services = data.facts["حالة الخدمات"] || "غير منشور";
  const answer = `${data.name}: المرحلة ${phase}، ويناسب ${goal}، وحالة الخدمات: ${services}.`.slice(0, 250);
  const source = `مصدر: ملخص الحي من البيانات المنشورة في صفحة ${data.name}.`;
  return { question: `ما حالة ${data.name} ومن يصلح له؟`, answer, source, facts: data.facts };
}

function buildCompoundQABlock(data) {
  const dev = data.facts["المطوّر"] || data.facts["المطور"] || "غير منشور";
  const district = data.facts["الحي / الموقع"] || "غير منشور";
  const status = data.facts["الحالة"] || "غير منشور";
  const sourceName = data.facts["المصدر"] || "غير منشور";
  const oudaNote = data.isOuda
    ? " تنبيه تحريري: الدليل يرتبط بعلاقة مع عوده للتطوير العقاري مطوّر هذا المشروع."
    : "";
  const answer = `${data.name}: مطوّره ${dev}، الموقع ${district}، الحالة ${status}.${oudaNote}`.replace(/\s+/g, " ").trim();
  const source = `مصدر: ${sourceName}.`;
  return { question: `ما البيانات المنشورة عن ${data.name}؟`, answer, source, facts: data.facts };
}

function hasQuickFactsTable(html) {
  return html.includes("ملخص الحي من البيانات المنشورة") || html.includes("ملخص المشروع من البيانات المنشورة") || html.includes("الدرجة من البيانات المنشورة");
}

function hasFAQSchema(html) {
  return html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"');
}

function buildFAQSchema(question, answer, url) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answer,
        },
      },
    ],
  };
}

function injectQABlock(html, block, slug) {
  if (html.includes(MARKER)) return html;
  const factsTable = hasQuickFactsTable(html) ? "" : buildQuickFactsTable(block.facts);
  const qaHtml = `
${MARKER}
<section class="paper section" data-qa-block="true"><div class="wrap"><h2>سؤال وإجابة</h2>
<div class="qa-block" style="background:#fbfaf4;border:1px solid #dbe3da;border-radius:8px;padding:1.1rem 1.2rem;margin:1rem 0">
  <p><strong>س:</strong> ${block.question}</p>
  <p><strong>ج:</strong> ${block.answer}</p>
  <p style="font-size:.82rem;color:#607067;margin-top:.6rem"><em>${block.source}</em></p>
</div>
${factsTable ? `<h3>حقائق سريعة</h3>${factsTable}` : ""}
</div></section>
`;
  // insert after the page-hero section
  const heroEnd = html.match(/<\/section>\s*<section class="paper section"/);
  if (heroEnd) {
    const idx = heroEnd.index + "</section>".length;
    return html.slice(0, idx) + qaHtml + html.slice(idx);
  }
  // fallback: before </main>
  return html.replace("</main>", `${qaHtml}</main>`);
}

function injectFAQSchema(html, block, url) {
  if (hasFAQSchema(html)) return html;
  const schema = buildFAQSchema(block.question, block.answer, url);
  const script = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  return html.replace("</head>", `${script}</head>`);
}

// ---------------------------------------------------------------------------
// معالجة المجلدات
// ---------------------------------------------------------------------------
function listIndexFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const idx = path.join(dir, e.name, "index.html");
    if (fs.existsSync(idx)) out.push(idx);
  }
  return out;
}

function processEntityPage(file, type, slug) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(MARKER)) {
    return { status: "skipped", slug };
  }
  let block;
  if (type === "developer") {
    const data = extractDeveloperData(html);
    if (!data.name) return { status: "no-name", slug };
    block = buildDeveloperQABlock(data);
  } else if (type === "district") {
    const data = extractDistrictData(html);
    if (!data.name) return { status: "no-name", slug };
    block = buildDistrictQABlock(data);
  } else if (type === "compound") {
    const data = extractCompoundData(html);
    if (!data.name) return { status: "no-name", slug };
    block = buildCompoundQABlock(data);
  } else {
    return { status: "unknown-type", slug };
  }
  const url = `${SITE}${slug}`;
  html = injectQABlock(html, block, slug);
  html = injectFAQSchema(html, block, url);
  fs.writeFileSync(file, html);
  return { status: "injected", slug, question: block.question };
}

// ---------------------------------------------------------------------------
function main() {
  const counts = { developer: 0, district: 0, compound: 0, skipped: 0, noName: 0 };

  const developersDir = path.join(clientDir, "developers");
  for (const f of listIndexFiles(developersDir)) {
    const slug = "/developers/" + path.basename(path.dirname(f)) + "/";
    const r = processEntityPage(f, "developer", slug);
    if (r.status === "injected") counts.developer++;
    if (r.status === "skipped") counts.skipped++;
    if (r.status === "no-name") counts.noName++;
  }

  const districtsDir = path.join(clientDir, "districts");
  for (const f of listIndexFiles(districtsDir)) {
    const slug = "/districts/" + path.basename(path.dirname(f)) + "/";
    const r = processEntityPage(f, "district", slug);
    if (r.status === "injected") counts.district++;
    if (r.status === "skipped") counts.skipped++;
    if (r.status === "no-name") counts.noName++;
  }

  const compoundsDir = path.join(clientDir, "compounds");
  for (const f of listIndexFiles(compoundsDir)) {
    const slug = "/compounds/" + path.basename(path.dirname(f)) + "/";
    const r = processEntityPage(f, "compound", slug);
    if (r.status === "injected") counts.compound++;
    if (r.status === "skipped") counts.skipped++;
    if (r.status === "no-name") counts.noName++;
  }

  rep("qa", `مطوّرون: ${counts.developer}، أحياء: ${counts.district}، كمبوندات: ${counts.compound}، تُخطّى: ${counts.skipped}، بلا اسم: ${counts.noName}`);

  console.log("=== تقرير المرحلة الخامسة: بلوكات سؤال/إجابة (5.2) ===");
  for (const line of report) console.log(line);
  console.log(`=== انتهى: ${report.length} عملية ===`);
}

main();
