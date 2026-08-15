/**
 * يجعل قائمة صفحات vite تُبنى تلقائيًا من ملفات client/**\/index.html
 * بدل قائمة مكتوبة يدويًا تُنسى مع كل صفحة جديدة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "vite.config.ts");
let source = fs.readFileSync(configPath, "utf8");

if (source.includes("function htmlPageInputs")) {
  throw new Error("قائمة الصفحات التلقائية مضافة بالفعل.");
}

const helper = `// كل ملف client/**/index.html يصبح صفحة في البناء تلقائيًا — لا قائمة يدوية تُنسى.
function htmlPageInputs(): Record<string, string> {
  const clientRoot = path.resolve(import.meta.dirname, "client");
  const inputs: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "public" || entry.name === "src") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === "index.html") {
        const rel = path.relative(clientRoot, full);
        const key = rel === "index.html" ? "home" : rel.replace(/[\\\\/]index\\.html$/, "").replace(/[^a-zA-Z0-9]/g, "_");
        inputs[key] = full;
      }
    }
  };
  walk(clientRoot);
  return inputs;
}

export default defineConfig({`;

if (!source.includes("export default defineConfig({")) throw new Error("لم يتم العثور على defineConfig.");
source = source.replace("export default defineConfig({", helper);

const inputRe = /input: \{[\s\S]*?\n      \},/;
if (!inputRe.test(source)) throw new Error("لم يتم العثور على كتلة input.");
source = source.replace(inputRe, "input: htmlPageInputs(),");

fs.writeFileSync(configPath, source);
console.log("تم تحويل قائمة صفحات vite إلى قائمة تلقائية.");
