import { getAnalyticsEvents, expect, test } from "./fixtures";

const browserFreeTest = test.extend({
  browser: () =>
    Promise.reject(new Error("Request-only tests must not start a browser.")),
});

browserFreeTest(
  "Request-only tests do not initialise page fixtures",
  async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
  },
);

test.describe("HTTPS preview routing", () => {
  test.use({ baseURL: "https://preview.example.test" });

  test("Preview documents and images are not replaced with external stubs", async ({
    page,
    context,
  }) => {
    // Context routes run after page routes, so this also detects swallowed requests.
    await context.route("https://preview.example.test/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<h1>Preview page</h1><img alt="Preview image" src="/image.svg">',
      }),
    );
    await context.route("https://preview.example.test/image.svg", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24"/>',
      }),
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Preview page", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByRole("img", { name: "Preview image", exact: true })
          .evaluate((image: HTMLImageElement) => ({
            complete: image.complete,
            width: image.naturalWidth,
            height: image.naturalHeight,
          })),
      )
      .toEqual({ complete: true, width: 32, height: 24 });
  });
});

test("Analytics events are captured locally without loading vendor scripts", async ({
  page,
  context,
}) => {
  const escapedRequests: string[] = [];
  await context.route(
    /google-analytics\.com|googletagmanager\.com|analytics\.google\.com/,
    (route) => {
      escapedRequests.push(route.request().url());
      return route.abort();
    },
  );
  await page.goto("/");
  await page.evaluate(() => {
    Object.assign(window, {
      ga: Object.assign(() => {}, {
        q: [["send", "event", "Test", "queued-action", "Queued label"]],
      }),
    });
  });
  await page.addScriptTag({
    url: "https://www.google-analytics.com/analytics.js",
  });
  await page.addScriptTag({
    url: "https://www.googletagmanager.com/gtag/js?id=test",
  });
  const status = await page.evaluate(async () => {
    const response = await fetch("https://www.google-analytics.com/g/collect");
    return response.status;
  });
  expect(status).toBe(204);
  expect(await getAnalyticsEvents(page)).toContainEqual({
    category: "Test",
    action: "queued-action",
    label: "Queued label",
  });
  expect(escapedRequests).toEqual([]);
});
