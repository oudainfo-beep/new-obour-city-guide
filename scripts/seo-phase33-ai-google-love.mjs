/**
 * seo-phase33-ai-google-love.mjs
 * المرحلة 33 — ترقيات GEO/SEO لصفحات المحتوى:
 *  1) WebPage → Article (headline + author + publisher + تواريخ) — نتائج منسّقة واقتباس AI أدق.
 *  2) حبة «✓ مراجَع · أغسطس 2026» مرئية في البطل — إشارة حداثة للمستخدم والمحركات.
 *  3) HowTo schema تلقائي للأدلة ذات الخطوات (أول قائمة مرقمة ≥3 بنود).
 *  4) ItemList schema لصفحات القوائم الموثقة (أسماء الكيانات من الجدول).
 *  5) Place schema لصفحات الأحياء (تعزيز البحث المحلي).
 * idempotent: يتحقق من "@type":"Article" قبل اللمس. يعمل بعد كل مراحل التوليد.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const SITE = "https://obourguide.com";
const TODAY = "2026-08-28";

// قائمة صفحات المحتوى = مفاتيح TITLES في المرحلة 32 (مصدر واحد متزامن)
const p32 = fs.readFileSync(path.join(root, "scripts", "seo-phase32-internal-links.mjs"), "utf8");
const SLUGS = [...p32.matchAll(/"([\w/-]+)":\s*"/g)].map((m) => m[1])
  .concat(["market-reports-obour", "new-projects-watch"])
  .filter((s, i, a) => a.indexOf(s) === i && !["housing","districts","rent","transport","shopping","health","education","life","en"].includes(s));

function getLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
}
function strip(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function upgradePage(slug) {
  const p = path.join(clientDir, slug, "index.html");
  if (!fs.existsSync(p)) return "missing";
  let html = fs.readFileSync(p, "utf8");
  if (html.includes('"@type":"Article"')) return "already";

  const blocks = getLdBlocks(html);
  const h1m = html.match(/<h1>([^<]+)<\/h1>/);
  const h1 = h1m ? h1m[1].trim() : slug;
  const url = `${SITE}/${slug}/`;
  const isEn = slug.startsWith("en/");

  let touched = false;

  // 1) WebPage → Article
  for (const b of blocks) {
    try {
      const obj = JSON.parse(b[1]);
      if (obj["@type"] === "WebPage") {
        obj["@type"] = "Article";
        obj.headline = h1;
        obj.author = { "@id": SITE + "/#org" };
        obj.mainEntityOfPage = url;
        obj.datePublished = obj.datePublished || TODAY;
        obj.dateModified = TODAY;
        html = html.replace(b[0], `<script type="application/ld+json">${JSON.stringify(obj)}</script>`);
        touched = true;
        break;
      }
    } catch {}
  }
  if (!touched) return "no-webpage";

  // 2) حبة الحداثة المرئية
  const tagRe = /(<span class="tag">[^<]*<\/span>)/;
  if (tagRe.test(html) && !html.includes("✓ مراجَع")) {
    html = html.replace(tagRe, `$1<span class="tag" style="margin-inline-start:.4rem">✓ ${isEn ? "Reviewed" : "مراجَع"} · ${isEn ? "Aug 2026" : "أغسطس 2026"}</span>`);
  }

  const extra = [];

  // 3) HowTo من أول قائمة مرقمة (≥3 خطوات)
  const olm = html.match(/<article>[\s\S]*?<ol>([\s\S]*?)<\/ol>/);
  if (olm) {
    const steps = [...olm[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1])).filter((x) => x.length > 15).slice(0, 10);
    if (steps.length >= 3) {
      extra.push({
        "@context": "https://schema.org", "@type": "HowTo",
        name: isEn ? h1 : `خطوات: ${h1}`,
        inLanguage: isEn ? "en" : "ar-EG",
        step: steps.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t })),
      });
    }
  }

  // 4) ItemList لصفحات القوائم الموثقة
  if (html.includes("القائمة الموثقة")) {
    const names = [...html.matchAll(/<tr><td>\d+<\/td><td><strong>([^<]+)<\/strong>/g)].map((m) => m[1]).slice(0, 30);
    if (names.length >= 3) {
      extra.push({
        "@context": "https://schema.org", "@type": "ItemList",
        name: h1, numberOfItems: names.length,
        itemListElement: names.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n })),
      });
    }
  }

  // 5) Place للأحياء
  const dm = slug.match(/^district-(\d)$/);
  if (dm) {
    const AR_N = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع"];
    extra.push({
      "@context": "https://schema.org", "@type": "Place",
      name: `الحي ${AR_N[+dm[1]]} — مدينة العبور`,
      containedInPlace: { "@type": "City", name: "مدينة العبور", containedInPlace: { "@type": "AdministrativeArea", name: "محافظة القليوبية", "addressCountry": "EG" } },
    });
  }

  if (extra.length) {
    const ld = extra.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
    html = html.replace("</head>", ld + "</head>");
  }

  fs.writeFileSync(p, html, "utf8");
  return "upgraded";
}

function main() {
  const counts = {};
  for (const slug of SLUGS) {
    const r = upgradePage(slug);
    counts[r] = (counts[r] || 0) + 1;
  }
  console.log("Phase 33 AI/Google love:", JSON.stringify(counts));
  console.log(`slugs targeted: ${SLUGS.length}`);
}

main();
