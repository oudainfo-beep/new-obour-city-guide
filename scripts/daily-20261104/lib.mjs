/**
 * lib.mjs — بنية المهمة اليومية 2026-11-04 (نمط seo-phase24-ar-wave2-20260828.mjs):
 * يعيد استخدام أدوات daily-20261002/lib.mjs (loadChrome/buildHead/الجداول) مع قالب المقال
 * الاحترافي بتاريخ الموجة الحالية: Article+FAQPage+BreadcrumbList+Organization، عنوان <60،
 * وصف 150-160، FAQ ≥3، 500-900 كلمة، لا كيانات مخترعة، بطاقة /corrections/.
 */
import {
  SITE,
  report,
  rep,
  loadChrome,
  orgNode,
  buildHead,
  faqSchema,
  faqHtml,
  breadcrumbSchema,
  breadcrumbHtmlAr,
  writePage,
  readData,
  dataTable,
} from "../daily-20261002/lib.mjs";

export {
  SITE,
  report,
  rep,
  loadChrome,
  orgNode,
  buildHead,
  faqSchema,
  faqHtml,
  breadcrumbSchema,
  breadcrumbHtmlAr,
  writePage,
  readData,
  dataTable,
};

export const TODAY = "2026-11-04";
export const TODAY_AR = "4 نوفمبر 2026";

const PRO_CSS = `<style>.ogp{--g:#123f33;--a:#c2671c}.ogp .byline{display:flex;flex-wrap:wrap;gap:.35rem 1rem;font-size:.85rem;color:#6b7a72;margin:0 0 1.2rem;padding:0 0 .9rem;border-bottom:1px solid #e7e0d2}.ogp .byline a{color:var(--g)}.ogp .tldr{background:#e5efe7;border-right:4px solid var(--g);border-radius:14px;padding:1rem 1.2rem;margin:0 0 1.4rem}.ogp .tldr strong{display:block;font-size:1.02rem;margin-bottom:.35rem;color:var(--g)}.ogp .tldr ul{margin:.2rem 0 0;padding-right:1.1rem}.ogp .tldr li{margin:.3rem 0;line-height:1.85}.ogp .toc{border:1px solid #d3c9b4;border-radius:14px;padding:.9rem 1.2rem;margin:0 0 1.6rem;background:#fff}.ogp .toc strong{color:var(--g)}.ogp .toc ol{margin:.4rem 0 0;padding-right:1.2rem;columns:2 16rem}.ogp .toc li{margin:.25rem 0;break-inside:avoid}.ogp h2{scroll-margin-top:90px}.ogp article a,.ogp a.in{color:#0f5c46;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}.ogp table{width:100%;border-collapse:collapse;font-size:.92rem}.ogp th,.ogp td{padding:.6rem .7rem;border-bottom:1px solid #e7e0d2;text-align:right;vertical-align:top}.ogp th{background:#f5f1e8;color:var(--g)}.ogp .table-wrap{margin:1rem 0 1.4rem}.ogp .related{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:.8rem;margin:1rem 0 1.6rem}.ogp .related a{display:block;border:1px solid #d3c9b4;border-radius:14px;padding:.85rem 1rem;background:#fff;text-decoration:none;color:#1a2a24}.ogp .related a b{display:block;color:var(--g);margin-bottom:.2rem}.ogp .related a span{font-size:.86rem;color:#6b7a72;line-height:1.7}.ogp .sources{font-size:.88rem;line-height:1.9}.ogp .answer{font-size:1.05rem;line-height:2}</style>`;

function slugId(i) { return `s${i + 1}`; }

export function pageShellPro(chrome, o) {
  const { slug, title, description, h1, tag, crumbs, lead, takeaways, sections, faq, sources, related, extraSchemas = [], keywords = [] } = o;
  const url = `${SITE}/${slug}/`;
  const bodyHtml = sections.map((s, i) => `<h2 id="${slugId(i)}">${s.h}</h2>${s.html}`).join("\n");
  const plain = (lead + bodyHtml + faq.map((q) => q.q + " " + q.a).join(" ")).replace(/<[^>]+>/g, " ");
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.round(words / 200));
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": url + "#article",
    headline: h1,
    description,
    inLanguage: "ar-EG",
    datePublished: TODAY,
    dateModified: TODAY,
    wordCount: words,
    keywords: keywords.join("، "),
    author: { "@type": "Organization", name: "فريق تحرير دليل العبور", url: SITE + "/editorial-policy/" },
    publisher: { "@id": SITE + "/#org" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: SITE + "/brand/og.png",
    about: { "@type": "Place", name: "مدينة العبور والعبور الجديدة", address: { "@type": "PostalAddress", addressLocality: "العبور", addressRegion: "القليوبية", addressCountry: "EG" } },
  };
  const schemas = [orgNode(), article, breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url }))), faqSchema(faq), ...extraSchemas];
  const tLen = [...title].length, dLen = [...description].length;
  rep(tLen < 60 && dLen >= 150 && dLen <= 160 ? "META" : "META-CHECK", `title=${tLen}ch desc=${dLen}ch words=${words} — ${url}`);
  if (faq.length < 3) rep("FAQ-CHECK", `${url} has only ${faq.length} questions`);
  if (words < 500 || words > 900) rep("WORDS-CHECK", `${words} words — ${url}`);
  let head = buildHead(chrome.head, { title, description, url, schemas });
  head = head.replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="article">`);
  head = head.replace("</head>", `<meta property="article:published_time" content="${TODAY}"><meta property="article:modified_time" content="${TODAY}">${PRO_CSS}</head>`);
  const internal = (bodyHtml.match(/href="\//g) || []).length + related.length;
  rep("LINKS", `${internal} internal links — ${url}`);
  const toc = `<nav class="toc" aria-label="محتويات المقال"><strong>محتويات المقال</strong><ol>${sections.map((s, i) => `<li><a href="#${slugId(i)}">${s.h.replace(/<[^>]+>/g, "")}</a></li>`).join("")}<li><a href="#faq">أسئلة شائعة</a></li></ol></nav>`;
  const byline = `<p class="byline"><span>بقلم <a href="/editorial-policy/">فريق تحرير دليل العبور</a></span><span>نُشر: <time datetime="${TODAY}">${TODAY_AR}</time></span><span>وقت القراءة: ${minutes} دقائق</span><span><a href="/methodology/">منهجية الدليل</a></span></p>`;
  const tldr = `<div class="tldr"><strong>الخلاصة في 30 ثانية</strong><ul>${takeaways.map((t) => `<li>${t}</li>`).join("")}</ul></div>`;
  const rel = `<h2 id="related">أدلة ذات صلة</h2><div class="related">${related.map(([h, t, d]) => `<a href="${h}"><b>${t}</b><span>${d}</span></a>`).join("")}</div>`;
  const src = sources.length ? `<h2 id="sources">المصادر</h2><ol class="sources">${sources.map(([t, u]) => `<li><a href="${u}" rel="nofollow noopener" target="_blank">${t}</a></li>`).join("")}</ol><p class="note">تنبيه تحريري: الأرقام في هذا المقال منقولة من المصادر المذكورة بتواريخها، والقرارات والأسعار تتغير. إن وجدت معلومة تحتاج تحديثًا أرسلها عبر <a href="/corrections/">صفحة التصحيح</a>.</p>` : `<p class="note">تنبيه تحريري: النطاقات السعرية في هذا المقال إرشادية وتتغير باستمرار، تحقق من السعر الحالي مباشرة من مقدم الخدمة قبل أي قرار. إن وجدت معلومة تحتاج تحديثًا أرسلها عبر <a href="/corrections/">صفحة التصحيح</a>.</p>`;
  const main = `<main class="ogp"><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${byline}<p class="answer">${lead}</p>${tldr}${toc}${bodyHtml}<h2 id="faq">أسئلة شائعة</h2>${faqHtml(faq)}${rel}${src}</article><aside class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a><a class="text-link" href="/updates/">تحديثات الدليل ↖</a></aside></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtmlAr(crumbs)}${main}${chrome.footer}</body></html>`;
}

export const HOME = { name: "الرئيسية", path: "/", url: SITE + "/" };
export const crumb = (section, page) => [HOME, section, page];

export const PAGES = [];
export function addPage(relDir, builder) {
  PAGES.push({ relDir, builder });
}
export const PRO = (o) => (chrome) => pageShellPro(chrome, o);
