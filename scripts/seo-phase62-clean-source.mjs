/**
 * seo-phase62-clean-source.mjs — مصدر نظيف بلا بصمات خط البناء.
 *
 * الصفحات كانت تحمل تعليقات HTML بأسماء مراحل التوليد (<!-- phase17-… -->)
 * — بصمة بايبلاين ظاهرة لأي شخص يفتح «عرض المصدر». هذه المرحلة:
 *  1) تحصد كل علّامة مرحلة إلى سمة واحدة على وسم <html>: data-b="b17-performance …"
 *     (فحوص الـ idempotency في المراحل صارت تقرأها — لا تكرار حقن أبدًا).
 *  2) تحذف كل تعليقات HTML من الصفحات نهائيًا.
 * idempotent: من لا تعليقات لديه ولا جديد في data-b لا يُلمس.
 * تعمل في نهاية السلسلة بعد كل مراحل المحتوى.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules"].includes(e.name)) continue;
      yield* walk(p);
    } else if (e.name === "index.html") yield p;
  }
}

// phaseX → bX · seo-authority-compounds-links → bacl
const codeOf = (m) => m === "seo-authority-compounds-links" ? "bacl" : "b" + m.replace(/^phase/, "");
const MARKER_RE = /<!--\s*(phase[\w.-]+|seo-authority-compounds-links)\s*-->/g;

let cleaned = 0, harvested = 0;
for (const file of walk(clientDir)) {
  let html = fs.readFileSync(file, "utf8");
  const found = [...html.matchAll(MARKER_RE)].map((m) => codeOf(m[1]));
  let out = html;

  if (found.length) {
    const htmlTag = out.match(/<html[^>]*>/)[0];
    const have = (htmlTag.match(/data-b="([^"]*)"/) || [,""])[1].split(/\s+/).filter(Boolean);
    const merged = [...new Set([...have, ...found])].sort();
    const newTag = htmlTag.match(/data-b="/)
      ? htmlTag.replace(/data-b="[^"]*"/, `data-b="${merged.join(" ")}"`)
      : htmlTag.replace(/>$/, ` data-b="${merged.join(" ")}">`);
    out = out.replace(htmlTag, newTag);
    harvested++;
  }

  const noComments = out.replace(/<!--[\s\S]*?-->/g, "");
  if (noComments !== html) {
    fs.writeFileSync(file, noComments, "utf8");
    cleaned++;
  }
}

console.log(`[phase62] clean source: ${cleaned} صفحة بلا تعليقات، علّامات محصودة في data-b لـ ${harvested} صفحة`);
