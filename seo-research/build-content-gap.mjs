import fs from 'fs/promises';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'content-gap.csv');

function csvRow(cols) {
  return cols.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',');
}

async function main() {
  const entities = JSON.parse(await fs.readFile(path.join(ROOT, 'entity-database.json'), 'utf-8'));
  const audit = JSON.parse(await fs.readFile(path.join(ROOT, 'obourguide-audit.json'), 'utf-8'));
  const competitors = JSON.parse(await fs.readFile(path.join(ROOT, 'competitors.json'), 'utf-8'));

  const existingPaths = new Set(audit.pages.map(p => p.path));
  const existingTitles = new Set(audit.pages.map(p => (p.title + ' ' + p.h1).toLowerCase()));

  const rows = [];
  const headers = [
    'keyword', 'search_intent', 'language', 'topic', 'entity', 'competitor', 'competitor_url',
    'existing_obour_url', 'gap_type', 'priority', 'estimated_difficulty', 'business_value',
    'local_intent', 'recommended_page_type', 'recommended_url', 'source_requirements', 'status'
  ];

  // Helper: estimate difficulty
  function difficulty(kw) {
    if (/منافس|أفضل|أسعار|مول|مستشفى|مدرسة/.test(kw)) return 'medium';
    if (/ Obour| New Obour| العبور| العبور الجديدة/.test(kw)) return 'low-medium';
    return 'medium-high';
  }

  function addRow(r) {
    rows.push(csvRow([
      r.keyword, r.search_intent, r.language, r.topic, r.entity, r.competitor, r.competitor_url,
      r.existing_obour_url, r.gap_type, r.priority, r.estimated_difficulty, r.business_value,
      r.local_intent, r.recommended_page_type, r.recommended_url, r.source_requirements, r.status
    ]));
  }

  // 1. Entity gaps from competitors
  const competitorTopics = [];
  for (const c of competitors.competitors) {
    for (const topic of c.topics_covered || []) {
      competitorTopics.push({ topic, competitor: c.domain, url: c.important_urls[0] });
    }
    for (const ent of c.entities_covered || []) {
      const exists = entities.entities.some(e =>
        e.canonical_name.toLowerCase().includes(ent.toLowerCase()) ||
        e.arabic_name.toLowerCase().includes(ent.toLowerCase())
      );
      const existingUrl = exists
        ? entities.entities.find(e => e.canonical_name.toLowerCase().includes(ent.toLowerCase()))?.source_urls?.[0] || ''
        : '';
      addRow({
        keyword: ent,
        search_intent: 'informational',
        language: 'mixed',
        topic: 'entity',
        entity: ent,
        competitor: c.domain,
        competitor_url: c.important_urls[0],
        existing_obour_url: existingUrl,
        gap_type: exists ? 'weak-page' : 'missing-page',
        priority: exists ? 'medium' : 'high',
        estimated_difficulty: 'medium',
        business_value: 'medium',
        local_intent: 'high',
        recommended_page_type: 'entity-page',
        recommended_url: exists ? existingUrl : `/search/?q=${encodeURIComponent(ent)}`,
        source_requirements: 'Official website or verified directory listing',
        status: 'open'
      });
    }
  }

  // 2. Local-intent keyword opportunities
  const localKeywords = [
    { kw: 'مدارس العبور', url: '/schools/' },
    { kw: 'مدارس العبور الجديدة', url: '/education-guide/' },
    { kw: 'مستشفيات العبور', url: '/hospitals/' },
    { kw: 'صيدليات العبور', url: '/pharmacies/' },
    { kw: 'مطاعم العبور', url: '/restaurants/' },
    { kw: 'كافيهات العبور', url: '/dining-guide/' },
    { kw: 'مولات العبور', url: '/shopping/' },
    { kw: 'عيادات العبور', url: '/clinics/' },
    { kw: 'حضانات العبور', url: '/nurseries/' },
    { kw: 'جيم العبور', url: '/fitness/' },
    { kw: 'بنوك العبور', url: '/banks/' },
    { kw: 'خدمات العبور', url: '/directory/' },
    { kw: 'أحياء العبور الجديدة', url: '/districts/' },
    { kw: 'كمبوندات العبور الجديدة', url: '/compounds/' },
    { kw: 'أسعار العبور الجديدة', url: '/prices/' },
    { kw: 'Obour City schools', url: '/en/education-guide/' },
    { kw: 'Obour City hospitals', url: '/en/' },
    { kw: 'New Obour compounds', url: '/en/compounds/' },
    { kw: 'restaurants in Obour', url: '/en/dining-guide/' },
    { kw: 'services in Obour', url: '/en/' },
  ];

  for (const { kw, url } of localKeywords) {
    const exists = existingPaths.has(url);
    addRow({
      keyword: kw,
      search_intent: 'informational/local',
      language: /[\u0600-\u06FF]/.test(kw) ? 'arabic' : 'english',
      topic: 'local-directory',
      entity: '',
      competitor: 'multiple',
      competitor_url: '',
      existing_obour_url: exists ? `https://obourguide.com${url}` : '',
      gap_type: exists ? 'needs-optimization' : 'missing-page',
      priority: 'high',
      estimated_difficulty: difficulty(kw),
      business_value: 'high',
      local_intent: 'high',
      recommended_page_type: 'category-page',
      recommended_url: `https://obourguide.com${url}`,
      source_requirements: 'Verified directory data',
      status: 'open'
    });
  }

  // 3. Thin pages from audit
  for (const p of audit.pages) {
    if (p.word_count && p.word_count < 300) {
      addRow({
        keyword: p.h1 || p.title,
        search_intent: 'informational',
        language: 'arabic',
        topic: 'thin-content',
        entity: '',
        competitor: '',
        competitor_url: '',
        existing_obour_url: `https://obourguide.com${p.path}`,
        gap_type: 'thin-page',
        priority: 'medium',
        estimated_difficulty: 'low',
        business_value: 'low',
        local_intent: 'medium',
        recommended_page_type: 'expand-existing',
        recommended_url: `https://obourguide.com${p.path}`,
        source_requirements: 'Original local research',
        status: 'open'
      });
    }
  }

  // 4. Question-based opportunities
  const questions = [
    'كم تبعد العبور عن مدينة نصر',
    'كم تبعد العبور الجديدة عن القاهرة',
    'أحسن حي في العبور الجديدة',
    'أسعار الشقق في العبور الجديدة',
    'أفضل مدرسة في العبور',
    'أقرب مستشفى من العبور الجديدة',
    'مواعيد جهاز المدينة العبور',
    'خطوات استلام شقة في العبور الجديدة',
    'تمويل عقاري العبور الجديدة',
    'مولات العبور الجديدة',
  ];
  for (const q of questions) {
    addRow({
      keyword: q,
      search_intent: 'question',
      language: 'arabic',
      topic: 'faq',
      entity: '',
      competitor: 'multiple',
      competitor_url: '',
      existing_obour_url: '',
      gap_type: 'missing-content',
      priority: 'medium',
      estimated_difficulty: 'low-medium',
      business_value: 'medium',
      local_intent: 'high',
      recommended_page_type: 'faq-page',
      recommended_url: 'https://obourguide.com/faq/',
      source_requirements: 'Verified official sources or methodology',
      status: 'open'
    });
  }

  // 5. Comparison / long-tail
  const comparisons = [
    'العبور الجديدة vs التجمع الخامس',
    'الحي الأول vs الحي الخامس العبور الجديدة',
    'كناري vs سولانا العبور الجديدة',
    'أرخص كمبوند في العبور الجديدة',
    'أفضل حي للإيجار في العبور',
  ];
  for (const q of comparisons) {
    addRow({
      keyword: q,
      search_intent: 'comparison',
      language: 'arabic',
      topic: 'comparison',
      entity: '',
      competitor: 'multiple',
      competitor_url: '',
      existing_obour_url: '',
      gap_type: 'missing-page',
      priority: 'medium',
      estimated_difficulty: 'medium',
      business_value: 'medium',
      local_intent: 'high',
      recommended_page_type: 'comparison-page',
      recommended_url: 'https://obourguide.com/compare/',
      source_requirements: 'Published price/location data only',
      status: 'open'
    });
  }

  await fs.writeFile(OUT, [csvRow(headers), ...rows].join('\n'), 'utf-8');
  console.log(`Content gap CSV written: ${rows.length} rows`);
}

main().catch(e => { console.error(e); process.exit(1); });
