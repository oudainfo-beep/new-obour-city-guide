/**
 * build-all.mjs — منسّق البناء الموحد.
 *
 * بدل 80 عملية node منفصلة (كل واحدة تدفع تكلفة الإقلاع وإعادة قراءة الملفات)،
 * نستورد كل مراحل المحتوى في عملية واحدة بالترتيب نفسه — نفس السلوك، أسرع بمراحل.
 *
 * المصدر الوحيد للحقيقة: سلسلة "build" في package.json — يُستخرج منها تلقائيًا،
 * فلا تنجرف القائمة أبدًا. vite/esbuild يبقيان خطوات منفصلة في السلسلة.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

// "phases" تحمل سلسلة المراحل كاملة (المصدر الوحيد للحقيقة) — "build" تستدعي هذا المنسّق.
const chain = pkg.scripts.phases;
if (!chain) {
  console.error('build-all: package.json lacks a "phases" script — the phase chain lives there.');
  process.exit(1);
}
const scripts = [...chain.matchAll(/node (scripts\/[\w.-]+\.mjs)/g)]
  .map((m) => m[1])
  .filter((s) => s !== "scripts/build-all.mjs");

console.log(`build-all: ${scripts.length} phase scripts, single process\n`);

// بعض مراحل السلسلة تنهي نفسها بـ process.exit(0) — في العمليات المنفصلة هذا طبيعي،
// لكنه هنا سيقتل بقية السلسلة. نحوّل exit(0) إلى "نجاح مبكر" وexit(≠0) إلى فشل.
class PhaseExit extends Error {
  constructor(code) { super(`phase called process.exit(${code})`); this.code = code; }
}
const realExit = process.exit.bind(process);
process.exit = (code = 0) => { throw new PhaseExit(code); };

const t0 = performance.now();
let i = 0;
for (const rel of scripts) {
  i++;
  const start = performance.now();
  const name = path.basename(rel);
  try {
    // ?run= يكسر كاش الاستيراد: مرحلة تتكرر في السلسلة تعمل في كل موضع (كالعمليات المنفصلة)
    await import(pathToFileURL(path.join(root, rel)).href + `?run=${i}`);
    const ms = Math.round(performance.now() - start);
    if (ms > 1000) console.log(`  [${i}/${scripts.length}] ${name} — ${(ms / 1000).toFixed(1)}s`);
  } catch (e) {
    if (e instanceof PhaseExit && e.code === 0) continue; // نجاح مبكر — أكمل السلسلة
    const msg = e instanceof PhaseExit ? `exited with code ${e.code}` : e.message;
    console.error(`\n❌ FAILED at ${name}: ${msg}`);
    if (!(e instanceof PhaseExit)) console.error(e.stack?.split("\n").slice(0, 4).join("\n") || "");
    process.exit = realExit;
    process.exit(1);
  }
}

process.exit = realExit;

console.log(`\n✅ all ${scripts.length} phases done in ${((performance.now() - t0) / 1000).toFixed(1)}s (single process)`);
