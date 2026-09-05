# auth.md

**Obour Guide (دليل العبور والعبور الجديدة)** — agent authentication & registration policy for `https://obourguide.com`.

## 1. Agent audience

This document is for AI agents, LLM crawlers, answer engines, and other automated clients that read or reference Obour Guide content — the Arabic/English city guide for Obour City & New Obour (Qalyubia, Egypt): services directory, prices, districts, developers, and open datasets.

## 2. Access model — no authentication required

All published resources are **public and read-only**. No account, API key, token, or login is required:

| Resource | Access |
|---|---|
| All guide pages (`/…`) | Public `GET` |
| Open Data API — `GET /data/*.json` (see `/.well-known/api-catalog`) | Public, keyless |
| `/llms.txt`, `/sitemap.xml`, `/feed.xml`, `/.well-known/api-catalog` | Public, keyless |

There is **no write API** exposed to agents or third parties. Community Q&A accounts (when offered) are created exclusively through the human web UI at `/ask/` — agents must not attempt to register or post programmatically.

## 3. Registration / provisioning

- **Read access:** no registration. Fetch what you need, subject to the usage policy below.
- **High-volume or commercial reuse:** email `info@obourguide.com` with your organization, purpose, and expected request volume to provision a usage arrangement (optional; public rates are generous).
- **Credential issuance:** not applicable — this service issues no credentials and accepts none.

## 4. Credential use

Not applicable. Requests should be plain HTTPS `GET`/`HEAD` without `Authorization` headers. If you previously received a key from us by private arrangement, send it as `Authorization: Bearer <key>` (header method) — but none is needed for the public surface.

## 5. Content usage policy (robots.txt Content Signals)

The site-wide policy is machine-readable in `/robots.txt`:

- `search=yes` — indexing and search results allowed
- `ai-input=yes` — real-time grounding/answers allowed for permitted search bots
- `ai-train=no` — **model training is prohibited** (training crawlers are blocked in robots.txt)
- `use=reference` — quote/reference with attribution

Attribution: «دليل العبور والعبور الجديدة» — https://obourguide.com/

## 6. Fair use & rate guidance

- Stay under ~2 requests/second; crawl `/sitemap.xml` rather than blind crawling.
- Identify yourself honestly in `User-Agent`. Spoofing another bot may get you rate-limited.
- Datasets carry **CC BY-SA 4.0**.

## 7. Discovery

- API catalog: `/.well-known/api-catalog` (RFC 9727, `application/linkset+json`)
- OpenAPI description of datasets: `/data/openapi.json`
- LLM-oriented site summary: `/llms.txt`

## 8. Contact

`info@obourguide.com` — corrections, provisioning questions, abuse reports.

---

*ملاحظة بالعربية: كل محتوى الدليل والبيانات المفتوحة متاح للقراءة العامة دون تسجيل أو مفاتيح. التدريب على المحتوى ممنوع (انظر robots.txt)، والاقتباس مع الإسناد مسموح. للاستخدام التجاري المكثّف راسلنا على info@obourguide.com.*
