import fs from 'fs/promises';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CLIENT = path.join(ROOT, '..', 'client');
const OUT = path.join(ROOT, 'obourguide-audit.json');

function extractTitle(html) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ')?.trim() || '';
}

function extractH1(html) {
  return html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ')?.replace(/\s+/g, ' ')?.trim() || '';
}

function extractMetaDescription(html) {
  return html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim()
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim()
    || '';
}

function extractCanonical(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]?.trim()
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]?.trim()
    || '';
}

function extractSchema(html) {
  const schemas = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1]);
      const types = Array.isArray(json) ? json.map(x => x['@type']) : [json['@type']];
      schemas.push(...types.filter(Boolean));
    } catch {}
  }
  return schemas;
}

function extractInternalLinks(html, basePath) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    links.push({ href, text: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) });
  }
  return links.slice(0, 50);
}

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).length;
}

async function main() {
  const files = [];
  async function walk(dir, rel = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const next = path.join(dir, e.name);
        if (await fs.access(path.join(next, 'index.html')).then(() => true).catch(() => false)) {
          files.push(path.join(rel, e.name));
        }
        await walk(next, path.join(rel, e.name));
      }
    }
  }
  await walk(CLIENT);

  const pages = [];
  for (const rel of files) {
    const idx = path.join(CLIENT, rel, 'index.html');
    try {
      const html = await fs.readFile(idx, 'utf-8');
      const page = {
        path: `/${rel}/`,
        file: idx,
        title: extractTitle(html),
        h1: extractH1(html),
        meta_description: extractMetaDescription(html),
        canonical: extractCanonical(html),
        schemas: extractSchema(html),
        word_count: wordCount(html),
        internal_links: extractInternalLinks(html, rel),
        has_noindex: /noindex/i.test(html),
      };
      pages.push(page);
    } catch (err) {
      pages.push({ path: `/${rel}/`, file: idx, error: err.message });
    }
  }

  const bySchema = {};
  for (const p of pages) {
    for (const s of p.schemas || []) {
      bySchema[s] = (bySchema[s] || 0) + 1;
    }
  }

  const thinPages = pages.filter(p => p.word_count && p.word_count < 300).map(p => p.path);
  const missingMeta = pages.filter(p => !p.meta_description).map(p => p.path);
  const missingH1 = pages.filter(p => !p.h1).map(p => p.path);

  await fs.writeFile(OUT, JSON.stringify({
    generated: new Date().toISOString(),
    total_pages: pages.length,
    schema_usage: bySchema,
    thin_pages: thinPages,
    missing_meta_description: missingMeta,
    missing_h1: missingH1,
    pages,
  }, null, 2));

  console.log(`Audit written: ${pages.length} pages`);
  console.log('Schema usage:', bySchema);
  console.log(`Thin pages (<300 words): ${thinPages.length}`);
  console.log(`Missing meta description: ${missingMeta.length}`);
  console.log(`Missing H1: ${missingH1.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
