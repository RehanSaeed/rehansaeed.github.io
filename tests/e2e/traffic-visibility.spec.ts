import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test as unitTest, type Locator } from "@playwright/test";
import { test } from "./fixtures";
import type { TrafficSnapshot } from "../../shared/utils/traffic";

const path = "/ai-gone-rogue/";
const previous = "/on-the-etiquette-of-pull-request-comments/";
const history = {
  startDate: "2026-10-27",
  endDate: "2026-10-30",
  months: [{ month: "2026-10", views: 11, engagementSeconds: 110 }],
  days: [
    { date: "2026-10-27", views: 2, engagementSeconds: 20 },
    { date: "2026-10-28", views: 5, engagementSeconds: 50 },
    { date: "2026-10-29", views: 3, engagementSeconds: 30 },
    { date: "2026-10-30", views: 1, engagementSeconds: 10 },
  ],
};
const snapshot: TrafficSnapshot = {
  updated: "2026-10-30T06:23:00Z",
  timeZone: "Etc/GMT",
  posts: { [path]: history, [previous]: history },
};

async function clickDate(button: Locator, count = 5) {
  for (let index = 0; index < count; index++) await button.click();
}

test.beforeEach(async ({ page }) => {
  await page.route("**/post-traffic.json", (route) =>
    route.fulfill({ json: snapshot }),
  );
});

test("Traffic stays hidden without fetching a snapshot until the fifth activation", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/post-traffic.json") requests++;
  });
  const response = await page.goto(path);
  expect(await response!.text()).not.toContain('class="post-page__traffic');
  const date = page.locator(".dt-published");
  await expect(date).toHaveJSProperty("tagName", "TIME");
  await expect(date).toHaveAttribute("datetime", /^2026-10-27/);
  const button = date.getByRole("button");
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button).toHaveAccessibleName(/activate five times/);
  await expect(date).not.toHaveAttribute("tabindex");
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  expect(requests).toBe(0);
  await clickDate(button, 4);
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  expect(requests).toBe(0);
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".post-traffic__total dd")).toHaveText("11");
  expect(requests).toBe(1);
  await clickDate(button);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  expect(requests).toBe(1);
});

test("The publication date retains its tooltip and supports Enter and Space", async ({
  page,
}) => {
  await page.goto(path);
  const button = page.locator(".dt-published button");
  await expect(button).toBeEnabled();
  await button.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(button).toBeFocused();
  const datetime = await page.locator(".dt-published").getAttribute("datetime");
  await expect(
    page.getByRole("tooltip").filter({ hasText: datetime! }),
  ).toBeVisible();
  for (let index = 0; index < 5; index++) await button.press("Enter");
  await expect(page.locator(".post-traffic")).toBeVisible();
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  for (let index = 0; index < 5; index++) await button.press("Space");
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  await expect(button).toHaveAttribute("aria-pressed", "false");
});

test("A pause of more than three seconds resets the activation count", async ({
  page,
}) => {
  await page.goto(path);
  const button = page.locator(".dt-published button");
  await expect(button).toBeEnabled();
  await page.clock.install();
  await clickDate(button, 4);
  await page.clock.fastForward(3100);
  await clickDate(button, 4);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  await button.click();
  await expect(page.locator(".post-traffic")).toBeVisible();
});

test("Visibility survives reloads and article navigation but not an independent tab", async ({
  page,
  context,
}) => {
  await page.goto(path);
  await clickDate(page.locator(".dt-published button"));
  await expect(page.locator(".post-traffic")).toBeVisible();
  await page.reload();
  await expect(page.locator(".dt-published button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".post-traffic")).toBeVisible();
  await page.getByRole("link", { name: /Previous post/ }).click();
  await expect(page).toHaveURL(new RegExp(`${previous}$`));
  await expect(page.locator(".dt-published button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".post-traffic")).toBeVisible();

  const independent = await context.newPage();
  await independent.goto(path);
  await expect(independent.locator(".dt-published button")).toBeEnabled();
  await expect(independent.locator(".dt-published button")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(independent.locator(".post-traffic")).toHaveCount(0);
  await independent.close();

  await clickDate(page.locator(".dt-published button"));
  await page.reload();
  await expect(page.locator(".dt-published button")).toBeEnabled();
  await expect(page.locator(".dt-published button")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator(".post-traffic")).toHaveCount(0);
});

test("Blocked session storage logs the limitation without breaking the toggle", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (this: Storage, key: string) {
      if (key === "article-traffic-visible")
        throw new DOMException("Storage blocked", "SecurityError");
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === "article-traffic-visible")
        throw new DOMException("Storage blocked", "SecurityError");
      return set.call(this, key, value);
    };
  });
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await page.goto(path);
  await clickDate(page.locator(".dt-published button"));
  await expect(page.locator(".post-traffic")).toBeVisible();
  expect(warnings.join("\n")).toContain("Could not restore tab visibility");
  expect(warnings.join("\n")).toContain(
    "Could not save visibility for reloads",
  );
});

test("Publication switches are not added to article listings or update dates", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".post-card .dt-published").first()).toBeVisible();
  await expect(page.locator(".post-card .dt-published button")).toHaveCount(0);
  await page.goto("/gethashcode-made-easy/");
  await expect(page.locator(".dt-published button")).toBeEnabled();
  await expect(page.locator(".dt-updated")).toHaveJSProperty("tagName", "TIME");
  await expect(page.locator(".dt-updated button")).toHaveCount(0);
});

test.describe("Touch publication-date gesture", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 900 } });
  test("Five taps reveal traffic without changing the date layout", async ({
    page,
  }) => {
    await page.goto(path);
    const button = page.locator(".dt-published button");
    await expect(button).toBeEnabled();
    const before = await button.boundingBox();
    for (let index = 0; index < 5; index++) await button.tap();
    await expect(page.locator(".post-traffic")).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const after = await button.boundingBox();
    expect(after!.width).toBeCloseTo(before!.width, 1);
    expect(after!.height).toBeCloseTo(before!.height, 1);
  });
});

unitTest(
  "Traffic JSON is public but excluded from automatic PWA precaching",
  async () => {
    const worker = await readFile(join("dist", "service-worker.js"), "utf8");
    const urls = [...worker.matchAll(/\burl:"((?:[^"\\]|\\.)*)"/g)].map(
      (match) => JSON.parse(`"${match[1]}"`) as string,
    );
    expect(urls.length).toBeGreaterThan(500);
    expect(urls).not.toContain("post-traffic.json");
    expect(worker).toContain('"article-traffic"');
    expect(worker).toContain("NetworkFirst");
  },
);
