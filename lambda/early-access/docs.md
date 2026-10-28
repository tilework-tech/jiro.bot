# Noridoc: early-access Lambda

Path: @/lambda/early-access

### Overview

- A Node 22 ESM Lambda (`jirobot-early-access`) behind an API Gateway HTTP API that runs double opt-in sign-up for the jiro.bot early-access list.
- `POST /signup` validates the visitor and emails a confirmation link. `GET /confirm` only verifies the link and shows a "Confirm my spot" button; `POST /confirm` (the button) writes the person to Clarify, the GTM CRM Martin works the list from.
- Exists because GTM wants an onboarding waitlist with a 30-minute setup call instead of self-serve onboarding. It is modeled on the newsletter-subscribe and demo-intake Lambdas in `site-noriagentic`.

### How it fits into the larger codebase

- Called by [the site's early-access script](../../site/js/early-access.js), which posts JSON to the URL in [the landing page's](../../site/index.html) `early-access-endpoint` meta tag, currently `https://9bt7wykv5e.execute-api.us-east-1.amazonaws.com/signup` (see [the site docs](../../docs.md)).
- Redirects (303) confirmed visitors to `SITE_ORIGIN/confirmed.html` and invalid or expired links to `SITE_ORIGIN/link-expired.html`; those pages live in `site/` and ship with the site deploy. The intermediate confirm page is HTML rendered by the Lambda itself on the API Gateway domain.
- External dependencies: SES v2 (from `hello@jiro.bot`, reply-to `martin@noriagentic.com`) and the Clarify REST API (person object in `CLARIFY_WORKSPACE`, authenticated with `CLARIFY_API_KEY`). The AWS SDK comes from the Lambda runtime, so the deployed package is the handler file alone; the SDK is only a dev dependency for tests.
- Infrastructure is the CloudFormation stack `jiro-bot-early-access` from [infra/early-access.cfn.yaml](../../infra/early-access.cfn.yaml); this folder only holds the code. Configuration is environment-only, set by that stack: `CONFIRM_SECRET`, `CLARIFY_API_KEY`, `CLARIFY_WORKSPACE`, plus optional `FROM_ADDRESS`, `REPLY_TO_ADDRESS`, and `SITE_ORIGIN` overrides. Module load throws if `CONFIRM_SECRET` is missing or shorter than 16 characters, so a misconfigured function fails every invocation rather than signing with a weak key.

```text
POST /signup ──> validate ──> SES email with /confirm?token=...
GET  /confirm?token ──> verify ──> HTML page with form (hidden token)   [no write]
POST /confirm (form-urlencoded token) ──> verify ──> Clarify ──> 303 confirmed.html
                      invalid/expired token at either step ──> 303 link-expired.html
```

### Core Implementation

- Routing is by `rawPath` and method. `/confirm` accepts GET and POST without an origin check. `/signup` enforces an origin allowlist (`https://jiro.bot`, `https://www.jiro.bot`), answers CORS preflight, and accepts only POST; requests without an `Origin` header are allowed through. Unknown routes return 404.
- Sign-up parsing: rejects bodies over 16 KB (413) and non-object JSON (400); a non-empty honeypot `ea_hp` returns a fake 202 and sends nothing. Fields are trimmed and email is lowercased. Name needs at least 2 characters (longer input is truncated); email (simple regex) is rejected, not truncated, when over 254 characters. Organization is not collected; any `org` field sent is ignored.
- Stateless pending sign-up: the token is `base64url(JSON{name,email,page,referrer,exp}).HMAC-SHA256(CONFIRM_SECRET)` with a 24-hour expiry. Nothing is stored until the confirm form comes back. Verification uses a timing-safe comparison, and the confirm URL is built from the request's own API Gateway domain.
- The confirmation email has text and HTML parts. The greeting uses the first name only when it is plain (letters, marks, apostrophes, hyphens, at most 40 characters) and the full name contains no `.`, `/`, or `:`; otherwise it says "Hi there". The email is sent as Martin, and URL-like names would otherwise render as links in mail clients. SES failure returns 502 to the browser.
- Clarify write on `POST /confirm`, after a lookup by email. Lookup results whose email addresses do not actually match are ignored, and empty response bodies are treated as `{}`.

| Case | Action |
|------|--------|
| No match | Create the person with `match_on: email_addresses`, split name into first/last, label `Jiro Early Access`, `early_access_status` `Waitlist` |
| Existing person | PATCH, appending the label (meta `collection: append`) only if missing and setting `Waitlist` only if status is empty |
| Both cases | Set `early_access_confirmed_at` (YYYY-MM-DD), and `early_access_context` (JSON with source, page, referrer, UTM params parsed from `page`, timestamp) |

### Things to Know

- Confirmation is two steps because corporate mail scanners (Safe Links, Mimecast) open links but do not submit forms. `GET /confirm` must never write to Clarify.
- A status Martin has already set in Clarify is never overwritten, and repeat confirms do not duplicate the person or the label; the date and context fields are refreshed each time. The Clarify `early_access_org` field exists but is no longer written.
- A Clarify failure (non-2xx, network error, or 4-second per-call timeout) returns a 502 HTML "try the link again" page rather than a redirect, since the token is still valid until it expires. The stack sets a 15-second function timeout for this: the Lambda default of 3 seconds would kill the invocation before the retry page renders.
- Logs carry only the stage, request ID, and error name (non-2xx Clarify responses surface as `ClarifyHTTP<status>`, e.g. `ClarifyHTTP503`). Error messages are never logged because SES messages can contain the recipient address.
- The origin check does not stop non-browser clients, so `/signup` can be scripted to send confirmation emails to arbitrary addresses. The only limit is API Gateway throttling on the `$default` stage (`POST /signup` burst 5, 1 request/s; other routes burst 20, 5 requests/s); there is no per-recipient limit.
- Tokens are signed, not encrypted: the confirm URL carries the sign-up details in readable base64, which is why the stage has no access logs. Rotating `CONFIRM_SECRET` is the only way to revoke outstanding links.

| Stack piece | Notes |
|---|---|
| SES | Domain identity `jiro.bot` with DKIM CNAMEs and a `_dmarc` TXT (`p=none`, report only) in Route 53; the function role may send only from that identity |
| Function | `jirobot-early-access`, `nodejs22.x`, 15 s timeout, created with placeholder code that returns 503 until real code is deployed |
| HTTP API | `https://9bt7wykv5e.execute-api.us-east-1.amazonaws.com`, routes `POST`/`OPTIONS /signup` and `GET`/`POST /confirm`, auto-deployed `$default` stage |
| Secrets | `ConfirmSecret` and `ClarifyApiKey` are NoEcho stack parameters. `ClarifyApiKey` is `pending` until Martin issues a key; set it with a stack update that passes `UsePreviousValue` for `ConfirmSecret` |
| Deploy access | An inline policy lets the existing deploy role `github-actions-jiro-bot-deploy` (from [infra/site.cfn.yaml](../../infra/site.cfn.yaml)) update and read this function's code |

- Real code ships only through [the reference workflow](deploy-workflow.yml), which runs the tests then [the deploy script](deploy.sh). The script only updates function code and refuses to run outside a GitHub Actions `workflow_dispatch` run, per the org rule that deploys go through workflow dispatch. The workflow must be copied into `.github/workflows/` with an admin-approved token, since pushing workflow files needs that permission. It must not set a GitHub `environment`, because the deploy role trusts only the OIDC subject `ref:refs/heads/main` and an environment changes the subject. Timeout, environment variables and throttling belong to the stack, not the deploy.
- Until that workflow has run, the live function is the placeholder, so every sign-up from jiro.bot gets a 503 and the pop-up shows its try-again message.
- `npm test` runs `node:test` with `aws-sdk-client-mock` for SES and an in-memory fake Clarify installed over `fetch`, so tests make no network calls.

Created and maintained by Nori.
