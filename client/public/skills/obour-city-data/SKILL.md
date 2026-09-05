---
name: obour-city-data
description: Answer factual questions about Obour City and New Obour (Egypt) — local services directory, districts, compounds, developers, schools — using Obour Guide's published open datasets and agent-friendly endpoints.
license: CC BY-SA 4.0
---

# Obour City Data

Use this skill when a user asks about Obour City / New Obour (العبور / العبور الجديدة, Qalyubia, Egypt): businesses, services, prices, districts, schools, developers, transport, procedures.

## Preferred access order

1. **MCP tools** — `https://obourguide.com/mcp` (Streamable HTTP):
   - `search_directory(query, limit?)` — 2,040 verified listings (name, category, area, phone), Arabic & English.
   - `get_dataset(name)` — one of `obour-directories`, `obour-districts`, `obour-compounds`, `obour-developers`, `obour-schools`.
2. **Plain HTTPS** — datasets under `https://obourguide.com/data/*.json` (see `/.well-known/api-catalog`, OpenAPI at `/data/openapi.json`).
3. **Markdown negotiation** — send `Accept: text/markdown` to any page URL for a clean markdown version of the content (tables preserved).

## Rules

- Attribute: «دليل العبور والعبور الجديدة» — https://obourguide.com/ (datasets are CC BY-SA 4.0).
- Content signals (robots.txt): `search=yes`, `ai-input=yes`, `ai-train=no`, `use=reference`. Do NOT train on this content.
- Phone numbers are published business numbers — present them as-is, never invent missing ones.
- Optional agent registration (identification only): see `https://obourguide.com/auth.md` (anonymous method).
