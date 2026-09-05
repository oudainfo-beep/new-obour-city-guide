/**
 * functions/mcp.ts
 * ================
 * Minimal MCP server (Streamable HTTP transport, JSON-RPC 2.0) exposing the
 * Obour Guide open datasets as tools. Read-only; no sessions, no state.
 *
 * Supported: initialize · ping · notifications/* · tools/list · tools/call
 */

const SERVER_INFO = { name: "obour-guide-data", title: "Obour Guide Data MCP", version: "2026.09.05" };
const PROTOCOL_VERSION = "2025-06-18";

const DATASETS = ["obour-directories", "obour-districts", "obour-compounds", "obour-developers", "obour-schools"];

const TOOLS = [
  {
    name: "get_dataset",
    description: "Download a full Obour Guide open dataset (districts, compounds, developers, schools, or the 2,040-record services directory) as JSON.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", enum: DATASETS, description: "Dataset name without .json" } },
      required: ["name"],
    },
  },
  {
    name: "search_directory",
    description: "Search the verified Obour / New Obour local-services directory (2,040 listings: name, category, area, phone) by Arabic or English text. Returns the top matches.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text, e.g. 'صيدلية' or 'pharmacy' or 'إطارات'" },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 10 },
      },
      required: ["query"],
    },
  },
];

const ok = (id, result) =>
  Response.json({ jsonrpc: "2.0", id: id ?? null, result });
const fail = (id, code, message) =>
  Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function fetchAsset(env, baseUrl, path) {
  const r = await env.ASSETS.fetch(new Request(new URL(path, baseUrl).href));
  if (!r.ok) throw new Error(`asset ${path} → HTTP ${r.status}`);
  return r.json();
}

async function callTool(req, env, baseUrl) {
  const id = req.id ?? null;
  const { name, arguments: args = {} } = req.params || {};

  if (name === "get_dataset") {
    if (!DATASETS.includes(args.name)) return fail(id, -32602, `name must be one of: ${DATASETS.join(", ")}`);
    try {
      const data = await fetchAsset(env, baseUrl, `/data/${args.name}.json`);
      return ok(id, { content: [{ type: "text", text: JSON.stringify(data) }] });
    } catch (e) {
      return fail(id, -32603, String(e.message || e));
    }
  }

  if (name === "search_directory") {
    const q = String(args.query || "").trim().toLowerCase();
    if (!q) return fail(id, -32602, "query is required");
    const limit = Math.min(Math.max(parseInt(args.limit) || 10, 1), 25);
    try {
      const data = await fetchAsset(env, baseUrl, "/data/obour-directories.json");
      const items = data.items || [];
      const hits = items
        .filter((it) =>
          [it.name, it.englishName, it.category, it.area, it.directoryTitle]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(q))
        )
        .slice(0, limit);
      const text = hits.length
        ? hits.map((h) => `• ${h.name}${h.englishName ? " (" + h.englishName + ")" : ""} — ${h.category} — ${h.area} — ☎ ${h.phone || "—"} [${h.directoryTitle}]`).join("\n")
        : `لا نتائج لـ "${args.query}" — No matches.`;
      return ok(id, { content: [{ type: "text", text }] });
    } catch (e) {
      return fail(id, -32603, String(e.message || e));
    }
  }

  return fail(id, -32602, `Unknown tool: ${name}`);
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);

  if (request.method === "GET") {
    return Response.json({
      name: SERVER_INFO.title,
      transport: "streamable-http",
      usage: "POST JSON-RPC 2.0: initialize → tools/list → tools/call. Docs: /.well-known/mcp/server-card.json",
    });
  }
  if (request.method !== "POST") return fail(null, -32600, "POST only");

  let req;
  try {
    req = await request.json();
  } catch {
    return fail(null, -32700, "Parse error");
  }

  if (req && typeof req.method === "string" && req.method.startsWith("notifications/")) {
    return new Response(null, { status: 202 });
  }

  switch (req.method) {
    case "initialize":
      return ok(req.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });
    case "ping":
      return ok(req.id, {});
    case "tools/list":
      return ok(req.id, { tools: TOOLS });
    case "tools/call":
      return callTool(req, env, url);
    default:
      return fail(req.id, -32601, "Method not found");
  }
}
