import type { E2EFixtures } from "./fixtures";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "./fixtures";
import { safeComment, type GitHubComment } from "../../shared/utils/comments";
import {
  appThemeLoaded,
  pwaInstallPromoClicked,
  searchResultSelected,
} from "../../app/framework/analytics";
import { commentSnapshots } from "../../modules/blog-content/comments";
import { cacheSchema, graphSchema, requestUrl } from "./data";
import { z } from "zod";

const postPath =
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const commentsPath =
  "**/api.github.com/repos/RehanSaeed/rehansaeed.github.io/issues/607/comments*";
const comment: GitHubComment = {
  id: 987654321,
  html_url:
    "https://github.com/RehanSaeed/rehansaeed.github.io/issues/607#issuecomment-987654321",
  body_html: "<p>A new <strong>live comment</strong>.</p>",
  created_at: "2026-01-02T00:00:00Z",
  user: {
    login: "reader",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/reader",
  },
};

test.describe("Migration completion", () => {
  for (const { batchVisibilityChanges, title } of [
    {
      batchVisibilityChanges: false,
      title: "Keeps comments in SSR and refreshes them without rebuilding",
    },
    {
      batchVisibilityChanges: true,
      title:
        "Refreshes comments after batched visibility changes, including cached reloads",
    },
  ]) {
    async function verifyCommentRefresh({ page }: Pick<E2EFixtures, "page">) {
      if (batchVisibilityChanges) {
        await page.addInitScript(() => {
          const NativeObserver = window.IntersectionObserver;
          window.IntersectionObserver = class extends NativeObserver {
            constructor(
              callback: IntersectionObserverCallback,
              options?: IntersectionObserverInit,
            ) {
              super((entries, observer) => {
                const batch = entries.flatMap((entry) =>
                  entry.target.matches(".comments") && entry.isIntersecting
                    ? [
                        new Proxy(entry, {
                          get(target, property): unknown {
                            return property === "isIntersecting"
                              ? false
                              : Reflect.get(target, property, target);
                          },
                        }),
                        entry,
                      ]
                    : [entry],
                );
                callback(batch, observer);
              }, options);
            }
          };
        });
      }
      let requests = 0;
      await page.route(commentsPath, (route) => {
        requests++;
        return route.fulfill({ json: [comment] });
      });
      const response = await page.goto(postPath);
      expect(await response!.text()).toContain('class="comment"');
      await page.locator(".comments").scrollIntoViewIfNeeded();
      await expect(page.locator(".comment__content")).toHaveCount(1);
      await expect(page.locator(".comment__content")).toHaveText(
        "A new live comment.",
      );
      await expect(page.locator(".comments__github")).toHaveAttribute(
        "href",
        /issues\/607$/,
      );
      expect(requests).toBe(1);
      await page.reload();
      await page.locator(".comments").scrollIntoViewIfNeeded();
      await expect(page.locator(".comment__content")).toHaveCount(1);
      await expect(page.locator(".comment__content")).toHaveText(
        "A new live comment.",
      );
      expect(requests).toBe(1);
    }

    test(title, async ({ page }) => {
      await expect(verifyCommentRefresh({ page })).resolves.toBeUndefined();
    });
  }

  test("Retains the static comments with an explicit message when GitHub is unavailable", async ({
    page,
  }) => {
    await page.route(commentsPath, (route) =>
      route.fulfill({ status: 403, json: { message: "Rate limit" } }),
    );
    await page.goto(postPath);
    const count = await page.locator(".comment").count();
    expect(count).toBeGreaterThan(0);
    await page.locator(".comments").scrollIntoViewIfNeeded();
    await expect(page.locator(".comments [role=status]")).toContainText(
      "showing saved comments",
    );
    const layout = await page
      .locator(".comments__header")
      .evaluate((header) => {
        const toolbar = header.querySelector(".comments__toolbar")!;
        const status = header.querySelector("[role=status]")!;
        return {
          toolbarBottom: toolbar.getBoundingClientRect().bottom,
          statusTop: status.getBoundingClientRect().top,
          statusBottom: status.getBoundingClientRect().bottom,
          dividerTop:
            header.getBoundingClientRect().bottom -
            Number.parseFloat(getComputedStyle(header).borderBottomWidth),
        };
      });
    expect(layout.statusTop).toBeGreaterThan(layout.toolbarBottom);
    expect(layout.statusBottom).toBeLessThan(layout.dividerTop);
    await expect(page.locator(".comment")).toHaveCount(count);
  });

  test("Sanitizes GitHub markup and preserves safe formatting", () => {
    const html = safeComment({
      ...comment,
      body_html:
        '<p><strong>Safe</strong><script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(1)"><a href="javascript:alert(1)">Bad</a></p>',
    }).body_html;
    expect(html).toContain("<strong>Safe</strong>");
    expect(html).not.toMatch(/script|onerror|javascript:/);
    expect(html).toContain('rel="nofollow noopener noreferrer"');
    expect(
      safeComment({
        ...comment,
        body_html:
          '<a href="some/page">Relative</a><img src="http://[invalid">',
      }).body_html,
    ).toContain(
      'href="https://github.com/RehanSaeed/rehansaeed.github.io/issues/some/page"',
    );
  });

  async function verifySnapshotRetries() {
    await mkdir(join(process.cwd(), ".parity"), { recursive: true });
    const directory = await mkdtemp(
      join(process.cwd(), ".parity", "comment-cache-"),
    );
    const originalFetch = globalThis.fetch;
    let attempts = 0;
    globalThis.fetch = (input) => {
      if (requestUrl(input).includes("/issues?")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                number: 607,
                title: "[Comment] Test snapshot",
                html_url:
                  "https://github.com/RehanSaeed/rehansaeed.github.io/issues/607",
              },
            ]),
          ),
        );
      }
      attempts++;
      return Promise.resolve(
        attempts === 1
          ? new Response("Rate limit", { status: 403 })
          : new Response(JSON.stringify([comment])),
      );
    };
    try {
      expect(
        (await commentSnapshots(directory))["Test snapshot"]?.comments,
      ).toEqual([]);
      expect(
        cacheSchema.parse(
          JSON.parse(
            await readFile(join(directory, "blog-comments.json"), "utf8"),
          ),
        ).updated,
      ).toBe(0);
      expect(
        (await commentSnapshots(directory))["Test snapshot"]?.comments,
      ).toHaveLength(1);
      expect(attempts).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
      await rm(directory, { recursive: true, force: true });
    }
  }

  test("Retries incomplete build snapshots instead of caching failures as fresh", async () => {
    await expect(verifySnapshotRetries()).resolves.toBeUndefined();
  });

  async function verifyGa4Initialization({ page }: Pick<E2EFixtures, "page">) {
    let loads = 0;
    await page.route("**/www.googletagmanager.com/gtag/js?*", (route) => {
      loads++;
      return route.fulfill({ contentType: "text/javascript", body: "" });
    });
    const response = await page.goto("/");
    const id =
      (await response!.text()).match(
        /googleAnalyticsId:"(G-[A-Z0-9]+)"/,
      )?.[1] ?? "";
    await page.waitForFunction(
      () => typeof Reflect.get(window, "gtag") === "function",
    );
    const state = () =>
      page.evaluate(() => {
        const dataLayer: unknown = Reflect.get(window, "dataLayer");
        if (!Array.isArray(dataLayer)) {
          throw new Error("Expected an analytics data layer");
        }
        return {
          calls: dataLayer.map((entry: unknown) => {
            if (
              typeof entry !== "object" ||
              entry === null ||
              !("length" in entry) ||
              typeof entry.length !== "number"
            ) {
              throw new Error("Expected an array-like analytics call");
            }
            return Array.from({ length: entry.length }, (_, index): unknown =>
              Reflect.get(entry, String(index)),
            );
          }),
        };
      });
    if (id) {
      await expect.poll(() => loads).toBe(1);
      await expect
        .poll(async () =>
          (await state()).calls.filter((call) => call[0] === "config"),
        )
        .toEqual([["config", id]]);
      await page
        .locator("nav")
        .getByRole("link", { name: "About", exact: true })
        .click();
      await expect(page).toHaveURL(/\/about\/$/);
      expect(loads).toBe(1);
    } else {
      expect(loads).toBe(0);
    }
    const { calls } = await state();
    expect(calls.filter((call) => call[0] === "config")).toHaveLength(
      id ? 1 : 0,
    );
    expect(calls.some((call) => call[0] === "consent")).toBe(false);
    expect(
      calls.some((call) => call[0] === "event" && call[1] === "page_view"),
    ).toBe(false);
  }

  test("Loads GA4 only when configured and initializes it once with default storage", async ({
    page,
  }) => {
    await expect(
      verifyGa4Initialization({
        page,
      }),
    ).resolves.toBeUndefined();
  });

  test("Reserves card image dimensions and prioritizes only the first post", async ({
    page,
  }) => {
    await page.goto("/");
    const images = page.locator(".post-card__image");
    await expect(images).toHaveCount(10);
    await expect(images.first()).toHaveAttribute("loading", "eager");
    await expect(images.first()).toHaveAttribute("fetchpriority", "high");
    await expect(images.nth(1)).toHaveAttribute("loading", "lazy");
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute("height", /^[1-9]\d*$/);
    }
  });

  test("Maps all analytics event names to valid GA4 identifiers", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "framework", "analytics.ts"),
      "utf8",
    );
    expect(source).not.toContain('ga("send"');
    expect(source).toContain('action.replaceAll("-", "_")');
    // Helpers are safe during SSR, where no browser tracker exists.
    expect(() => {
      appThemeLoaded("light");
    }).not.toThrow();
    expect(() => {
      pwaInstallPromoClicked("button", true);
    }).not.toThrow();
    expect(() => {
      searchResultSelected("ASP.NET");
    }).not.toThrow();
  });

  for (const [width, fontSize, spacing] of [
    [375, 16, 24],
    [576, 16, 24],
    [1088, 18, 47.625],
    [1600, 20, 71.25],
    [1920, 20, 86.25],
  ]) {
    test(`Fluid typography at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const computed = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.width = "var(--global-space-fluid-6)";
        document.body.append(probe);
        const spacing = Number.parseFloat(getComputedStyle(probe).width);
        probe.remove();
        return {
          fontSize: Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ),
          spacing,
        };
      });
      expect(computed.fontSize).toBeCloseTo(fontSize!, 2);
      // Layout rounds to different subpixel units in Chromium and Firefox.
      expect(Math.abs(computed.spacing - spacing!)).toBeLessThan(0.02);
    });
  }

  test("Corrects pagination canonicals, schema and Apple icon", async ({
    page,
  }) => {
    await page.goto("/2/");
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
      "href",
      "https://rehansaeed.com/2/",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://rehansaeed.com/2/",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      "/images/icons/favicon-180x180.png",
    );
    await page.goto("/on-the-etiquette-of-pull-request-comments/");
    const graph = graphSchema.parse(
      JSON.parse(
        (await page
          .locator('script[type="application/ld+json"]')
          .textContent()) ?? "",
      ),
    );
    const schema = graph["@graph"].find((node) => node["@type"] === "Article");
    const webpage = graph["@graph"].find(
      (node) => node["@id"] === schema!.mainEntityOfPage!["@id"],
    );
    expect(webpage!.url).toBe(
      "https://rehansaeed.com/on-the-etiquette-of-pull-request-comments/",
    );
    expect(schema!.dateModified).toBe(schema!.datePublished);
    expect(z.array(z.unknown()).parse(schema!.image)[0]).toHaveProperty(
      "caption",
    );
    const author = graph["@graph"].find(
      (node) => node["@id"] === schema!.author!["@id"],
    );
    expect(author).toHaveProperty("image");
    expect(author).not.toHaveProperty("logo");
  });

  test("Serves drafts and overlays but excludes them from the sitemap", async ({
    request,
  }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of [
      "/cheat-sheet/",
      "/streaming/border/",
      "/streaming/thumbnail/",
    ]) {
      const response = await request.get(path);
      expect(response.ok()).toBe(true);
      expect(await response.text()).toMatch(
        /name="robots" content="noindex, follow"/,
      );
      expect(sitemap).not.toContain(`https://rehansaeed.com${path}</loc>`);
    }
    expect(sitemap).toContain("<lastmod>2022-08-02");
  });

  test("The thumbnail designer retains its query controls and live background input", async ({
    page,
  }) => {
    await page.goto(
      "/streaming/thumbnail/?background=dark&title=Hello&subtitle=World&title-font-size=5&title-align=center&title-justify=center&logo-align=end&logo-justify=start&image1=/images/hero/Application-Insights-1366x768.png&image1-width=600&image1-height=400&image1-x=120&image1-y=180&image1-rotate=10",
    );
    const thumbnail = page.locator(".thumbnail");
    await expect(thumbnail).toHaveCSS("inline-size", "1920px");
    await expect(thumbnail).toHaveCSS("block-size", "1080px");
    await expect(thumbnail).toHaveClass(/thumbnail--background-dark/);
    await expect(page.locator(".thumbnail-title__title")).toHaveText("Hello");
    await expect(page.locator(".thumbnail-title__subtitle")).toHaveText(
      "World",
    );
    await expect(page.locator(".thumbnail-title")).toHaveCSS(
      "align-content",
      "center",
    );
    await expect(page.locator(".thumbnail-title")).toHaveCSS(
      "justify-items",
      "center",
    );
    const logo = page.locator(".thumbnail-logo");
    await expect(logo).toHaveCSS("align-self", "end");
    await expect(logo).toHaveCSS("justify-self", "start");
    await expect(logo.locator("svg")).toHaveCSS("inline-size", "150px");
    const image = page.locator(".thumbnail__image1");
    await expect(image).toHaveAttribute(
      "src",
      "/images/hero/Application-Insights-1366x768.png",
    );
    await expect(image).toHaveCSS("inline-size", "600px");
    await expect(image).toHaveCSS("block-size", "400px");
    await expect(image).toHaveCSS("inset-inline-start", "120px");
    await expect(image).toHaveCSS("inset-block-start", "180px");
    await expect(image).toHaveCSS("rotate", "10deg");
    const background = page.locator(".thumbnail-options__input");
    await expect(background).toHaveValue("dark");
    await background.fill("light");
    await expect(thumbnail).toHaveClass(/thumbnail--background-light/);

    await page.goto("/streaming/thumbnail/?background=dark&no-logo=true");
    await expect(page.locator(".thumbnail-logo")).toHaveCount(0);
    await expect(page.locator(".thumbnail-title")).toHaveCount(0);
    await expect(page.locator(".thumbnail-image")).toHaveCount(0);
  });
});
