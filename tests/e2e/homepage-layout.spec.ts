import { expect, test } from "./fixtures";

for (const { width, height } of [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 768, height: 1000 },
  { width: 1440, height: 1000 },
]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Post discovery fits the first viewport at ${width}px in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const author = page.getByRole("main").locator(".author");
      await expect(author.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(author.getByRole("img")).toBeVisible();
      await expect(author.locator(".author__description")).toBeVisible();
      const links = author.locator(".social").getByRole("link");
      await expect(links).toHaveCount(9);
      const bounds = await links.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            width: document.documentElement.clientWidth,
          };
        }),
      );
      for (const rect of bounds) {
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(rect.width);
      }
      const title = page.locator(".post-card__title").first();
      const titleBounds = await title.boundingBox();
      expect(titleBounds).not.toBeNull();
      expect(titleBounds!.y + titleBounds!.height).toBeLessThan(height);
      await title.getByRole("link").focus();
      await expect(title.getByRole("link")).toBeFocused();
      const destination = await title.getByRole("link").getAttribute("href");
      await title.getByRole("link").press("Enter");
      await expect(page).toHaveURL(destination!);
    });
  }
}

for (const interaction of ["hover", "focus"] as const) {
  test(`Article data prefetch waits for title ${interaction}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const requestedPaths: string[] = [];
    page.on("request", (request) => {
      requestedPaths.push(new URL(request.url()).pathname);
    });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeEnabled();
    const link = page.locator(".post-card__title").first().getByRole("link");
    await expect(link).toBeInViewport();
    const destination = await link.getAttribute("href");
    const payloadPath = `${destination}_payload.json`;
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestIdleCallback(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        }),
    );
    expect(requestedPaths).not.toContain(payloadPath);
    const prefetch = page.waitForRequest(
      (request) => new URL(request.url()).pathname === payloadPath,
    );
    await link[interaction]();
    await prefetch;
    await expect(page).toHaveURL("/");
    await link.click();
    await expect(page).toHaveURL(destination!);
  });
}

for (const path of [
  "/",
  "/about/",
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
]) {
  test(`Footer author does not introduce another primary heading on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(
      page.getByRole("contentinfo").getByRole("heading", { level: 1 }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("contentinfo")
        .getByRole("heading", { name: "Muhammad Rehan Saeed", level: 2 }),
    ).toBeAttached();
  });
}
