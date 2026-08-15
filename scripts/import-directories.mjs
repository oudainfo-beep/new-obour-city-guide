/**
 * يستورد ملف «الدليل الشامل لمدينتي العبور والعبور الجديدة» (xlsx)
 * إلى ملفات JSON داخل data/directories/ ليبني منها المولد صفحات الأدلة.
 * المصدر يبقى محفوظًا لكل سجل، والهاتف غير المتاح يُترك فارغًا («—» في المصدر).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || path.join(process.env.HOME, "Downloads", "project-preview-9597a1.xlsx");
const outDir = path.join(root, "data", "directories");
fs.mkdirSync(outDir, { recursive: true });

// ترتيب الأولوية = ترتيب الظهور في صفحة الدليل
const SHEETS = [
  { sheet: "الصيدليات", slug: "pharmacies", title: "الصيدليات", one: "صيدلية",
    lead: "أقرب صيدلية ومواعيدها الليلية معلومة تسبق السعر في ترتيب أولويات السكن." },
  { sheet: "المستشفيات", slug: "hospitals", title: "المستشفيات والمراكز الطبية", one: "مستشفى",
    lead: "زمن الوصول لأقرب طوارئ ليلًا — لا نهارًا — هو الرقم الذي يجب أن تعرفه قبل الشراء." },
  { sheet: "الصحة - عيادات ومراكز", slug: "clinics", title: "العيادات والمراكز الطبية", one: "عيادة",
    lead: "عيادات ومعامل ومراكز تخصصية تخدم سكان العبور والعبور الجديدة." },
  { sheet: "المدارس", slug: "schools-all", title: "المدارس", one: "مدرسة",
    lead: "مدارس حكومية وخاصة ودولية تخدم المدينة ومحيطها." },
  { sheet: "التعليم - حضانات ومراكز", slug: "nurseries", title: "الحضانات والمراكز التعليمية", one: "حضانة أو مركز",
    lead: "حضانات وسناتر ومراكز لغات — أول سؤال للأسر المنتقلة حديثًا." },
  { sheet: "المطاعم والكافيهات", slug: "restaurants", title: "المطاعم والكافيهات", one: "مطعم أو كافيه",
    lead: "أوسع تجمع خدمي في المنطقة: مطاعم وكافيهات وحلويات وأسماك ومشويات." },
  { sheet: "التسوق", slug: "shopping", title: "التسوق والمحلات", one: "محل",
    lead: "سوبرماركت ومولات وملابس وإلكترونيات وأثاث — احتياجات الأسبوع الأول بعد الانتقال." },
  { sheet: "الخدمات المنزلية", slug: "home-services", title: "الخدمات المنزلية", one: "خدمة",
    lead: "سباكة وكهرباء وتكييف وصيانة ونظافة — أرقام تُطلب وقت الحاجة لا وقت التصفح." },
  { sheet: "الخدمات المهنية", slug: "professional-services", title: "الخدمات المهنية", one: "مكتب",
    lead: "محاماة ومحاسبة وهندسة وتسويق وخدمات شركات." },
  { sheet: "لياقة وتجميل", slug: "fitness", title: "اللياقة والتجميل", one: "مركز",
    lead: "جيم ونوادي ومراكز تجميل وحلاقة." },
  { sheet: "السيارات", slug: "automotive", title: "خدمات السيارات", one: "مركز",
    lead: "معارض وورش وكاوتش وغسيل وقطع غيار." },
  { sheet: "البنوك والخدمات المالية", slug: "banks", title: "البنوك والصرافات", one: "فرع أو ماكينة",
    lead: "فروع بنوك وماكينات صراف آلي داخل المدينة." },
  { sheet: "العقارات", slug: "real-estate-offices", title: "المكاتب والشركات العقارية", one: "مكتب",
    lead: "مكاتب ووسطاء وشركات عقارية عاملة في المدينة — للاطلاع لا للتوصية." },
  { sheet: "الترفيه", slug: "entertainment", title: "الترفيه والأنشطة", one: "مكان",
    lead: "نوادٍ وملاعب وأماكن ترفيه للأطفال والعائلات." },
  { sheet: "خدمات حكومية وعامة", slug: "government-services", title: "الخدمات الحكومية والعامة", one: "جهة",
    lead: "جهات ومكاتب خدمات عامة داخل المدينة." },
  { sheet: "اللوجستيات والمواصلات", slug: "logistics", title: "النقل والشحن", one: "شركة",
    lead: "شركات شحن ونقل وخدمات لوجستية." },
  { sheet: "الفنادق والإقامة", slug: "hotels", title: "الفنادق والإقامة", one: "مكان",
    lead: "خيارات الإقامة القصيرة في نطاق المدينة." },
];

const clean = (v) => (v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim());
const isDash = (v) => !v || /^[—–\-]+$/.test(v);

function readSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`ورقة غير موجودة: ${name}`);
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
  const hi = rows.findIndex((r) => r.map(clean).includes("الاسم"));
  if (hi < 0) throw new Error(`لا يوجد صف عناوين في: ${name}`);
  const head = rows[hi].map(clean);
  const col = (label) => head.indexOf(label);
  const iName = col("الاسم");
  const iEn = col("الاسم بالإنجليزية (كما ورد بالمصدر)");
  const iSub = col("الفئة الفرعية");
  const iType = col("النوع");
  const iAddr = col("العنوان");
  const iPhone = col("أرقام الهاتف");
  const iSrc = col("المصدر");

  const items = [];
  for (const r of rows.slice(hi + 1)) {
    const name = clean(r[iName]);
    if (!name || name === "الاسم") continue;
    const phoneRaw = iPhone >= 0 ? clean(r[iPhone]) : "";
    const phone = isDash(phoneRaw) ? "" : phoneRaw;
    const first = (phone.match(/[0-9+][0-9\s\-]{6,}/) || [""])[0].replace(/[\s\-]/g, "");
    items.push({
      n: name,
      e: iEn >= 0 ? clean(r[iEn]) : "",
      c: [iSub >= 0 ? clean(r[iSub]) : "", iType >= 0 ? clean(r[iType]) : ""].filter(Boolean).join(" · "),
      a: iAddr >= 0 ? clean(r[iAddr]) : "",
      p: phone,
      t: first,
      s: iSrc >= 0 ? clean(r[iSrc]) : "",
    });
  }
  return items;
}

const wb = XLSX.readFile(src);
const manifest = [];
let total = 0;

for (const cfg of SHEETS) {
  const items = readSheet(wb, cfg.sheet);
  // نُبقي كل السجلات كما وردت في المصدر: تكرار الاسم عبر فئتين فرعيتين مقصود
  const unique = items;
  const subs = [...new Set(unique.map((i) => i.c).filter(Boolean))].sort();
  fs.writeFileSync(
    path.join(outDir, `${cfg.slug}.json`),
    JSON.stringify({ slug: cfg.slug, title: cfg.title, one: cfg.one, lead: cfg.lead, subs, items }, null, 0),
  );
  manifest.push({ slug: cfg.slug, title: cfg.title, one: cfg.one, lead: cfg.lead, count: unique.length, subs: subs.length });
  total += unique.length;
  console.log(`${cfg.slug.padEnd(24)} ${String(unique.length).padStart(4)}  (${items.length - unique.length} مكرر)  ${subs.length} فئة فرعية`);
}

fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(manifest, null, 2));
console.log(`\nالإجمالي: ${total} سجلًا في ${manifest.length} دليلًا.`);
