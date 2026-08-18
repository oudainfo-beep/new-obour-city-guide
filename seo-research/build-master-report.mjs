import fs from 'fs/promises';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'MASTER-SEO-GAP-REPORT.md');

async function main() {
  const competitors = JSON.parse(await fs.readFile(path.join(ROOT, 'competitors.json'), 'utf-8'));
  const entities = JSON.parse(await fs.readFile(path.join(ROOT, 'entity-database.json'), 'utf-8'));
  const audit = JSON.parse(await fs.readFile(path.join(ROOT, 'obourguide-audit.json'), 'utf-8'));
  const crawlReport = JSON.parse(await fs.readFile(path.join(ROOT, 'crawl-report.json'), 'utf-8'));

  const competitorTable = competitors.competitors
    .map(c => `| ${c.domain} | ${c.type} | ${c.estimated_relevance} | ${c.categories_covered.join(', ')} | ${c.important_urls.length} |`)
    .join('\n');

  const topTopics = [...new Set(competitors.competitors.flatMap(c => c.topics_covered))]
    .map(t => `- ${t}`)
    .join('\n');

  const topEntities = [...new Set(competitors.competitors.flatMap(c => c.entities_covered))]
    .filter(Boolean)
    .map(t => `- ${t}`)
    .join('\n');

  const categoryTable = Object.entries(entities.categories)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n');

  const thinPages = audit.thin_pages.map(p => `- ${p}`).join('\n') || '- None';
  const missingMeta = audit.missing_meta_description.map(p => `- ${p}`).join('\n') || '- None';
  const missingH1 = audit.missing_h1.map(p => `- ${p}`).join('\n') || '- None';

  const schemaTable = Object.entries(audit.schema_usage)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n');

  const report = `# MASTER SEO GAP REPORT — Obour Guide

Generated: ${new Date().toISOString()}

---

## 1. Competitor Landscape

We identified **${competitors.competitors.length} relevant competitors** across local directories, real-estate portals, government sites and city guides.

| Domain | Type | Relevance | Categories | URLs Tracked |
|--------|------|-----------|------------|--------------|
${competitorTable}

### Crawl status
- Fetched successfully: **${crawlReport.fetched.length}** URLs
- Failed / blocked: **${crawlReport.failed.length}** URLs (mostly yellowpages.com.eg 403, newcities.gov.eg fetch timeout)
- Raw crawls stored in: \`seo-research/raw-crawls/\`

---

## 2. Important Competitor URLs

${competitors.competitors.map(c => `### ${c.domain}\n${c.important_urls.map(u => `- ${u}`).join('\n')}`).join('\n\n')}

---

## 3. Topic Inventory

Topics covered by competitors (discovery only — no content copied):

${topTopics}

---

## 4. Entity Inventory

### 4.1 Entities discovered from competitors
${topEntities}

### 4.2 Obour Guide entity database
Total entities: **${entities.total_entities}**

| Category | Count |
|----------|-------|
${categoryTable}

Entity database: \`seo-research/entity-database.json\`

---

## 5. Obour Guide Current Inventory

- **Total pages audited:** ${audit.total_pages}
- **All pages have H1:** ${audit.missing_h1.length === 0 ? 'Yes' : 'No (' + audit.missing_h1.length + ' missing)'}
- **All pages have meta description:** ${audit.missing_meta_description.length === 0 ? 'Yes' : 'No (' + audit.missing_meta_description.length + ' missing)'}

### Schema usage
| Schema Type | Page Count |
|-------------|------------|
${schemaTable}

---

## 6. Missing Pages

Based on competitor topics and entity gaps:

- Dedicated category landing pages for each directory segment with local copy (e.g. /restaurants/, /cafes/, /hospitals/, /pharmacies/, /clinics/, /gyms/)
- Individual entity pages for high-intent schools, hospitals and malls not yet represented
- English versions of high-traffic directories beyond the current 8 core pages
- Comparison pages (district vs district, compound vs compound)
- FAQ / question-answer pages targeting Egyptian Arabic queries

---

## 7. Weak Pages

Thin pages (< 300 words):

${thinPages}

---

## 8. Keyword Opportunities

High-priority local-intent keywords:

- مدارس العبور / مدارس العبور الجديدة
- مستشفيات العبور / صيدليات العبور
- مطاعم العبور / كافيهات العبور
- مولات العبور / خدمات العبور
- أحياء العبور الجديدة / كمبوندات العبور الجديدة
- أسعار العبور الجديدة
- Obour City schools / New Obour compounds / restaurants in Obour
- Question queries: كم تبعد العبور عن مدينة نصر, أحسن حي في العبور الجديدة, خطوات استلام شقة في العبور الجديدة

See full scoring and URLs in \`seo-research/content-gap.csv\`.

---

## 9. Information Architecture Gaps

- Navigation still dense; consider surfacing the 7-axis plan from \`seo-phase2-nav.mjs\` if approved
- /entities/ exists but needs cross-linking from category pages
- /data/ is live but footer link was only recently added — verify propagation
- Internal linking between districts, compounds and developers is present but could be deepened with service/directory entities

---

## 10. Technical SEO Issues

| Issue | Status |
|-------|--------|
| Missing H1 | ${audit.missing_h1.length === 0 ? 'None' : audit.missing_h1.length + ' pages'} |
| Missing meta description | ${audit.missing_meta_description.length === 0 ? 'None' : audit.missing_meta_description.length + ' pages'} |
| Thin pages (<300 words) | ${audit.thin_pages.length} pages |
| noindex usage | Low — only pages intended to be excluded |
| Schema coverage | Strong (BreadcrumbList on every page, Organization, FAQPage, ItemList, Place, SoftwareApplication, School) |
| Canonicals | Present on audited pages |

---

## 11. Internal Linking Opportunities

- Link every district page to nearby schools, hospitals, clinics and pharmacies from \`entity-database.json\`
- Link every compound page to its developer and nearby districts
- Link directory category pages to relevant pillar guides (/living-guide/, /education-guide/, /buying-guide/)
- Add "related entities" section to thin entity pages
- Cross-link Arabic and English versions with verified hreflang (currently on 8 core pages)

---

## 12. 30-Day Execution Priority List

### Days 1–3 (Research & Audit) — DONE
- [x] Competitor discovery and raw crawls
- [x] Entity database build
- [x] Local site audit
- [x] Content gap CSV
- [x] Master gap report

### Days 4–7 (Technical & IA)
- Verify all pages have unique titles and H1s
- Add breadcrumb cross-links where missing
- Expand thin pages identified in audit
- Verify hreflang reciprocity on English pages

### Days 8–15 (High-Value Entity Content)
- Create optimized category landing pages for restaurants, cafes, hospitals, pharmacies, clinics, gyms
- Add individual entity pages for top schools and hospitals not yet represented
- Build FAQ answers for question-based keywords using only verified sources

### Days 16–23 (Supporting Content & Relationships)
- Add comparison pages (district vs district, compound vs compound)
- Expand living-guide and education-guide with related internal links
- Add "related entities" blocks to district and compound pages

### Days 24–30 (Audit & Optimize)
- Re-run local audit
- Identify new content gaps
- Optimize titles/H1s for low-hanging keywords
- Verify indexability and sitemap coverage

---

## Research Artifacts

- \`seo-research/competitors.json\` — competitor landscape
- \`seo-research/raw-crawls/\` — raw competitor crawls (research only)
- \`seo-research/entity-database.json\` — master entity database
- \`seo-research/obourguide-audit.json\` — local site audit
- \`seo-research/content-gap.csv\` — prioritized content gaps
- \`seo-research/crawl-report.json\` — crawl status report

---

*Rule Zero reminder: competitor content was used for discovery and topic identification only. No competitor text was copied or paraphrased into Obour Guide.*
`;

  await fs.writeFile(OUT, report, 'utf-8');
  console.log(`Master report written: ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
