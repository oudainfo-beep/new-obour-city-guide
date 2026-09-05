/**
 * seo-phase56-ahrefs-analytics.mjs
 * ================================
 * يحقن مقتطف Ahrefs Web Analytics في <head> لكل الصفحات (idempotent).
 * المفتاح من لوحة Ahrefs: data-key="J248aq0dS52m+zJNkOFSLA"
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SNIPPET = '<script src="https://analytics.ahrefs.com/analytics.js" data-key="J248aq0dS52m+zJNkOFSLA" async></script>';
const MARKER = "analytics.ahrefs.com/analytics.js";

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) listHtml(path.join(dir, e.name), out);
    else if (e.name === "index.html") out.push(path.join(dir, e.name));
  }
  return out;
}

function main() {
  const files = listHtml(clientDir);
  let added = 0, already = 0, noHead = 0;
  for (const f of files) {
    let html = fs.readFileSync(f, "utf8");
    if (html.includes(MARKER)) { already++; continue; }
    if (!html.includes("</head>")) { noHead++; continue; }
    html = html.replace("</head>", `  ${SNIPPET}\n</head>`);
    fs.writeFileSync(f, html);
    added++;
  }
  console.log(`phase56 (ahrefs analytics): أُضيف المقتطف إلى ${added} صفحة — موجود مسبقًا: ${already} — بلا <head>: ${noHead}`);
}

main();
