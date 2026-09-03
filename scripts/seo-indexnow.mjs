/**
 * seo-indexnow.mjs
 * المرحلة: IndexNow — إشعار فوري لمحركات البحث بالصفحات الجديدة/المحدثة.
 *
 * الآلية: بعد كل build يقرأ sitemap.xml ويرسل كل الروابط لـ IndexNow API
 * (Bing + Yandex + Google عبر البروتوكول الرسمي). يعمل تلقائيًا في كل نشر.
 * مفتاح التحقق: ملف {key}.txt في جذر الموقع يحمل المفتاح نفسه.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const KEY = "da784a17-b6e2-45d4-a31c-6f01688602d6";
const HOST = "obourguide.com";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function main() {
  // 1) تأكد أن ملف المفتاح موجود في الجذر (التحقق من الملكية)
  const keyFile = path.join(publicDir, `${KEY}.txt`);
  if (!fs.existsSync(keyFile) || fs.readFileSync(keyFile, "utf8").trim() !== KEY) {
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(keyFile, KEY);
    console.log(`[OK] wrote key file ${KEY}.txt`);
  }

  // 2) اجمع الروابط من السايت ماب
  const sitemapPath = path.join(publicDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    console.log("[WARN] sitemap.xml not found — IndexNow skipped");
    return;
  }
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) {
    console.log("[WARN] no URLs in sitemap — IndexNow skipped");
    return;
  }

  // 3) أرسل الروابط (حتى 10,000 في الطلب الواحد)
  const batches = [];
  for (let i = 0; i < urls.length; i += 10000) batches.push(urls.slice(i, i + 10000));

  for (const batch of batches) {
    const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch };
    try {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      console.log(`[OK] IndexNow: ${batch.length} URLs submitted → HTTP ${res.status}`);
      if (res.status !== 200 && res.status !== 202) {
        const txt = await res.text();
        console.log(`[WARN] IndexNow response: ${txt.slice(0, 200)}`);
      }
    } catch (e) {
      console.log(`[WARN] IndexNow failed: ${e.message} — continues next build`);
    }
  }
}

main();
