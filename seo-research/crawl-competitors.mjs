import fs from 'fs/promises';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT_DIR = path.join(ROOT, 'raw-crawls');
const COMPETITORS_FILE = path.join(ROOT, 'competitors.json');

function slugifyUrl(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, '');
  const pathPart = u.pathname.replace(/\/$/, '').replace(/[^a-zA-Z0-9\-_/]/g, '-');
  return `${host}${pathPart.replace(/\//g, '-')}`;
}

async function fetchOne(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    const duration = Date.now() - start;
    const html = await res.text();
    return {
      url,
      status: res.status,
      ok: res.ok,
      finalUrl: res.url,
      contentType: res.headers.get('content-type') || '',
      contentLength: html.length,
      duration,
      fetchedAt: new Date().toISOString(),
      html,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      error: err.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function extractHeadings(html) {
  const headings = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const text = match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) headings.push({ level: parseInt(match[1], 10), text });
    if (headings.length > 200) break;
  }
  return headings;
}

function extractMetaDescription(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
  return m ? m[1].trim() : '';
}

function extractLinks(html, baseUrl) {
  const seen = new Set();
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl).href;
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      links.push({ url: resolved, text: text.slice(0, 120) });
      if (links.length >= 100) break;
    } catch {}
  }
  return links;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const competitors = JSON.parse(await fs.readFile(COMPETITORS_FILE, 'utf-8'));
  const urls = competitors.competitors.flatMap(c => c.important_urls || []);

  const report = { fetched: [], failed: [] };

  for (const url of urls) {
    const slug = slugifyUrl(url);
    const filePath = path.join(OUT_DIR, `${slug}.json`);

    let existing = null;
    try {
      existing = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch {}

    if (existing && existing.ok && existing.html && existing.html.length > 500) {
      console.log(`SKIP (cached) ${url}`);
      report.fetched.push({ url, slug, status: existing.status, cached: true });
      continue;
    }

    console.log(`FETCH ${url}`);
    const raw = await fetchOne(url);

    if (!raw.ok || !raw.html) {
      console.log(`  FAIL ${raw.status} ${raw.error || ''}`);
      report.failed.push({ url, slug, status: raw.status, error: raw.error });
      continue;
    }

    const structured = {
      url: raw.url,
      finalUrl: raw.finalUrl,
      status: raw.status,
      contentType: raw.contentType,
      contentLength: raw.contentLength,
      duration: raw.duration,
      fetchedAt: raw.fetchedAt,
      title: extractTitle(raw.html),
      metaDescription: extractMetaDescription(raw.html),
      headings: extractHeadings(raw.html),
      links: extractLinks(raw.html, raw.finalUrl || raw.url),
      html: raw.html,
    };

    await fs.writeFile(filePath, JSON.stringify(structured, null, 2), 'utf-8');
    console.log(`  OK ${structured.title.slice(0, 60)} (${structured.headings.length} headings)`);
    report.fetched.push({ url, slug, status: raw.status, title: structured.title, cached: false });

    await new Promise(r => setTimeout(r, 800));
  }

  const summaryPath = path.join(ROOT, 'crawl-report.json');
  await fs.writeFile(summaryPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nDone. Fetched: ${report.fetched.length}, Failed: ${report.failed.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
