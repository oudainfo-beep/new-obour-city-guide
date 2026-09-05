# auth.md

**Obour Guide (دليل العبور والعبور الجديدة)** — agent registration walkthrough for `https://obourguide.com`. Follow top to bottom; every step is machine-actionable.

## 1. Discover the metadata

Fetch the Protected Resource Metadata (RFC 9728):

```
GET https://obourguide.com/.well-known/oauth-protected-resource
```

You get the `resource`, the `authorization_servers` list, `scopes_supported` (`public:read`), and `bearer_methods_supported` (`header`).

## 2. Read the authorization-server metadata

```
GET https://obourguide.com/.well-known/oauth-authorization-server
```

Read the `agent_auth` block: `skill` (this file), `register_uri`, `claim_uri`, `revocation_uri`, and `identity_types_supported`.

## 3. Register

One registration method is supported: **`anonymous`**.

```
POST https://obourguide.com/agent/auth
```

No request body is required. You receive `201` with:

```json
{
  "credential": "obq_anon_…",
  "credential_type": "api_key",
  "scopes": ["public:read"],
  "status": "active",
  "claim_uri": "https://obourguide.com/agent/auth/claim",
  "revocation_uri": "https://obourguide.com/agent/auth/revoke"
}
```

Skip any user-consent gate — there is no user identity to assert in the anonymous flow.

## 4. Use the credential

Send it on requests as a bearer token in the header:

```
Authorization: Bearer <credential>
```

**Honest note:** Obour Guide is a public, read-only resource. The credential is an *optional identification token* used for fair-use rate tracking — every public URL answers identically with or without it. If you never call `register_uri`, you lose nothing.

## 5. Claim (optional)

To bind a contact email to your registration (so we can reach you about rate or usage questions):

```
POST https://obourguide.com/agent/auth/claim
Content-Type: application/json

{ "email": "you@example.org" }
```

Scopes do not change after claiming — `public:read` is already full access.

## 6. Revocation & recovery

```
POST https://obourguide.com/agent/auth/revoke
```

Revocation is a stateless acknowledgment: discard the credential. If a credential ever returns an error, drop it and restart at Step 1 — re-registration is free.

## 7. Content usage policy

Machine-readable in `/robots.txt` (Content Signals): `search=yes`, `ai-input=yes`, `ai-train=no` (model training prohibited), `use=reference`. Attribution: «دليل العبور والعبور الجديدة» — https://obourguide.com/. Datasets under `/data/` carry CC BY-SA 4.0.

## 8. Rate guidance

Stay under ~2 requests/second, crawl `/sitemap.xml` rather than blind crawling, and identify yourself honestly in `User-Agent`. High-volume or commercial reuse: `info@obourguide.com`.

## 9. Related discovery documents

- `/.well-known/api-catalog` — API catalog (RFC 9727)
- `/data/openapi.json` — OpenAPI description of the open datasets
- `/llms.txt` — LLM-oriented site summary
