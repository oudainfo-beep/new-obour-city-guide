/**
 * seo-phase71-critical-css.mjs — إزالة render-blocking CSS من مسار أول رسمة.
 *
 * site.css (52KB) كان render-blocking → FCP بطيء على الموبايل. الآن:
 *  - <style> حرج مضمّن في الـ head (الهيكل + الهيدر + البطل + الفتات) يرسم فورًا
 *  - site.css الكاملة تُحمّل بنمط print→all غير الحاجب + نسخة <noscript>
 * idempotent بعلامة data-crit="71" — يعمل آخر السلسلة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");

// CSS حرجة مكتوبة mobile-first — تغطي الإطار المرئي الأول فقط
const CRITICAL = `*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#eef4ef;color:#1a2a24;font:16px/1.8 "IBM Plex Sans Arabic",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding-inline:1.25rem}
a{color:#1a5442}
.site-header{background:#0d2f26;position:sticky;top:0;z-index:40}
.header-row{display:flex;align-items:center;gap:1rem;padding:.7rem 0;min-height:68px}
.brand{display:flex;align-items:center;gap:.6rem;color:#fff;text-decoration:none;margin-inline-start:auto}
.brand img{border-radius:12px}
.brand b{font-family:"Noto Kufi Arabic",sans-serif;font-weight:800;font-size:1.05rem;display:block;line-height:1.2}
.brand em,.brand small{display:block;font-style:normal;color:#cbd5cf;font-size:.68rem;line-height:1.3}
.brand small{color:#9db3a8}
.desktop-nav,.site-search{display:none}
.pwa-install{margin-inline-start:auto;background:#c2671c;color:#fff;border:0;border-radius:999px;padding:.5rem .9rem;font:600 .78rem "IBM Plex Sans Arabic",sans-serif;display:flex;align-items:center;gap:.35rem}
.mobile-menu summary{list-style:none;cursor:pointer;color:#fff;font-size:1.5rem;padding:.4rem .55rem;border:1px solid rgba(255,255,255,.25);border-radius:10px;line-height:1}
.mobile-menu summary::-webkit-details-marker{display:none}
.page-hero{position:relative;overflow:hidden;background:linear-gradient(150deg,#f3ecdd 0%,#e6efdf 60%,#d8e8d2 100%)}
.grid-bg{position:absolute;inset:0;opacity:.1;background-image:linear-gradient(rgba(255,255,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px);background-size:44px 44px}
.hero-layout{position:relative;display:block;padding:3rem 0}
.hero-copy-block h1{font-family:"Noto Kufi Arabic",sans-serif;font-weight:800;font-size:clamp(2rem,6.4vw,4rem);line-height:1.2;margin:.75rem 0 1rem;color:#1a2a24;letter-spacing:-.03em}
.hero-copy-block>p:last-child{font-size:1rem;color:#475569;line-height:2;max-width:760px}
.tag{display:inline-flex;align-items:center;gap:.35rem;border:1px solid #d3c9b4;background:#f0fdfa;color:#2f7456;padding:.35rem .7rem;font:800 .74rem "IBM Plex Sans Arabic",sans-serif;border-radius:999px}
.breadcrumb{background:rgba(255,255,255,.7);border-bottom:1px solid #e0e6df;padding:.65rem 0;font-size:.86rem}
.breadcrumb ol{list-style:none;display:flex;gap:.5rem;flex-wrap:wrap;padding:.6rem 0;margin:0}
.breadcrumb a{color:#1a5442;text-decoration:none}
.breadcrumb .sep{color:#8fa398}
.section{padding:2.6rem 0}
article h2{font-family:"Noto Kufi Arabic",sans-serif;line-height:1.4}
.button{display:inline-block;background:#123f33;color:#fff;text-decoration:none;border-radius:10px;padding:.7rem 1.2rem;font:700 .9rem "IBM Plex Sans Arabic",sans-serif}
.faq-block details{background:#fff;border:1px solid #e0e6df;border-radius:12px;margin-bottom:.6rem;padding:.8rem 1rem}
.faq-block summary{cursor:pointer;font-weight:700;font-family:"Noto Kufi Arabic",sans-serif}
@media(min-width:1001px){.desktop-nav{display:flex;gap:.2rem;margin-inline-start:auto}.pwa-install{margin-inline-start:0}.hero-layout{padding:4.5rem 0}}`;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", "public"].includes(e.name)) continue;
      yield* walk(p);
    } else if (e.name === "index.html") yield p;
  }
}

const LINK_RE = /<link rel="stylesheet" href="\/static\/site\.css\?v=[a-z0-9]+">/;
const CRIT_RE = /<style data-crit="71">[\s\S]*?<\/style>/;
let done = 0, updated = 0, skipped = 0;
for (const file of walk(clientDir)) {
  const html = fs.readFileSync(file, "utf8");
  if (CRIT_RE.test(html)) {
    const out = html.replace(CRIT_RE, `<style data-crit="71">${CRITICAL}</style>`);
    if (out !== html) { fs.writeFileSync(file, out, "utf8"); updated++; } else skipped++;
    continue;
  }
  const m = html.match(LINK_RE);
  if (!m) { skipped++; continue; }
  const block = `<style data-crit="71">${CRITICAL}</style>` +
    `<link rel="stylesheet" href="${m[0].match(/href="([^"]+)"/)[1]}" media="print" onload="this.media='all'">` +
    `<noscript>${m[0]}</noscript>`;
  fs.writeFileSync(file, html.replace(LINK_RE, block), "utf8");
  done++;
}
console.log(`[phase71] critical CSS: ${done} جديدة · ${updated} مُحدّثة · ${skipped} تخطّي — site.css لم تعد حاجبة`);
