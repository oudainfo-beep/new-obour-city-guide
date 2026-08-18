import fs from 'fs/promises';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CLIENT = path.join(ROOT, '..', 'client');
const DATA = path.join(ROOT, '..', 'data');
const RAW = path.join(ROOT, 'raw-crawls');
const OUT = path.join(ROOT, 'entity-database.json');

function normalizePhone(p) {
  if (!p) return '';
  return String(p).replace(/\s/g, '').replace(/^0/, '');
}

function titleCase(str) {
  return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

async function readDirectoryFiles() {
  const dir = path.join(DATA, 'directories');
  const files = await fs.readdir(dir).catch(() => []);
  const byFile = {};
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const content = JSON.parse(await fs.readFile(path.join(dir, f), 'utf-8'));
    byFile[f.replace('.json', '')] = content;
  }
  return byFile;
}

async function readClientPages(subdirs) {
  const pages = [];
  for (const sub of subdirs) {
    const full = path.join(CLIENT, sub);
    const entries = await fs.readdir(full).catch(() => []);
    for (const e of entries) {
      const idx = path.join(full, e, 'index.html');
      try {
        const html = await fs.readFile(idx, 'utf-8');
        const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ')?.trim() || '';
        const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ')?.replace(/\s+/g, ' ')?.trim() || '';
        pages.push({ subdir: sub, slug: e, title, h1, path: idx });
      } catch {}
    }
  }
  return pages;
}

async function readRawCrawls() {
  const files = await fs.readdir(RAW).catch(() => []);
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const content = JSON.parse(await fs.readFile(path.join(RAW, f), 'utf-8'));
      out.push(content);
    } catch {}
  }
  return out;
}

function makeEntity({ canonical, arabic, english, category, subcategory, location, district, sourceUrls, confidence, extra }) {
  const id = `${category}-${subcategory || 'general'}-${canonical.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '')}`;
  return {
    id,
    canonical_name: canonical,
    arabic_name: arabic,
    english_name: english,
    category,
    subcategory: subcategory || '',
    location: location || '',
    district: district || '',
    source_urls: Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls].filter(Boolean),
    confidence: Math.max(0, Math.min(1, confidence)),
    related_entities: [],
    ...extra,
  };
}

async function main() {
  const dirs = await readDirectoryFiles();
  const clientPages = await readClientPages(['districts', 'compounds', 'developers', 'schools']);
  const rawCrawls = await readRawCrawls();

  const entities = [];

  // Districts from client
  const districtPages = clientPages.filter(p => p.subdir === 'districts');
  for (const p of districtPages) {
    const name = p.h1 || p.title.replace(/دليل|حي|مدينة/g, '').trim();
    entities.push(makeEntity({
      canonical: p.slug,
      arabic: name,
      english: titleCase(p.slug.replace(/district-/, 'District ')),
      category: 'Geography',
      subcategory: 'District',
      district: name,
      sourceUrls: [`https://obourguide.com/districts/${p.slug}/`],
      confidence: 1.0,
    }));
  }

  // Compounds from client
  const compoundPages = clientPages.filter(p => p.subdir === 'compounds');
  for (const p of compoundPages) {
    const name = p.h1 || p.title;
    entities.push(makeEntity({
      canonical: p.slug,
      arabic: name,
      english: titleCase(p.slug.replace(/-/g, ' ')),
      category: 'RealEstate',
      subcategory: 'Compound',
      sourceUrls: [`https://obourguide.com/compounds/${p.slug}/`],
      confidence: 1.0,
    }));
  }

  // Developers from client
  const developerPages = clientPages.filter(p => p.subdir === 'developers');
  for (const p of developerPages) {
    const name = p.h1 || p.title;
    entities.push(makeEntity({
      canonical: p.slug,
      arabic: name,
      english: titleCase(p.slug.replace(/-/g, ' ')),
      category: 'RealEstate',
      subcategory: 'Developer',
      sourceUrls: [`https://obourguide.com/developers/${p.slug}/`],
      confidence: 1.0,
    }));
  }

  // Schools from data/schools-all.json
  const schools = dirs['schools-all'];
  if (schools && schools.items) {
    for (const s of schools.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Education',
        subcategory: s.c || 'School',
        location: s.a || '',
        district: s.a?.match(/الحي\s+(\S+)/)?.[1] || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.7,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Nurseries
  const nurseries = dirs['nurseries'];
  if (nurseries && nurseries.items) {
    for (const s of nurseries.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Education',
        subcategory: 'Nursery',
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.7,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Healthcare: clinics, hospitals, pharmacies
  for (const file of ['clinics', 'hospitals', 'pharmacies']) {
    const data = dirs[file];
    if (!data || !data.items) continue;
    for (const s of data.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Healthcare',
        subcategory: file === 'clinics' ? (s.c || 'Clinic') : file === 'hospitals' ? 'Hospital' : 'Pharmacy',
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.7,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Food
  const restaurants = dirs['restaurants'];
  if (restaurants && restaurants.items) {
    for (const s of restaurants.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Food',
        subcategory: s.c || 'Restaurant',
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.6,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Shopping
  const shopping = dirs['shopping'];
  if (shopping && shopping.items) {
    for (const s of shopping.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Shopping',
        subcategory: s.c || 'Store',
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.6,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Services
  for (const file of ['banks', 'government-services', 'professional-services', 'home-services', 'logistics']) {
    const data = dirs[file];
    if (!data || !data.items) continue;
    for (const s of data.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Services',
        subcategory: file.replace(/-/g, ' '),
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.6,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Lifestyle
  for (const file of ['fitness', 'entertainment', 'hotels']) {
    const data = dirs[file];
    if (!data || !data.items) continue;
    for (const s of data.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Lifestyle',
        subcategory: file.replace(/-/g, ' '),
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.6,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Automotive
  const automotive = dirs['automotive'];
  if (automotive && automotive.items) {
    for (const s of automotive.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Automotive',
        subcategory: s.c || 'Car Service',
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.6,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Real estate offices
  const reOffices = dirs['real-estate-offices'];
  if (reOffices && reOffices.items) {
    for (const s of reOffices.items) {
      entities.push(makeEntity({
        canonical: s.e || s.n,
        arabic: s.n,
        english: s.e || '',
        category: 'Services',
        subcategory: 'Real Estate Office',
        location: s.a || '',
        sourceUrls: [s.s ? `source:${s.s}` : ''].filter(Boolean),
        confidence: 0.6,
        extra: { phone: s.t || s.p || '', address: s.a || '' },
      }));
    }
  }

  // Extract entities from raw crawls (discovery only, no copying)
  const competitorEntities = [];
  for (const crawl of rawCrawls) {
    if (!crawl.ok || !crawl.html) continue;
    const title = crawl.title || '';
    const headings = crawl.headings || [];
    const list = headings
      .filter(h => h.level <= 3)
      .map(h => h.text.replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 5 && t.length < 100 && /مدرسة|مستشفى|صيدلية|مطعم|كافيه|مول|خدمة|عيادة|حضانة|جيم|بنك|مركز/i.test(t));
    for (const t of list) {
      competitorEntities.push(makeEntity({
        canonical: t,
        arabic: t,
        english: '',
        category: 'Discovery',
        subcategory: 'Competitor Mention',
        sourceUrls: [crawl.url],
        confidence: 0.3,
      }));
    }
  }

  // Deduplicate by canonical+location
  const seen = new Map();
  for (const e of [...entities, ...competitorEntities]) {
    const key = `${e.category}|${e.subcategory}|${e.canonical_name.toLowerCase()}|${e.location?.toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, e);
    else {
      const existing = seen.get(key);
      existing.source_urls = Array.from(new Set([...existing.source_urls, ...e.source_urls]));
      existing.confidence = Math.max(existing.confidence, e.confidence);
    }
  }

  const final = Array.from(seen.values());

  await fs.writeFile(OUT, JSON.stringify({
    generated: new Date().toISOString(),
    total_entities: final.length,
    categories: Object.fromEntries(
      [...new Set(final.map(e => e.category))].map(c => [c, final.filter(e => e.category === c).length])
    ),
    entities: final,
  }, null, 2));

  console.log(`Entity database written: ${final.length} entities`);
  console.log('Categories:', Object.fromEntries([...new Set(final.map(e => e.category))].map(c => [c, final.filter(e => e.category === c).length])));
}

main().catch(e => { console.error(e); process.exit(1); });
