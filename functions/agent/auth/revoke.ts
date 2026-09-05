// Stateless revocation acknowledgment. Keys are not validated anywhere, so
// revocation is passive: discard the key. Documented in /auth.md step 6.
export async function onRequest(ctx) {
  if (ctx.request.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
  }
  return Response.json({ revoked: true, note: "Stateless acknowledgment — the credential gates no resources, so nothing further is required." });
}
