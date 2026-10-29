import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 4199;
const SITE = `http://127.0.0.1:${PORT}`;
const ENDPOINT = "https://early-access.test/signup";

let server;
let browser;

before(async () => {
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", String(PORT)], {
    cwd: REPO,
    stdio: ["ignore", "ignore", "inherit"],
  });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(SITE).then(
      (r) => r.ok,
      () => false,
    );
    if (!up) await new Promise((r) => setTimeout(r, 100));
  }
  if (!up) throw new Error(`preview server did not start on ${SITE}`);
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.kill();
});

// Opens the page with the sign-up endpoint pointed at a stub that records submissions.
async function openSite({ status = 202, path = "/", networkError = false } = {}) {
  const page = await browser.newPage();
  const errors = [];
  const submissions = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(`${SITE}/`, async (route) => {
    const res = await route.fetch();
    const html = (await res.text()).replace(
      /<meta name="early-access-endpoint" content="[^"]*"/,
      `<meta name="early-access-endpoint" content="${ENDPOINT}"`,
    );
    await route.fulfill({ response: res, body: html });
  });
  await page.route(ENDPOINT, async (route) => {
    if (route.request().method() === "POST") submissions.push(JSON.parse(route.request().postData()));
    if (networkError) return route.abort();
    await route.fulfill({
      status: route.request().method() === "OPTIONS" ? 204 : status,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type",
        "content-type": "application/json",
      },
      body: status < 300 ? '{"accepted":true}' : '{"error":"failed"}',
    });
  });
  await page.goto(`${SITE}${path}`);
  return { page, errors, submissions };
}

const dialog = (page) => page.getByRole("dialog");
const submitButton = (page) => dialog(page).getByRole("button", { name: /get early access/i });

async function fill(page, { name = "Alex Morgan", email = "alex@company.com" } = {}) {
  const d = dialog(page);
  await d.getByLabel(/name/i).fill(name);
  await d.getByLabel(/email/i).fill(email);
}

test("every Get early access button opens the sign-up pop-up", async () => {
  const { page, errors } = await openSite();
  const buttons = page.locator("a, button").filter({ hasText: /^\s*Get early access\s*$/ });
  let clicked = 0;
  for (let i = 0; i < (await buttons.count()); i++) {
    const button = buttons.nth(i);
    if (!(await button.isVisible())) continue;
    await button.click();
    await dialog(page).waitFor({ state: "visible" });
    assert.deepEqual(
      await dialog(page).getByRole("textbox").evaluateAll((inputs) => inputs.map((input) => input.name)),
      ["name", "email"],
    );
    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
    clicked++;
  }
  // Nav, hero, two pricing tiers, the reserve section and the footer.
  assert.ok(clicked >= 6, `clicked ${clicked} buttons`);
  assert.deepEqual(errors, []);
  await page.close();
});

test("a direct #reserve link opens the name and email pop-up", async () => {
  const { page, errors, submissions } = await openSite({ path: "/#reserve" });
  await dialog(page).waitFor({ state: "visible" });
  assert.deepEqual(
    await dialog(page).getByRole("textbox").evaluateAll((inputs) => inputs.map((input) => input.name)),
    ["name", "email"],
  );
  assert.equal(submissions.length, 0);
  assert.deepEqual(errors, []);
  await page.close();
});

test("submitting name and email asks the visitor to check their inbox", async () => {
  const { page, submissions } = await openSite();
  await page.getByRole("link", { name: "Get early access" }).first().click();
  await fill(page);
  await submitButton(page).click();

  await dialog(page)
    .getByText(/check your inbox/i)
    .waitFor();
  assert.ok(await dialog(page).getByText("alex@company.com").isVisible());
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].name, "Alex Morgan");
  assert.equal(submissions[0].email, "alex@company.com");
  assert.match(submissions[0].page, /^http:\/\/127\.0\.0\.1/);
  assert.equal(submissions[0].ea_hp, "", "honeypot field the Lambda checks is sent empty");
  assert.ok(
    await page.evaluate(() => {
      const el = document.activeElement;
      return el.closest("dialog") !== null && el.checkVisibility();
    }),
    "focus moves to the visible confirmation",
  );
  await page.close();
});

test("a visitor can explore a hero example and then sign up", async () => {
  const { page, errors, submissions } = await openSite();
  page.setDefaultTimeout(5000);
  await page.getByRole("tab", { name: "Multiplayer", exact: true }).click();
  await page.getByRole("link", { name: "Get early access" }).first().click();
  await fill(page);
  await submitButton(page).click();
  await dialog(page).getByText(/check your inbox/i).waitFor();
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].email, "alex@company.com");
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("tab", { name: "Multiplayer", exact: true }).getAttribute("aria-selected"), "true");
  assert.deepEqual(errors, []);
  await page.close();
});

test("the FAQ button collects name and email in the dialog and submits the signup", async () => {
  const { page, submissions } = await openSite();
  const reserve = page.getByRole("region", { name: "Get early access", exact: true });
  await reserve.getByRole("button", { name: /get early access/i }).click();
  await fill(page, { name: "Sam Rivera", email: "sam@studio.com" });
  await submitButton(page).click();
  await dialog(page).getByText(/check your inbox/i).waitFor();
  assert.ok(await dialog(page).getByText("sam@studio.com").isVisible());
  assert.deepEqual(submissions, [{
    name: "Sam Rivera",
    email: "sam@studio.com",
    ea_hp: "",
    page: `${SITE}/`,
    referrer: "",
  }]);
  await page.close();
});

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`FAQ signup is reachable by keyboard with ${reducedMotion} motion`, async () => {
    const { page } = await openSite();
    await page.emulateMedia({ reducedMotion });
    // The final FAQ question is the preceding tab stop.
    await page.locator("#faq summary").last().focus();
    await page.keyboard.press("Tab");
    const button = page.locator("#reserve button");
    assert.ok(await button.evaluate((n) => n === document.activeElement), "Tab reaches the signup button");
    assert.ok(await button.evaluate((n) => {
      const style = getComputedStyle(n);
      return n.matches(":focus-visible") && style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2;
    }), "button has a visible keyboard focus ring");
    await page.keyboard.press("Enter");
    await dialog(page).waitFor({ state: "visible" });
    assert.ok(await dialog(page).getByLabel("Name", { exact: true }).evaluate((n) => n === document.activeElement));
    await page.keyboard.press("Tab");
    assert.ok(await dialog(page).getByLabel("Work email").evaluate((n) => n === document.activeElement));
    await page.keyboard.press("Escape");
    assert.ok(await button.evaluate((n) => n === document.activeElement), "Escape returns focus to the signup button");
    await page.close();
  });
}

test("the close button and a click on the backdrop close the pop-up", async () => {
  const { page } = await openSite();
  await page.getByRole("link", { name: "Get early access" }).first().click();
  await dialog(page).getByRole("button", { name: "Close" }).click();
  await dialog(page).waitFor({ state: "hidden" });

  await page.getByRole("link", { name: "Get early access" }).first().click();
  await page.mouse.click(5, 300);
  await dialog(page).waitFor({ state: "hidden" });
  await page.close();
});

test("an incomplete form is not sent", async () => {
  const { page, submissions } = await openSite();
  await page.getByRole("link", { name: "Get early access" }).first().click();
  for (const fields of [{ email: "not-an-email" }, { email: "" }, { name: " " }]) {
    await fill(page, fields);
    await submitButton(page).click();
    assert.equal(submissions.length, 0, JSON.stringify(fields));
  }
  assert.equal(
    await dialog(page)
      .getByText(/check your inbox/i)
      .isVisible(),
    false,
  );
  await page.close();
});

test("a failed or unreachable sign-up keeps the form and lets the visitor try again", async () => {
  for (const options of [{ status: 502 }, { networkError: true }]) {
    const { page } = await openSite(options);
    await page.getByRole("link", { name: "Get early access" }).first().click();
    await fill(page);
    await submitButton(page).click();
    await dialog(page)
      .getByText(/try again/i)
      .waitFor();
    assert.equal(await dialog(page).getByLabel(/email/i).inputValue(), "alex@company.com");
    assert.ok(await submitButton(page).isEnabled());
    await page.close();
  }
});

test("the pop-up links to the privacy policy, which is served on jiro.bot", async () => {
  const { page } = await openSite();
  await page.getByRole("link", { name: "Get early access" }).first().click();
  const href = await dialog(page)
    .getByRole("link", { name: /privacy/i })
    .getAttribute("href");
  const res = await page.goto(new URL(href, SITE).href);
  assert.equal(res.status(), 200);
  await page.getByRole("heading", { name: "Privacy Policy" }).waitFor();
  await page.close();
});

test("confirmed and link-expired pages explain the next step and link home", async () => {
  const page = await browser.newPage();
  for (const [path, text] of [
    ["/confirmed.html", /you('|’)re confirmed/i],
    ["/link-expired.html", /expired/i],
  ]) {
    const res = await page.goto(`${SITE}${path}`);
    assert.equal(res.status(), 200, path);
    await page.getByRole("heading", { name: text }).waitFor();
    const home = await page
      .getByRole("link", { name: /jiro\.bot|back|sign up/i })
      .first()
      .evaluate((a) => a.href);
    assert.equal(home, `${SITE}/`);
  }
  await page.close();
});
