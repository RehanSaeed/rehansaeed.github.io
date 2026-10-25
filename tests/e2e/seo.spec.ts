import { load } from "cheerio";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { NuxtApp } from "nuxt/app";
import { filterMarkdownSitemap } from "../../modules/blog-content/seo";

type NuxtRoot = HTMLElement & {
  __vue_app__?: { config: { globalProperties: { $nuxt: NuxtApp } } };
};

async function announceUpdate(page: Page) {
  await page.waitForFunction(
    () => !!document.querySelector<NuxtRoot>("#__nuxt")?.__vue_app__,
  );
  await page.evaluate(() => {
    const app =
      document.querySelector<NuxtRoot>("#__nuxt")!.__vue_app__!.config
        .globalProperties.$nuxt;
    app.$pwa!.needRefresh = true;
  });
}

test("Markdown discovery removes unlisted entries and empty groups, not similarly named public pages", () => {
  const sitemap =
    '# Blog Sitemap\n\n## cheat-sheet\n- [Draft](https://rehansaeed.com/cheat-sheet.md "2020-01-01")\n\n## tag\n- [Public tag](https://rehansaeed.com/tag/cheat-sheet.md)\n\n## streaming\n- [Border](https://rehansaeed.com/streaming/border.md)\n- [Thumbnail](https://rehansaeed.com/streaming/thumbnail.md)\n';
  const filtered = filterMarkdownSitemap(
    sitemap,
    new Set(["/cheat-sheet", "/streaming/border", "/streaming/thumbnail"]),
  );
  expect(filtered).toContain("# Blog Sitemap");
  expect(filtered).toContain("https://rehansaeed.com/tag/cheat-sheet.md");
  expect(filtered).not.toContain("https://rehansaeed.com/cheat-sheet.md");
  expect(filtered).not.toContain("## cheat-sheet");
  expect(filtered).not.toContain("## streaming");
});

test("Static discovery serves real Markdown and the explicit AI training policy", async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = load(await sitemap.text(), { xml: true });
  const urls = xml("url > loc")
    .map((_, node) => xml(node).text())
    .get();
  expect(urls.length).toBeGreaterThan(0);
  for (const path of ["/streaming/border/", "/streaming/thumbnail/"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const page = load(await response.text());
    expect(page('meta[name="robots"]').attr("content")).toContain("noindex");
    expect(urls).not.toContain(`https://rehansaeed.com${path}`);
  }
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Content-Usage: train-ai=y");
  expect(await robots.text()).toContain("Content-Signal: ai-train=yes");
  for (const path of ["/llms.txt", "/llms-full.txt", "/sitemap.md"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("https://rehansaeed.com/");
  }
  const markdown = await request.get(
    "/on-the-etiquette-of-pull-request-comments.md",
  );
  expect(markdown.ok()).toBe(true);
  expect(await markdown.text()).toContain(
    'canonical_url: "https://rehansaeed.com/on-the-etiquette-of-pull-request-comments/"',
  );
  for (const path of [
    "/cheat-sheet.md",
    "/streaming/border.md",
    "/streaming/thumbnail.md",
    "/404-not-found.md",
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test("Social crawlers receive a real branded PNG instead of a runtime renderer", async ({
  request,
}) => {
  const response = await request.get(
    "/on-the-etiquette-of-pull-request-comments/",
  );
  const $ = load(await response.text());
  const og = new URL($('meta[property="og:image"]').attr("content")!);
  expect(og.pathname).toMatch(/^\/_og\/s\/o_[a-f0-9]+\.png$/);
  expect($('meta[name="twitter:image"]').attr("content")).toBe(og.href);
  const image = await request.get(og.pathname);
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
  const png = await image.body();
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test("Client-side pagination preserves one canonical and its crawler response has the correct schema graph", async ({
  page,
  baseURL,
  request,
}) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ contentType: "text/plain", body: "" }),
  );
  await page.goto("/");
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/\/2\/$/);
  await expect(page.locator("link[rel=canonical]")).toHaveCount(1);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://rehansaeed.com/2/",
  );
  // Schema.org intentionally runs server-only: crawlers get each route's static graph
  // without shipping the schema resolver in the browser bundle.
  const $ = load(await (await request.get("/2/")).text());
  const scripts = $('script[type="application/ld+json"]');
  expect(scripts.length).toBe(1);
  const graph = JSON.parse(scripts.text());
  const ids = graph["@graph"].map((node: { "@id": string }) => node["@id"]);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toContain("https://rehansaeed.com/2/#webpage");
  expect(ids).not.toContain("https://rehansaeed.com/#webpage");
});

test("Later dismisses the package update prompt without interrupting client navigation", async ({
  page,
  baseURL,
}) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ contentType: "text/plain", body: "" }),
  );
  await page.goto("/");
  await announceUpdate(page);
  const notice = page.getByRole("region", { name: "Site update" });
  await expect(notice).toHaveCount(1);
  await notice.getByRole("button", { name: "Later", exact: true }).click();
  await expect(notice).toHaveCount(0);
  let documentNavigations = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documentNavigations++;
  });
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/\/2\/$/);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://rehansaeed.com/2/",
  );
  expect(documentNavigations).toBe(0);
  await expect(notice).toHaveCount(0);
  await announceUpdate(page);
  await expect(notice).toHaveCount(1);
  expect(documentNavigations).toBe(0);
});

test("Nuxt recovers a chunk navigation failure with its built-in reload", async ({
  page,
  baseURL,
}) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ contentType: "text/plain", body: "" }),
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  const navigation = page.waitForRequest(
    (request) =>
      request.isNavigationRequest() &&
      request.frame() === page.mainFrame() &&
      new URL(request.url()).pathname === "/about/",
  );
  await page.evaluate(() => {
    const app =
      document.querySelector<NuxtRoot>("#__nuxt")!.__vue_app__!.config
        .globalProperties.$nuxt;
    app.$router.beforeEach(async () => {
      const error = new Error("Test unavailable page chunk");
      await app.hooks.callHook("app:chunkError", { error });
      throw error;
    });
    void app.$router.push("/about/").catch(() => {
      // The synthetic navigation fails; Nuxt's error hook owns recovery.
    });
  });
  await navigation;
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await expect(page.getByRole("region", { name: "Site update" })).toHaveCount(
    0,
  );
});

test("A package update without a worker does not force a document reload", async ({
  page,
  baseURL,
}) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ contentType: "text/plain", body: "" }),
  );
  await page.goto("/about/");
  await announceUpdate(page);
  const notice = page.getByRole("region", { name: "Site update" });
  await expect(notice).toBeVisible();
  let documentNavigations = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documentNavigations++;
  });
  await notice.getByRole("button", { name: "Update now", exact: true }).click();
  await expect(
    notice.getByRole("button", { name: "Update now", exact: true }),
  ).toBeEnabled();
  await expect(notice).toBeVisible();
  await expect(page).toHaveURL(/\/about\/$/);
  expect(documentNavigations).toBe(0);
});

for (const width of [320, 375, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Update notice is compact, nonmodal and dismissible at ${width}px in ${colorScheme} mode`, async ({
      page,
      baseURL,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme });
      await page.route(
        (url) => url.origin !== new URL(baseURL!).origin,
        (route) => route.fulfill({ contentType: "text/plain", body: "" }),
      );
      await page.goto("/about/");
      const search = page.getByRole("button", { name: "Open search" });
      await expect(search).toBeEnabled();
      await search.focus();
      const documentWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      if (width >= 375) expect(documentWidth).toBe(width);
      let documentNavigations = 0;
      page.on("request", (request) => {
        if (
          request.isNavigationRequest() &&
          request.frame() === page.mainFrame()
        )
          documentNavigations++;
      });
      await announceUpdate(page);
      await announceUpdate(page);
      const notice = page.getByRole("region", { name: "Site update" });
      await expect(notice).toHaveCount(1);
      await expect(
        notice.getByRole("heading", { name: "Update available" }),
      ).toBeVisible();
      await expect(search).toBeFocused();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      const bounds = await notice.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(16);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 16);
      expect(bounds!.y).toBeGreaterThanOrEqual(16);
      expect(bounds!.y).toBeLessThanOrEqual(24);
      expect(bounds!.width).toBeLessThanOrEqual(400);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(800 - 16);
      expect(
        await notice.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBe(0);
      expect(
        await notice
          .locator(".site-update__message")
          .evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(documentWidth);
      await search.click();
      await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
      await page.getByRole("button", { name: "Close Search" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await notice
        .getByRole("button", { name: "Update now", exact: true })
        .focus();
      await page.keyboard.press("Tab");
      const later = notice.getByRole("button", { name: "Later", exact: true });
      await expect(later).toBeFocused();
      await expect(later).toHaveCSS("outline-style", "solid");
      const dismiss =
        colorScheme === "light"
          ? later
          : notice.getByRole("button", { name: "Dismiss site update" });
      await dismiss.click();
      await expect(notice).toHaveCount(0);
      expect(documentNavigations).toBe(0);
    });
  }
}
