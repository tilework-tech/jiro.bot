import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { mockClient } from "aws-sdk-client-mock";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

process.env.CONFIRM_SECRET = "test-secret-do-not-use-in-prod";
process.env.CLARIFY_API_KEY = "test-key";
process.env.CLARIFY_WORKSPACE = "noriagentic";
delete process.env.FROM_ADDRESS;
delete process.env.REPLY_TO_ADDRESS;
delete process.env.SITE_ORIGIN;

const { handler } = await import("./index.mjs");
const ses = mockClient(SESv2Client);

const SITE = "https://jiro.bot";
const DOMAIN = "abc123.execute-api.us-east-1.amazonaws.com";
const LABEL = "Jiro Early Access";

// In-memory stand-in for the Clarify person records API. Email matching ignores
// case, as Clarify normalizes emails on both writes and filters.
let people;
let clarifyRequests;
let clarifyDown;
const originalFetch = globalThis.fetch;
const CONSOLE_METHODS = ["log", "info", "warn", "error"];
const originalConsole = Object.fromEntries(CONSOLE_METHODS.map((m) => [m, console[m]]));
let logs;

const hasEmail = (person, email) =>
  person.attributes.email_addresses.items.some((e) => e.toLowerCase() === email.toLowerCase());

function fakeClarify(url, init = {}) {
  const u = new URL(url);
  const method = init.method || "GET";
  clarifyRequests.push({ method, url: u });
  if (clarifyDown === "network") throw new TypeError("fetch failed");
  if (clarifyDown === true || clarifyDown === method) {
    return Response.json({ errors: [{ status: "503" }] }, { status: 503 });
  }
  if (init.headers?.authorization !== "api-key test-key" || !u.pathname.startsWith("/v1/workspaces/noriagentic/")) {
    return Response.json({ errors: [{ status: "401" }] }, { status: 401 });
  }
  const body = init.body ? JSON.parse(init.body) : null;

  if (method === "GET" && u.pathname.endsWith("/objects/person/resources")) {
    const data = people.filter((p) => hasEmail(p, u.searchParams.get("filter[email_addresses]")));
    return Response.json({ data, meta: { total_records: data.length } });
  }
  if (method === "POST" && u.pathname.endsWith("/objects/person/records")) {
    const person = {
      id: `person-${people.length + 1}`,
      type: "person",
      attributes: structuredClone(body.data.attributes),
    };
    people.push(person);
    return Response.json({ data: person }, { status: 201 });
  }
  const patch = u.pathname.match(/\/objects\/person\/records\/([^/]+)$/);
  if (method === "PATCH" && patch) {
    const person = people.find((p) => p.id === patch[1]);
    if (!person) return Response.json({ errors: [{ status: "404" }] }, { status: 404 });
    for (const [key, value] of Object.entries(body.data.attributes)) {
      if (body.meta?.[key]?.collection === "append") {
        person.attributes[key] = { items: [...(person.attributes[key]?.items || []), ...value.items] };
      } else {
        person.attributes[key] = value;
      }
    }
    return Response.json({ data: person });
  }
  return Response.json({ errors: [{ status: "404" }] }, { status: 404 });
}

function signupEvent(body, { origin = SITE, method = "POST", raw, base64 = false } = {}) {
  const text = raw ?? JSON.stringify(body);
  return {
    rawPath: "/signup",
    headers: origin === null ? {} : { origin },
    requestContext: { http: { method }, domainName: DOMAIN, requestId: "req-1" },
    body: base64 ? Buffer.from(text).toString("base64") : text,
    isBase64Encoded: base64,
  };
}

function openLink(token) {
  return {
    rawPath: "/confirm",
    headers: {},
    requestContext: { http: { method: "GET" }, domainName: DOMAIN, requestId: "req-2" },
    ...(token === undefined ? {} : { queryStringParameters: { token } }),
  };
}

// Opens the emailed link, then submits the page's confirm form the way a browser would.
async function confirm(token, app = handler) {
  const page = await app(openLink(token));
  if (page.statusCode !== 200) return page;
  const form = page.body.match(/<form[^>]*method="post"[^>]*action="([^"]+)"[\s\S]*?name="token" value="([^"]*)"/i);
  assert.ok(form, "confirm page has a form");
  const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  return app({
    rawPath: new URL(decode(form[1]), `https://${DOMAIN}`).pathname,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    requestContext: { http: { method: "POST" }, domainName: DOMAIN, requestId: "req-3" },
    body: new URLSearchParams({ token: decode(form[2]) }).toString(),
  });
}

const valid = (overrides = {}) => ({
  name: "Alex Morgan",
  email: "alex@company.com",
  org: "Acme Robotics",
  page: "https://jiro.bot/?utm_source=linkedin&utm_campaign=launch",
  referrer: "https://www.linkedin.com/",
  ...overrides,
});

const sentEmails = () => ses.commandCalls(SendEmailCommand).map((c) => c.args[0].input);

async function signUpAndGetToken(body = valid(), app = handler) {
  const res = await app(signupEvent(body));
  assert.equal(res.statusCode, 202);
  const text = sentEmails().at(-1).Content.Simple.Body.Text.Data;
  return decodeURIComponent(text.match(/\/confirm\?token=([^\s"]+)/)[1]);
}

const findPerson = (email) => people.find((p) => hasEmail(p, email));
const assertNoVisitorDetails = () => {
  assert.ok(logs.length > 0, "failure was logged");
  for (const secret of ["alex@company.com", "Alex Morgan", "Acme Robotics"]) {
    assert.ok(
      logs.every((line) => !line.includes(secret)),
      `logs leak ${secret}`,
    );
  }
};

beforeEach(() => {
  ses.reset();
  ses.on(SendEmailCommand).resolves({ MessageId: "m" });
  people = [];
  clarifyRequests = [];
  clarifyDown = false;
  logs = [];
  globalThis.fetch = fakeClarify;
  for (const m of CONSOLE_METHODS)
    console[m] = (...args) => logs.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  Object.assign(console, originalConsole);
  mock.timers.reset();
});

// ---------- sign-up ----------

test("sign-up emails a confirm link from Martin and saves nothing to Clarify yet", async () => {
  const res = await handler(signupEvent(valid({ email: " Alex@Company.com " })));

  assert.equal(res.statusCode, 202);
  assert.equal(res.headers["access-control-allow-origin"], SITE);
  const [email] = sentEmails();
  assert.deepEqual(email.Destination.ToAddresses, ["alex@company.com"]);
  assert.match(email.FromEmailAddress, /<martin@jiro\.bot>$/);
  assert.deepEqual(email.ReplyToAddresses, ["martin@noriagentic.com"]);
  for (const body of [email.Content.Simple.Body.Text.Data, email.Content.Simple.Body.Html.Data]) {
    assert.match(body, /Hi Alex,/);
    assert.match(body, new RegExp(`https://${DOMAIN}/confirm\\?token=`));
  }
  assert.equal(clarifyRequests.length, 0);
});

test("names are escaped in the HTML email", async () => {
  await handler(signupEvent(valid({ name: "<img src=x onerror=alert(1)> Morgan" })));
  const html = sentEmails()[0].Content.Simple.Body.Html.Data;
  assert.doesNotMatch(html, /<img src=x/);
});

test("names that look like links are not repeated in the email", async () => {
  for (const name of ["https://evil.example/login", "evil.example Morgan", "www.evil.example"]) {
    ses.reset();
    ses.on(SendEmailCommand).resolves({ MessageId: "m" });
    await handler(signupEvent(valid({ name })));
    const { Text, Html } = sentEmails()[0].Content.Simple.Body;
    for (const body of [Text.Data, Html.Data]) {
      assert.match(body, /Hi there,/, name);
      assert.ok(!body.includes("evil.example"), name);
    }
  }
});

test("rejects missing or malformed fields without sending email", async () => {
  const bad = [
    valid({ name: "" }),
    valid({ name: "A" }),
    valid({ email: "not-an-email" }),
    valid({ email: undefined }),
    valid({ email: `${"a".repeat(250)}@company.com` }),
    valid({ org: "" }),
    valid({ org: "   " }),
    valid({ org: "x".repeat(500) }),
  ];
  for (const body of bad) {
    assert.equal((await handler(signupEvent(body))).statusCode, 400, JSON.stringify(body).slice(0, 80));
  }
  for (const raw of ["{not json", "null", "[]"]) {
    assert.equal((await handler(signupEvent(null, { raw }))).statusCode, 400, raw);
  }
  const huge = JSON.stringify({ ...valid(), referrer: "x".repeat(1024 * 1024) });
  assert.equal((await handler(signupEvent(null, { raw: huge }))).statusCode, 413);
  assert.equal(sentEmails().length, 0);
});

test("base64-encoded bodies and requests without an Origin header are accepted", async () => {
  assert.equal((await handler(signupEvent(valid(), { base64: true }))).statusCode, 202);
  assert.equal((await handler(signupEvent(valid(), { origin: null }))).statusCode, 202);
  assert.equal(sentEmails().length, 2);
});

test("page and referrer are optional, and a malformed page URL is tolerated", async () => {
  assert.equal((await handler(signupEvent(valid({ page: undefined, referrer: undefined })))).statusCode, 202);
  const token = await signUpAndGetToken(valid({ page: "not a url" }));
  assert.equal((await confirm(token)).headers.location, `${SITE}/confirmed.html`);
});

test("honeypot submissions look accepted but send nothing", async () => {
  const res = await handler(signupEvent(valid({ ea_hp: "http://spam.example" })));
  assert.equal(res.statusCode, 202);
  assert.equal(sentEmails().length, 0);
});

test("sign-up refuses other websites", async () => {
  assert.equal((await handler(signupEvent(valid(), { origin: "https://evil.example" }))).statusCode, 403);
  assert.equal(sentEmails().length, 0);
});

test("browser preflight from jiro.bot and www.jiro.bot is allowed", async () => {
  for (const origin of [SITE, "https://www.jiro.bot"]) {
    const preflight = await handler(signupEvent(null, { method: "OPTIONS", origin }));
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers["access-control-allow-origin"], origin);
    assert.match(preflight.headers["access-control-allow-methods"], /POST/);
  }
});

test("unknown routes are not found", async () => {
  assert.equal((await handler({ ...signupEvent(valid()), rawPath: "/elsewhere" })).statusCode, 404);
  assert.equal((await handler(signupEvent(null, { method: "GET" }))).statusCode, 404);
  assert.equal(sentEmails().length, 0);
});

test("a failed send is reported to the visitor without logging their details", async () => {
  ses.on(SendEmailCommand).rejects(
    Object.assign(
      new Error("Email address is not verified. The following identities failed the check: alex@company.com"),
      {
        name: "MessageRejected",
      },
    ),
  );
  const res = await handler(signupEvent(valid()));
  assert.equal(res.statusCode, 502);
  assertNoVisitorDetails();
});

// ---------- confirm ----------

test("opening the link alone saves nothing, so mail scanners can't confirm a sign-up", async () => {
  const token = await signUpAndGetToken();
  const page = await handler(openLink(token));
  assert.equal(page.statusCode, 200);
  assert.match(page.headers["content-type"], /text\/html/);
  assert.match(page.body, /confirm/i);
  assert.equal(clarifyRequests.length, 0);
});

test("confirming adds a new person to the early-access waitlist and redirects to /confirmed", async () => {
  mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-03T15:00:00Z").getTime() });
  const res = await confirm(await signUpAndGetToken());

  assert.equal(res.statusCode, 303);
  assert.equal(res.headers.location, `${SITE}/confirmed.html`);
  const person = findPerson("alex@company.com");
  assert.deepEqual(person.attributes.name, { first_name: "Alex", last_name: "Morgan" });
  assert.deepEqual(person.attributes.labels.items, [LABEL]);
  assert.equal(person.attributes.early_access_status, "Waitlist");
  assert.equal(person.attributes.early_access_org, "Acme Robotics");
  assert.equal(person.attributes.early_access_confirmed_at, "2026-11-03");
  const context = JSON.parse(person.attributes.early_access_context);
  assert.equal(context.page, "https://jiro.bot/?utm_source=linkedin&utm_campaign=launch");
  assert.equal(context.referrer, "https://www.linkedin.com/");
  assert.deepEqual(context.utm, { utm_source: "linkedin", utm_campaign: "launch" });
});

test("one-word and multi-word names are split into first and last name", async () => {
  await confirm(await signUpAndGetToken(valid({ name: "Cher", email: "cher@company.com" })));
  await confirm(await signUpAndGetToken(valid({ name: "Mary Jane Smith", email: "mj@company.com" })));
  assert.deepEqual(findPerson("cher@company.com").attributes.name, { first_name: "Cher", last_name: "" });
  assert.deepEqual(findPerson("mj@company.com").attributes.name, { first_name: "Mary", last_name: "Jane Smith" });
});

test("confirming an existing contact keeps their labels and their outreach status", async () => {
  people.push({
    id: "person-existing",
    type: "person",
    attributes: {
      name: { first_name: "Alex", last_name: "Morgan" },
      email_addresses: { items: ["Alex@Company.com"] },
      labels: { items: ["Newsletter"] },
      early_access_status: "Booked",
    },
  });

  const res = await confirm(await signUpAndGetToken(valid({ org: "Acme Labs" })));

  assert.equal(res.headers.location, `${SITE}/confirmed.html`);
  assert.equal(people.length, 1);
  const { attributes } = findPerson("alex@company.com");
  assert.deepEqual([...attributes.labels.items].sort(), [LABEL, "Newsletter"].sort());
  assert.equal(attributes.early_access_status, "Booked");
  assert.equal(attributes.early_access_org, "Acme Labs");
});

test("an existing contact who was never on the waitlist starts at Waitlist", async () => {
  people.push({
    id: "person-existing",
    type: "person",
    attributes: { email_addresses: { items: ["alex@company.com"] }, labels: { items: ["Outbound"] } },
  });
  await confirm(await signUpAndGetToken());
  assert.equal(findPerson("alex@company.com").attributes.early_access_status, "Waitlist");
});

test("confirming twice does not duplicate the person or the label", async () => {
  const token = await signUpAndGetToken();
  await confirm(token);
  assert.equal((await confirm(token)).headers.location, `${SITE}/confirmed.html`);
  assert.equal(people.length, 1);
  assert.deepEqual(findPerson("alex@company.com").attributes.labels.items, [LABEL]);
});

test("links signed with another secret, altered, or missing go to /link-expired without touching Clarify", async () => {
  const realSecret = process.env.CONFIRM_SECRET;
  process.env.CONFIRM_SECRET = "attacker-secret-also-long-enough";
  const { handler: attacker } = await import("./index.mjs?attacker");
  process.env.CONFIRM_SECRET = realSecret;
  const forged = await signUpAndGetToken(valid({ email: "eve@evil.example" }), attacker);

  const token = await signUpAndGetToken();
  const flip = (t, i) => t.slice(0, i) + (t[i] === "A" ? "B" : "A") + t.slice(i + 1);
  const altered = [0, Math.floor(token.length / 2), token.length - 1].map((i) => flip(token, i));

  for (const t of [undefined, "", "garbage", forged, ...altered]) {
    const res = await confirm(t);
    assert.ok([302, 303].includes(res.statusCode));
    assert.equal(res.headers.location, `${SITE}/link-expired.html`);
  }
  // A forged token posted straight to the confirm form is refused too.
  const posted = await handler({
    rawPath: "/confirm",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    requestContext: { http: { method: "POST" }, domainName: DOMAIN },
    body: `token=${encodeURIComponent(forged)}`,
  });
  assert.equal(posted.headers.location, `${SITE}/link-expired.html`);
  assert.equal(clarifyRequests.length, 0);
});

test("confirm links work for 24 hours and then expire", async () => {
  mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const early = await signUpAndGetToken(valid({ email: "early@company.com" }));
  const late = await signUpAndGetToken(valid({ email: "late@company.com" }));

  mock.timers.tick(24 * 60 * 60 * 1000 - 1);
  assert.equal((await confirm(early)).headers.location, `${SITE}/confirmed.html`);
  mock.timers.tick(2);
  assert.equal((await confirm(late)).headers.location, `${SITE}/link-expired.html`);
  assert.equal(findPerson("late@company.com"), undefined);
});

test("a Clarify failure shows a retry page instead of claiming the spot is confirmed", async () => {
  people.push({
    id: "person-existing",
    type: "person",
    attributes: { email_addresses: { items: ["alex@company.com"] } },
  });
  const token = await signUpAndGetToken();
  for (const outage of [true, "network", "PATCH"]) {
    clarifyDown = outage;
    logs = [];
    const res = await confirm(token);

    assert.equal(res.statusCode, 502, String(outage));
    assert.match(res.headers["content-type"], /text\/html/);
    assert.match(res.body, /try the link again/i);
    assertNoVisitorDetails();
  }

  clarifyDown = false;
  assert.equal((await confirm(token)).headers.location, `${SITE}/confirmed.html`);
  assert.equal(people.length, 1);
});

test("missing Clarify configuration shows the retry page", async () => {
  const key = process.env.CLARIFY_API_KEY;
  delete process.env.CLARIFY_API_KEY;
  const { handler: unconfigured } = await import("./index.mjs?unconfigured");
  process.env.CLARIFY_API_KEY = key;

  const res = await confirm(await signUpAndGetToken(valid(), unconfigured), unconfigured);
  assert.equal(res.statusCode, 502);
  assert.equal(people.length, 0);
});
