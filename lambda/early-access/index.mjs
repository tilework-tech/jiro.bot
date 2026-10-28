import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { createHmac, timingSafeEqual } from "node:crypto";

const ses = new SESv2Client({});

const {
  CONFIRM_SECRET,
  CLARIFY_API_KEY,
  CLARIFY_WORKSPACE,
  FROM_ADDRESS = "Martin from Jiro <hello@jiro.bot>",
  REPLY_TO_ADDRESS = "martin@noriagentic.com",
  SITE_ORIGIN = "https://jiro.bot",
} = process.env;

if (!CONFIRM_SECRET || CONFIRM_SECRET.length < 16) throw new Error("CONFIRM_SECRET must be set (16+ characters)");

const CLARIFY_ROOT = "https://api.clarify.ai/v1";
const LABEL = "Jiro Early Access";
const INITIAL_STATUS = "Waitlist";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 16384;
// Keep both Clarify calls inside the function's 15 s timeout.
const CLARIFY_TIMEOUT_MS = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ORIGINS = new Set(["https://jiro.bot", "https://www.jiro.bot"]);
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

// ---------- confirm token ----------
// The signed token is the pending sign-up: nothing is stored until it comes back.

function sign(payload) {
  return createHmac("sha256", CONFIRM_SECRET).update(payload).digest("base64url");
}

function makeToken(signup) {
  const payload = Buffer.from(JSON.stringify({ ...signup, exp: Date.now() + TOKEN_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function parseToken(token) {
  const [payload, sig, extra] = (token || "").split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const signup = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof signup.email !== "string" || typeof signup.exp !== "number" || Date.now() > signup.exp) return null;
    return signup;
  } catch {
    return null;
  }
}

// ---------- responses ----------

function cors(origin) {
  return {
    "access-control-allow-origin": ALLOWED_ORIGINS.has(origin) ? origin : SITE_ORIGIN,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin",
  };
}

const json = (statusCode, body, origin) => ({
  statusCode,
  headers: { "content-type": "application/json", ...cors(origin) },
  body: JSON.stringify(body),
});

const redirect = (page) => ({ statusCode: 303, headers: { location: `${SITE_ORIGIN}/${page}` }, body: "" });

const html = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  body: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex"><title>Jiro early access</title>
<style>body{background:#2bff6b;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;min-height:100vh;margin:0;align-items:center;justify-content:center;padding:1.5rem;box-sizing:border-box}main{background:#0a0a0a;max-width:460px;padding:32px 28px}h1{margin:0 0 12px;font-size:28px}p{color:#cfcfcb;line-height:1.5}a{color:#ffffff}button{margin-top:8px;height:43px;padding:0 20px;border:0;background:#fb5e45;color:#0a0a0a;font:600 13px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}</style>
</head><body><main>${body}</main></body></html>`,
});

// Mail scanners open links but don't submit forms, so the write waits for this button.
const confirmPage = (token) =>
  html(
    200,
    `<h1>Confirm your spot</h1><p>One click and you're on the Jiro early access list.</p>
<form method="post" action="/confirm"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit">Confirm my spot</button></form>`,
  );

const retryPage = () =>
  html(
    502,
    `<h1>Something went wrong</h1><p>We couldn't confirm your spot just now. Please try the link again in a minute.</p><p><a href="${SITE_ORIGIN}/">Back to jiro.bot</a></p>`,
  );

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const clean = (value, maxLength) => (typeof value === "string" ? value.trim().slice(0, maxLength) : "");

function logFailure(event, stage, err) {
  // Deliberately omit the visitor's details and upstream response bodies.
  console.error(
    JSON.stringify({
      event: `early_access_${stage}_failed`,
      request_id: event.requestContext?.requestId,
      error: err?.name,
    }),
  );
}

// ---------- routes ----------

export async function handler(event) {
  const method = event.requestContext?.http?.method;
  const origin = event.headers?.origin || event.headers?.Origin || "";

  if (event.rawPath === "/confirm" && method === "GET") return openConfirmLink(event);
  if (event.rawPath === "/confirm" && method === "POST") return confirm(event);
  if (event.rawPath !== "/signup") return json(404, { error: "not found" }, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(403, { error: "origin not allowed" }, origin);
  if (method === "OPTIONS") return { statusCode: 204, headers: cors(origin), body: "" };
  if (method !== "POST") return json(404, { error: "not found" }, origin);
  return signup(event, origin);
}

function parseSignup(body) {
  const signup = {
    name: clean(body.name, 160),
    email: clean(body.email, 1000).toLowerCase(),
    page: clean(body.page, 1000),
    referrer: clean(body.referrer, 1000),
  };
  if (signup.name.length < 2) throw new Error("invalid name");
  if (signup.email.length > 254 || !EMAIL_RE.test(signup.email)) throw new Error("invalid email");
  return signup;
}

async function signup(event, origin) {
  let value;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString() : event.body || "{}";
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return json(413, { error: "request too large" }, origin);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid body");
    // Honeypot field: bots fill it, humans never see it. Pretend success.
    if (body.ea_hp) return json(202, { accepted: true }, origin);
    value = parseSignup(body);
  } catch {
    return json(400, { error: "invalid request" }, origin);
  }

  const confirmUrl = `https://${event.requestContext.domainName}/confirm?token=${encodeURIComponent(makeToken(value))}`;
  try {
    await sendConfirmEmail(value, confirmUrl);
  } catch (err) {
    logFailure(event, "send", err);
    return json(502, { error: "email failed" }, origin);
  }
  return json(202, { accepted: true }, origin);
}

function openConfirmLink(event) {
  const token = event.queryStringParameters?.token;
  return parseToken(token) ? confirmPage(token) : redirect("link-expired.html");
}

async function confirm(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString() : event.body || "";
  const signup = parseToken(new URLSearchParams(raw).get("token"));
  if (!signup) return redirect("link-expired.html");
  try {
    await saveToClarify(signup);
  } catch (err) {
    logFailure(event, "clarify", err);
    return retryPage();
  }
  return redirect("confirmed.html");
}

// ---------- email ----------

// The greeting repeats what the visitor typed in mail sent as Martin, so only plain names get through.
const PLAIN_NAME_RE = /^[\p{L}\p{M}'’-]{1,40}$/u;
const firstName = (name) => {
  const first = name.split(/\s+/)[0];
  return PLAIN_NAME_RE.test(first) && !/[./:]/.test(name) ? first : "there";
};

async function sendConfirmEmail({ name, email }, confirmUrl) {
  const first = firstName(name);
  const text = `Hi ${first},

Thanks for signing up for early access to Jiro.

Please confirm your email so we can hold your spot:

${confirmUrl}

In the next few business days, we will email you a link to book your setup call.

If you didn't sign up, you can ignore this email.

Martin Stuebler
Head of GTM · Brooklyn, NYC
jiro.bot`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0a0a0a;background:#ffffff;">
<p style="margin:0 0 16px;">Hi ${escapeHtml(first)},</p>
<p style="margin:0 0 16px;">Thanks for signing up for early access to Jiro.</p>
<p style="margin:0 0 16px;">Please confirm your email so we can hold your spot:</p>
<p style="margin:24px 0;"><a href="${confirmUrl}" style="background:#fb5e45;color:#0a0a0a;padding:12px 22px;text-decoration:none;display:inline-block;font-weight:600;">Confirm email</a></p>
<p style="margin:0 0 16px;">In the next few business days, we will email you a link to book your setup call.</p>
<p style="margin:0 0 24px;color:#5c5c5c;font-size:14px;">If you didn&rsquo;t sign up, you can ignore this email.</p>
<p style="margin:0;">Martin Stuebler</p>
<p style="margin:0;color:#5c5c5c;font-size:14px;">Head of GTM &middot; Brooklyn, NYC<br><a href="${SITE_ORIGIN}" style="color:#5c5c5c;">jiro.bot</a></p>
<p style="margin:24px 0 0;color:#9a9f9a;font-size:12px;">Button not working? Open this link: <a href="${confirmUrl}" style="color:#9a9f9a;">${confirmUrl}</a></p>
</body></html>`;

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      ReplyToAddresses: [REPLY_TO_ADDRESS],
      Destination: { ToAddresses: [email] },
      Content: {
        Simple: {
          Subject: { Data: "Confirm your email for Jiro early access" },
          Body: { Text: { Data: text }, Html: { Data: html } },
        },
      },
    }),
  );
}

// ---------- Clarify ----------

async function clarify(path, init = {}) {
  if (!CLARIFY_API_KEY || !CLARIFY_WORKSPACE) throw new Error("Clarify configuration is missing");
  const response = await fetch(
    `${CLARIFY_ROOT}/workspaces/${encodeURIComponent(CLARIFY_WORKSPACE)}/objects/person/${path}`,
    {
      ...init,
      headers: { authorization: `api-key ${CLARIFY_API_KEY}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(CLARIFY_TIMEOUT_MS),
    },
  );
  if (!response.ok) throw Object.assign(new Error(), { name: `ClarifyHTTP${response.status}` });
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function utmFrom(page) {
  try {
    const params = new URL(page).searchParams;
    return Object.fromEntries(UTM_KEYS.filter((k) => params.get(k)).map((k) => [k, params.get(k).slice(0, 200)]));
  } catch {
    return {};
  }
}

async function saveToClarify({ name, email, page, referrer }) {
  const [first_name, ...rest] = name.split(/\s+/);
  const details = {
    early_access_confirmed_at: new Date().toISOString().slice(0, 10),
    early_access_context: JSON.stringify({
      source: "jiro.bot-early-access",
      page,
      referrer,
      utm: utmFrom(page),
      confirmed_at: new Date().toISOString(),
    }),
  };

  const { data: matches } = await clarify(`resources?filter[email_addresses]=${encodeURIComponent(email)}`);
  const existing = matches?.find((p) =>
    p.attributes?.email_addresses?.items?.some((e) => String(e).toLowerCase() === email),
  );

  if (!existing) {
    // match_on guards against a concurrent confirm creating the same person.
    await clarify("records?silent=true", {
      method: "POST",
      body: JSON.stringify({
        match_on: "email_addresses",
        data: {
          type: "person",
          attributes: {
            name: { first_name, last_name: rest.join(" ") },
            email_addresses: { items: [email] },
            labels: { items: [LABEL] },
            early_access_status: INITIAL_STATUS,
            ...details,
          },
        },
      }),
    });
    return;
  }

  // Existing contacts keep their other labels and wherever Martin has moved them.
  const attributes = { ...details };
  const meta = {};
  if (!existing.attributes?.labels?.items?.includes(LABEL)) {
    attributes.labels = { items: [LABEL] };
    meta.labels = { collection: "append" };
  }
  if (!existing.attributes?.early_access_status) attributes.early_access_status = INITIAL_STATUS;
  await clarify(`records/${encodeURIComponent(existing.id)}?silent=true`, {
    method: "PATCH",
    body: JSON.stringify({ data: { type: "person", id: existing.id, attributes }, meta }),
  });
}
