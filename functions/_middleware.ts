/**
 * functions/_middleware.ts
 * ========================
 * Markdown for Agents — content negotiation at the edge.
 *
 * A request bearing `Accept: text/markdown` for an HTML page receives a clean
 * markdown representation (content of <main>, formatting stripped, links/tables
 * preserved). Browsers (no such Accept) get the untouched HTML — HTML stays the
 * default representation.
 *
 * Response headers: Content-Type: text/markdown + Vary: Accept (cache safety).
 */

const WANTS_MD = /text\/markdown/i;

export async function onRequest(context) {
  const accept = context.request.headers.get("accept") || "";
  const url = new URL(context.request.url);

  // Not a markdown ask → pass through untouched (default = HTML for browsers)
  if (!WANTS_MD.test(accept)) return context.next();

  // Only negotiate documents, not assets (.json/.xml/.css/.png/…)
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return context.next();

  const resp = await context.next();
  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("text/html") || !resp.ok) return resp;

  const html = await resp.text();
  const md = htmlToMarkdown(html, url);

  return new Response(md, {
    status: resp.status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
      "x-markdown-negotiated": "true",
    },
  });
}

/* ---------------------------------------------------------------------------
 * Lightweight HTML → Markdown converter (main-content scoped)
 * ------------------------------------------------------------------------- */

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;(\d+)?/gi, " ");
}

function inline(s) {
  return decodeEntities(String(s).replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function absolute(href, base) {
  try {
    return new URL(href, base.origin).href;
  } catch {
    return href;
  }
}

function htmlToMarkdown(html, url) {
  // Scope to <main> (falls back to <body>)
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let s = main ? main[1] : (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, ""])[1];

  // Drop non-content blocks
  s = s
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(form|button|svg|iframe|noscript|select|dialog)[^>]*>[\s\S]*?<\/\1>/gi, "");

  // Tables → markdown tables (header row + separator + body rows)
  s = s.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tbl) => {
    const rows = [];
    for (const rm of tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...rm[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) =>
        inline(c[1]).replace(/\|/g, "\\|")
      );
      if (cells.length) rows.push("| " + cells.join(" | ") + " |");
    }
    if (!rows.length) return "";
    const sep = "|" + " --- |".repeat(rows[0].split("|").length - 2);
    return "\n\n" + rows[0] + "\n" + sep + "\n" + rows.slice(1).join("\n") + "\n\n";
  });

  // Headings
  for (let i = 1; i <= 6; i++) {
    s = s.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)</h${i}>`, "gi"), (_, t) => {
      const txt = inline(t);
      return txt ? "\n\n" + "#".repeat(i) + " " + txt + "\n\n" : "";
    });
  }

  // Links (absolute), skip empty/icon anchors
  s = s.replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, h, t) => {
    const txt = inline(t);
    if (!txt) return "";
    return `[${txt}](${absolute(h, url)})`;
  });

  // List items
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => "- " + inline(t) + "\n");

  // Emphasis
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${inline(t)}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `*${inline(t)}*`);

  // Block boundaries → blank lines; <br> → newline
  s = s
    .replace(/<\/(p|div|section|article|ul|ol|blockquote|figure|figcaption)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Strip everything left, decode entities, tidy
  s = decodeEntities(s.replace(/<[^>]+>/g, ""));
  s = s
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");

  const title = inline((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1]);
  const header = title ? `# ${title}\n\n` : "";
  return header + s + "\n";
}
