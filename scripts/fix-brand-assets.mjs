/**
 * كل صور الموقع كانت على مسار /manus-storage/ وهو وسيط تطوير محلي فقط،
 * فكانت ترجع 404 على الإنتاج: الشعار والأيقونة وصورة الهيرو وصورة المشاركة.
 * هذا السكربت يحوّلها إلى أصول حقيقية داخل المستودع تحت /brand/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatorPath = path.join(root, "scripts", "render-static.mjs");
let source = fs.readFileSync(generatorPath, "utf8");

if (source.includes("/brand/logo.svg")) throw new Error("أصول العلامة مرتبطة بالفعل.");

const replacements = [
  ['const logo = "/manus-storage/new-obour-guide-logo_ec68776f.png";',
   'const logo = "/brand/logo.svg";\nconst logoRaster = "/brand/logo.png";\nconst ogImage = "/brand/og.png";'],
  ['const hero = "/manus-storage/new-obour-hero-atlas_06362579.png";',
   'const hero = "/brand/atlas-hero.svg";'],
  ['const connectivity = "/manus-storage/new-obour-connectivity-map_406e109a.png";', ''],
  ['const neighborhoodsImage = "/manus-storage/new-obour-neighborhoods_ebcc4c51.png";',
   'const neighborhoodsImage = "/brand/districts-plan.svg";'],
  // الأيقونة: SVG بدل PNG
  ['<link rel="icon" type="image/png" href="${logo}">',
   '<link rel="icon" type="image/svg+xml" href="${logo}"><link rel="apple-touch-icon" href="${logoRaster}">'],
  // صورة المشاركة الاجتماعية: PNG حقيقي بمقاس 1200x630
  ['<meta property="og:image" content="${site}${hero}">',
   '<meta property="og:image" content="${site}${ogImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'],
  // شعار المنظمة في البيانات المنظمة: نسخة نقطية
  ['logo: `${site}${logo}`', 'logo: `${site}${logoRaster}`'],
  // نصوص بديلة صادقة: هذه رسوم توضيحية وليست صورًا فوتوغرافية للمدينة
  ['alt="مشهد جوي تحريري لمدينة جديدة ومسارات اتصال"',
   'alt="رسم توضيحي تجريدي لمخطط مدينة ومحاورها"'],
  ['alt="شارع سكني هادئ في مدينة جديدة"',
   'alt="رسم تخطيطي تجريدي لنسيج أحياء سكنية ومحاور مرورية"'],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`لم يتم العثور على: ${from.slice(0, 70)}`);
  source = source.replace(from, to);
}

if (source.includes("manus-storage")) {
  throw new Error("ما زال هناك مرجع إلى manus-storage في المولد.");
}

fs.writeFileSync(generatorPath, source);

// حذف ملفات HTML قديمة خارج البناء تحمل canonical للنطاق القديم newobourguide.com
const clientDir = path.join(root, "client");
const stale = fs.readdirSync(clientDir).filter((f) => f.endsWith(".html"));
let removed = 0;
for (const f of stale) {
  const p = path.join(clientDir, f);
  if (fs.readFileSync(p, "utf8").includes("newobourguide.com")) {
    fs.unlinkSync(p);
    removed++;
  }
}

console.log(`تم ربط أصول العلامة، وحذف ${removed} ملف HTML قديم يحمل النطاق القديم.`);
