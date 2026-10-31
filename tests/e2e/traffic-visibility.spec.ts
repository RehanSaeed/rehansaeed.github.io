import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test as unitTest, type Locator } from "@playwright/test";
import { test } from "./fixtures";
import type { TrafficSnapshot } from "../../shared/utils/traffic";

const path = "/ai-gone-rogue/";
const previous = "/on-the-etiquette-of-pull-request-comments/";
const gestureSelector = ".post-page__title-container .post-meta";
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

async function clickTimes(gesture: Locator, count = 5) {
  for (let index = 0; index < count; index++) {
    await gesture.click();
  }
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
    if (new URL(request.url()).pathname === "/post-traffic.json") {
      requests++;
    }
  });
  const response = await page.goto(path);
  expect(await response!.text()).not.toContain('class="post-page__traffic');
  const date = page.locator(".dt-published");
  await expect(date).toHaveJSProperty("tagName", "TIME");
  await expect(date).toHaveAttribute("datetime", /^2026-10-27/);
  const gesture = page.locator(gestureSelector);
  await expect(gesture).toBeAttached();
  await expect(date.getByRole("button")).toHaveCount(0);
  await expect(date).toHaveAttribute("tabindex", "0");
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  expect(requests).toBe(0);
  await clickTimes(gesture, 4);
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  expect(requests).toBe(0);
  await gesture.click();
  await expect(page.locator(".post-traffic__total dd")).toHaveText("11");
  expect(requests).toBe(1);
  await clickTimes(gesture);
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  expect(requests).toBe(1);
});

test("Metadata keeps its original appearance, date focus and tooltip without advertising the gesture", async ({
  page,
}) => {
  await page.goto(path);
  const date = page.locator(".dt-published");
  const gesture = page.locator(gestureSelector);
  await expect(gesture).toBeAttached();
  await expect(date).not.toHaveAttribute("aria-hidden");
  await expect(gesture).not.toHaveCSS("cursor", "pointer");
  await expect(gesture).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(gesture).toHaveCSS("border-top-width", "0px");
  await expect(gesture).toHaveJSProperty("tabIndex", -1);
  await expect(date).toHaveJSProperty("tabIndex", 0);
  await expect(
    date.locator("button, [role], [aria-label], [aria-pressed]"),
  ).toHaveCount(0);
  const dateText = (await date.innerText()).trim();
  expect(dateText).not.toBe("");
  const accessible = await page.locator(".post-meta").ariaSnapshot();
  expect(accessible).toContain(dateText);
  expect(accessible).not.toMatch(/button|traffic|activate|pressed/i);
  await date.focus();
  await expect(date).toBeFocused();
  const datetime = await date.getAttribute("datetime");
  await expect(
    page.getByRole("tooltip").filter({ hasText: datetime! }),
  ).toBeVisible();
  await page.mouse.move(0, 0);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  await clickTimes(gesture);
  await expect(page.locator(".post-traffic")).toBeVisible();
  expect(await page.locator(".post-meta").ariaSnapshot()).not.toMatch(
    /button|traffic|activate|pressed/i,
  );
  await clickTimes(gesture);
  await expect(page.locator(".post-traffic")).toHaveCount(0);
});

test("A pause of more than three seconds resets the activation count", async ({
  page,
}) => {
  await page.goto(path);
  const gesture = page.locator(gestureSelector);
  await expect(gesture).toBeAttached();
  await page.clock.install();
  await clickTimes(gesture, 4);
  await page.clock.fastForward(3100);
  await clickTimes(gesture, 4);
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  await gesture.click();
  await expect(page.locator(".post-traffic")).toBeVisible();
});

test("Visibility survives reloads and article navigation but not an independent tab", async ({
  page,
  context,
}) => {
  await page.goto(path);
  await clickTimes(page.locator(gestureSelector));
  await expect(page.locator(".post-traffic")).toBeVisible();
  await page.reload();
  await expect(page.locator(".post-traffic")).toBeVisible();
  await page.getByRole("link", { name: /Previous post/ }).click();
  await expect(page).toHaveURL(new RegExp(`${previous}$`));
  await expect(page.locator(".post-traffic")).toBeVisible();

  const independent = await context.newPage();
  await independent.goto(path);
  await expect(independent.locator(gestureSelector)).toBeAttached();
  await expect(independent.locator(".post-traffic")).toHaveCount(0);
  await independent.close();

  await clickTimes(page.locator(gestureSelector));
  await page.reload();
  await expect(page.locator(gestureSelector)).toBeAttached();
  await expect(page.locator(".post-traffic")).toHaveCount(0);
});

test("Blocked session storage logs the limitation without breaking the toggle", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (this: Storage, key: string) {
      if (key === "article-traffic-visible") {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === "article-traffic-visible") {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return set.call(this, key, value);
    };
  });
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") {
      warnings.push(message.text());
    }
  });
  await page.goto(path);
  await clickTimes(page.locator(gestureSelector));
  await expect(page.locator(".post-traffic")).toBeVisible();
  expect(warnings.join("\n")).toContain("Could not restore tab visibility");
  expect(warnings.join("\n")).toContain(
    "Could not save visibility for reloads",
  );
});

test("The metadata gesture is limited to article headers and works across the whole line", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".post-card .dt-published").first()).toBeVisible();
  await expect(page.locator(gestureSelector)).toHaveCount(0);
  const updatedPath = "/gethashcode-made-easy/";
  await page.route("**/post-traffic.json", (route) =>
    route.fulfill({
      json: { ...snapshot, posts: { [updatedPath]: history } },
    }),
  );
  await page.goto(updatedPath);
  await expect(page.locator(gestureSelector)).toBeAttached();
  await expect(page.locator(".dt-updated")).toHaveJSProperty("tagName", "TIME");
  await clickTimes(page.locator(".dt-published"), 2);
  await clickTimes(page.locator(".dt-updated"), 2);
  await expect(page.locator(".post-traffic")).toHaveCount(0);
  await page.locator(gestureSelector).locator("strong").click();
  await expect(page.locator(".post-traffic")).toBeVisible();
});

test.describe("Touch article-metadata gesture", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 900 } });
  test("Five taps on metadata reveal traffic without changing the date layout", async ({
    page,
  }) => {
    await page.goto(path);
    const date = page.locator(".dt-published");
    const gesture = page.locator(gestureSelector);
    await expect(gesture).toBeAttached();
    const before = await date.boundingBox();
    for (let index = 0; index < 5; index++) {
      await gesture.tap();
    }
    await expect(page.locator(".post-traffic")).toBeVisible();
    const after = await date.boundingBox();
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
