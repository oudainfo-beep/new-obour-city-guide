// Anonymous agent registration (auth.md flow) — Obour Guide is public/read-only;
// the issued key is an OPTIONAL identification token for fair-rate tracking.
export async function onRequestPost() {
  const key = "obq_anon_" + crypto.randomUUID().replaceAll("-", "");
  return Response.json({
    credential: key,
    credential_type: "api_key",
    scopes: ["public:read"],
    status: "active",
    note: "Obour Guide is public & read-only — this key changes nothing about access. It identifies your agent for fair-use rate tracking. Present it as: Authorization: Bearer <key> (header method).",
    claim_uri: "https://obourguide.com/agent/auth/claim",
    revocation_uri: "https://obourguide.com/agent/auth/revoke",
  }, { status: 201 });
}

export async function onRequest(ctx) {
  if (ctx.request.method === "POST") return onRequestPost();
  return Response.json({ error: "method_not_allowed", register: "POST only — see https://obourguide.com/auth.md" }, { status: 405, headers: { Allow: "POST" } });
}
