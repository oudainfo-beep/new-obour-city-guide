// Optional claim ceremony. No email OTP: keys gate nothing on this public site,
// so "claiming" simply binds a contact email to the registration record.
export async function onRequest(ctx) {
  if (ctx.request.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
  }
  let email = null;
  try { email = (await ctx.request.json())?.email ?? null; } catch {}
  return Response.json({
    status: "claimed",
    email,
    note: "Claim recorded. Scopes are unchanged — public:read was already full access. No OTP ceremony is required on a read-only public resource.",
  });
}
