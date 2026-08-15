import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "scripts", "render-static.mjs");
let s = fs.readFileSync(p, "utf8");

if (s.includes("access-schematic")) throw new Error("مضاف بالفعل.");

const reps = [
  ['const hero = "/brand/atlas-hero.svg";',
   'const hero = "/brand/atlas-hero.svg";\nconst connectivity = "/brand/access-schematic.svg";'],
  // نص بديل وتعليق صادقان: هذا رسم تخطيطي وليس خريطة للمدينة
  ['alt="رسم توضيحي لشبكة وصول مدينة العبور الجديدة"',
   'alt="رسم تخطيطي تجريدي لمحاور حركة ومحطة مركزية"'],
  ['<figcaption>خريطة إرشادية<br>غير مقياسية</figcaption>',
   '<figcaption>رسم تخطيطي توضيحي<br>وليس خريطة للمدينة</figcaption>'],
];

for (const [from, to] of reps) {
  if (!s.includes(from)) throw new Error(`لم يتم العثور على: ${from.slice(0, 60)}`);
  s = s.replace(from, to);
}

fs.writeFileSync(p, s);
console.log("تم ربط الرسم التخطيطي وتصحيح النص البديل والتعليق.");
