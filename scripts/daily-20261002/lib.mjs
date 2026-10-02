/**
 * lib.mjs — بنية المهمة اليومية 2026-10-02 (نمط seo-phase24-ar-wave2-20260828.mjs):
 * loadChrome/buildHead من about-us، JSON-LD: WebPage+FAQPage+BreadcrumbList+Organization.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const clientDir = path.join(root, "client");
export const SITE = "https://obourguide.com";
export const TODAY = "2026-10-02";

export const report = [];
export const rep = (k, m) => report.push(`[${k}] ${m}`);

export function loadChrome() {
  const donorPath = path.join(clientDir, "about-us", "index.html");
  const donor = fs.readFileSync(donorPath, "utf8");
  const head = donor.match(/<head>[\s\S]*?<\/head>/)[0];
  const header = donor.match(/<body>([\s\S]*?)<nav class="breadcrumb"/)[1];
  const footer = donor.match(/<\/main>([\s\S]*?)<\/body>/)[1];
  return { head, header, footer };
}

export function orgNode() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": SITE + "/#org",
    name: "دليل العبور والعبور الجديدة",
    url: SITE + "/",
    logo: "https://obourguide.com/brand/logo.png",
    foundingDate: "2026",
    publishingPrinciples: SITE + "/editorial-policy/",
  };
}

export function buildHead(head, { title, description, url, schemas }) {
  let h = head;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const ld = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("");
  h = h.replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)+/, ld);
  return h;
}

export function faqSchema(questions) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };
}

export function faqHtml(questions) {
  return `<div class="faq-block">${questions
    .map((q) => `<details><summary>${q.q}</summary><p>${q.a}</p></details>`)
    .join("")}</div>`;
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function breadcrumbHtmlAr(items) {
  const lis = items
    .map((it, i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${it.name}</span>` : `<a href="${it.path}">${it.name}</a>`}</li>`)
    .join('<li class="sep">›</li>');
  return `<nav class="breadcrumb" aria-label="مسار التنقل"><div class="wrap"><ol>${lis}</ol></div></nav>`;
}

export function webPageSchema({ h1, url, description }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: h1,
    url,
    description,
    inLanguage: "ar-EG",
    datePublished: TODAY,
    dateModified: TODAY,
    publisher: { "@id": SITE + "/#org" },
  };
}

export function pageShellAr(chrome, { url, title, description, h1, tag, crumbs, body, faq }) {
  const schemas = [
    orgNode(),
    webPageSchema({ h1, url, description }),
    breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.url }))),
    faqSchema(faq),
  ];
  // بوابة الجودة: عنوان <60 ووصف 150-160 (يُسجَّل في التقرير لكل صفحة)
  const tLen = [...title].length;
  const dLen = [...description].length;
  rep(
    tLen < 60 && dLen >= 150 && dLen <= 160 ? "META" : "META-CHECK",
    `title=${tLen}ch desc=${dLen}ch — ${url}`,
  );
  if (faq.length < 3) rep("FAQ-CHECK", `${url} has only ${faq.length} questions`);
  const head = buildHead(chrome.head, { title, description, url, schemas });
  const main = `<main><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${body}<h2>أسئلة شائعة</h2>${faqHtml(faq)}</article><aside class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a><a class="text-link" href="/updates/">تحديثات الدليل ↖</a></aside></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtmlAr(crumbs)}${main}${chrome.footer}</body></html>`;
}

export function writePage(relDir, html) {
  const outDir = path.join(clientDir, relDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  rep("OK", `wrote /${relDir}/ (${Math.round(html.length / 1024)}KB)`);
}

export function injectHubLink(relFile, href, blockHtml) {
  const p = path.join(clientDir, relFile, "index.html");
  if (!fs.existsSync(p)) {
    rep("SKIP", `hub ${relFile} not found`);
    return;
  }
  let html = fs.readFileSync(p, "utf8");
  if (html.includes(`href="${href}"`)) {
    rep("SKIP", `${relFile} already links to ${href}`);
    return;
  }
  if (!html.includes("</main>")) {
    rep("SKIP", `${relFile} has no </main> marker`);
    return;
  }
  html = html.replace("</main>", `${blockHtml}</main>`);
  fs.writeFileSync(p, html, "utf8");
  rep("OK", `linked ${href} from /${relFile}/`);
}

export const AR = (o) => (chrome) => pageShellAr(chrome, o);
export const PAGES = [];
export function addPage(relDir, builder) {
  PAGES.push({ relDir, builder });
}

// قراءة بيانات الأدلة الموثقة (نمط المرحلة 7): لا كيانات مخترعة
const dataDir = path.join(root, "data", "directories");
export function readData(name) {
  const p = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
export function dataTable(items, note) {
  const rows = items.slice(0, 30).map((it, i) => {
    const phone = it.t || it.p || "غير منشور";
    const address = it.a || "غير منشور";
    return `<tr><td>${i + 1}</td><td><strong>${it.n}</strong>${it.e ? `<br><small>${it.e}</small>` : ""}</td><td>${it.c || "—"}</td><td>${address}</td><td dir="ltr">${phone}</td></tr>`;
  }).join("");
  return `<p>${note}</p><div class="table-wrap"><table><thead><tr><th>#</th><th>الاسم</th><th>التصنيف</th><th>العنوان</th><th>الهاتف</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ---------------------------------------------------------------------------
// قالب المقال الاحترافي (موجة 2026-10-02 v2): Article schema + فهرس محتويات +
// ملخص سريع + byline + جداول + FAQ موسّع + مصادر + «أدلة ذات صلة» داخلية.
// ---------------------------------------------------------------------------
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
  let head = buildHead(chrome.head, { title, description, url, schemas });
  head = head.replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="article">`);
  head = head.replace("</head>", `<meta property="article:published_time" content="${TODAY}"><meta property="article:modified_time" content="${TODAY}">${PRO_CSS}</head>`);
  const internal = (bodyHtml.match(/href="\//g) || []).length + related.length;
  rep("LINKS", `${internal} internal links — ${url}`);
  const toc = `<nav class="toc" aria-label="محتويات المقال"><strong>محتويات المقال</strong><ol>${sections.map((s, i) => `<li><a href="#${slugId(i)}">${s.h.replace(/<[^>]+>/g, "")}</a></li>`).join("")}<li><a href="#faq">أسئلة شائعة</a></li></ol></nav>`;
  const byline = `<p class="byline"><span>بقلم <a href="/editorial-policy/">فريق تحرير دليل العبور</a></span><span>نُشر: <time datetime="${TODAY}">2 أكتوبر 2026</time></span><span>وقت القراءة: ${minutes} دقائق</span><span><a href="/methodology/">منهجية الدليل</a></span></p>`;
  const tldr = `<div class="tldr"><strong>الخلاصة في 30 ثانية</strong><ul>${takeaways.map((t) => `<li>${t}</li>`).join("")}</ul></div>`;
  const rel = `<h2 id="related">أدلة ذات صلة</h2><div class="related">${related.map(([h, t, d]) => `<a href="${h}"><b>${t}</b><span>${d}</span></a>`).join("")}</div>`;
  const src = sources.length ? `<h2 id="sources">المصادر</h2><ol class="sources">${sources.map(([t, u]) => `<li><a href="${u}" rel="nofollow noopener" target="_blank">${t}</a></li>`).join("")}</ol><p class="note">تنبيه تحريري: الأرقام في هذا المقال منقولة من المصادر المذكورة بتواريخها، والقرارات والأسعار تتغير. إن وجدت معلومة تحتاج تحديثًا أرسلها عبر <a href="/corrections/">صفحة التصحيح</a>.</p>` : "";
  const main = `<main class="ogp"><section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap hero-layout"><div class="hero-copy-block"><span class="tag">${tag}</span><h1>${h1}</h1><p>${description}</p></div></div></section><section class="section"><div class="wrap content-grid"><article>${byline}<p class="answer">${lead}</p>${tldr}${toc}${bodyHtml}<h2 id="faq">أسئلة شائعة</h2>${faqHtml(faq)}${rel}${src}</article><aside class="action-card"><p>هل لديك تصحيح أو إضافة موثّقة؟</p><a class="button" href="/corrections/">اقترح تصحيحًا ↖</a><a class="text-link" href="/updates/">تحديثات الدليل ↖</a></aside></div></section></main>`;
  return `<!doctype html><html lang="ar" dir="rtl">${head}<body>${chrome.header}${breadcrumbHtmlAr(crumbs)}${main}${chrome.footer}</body></html>`;
}
export const PRO = (o) => (chrome) => pageShellPro(chrome, o);

/** رابط سياقي داخل جسم الصفحة الأم: قبل «أسئلة شائعة» إن وُجدت، وإلا قبل </main> */
export function injectContextLink(relFile, href, blockHtml) {
  const p = path.join(clientDir, relFile, "index.html");
  if (!fs.existsSync(p)) return rep("SKIP", `hub ${relFile} not found`);
  let html = fs.readFileSync(p, "utf8");
  if (html.includes(`href="${href}"`)) return rep("SKIP", `${relFile} already links to ${href}`);
  const m = html.match(/<h2[^>]*>(?:الأسئلة الشائعة|أسئلة شائعة)/);
  if (m) html = html.replace(m[0], `${blockHtml}${m[0]}`);
  else if (html.includes("</article>")) html = html.replace("</article>", `${blockHtml}</article>`);
  else if (html.includes("</main>")) html = html.replace("</main>", `${blockHtml}</main>`);
  else return rep("SKIP", `${relFile} no marker`);
  fs.writeFileSync(p, html, "utf8");
  rep("OK", `linked ${href} from /${relFile}/`);
}
