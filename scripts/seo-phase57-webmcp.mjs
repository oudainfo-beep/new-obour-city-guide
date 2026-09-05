/**
 * seo-phase57-webmcp.mjs
 * ======================
 * يحقن سكربت WebMCP (/static/webmcp.js) في <head> لكل الصفحات (idempotent) —
 * يعرّض أدوات الموقع لوكلاء المتصفح عبر navigator.modelContext.registerTool.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SNIPPET = '<script src="/static/webmcp.js" defer></script>';
const MARKER = "/static/webmcp.js";

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) listHtml(path.join(dir, e.name), out);
    else if (e.name === "index.html") out.push(path.join(dir, e.name));
  }
  return out;
}

function main() {
  const files = listHtml(clientDir);
  let added = 0, already = 0;
  for (const f of files) {
    let html = fs.readFileSync(f, "utf8");
    if (html.includes(MARKER)) { already++; continue; }
    if (!html.includes("</head>")) continue;
    html = html.replace("</head>", `  ${SNIPPET}\n</head>`);
    fs.writeFileSync(f, html);
    added++;
  }
  console.log(`phase57 (webmcp): أُضيف سكربت الأدوات إلى ${added} صفحة — موجود مسبقًا: ${already}`);
}

main();
