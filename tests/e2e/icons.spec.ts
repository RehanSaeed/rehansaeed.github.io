import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import type { NuxtApp } from "nuxt/app";
import { load } from "cheerio";
import { expect, test } from "./fixtures";

const post = "/on-the-etiquette-of-pull-request-comments/";
const screenshotDirectory = process.env.ICON_SCREENSHOTS_DIR;
type NuxtRoot = HTMLElement & {
  __vue_app__?: { config: { globalProperties: { $nuxt: NuxtApp } } };
};

async function ready(page: Page) {
  await page.waitForFunction(() => {
    const app =
      document.querySelector<NuxtRoot>("#__nuxt")?.__vue_app__?.config
        .globalProperties.$nuxt;
    return app && !app.isHydrating;
  });
  await page.evaluate(async () => {
    await document.fonts.load("16px Audiowide");
    await document.fonts.ready;
  });
  await page.addStyleTag({
    content: "* { content-visibility: visible !important; }",
  });
}

async function capture(page: Page, name: string, target?: Locator) {
  const icons = target
    ? target.locator("svg.icon:visible")
    : page.locator(".navigation svg.icon:visible");
  for (const icon of await icons.all()) {
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(
      icon.locator("path, line, polyline, rect, circle, polygon, ellipse"),
    ).not.toHaveCount(0);
    const box = await icon.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
    expect(box!.width).toBeCloseTo(box!.height, 1);
  }
  if (!screenshotDirectory) return;
  await mkdir(screenshotDirectory, { recursive: true });
  const options = {
    path: join(screenshotDirectory, `${name}.png`),
    animations: "disabled" as const,
  };
  if (target) {
    await target.screenshot(options);
  } else {
    await page.screenshot({
      ...options,
      clip: {
        x: 0,
        y: 0,
        width: page.viewportSize()!.width,
        height: 280,
      },
    });
  }
}

test("Icons are prerendered SVGs with real artwork, including closed dialogs", async ({
  request,
}) => {
  for (const path of ["/", post, "/about/", "/streaming/thumbnail/"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const $ = load(await response.text());
    const icons = $("svg.icon");
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect($(icon).attr("aria-hidden")).toBe("true");
      expect(
        $(icon).find("path, line, polyline, rect, circle, polygon, ellipse")
          .length,
      ).toBeGreaterThan(0);
    }
    expect($("span.icon")).toHaveLength(0);
  }
});

test("Icon artwork credits ship in styles without a separate notices file", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const $ = load(await response.text());
  const styles = $("style")
    .toArray()
    .map((element) => $(element).html() ?? "");
  for (const element of $("link[rel=stylesheet]").toArray()) {
    const href = $(element).attr("href");
    if (!href) throw new Error("Stylesheet link has no href");
    const stylesheet = await request.get(href);
    expect(stylesheet.ok(), href).toBe(true);
    styles.push(await stylesheet.text());
  }
  const shippedStyles = styles.join("\n");
  for (const credit of [
    "Font Awesome 5",
    "https://creativecommons.org/licenses/by/4.0/",
    "Cole Bemis",
    "Permission is hereby granted",
    "Lucide Icons and Contributors",
    "ISC License",
  ]) {
    expect(shippedStyles).toContain(credit);
  }
  expect((await request.get("/icon-licenses.txt")).status()).toBe(404);
});

test("Shared icons encapsulate inline styling and decorative defaults", async ({
  page,
}) => {
  await page.goto(post);
  await ready(page);
  const share = page.getByRole("button", { name: "Share", exact: true });
  const inlineIcon = share.locator("svg.icon");
  await expect(inlineIcon).toHaveCSS("display", "inline");
  await expect(inlineIcon).toHaveAttribute("aria-hidden", "true");
  await expect(inlineIcon).not.toHaveAttribute("inline");
  const blockIcon = page.locator(".theme-button svg.icon:visible");
  await expect(blockIcon).toHaveCSS("display", "block");
  const sizing = await inlineIcon.evaluate((icon) => {
    const style = getComputedStyle(icon);
    return {
      width: parseFloat(style.inlineSize),
      height: parseFloat(style.blockSize),
      fontSize: parseFloat(style.fontSize),
    };
  });
  expect(sizing.width).toBeCloseTo(sizing.fontSize, 1);
  expect(sizing.height).toBeCloseTo(sizing.fontSize, 1);
  await expect(blockIcon).toHaveClass(/theme-button__icon/);

  await page.goto("/streaming/thumbnail/");
  await ready(page);
  const logo = page.locator(".thumbnail-logo svg.icon");
  await expect(logo).toHaveCSS("inline-size", "150px");
  await expect(logo).toHaveCSS("block-size", "150px");
  await expect(logo).toHaveAttribute("aria-hidden", "true");
});

test.describe("Offline icons", () => {
  test.use({ serviceWorkers: "allow" });

  test("Unvisited pages, theme changes and dialogs need no icon API", async ({
    page,
    context,
    baseURL,
    browserName,
  }) => {
    test.skip(
      browserName === "firefox",
      "Playwright's Firefox offline mode bypasses service workers.",
    );
    test.slow();
    const iconRequests: string[] = [];
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined });
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (/iconify|_nuxt_icon/.test(url.href)) iconRequests.push(url.href);
    });
    await page.route(
      (url) => url.origin !== new URL(baseURL!).origin,
      (route) => route.fulfill({ contentType: "application/json", body: "[]" }),
    );
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await page.goto("/");
    await ready(page);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            resolve,
            {
              once: true,
            },
          ),
        );
      }
    });
    await context.setOffline(true);
    await page.goto(post);
    await ready(page);
    await expect(page.locator(".post__footer svg.icon:visible")).toHaveCount(3);
    const theme = page.locator("html");
    const previousTheme = await theme.getAttribute("data-theme");
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await expect(theme).not.toHaveAttribute("data-theme", previousTheme!);
    await expect(
      page.locator(".theme-button svg.icon").locator("path, circle, line"),
    ).not.toHaveCount(0);
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await expect(theme).toHaveAttribute("data-theme", previousTheme!);
    await expect(
      page.locator(".theme-button svg.icon").locator("path, circle, line"),
    ).not.toHaveCount(0);
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const share = page.getByRole("dialog", { name: "Share", exact: true });
    await expect(share.locator("svg.icon")).toHaveCount(6);
    await expect(share.locator("svg.icon path")).not.toHaveCount(0);
    await share.getByRole("button", { name: "Close Share" }).click();
    await page
      .getByRole("button", { name: "Buy me a Coffee", exact: true })
      .click();
    const support = page.getByRole("dialog", {
      name: "Buy me a Coffee",
      exact: true,
    });
    await expect(support.locator("svg.icon")).toHaveCount(5);
    await expect(support.locator("svg.icon path")).not.toHaveCount(0);
    await support
      .getByRole("button", { name: "Close Buy me a Coffee" })
      .click();
    await page.getByRole("button", { name: "Open search" }).click();
    await expect(
      page
        .getByRole("button", { name: "Close Search" })
        .locator("svg.icon path"),
    ).not.toHaveCount(0);
    await page.getByRole("button", { name: "Close Search" }).click();
    await page
      .locator("nav")
      .getByRole("link", { name: "About", exact: true })
      .click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.locator(".about__social-links svg.icon")).toHaveCount(7);
    await page.goto("/streaming/thumbnail/");
    await ready(page);
    await expect(page.locator(".thumbnail-logo svg.icon path")).toHaveCount(2);
    expect(iconRequests).toEqual([]);
  });
});

test.describe("Icon areas", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"));
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined });
    });
    await page.route(
      (url) => url.origin !== new URL(baseURL!).origin,
      (route) =>
        route.fulfill({
          contentType: "application/json",
          body:
            new URL(route.request().url()).hostname === "webmention.io"
              ? '{"links":[]}'
              : "[]",
        }),
    );
  });

  test("External stubs match only the exact Webmention host", async ({
    page,
  }) => {
    await page.goto("/");
    const responses = await page.evaluate(async () =>
      Promise.all(
        [
          "https://webmention.io/api/mentions",
          "https://not-webmention.io/api/mentions",
          "https://webmention.io.example/api/mentions",
          "https://example.com/?source=webmention.io",
        ].map(async (url) => (await fetch(url)).json()),
      ),
    );
    expect(responses).toEqual([{ links: [] }, [], [], []]);
  });

  for (const [device, viewport] of Object.entries({
    desktop: { width: 1280, height: 800 },
    mobile: { width: 375, height: 800 },
  })) {
    for (const colorScheme of ["light", "dark"] as const) {
      test(`${device} ${colorScheme}`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme });
        // Icon comparisons must not depend on automatic-theme persistence.
        await page.addInitScript(
          (theme) => localStorage.setItem("theme", theme),
          colorScheme,
        );
        const shot = async (name: string, target?: Locator) => {
          await expect(page.locator("html")).toHaveAttribute(
            "data-theme",
            colorScheme,
          );
          await capture(page, `${name}-${device}-${colorScheme}`, target);
        };

        await page.goto("/");
        await ready(page);
        await page.evaluate(() =>
          window.dispatchEvent(new Event("beforeinstallprompt")),
        );
        await expect(
          page.getByRole("button", { name: "Install the app" }),
        ).toBeVisible();
        await expect(page.locator(".navigation svg.icon:visible")).toHaveCount(
          3,
        );
        await shot("header-controls");
        await expect(page.locator(".main .author svg.icon")).toHaveCount(7);
        await shot("home-social", page.locator(".main .author"));
        await expect(page.locator(".footer .social svg.icon")).toHaveCount(7);
        await shot("footer-social", page.locator(".footer .author"));

        await page.getByRole("button", { name: "Open search" }).click();
        const search = page.getByRole("dialog", {
          name: "Search",
          exact: true,
        });
        await expect(search.locator("svg.icon")).toHaveCount(1);
        await shot("search-dialog", search);
        await search.getByRole("button", { name: "Close Search" }).click();
        await expect(search).not.toBeVisible();

        await page.goto(post);
        await ready(page);
        await expect(
          page.locator(".post__footer svg.icon:visible"),
        ).toHaveCount(3);
        await expect(
          page
            .getByRole("button", { name: "Buy me a Coffee", exact: true })
            .locator("svg.icon path"),
        ).toHaveCSS("fill", "rgb(255, 221, 0)");
        await shot("post-actions", page.locator(".post__footer"));
        await page.getByRole("button", { name: "Share", exact: true }).click();
        const share = page.getByRole("dialog", { name: "Share", exact: true });
        await expect(share.locator("svg.icon")).toHaveCount(6);
        await shot("share-dialog", share);
        await share.getByRole("button", { name: "Close Share" }).click();
        await page
          .getByRole("button", { name: "Buy me a Coffee", exact: true })
          .click();
        const support = page.getByRole("dialog", {
          name: "Buy me a Coffee",
          exact: true,
        });
        await expect(support.locator("svg.icon")).toHaveCount(5);
        await expect(
          support
            .getByRole("link", { name: "Buy me a Coffee", exact: true })
            .locator("svg.icon path"),
        ).toHaveCSS("fill", "rgb(255, 221, 0)");
        await shot("support-dialog", support);
        await support
          .getByRole("button", { name: "Close Buy me a Coffee" })
          .click();

        await page.locator(".webmentions").scrollIntoViewIfNeeded();
        await expect(page.locator(".webmentions__like-count")).toHaveText(
          "0 Likes",
        );
        await expect(page.locator(".webmentions__help svg.icon")).toHaveCount(
          1,
        );
        await shot("webmentions", page.locator(".webmentions"));

        await page.goto("/about/");
        await ready(page);
        await expect(page.locator(".about__social-links svg.icon")).toHaveCount(
          7,
        );
        await shot("about-social", page.locator(".about__social-links"));
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(async () => {
          const app =
            document.querySelector<NuxtRoot>("#__nuxt")!.__vue_app__!.config
              .globalProperties.$nuxt;
          await app.hooks.callHook("app:manifest:update", {
            id: "icon-comparison-update",
            timestamp: Date.now(),
          });
        });
        const update = page.getByRole("region", { name: "Site update" });
        await expect(update.locator("svg.icon")).toHaveCount(1);
        await shot("update-notice", update);
        await update
          .getByRole("button", { name: "Dismiss site update" })
          .click();
        await expect(update).not.toBeVisible();

        await page.goto("/streaming/thumbnail/?background=dark");
        await ready(page);
        await expect(page.locator(".thumbnail-logo svg.icon")).toBeVisible();
        await shot("streaming-logo", page.locator(".thumbnail-logo"));
      });
    }
  }
});
