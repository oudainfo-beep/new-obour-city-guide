/**
 * seo-phase8-meta-optimize.mjs
 * تحسين عناوين ووصف meta لصفحات التصنيفات الرئيسية.
 *
 * idempotent: كل تعديل محمي بعلامة خاصة به.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

const report = [];
const rep = (k, m) => report.push(`[${k}] ${m}`);

const OPTIMIZATIONS = [
  {
    path: "hospitals/index.html",
    marker: "<!-- phase8-meta-hospitals -->",
    title: "مستشفيات العبور والعبور الجديدة: دليل الطوارئ والعناوين 2026",
    description: "مستشفيات ومراكز طبية في العبور والعبور الجديدة: عناوين، هواتف، أقرب طوارئ لكل حي. بيانات منشورة قابلة للتحقق — لا تلميع.",
  },
  {
    path: "clinics/index.html",
    marker: "<!-- phase8-meta-clinics -->",
    title: "عيادات العبور والعبور الجديدة: أطباء، معامل، وأشعة بالعناوين",
    description: "عيادات وأطباء ومعامل تحاليل وأشعة في العبور والعبور الجديدة: 105 مدخل بالاسم والعنوان والهاتف والمصدر.",
  },
  {
    path: "fitness/index.html",
    marker: "<!-- phase8-meta-fitness -->",
    title: "جيم ونوادي رياضية في العبور والعبور الجديدة: دليل العناوين",
    description: "جيمات ونوادي رياضية ومراكز تجميل في العبور والعبور الجديدة: 40 مدخل بالاسم والعنوان والهاتف والمصدر.",
  },
  {
    path: "banks/index.html",
    marker: "<!-- phase8-meta-banks -->",
    title: "بنوك وماكينات صراف آلي في العبور والعبور الجديدة",
    description: "فروع بنوك وماكينات صراف آلي في العبور والعبور الجديدة: 78 مدخل بالاسم والعنوان والهاتف والمصدر.",
  },
  {
    path: "nurseries/index.html",
    marker: "<!-- phase8-meta-nurseries -->",
    title: "حضانات ومراكز تعليمية في العبور والعبور الجديدة: دليل الأرقام",
    description: "حضانات وسناتر ومراكز لغات في العبور والعبور الجديدة: 38 مدخل بالاسم والعنوان والهاتف والمصدر.",
  },
  {
    path: "shopping/index.html",
    marker: "<!-- phase8-meta-shopping -->",
    title: "مولات ومحلات العبور والعبور الجديدة: دليل التسوق بالأرقام",
    description: "مولات وسوبرماركت ومحلات ملابس وإلكترونيات وأثاث في العبور والعبور الجديدة: 285 مدخل بالاسم والعنوان والهاتف.",
  },
  {
    path: "dining-guide/index.html",
    marker: "<!-- phase8-meta-dining -->",
    title: "مطاعم وكافيهات العبور والعبور الجديدة: دليل الأكل والتوصيل",
    description: "مطاعم وكافيهات وخدمات توصيل في العبور والعبور الجديدة: اكتشف الخيارات حسب الحي والميزانية مع بيانات منشورة.",
  },
  {
    path: "cafes/index.html",
    marker: "<!-- phase8-meta-cafes -->",
    title: "كافيهات العبور والعبور الجديدة: دليل العناوين والأرقام 2026",
    description: "كافيهات ومحامص ومقاهي في العبور والعبور الجديدة: 36 مدخل بالاسم والعنوان والهاتف والمصدر.",
  },
  {
    path: "directory/index.html",
    marker: "<!-- phase8-meta-directory -->",
    title: "دليل خدمات العبور والعبور الجديدة: 1300+ مدخل بالأرقام",
    description: "دليل شامل لخدمات العبور والعبور الجديدة: صيدليات، مطاعم، مستشفيات، بنوك، جيمات، حضانات — بالاسم والعنوان والهاتف والمصدر.",
  },
  {
    path: "compounds/index.html",
    marker: "<!-- phase8-meta-compounds -->",
    title: "كمبوندات العبور الجديدة: دليل المشروعات والمطورين 2026",
    description: "فهرس الكمبوندات والمشروعات السكنية في العبور الجديدة مع المطور والحي والحالة والمصدر. بيانات منشورة فقط.",
  },
];

function updateMeta(filePath, { marker, title, description }) {
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes(marker)) {
    rep("SKIP", `${filePath}: already optimized`);
    return;
  }

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>${marker}`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">${marker}`);

  // Update Open Graph as well
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);

  fs.writeFileSync(filePath, html, "utf8");
  rep("OK", `${filePath}: title + meta updated`);
}

function main() {
  for (const opt of OPTIMIZATIONS) {
    const filePath = path.join(clientDir, opt.path);
    if (!fs.existsSync(filePath)) {
      rep("SKIP", `${opt.path}: file not found`);
      continue;
    }
    updateMeta(filePath, opt);
  }
  console.log("Phase 8.1 meta optimization done");
  console.log(report.join("\n"));
}

main();
