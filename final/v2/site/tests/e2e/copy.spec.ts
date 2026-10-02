import { expect, test, type Page } from "@playwright/test";
import { open, settled } from "./helpers";

const COPY: Record<string, string[]> = {
  hero: [
    "Jiro, the tasteful software engineer",
    "Bring your own subscription.",
    "Jiro works while you sleep",
    "Trigger Jiro from Slack mentions, Linear issues, CI failures, or alerts. Wake up to fixes instead of a backlog.",
  ],
  product: [
    "Plan, build, review, and ship PRs with an autonomous agent across Slack, web, and CLI.",
    "Every PR reviewed before your teammates see it",
    "Jiro reviews every pull request with automated checks and visual QA.",
  ],
  compare: [
    "Jiro vs. AI slop",
    "Jiro works, opinionated, inside your code host, Slack, and web, so context flows in and work ships out without a new dashboard or a migration to plan.",
  ],
  table: [
    "Any model, any harness, any integration, any compute",
    "Bring your own subscription, no token mark-up, move freely between providers, models, and weights.",
  ],
  faq: [
    "Which coding agents can I run?",
    "Can it work with our non-engineering tools?",
    "What does an agent's environment look like?",
    "How does billing work?",
    "Is the output always a pull request?",
    "What repositories can I use?",
  ],
  price: [
    "Not market price",
    "Apprentice", "$0", "Free trial",
    "Itamae", "$99/mo", "Single developer",
    "Omakase", "$250/mo", "Teams",
  ],
  pond: ["Pull up a Stool"],
};

const words = (s: string) => s.replace(/\s+/g, " ").trim();

async function goTo(page: Page, id: string) {
  const top = await page.locator(`[data-stop="${id}"]`).evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), top);
  await settled(page);
}

for (const [id, lines] of Object.entries(COPY)) {
  test(`the ${id} scene shows its new copy and nothing else`, async ({ page }) => {
    await open(page);
    await goTo(page, id);
    const stop = page.locator(`[data-stop="${id}"]`);
    expect(words(await stop.innerText())).toBe(words(lines.join(" ")));
  });
}

test("the scenes run in order, each with a Reserve a seat button in the top right corner", async ({ page }) => {
  await open(page);
  const ids = await page.locator("[data-stop]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.stop));
  expect(ids).toEqual(Object.keys(COPY));
  const vw = page.viewportSize()!.width;
  for (const id of ids) {
    await goTo(page, id!);
    const cta = page.getByRole("link", { name: "Reserve a seat" });
    await expect(cta, id).toBeInViewport();
    const box = (await cta.boundingBox())!;
    expect(box.y, id).toBeLessThan(60);
    expect(box.x + box.width, id).toBeGreaterThan(vw - 60);
    expect(await page.evaluate((b) => document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.closest("a")?.textContent, box), id).toBe("Reserve a seat");
  }
  expect(await page.getByRole("link", { name: "Reserve a seat" }).getAttribute("href")).toMatch(/^https:\/\/noriagentic\.com\//);
});

test("the top bar carries only the logo and the Reserve a seat button", async ({ page }) => {
  await open(page);
  expect(words(await page.locator("header.chrome").innerText())).toBe("jiro.bot Reserve a seat");
});

test("a FAQ answer appears only once a question is clicked", async ({ page }) => {
  await open(page);
  await goTo(page, "faq");
  const answer = page.getByTestId("faq-answer");
  await expect(answer).toBeHidden();
  await page.getByTestId("faq-question").filter({ hasText: "What repositories can I use?" }).click();
  await expect(answer).toBeVisible();
  await expect(answer).toContainText("Any GitHub repository you have access to.");
});

test("the page title carries the new headline", async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle(/Jiro, the tasteful software engineer/);
});
