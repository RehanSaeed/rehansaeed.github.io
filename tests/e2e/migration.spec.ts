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
  test("Keeps comments in SSR and refreshes them without rebuilding", async ({
    page,
  }) => {
    let requests = 0;
    await page.route(commentsPath, (route) => {
      requests++;
      return route.fulfill({ json: [comment] });
    });
    const response = await page.goto(postPath);
    expect(await response!.text()).toContain('class="vssue-comment"');
    await page.locator(".comments").scrollIntoViewIfNeeded();
    await expect(page.locator(".vssue-comment-main")).toHaveCount(1);
    await expect(page.locator(".vssue-comment-main")).toHaveText(
      "A new live comment.",
    );
    await expect(page.locator(".comments > .vssue > a")).toHaveAttribute(
      "href",
      /issues\/607$/,
    );
    expect(requests).toBe(1);
    await page.reload();
    await page.locator(".comments").scrollIntoViewIfNeeded();
    await expect(page.locator(".vssue-comment-main")).toHaveCount(1);
    await expect(page.locator(".vssue-comment-main")).toHaveText(
      "A new live comment.",
    );
    expect(requests).toBe(1);
  });

  test("Retains the static comments with an explicit message when GitHub is unavailable", async ({
    page,
  }) => {
    await page.route(commentsPath, (route) =>
      route.fulfill({ status: 403, json: { message: "Rate limit" } }),
    );
    await page.goto(postPath);
    const count = await page.locator(".vssue-comment").count();
    expect(count).toBeGreaterThan(0);
    await page.locator(".comments").scrollIntoViewIfNeeded();
    await expect(page.locator(".comments [role=status]")).toContainText(
      "showing saved comments",
    );
    await expect(page.locator(".vssue-comment")).toHaveCount(count);
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

  test("Retries incomplete build snapshots instead of caching failures as fresh", async () => {
    await mkdir(join(process.cwd(), ".parity"), { recursive: true });
    const directory = await mkdtemp(
      join(process.cwd(), ".parity", "comment-cache-"),
    );
    const originalFetch = globalThis.fetch;
    let attempts = 0;
    globalThis.fetch = async (input) => {
      if (String(input).includes("/issues?")) {
        return new Response(
          JSON.stringify([
            {
              number: 607,
              title: "[Comment] Test snapshot",
              html_url:
                "https://github.com/RehanSaeed/rehansaeed.github.io/issues/607",
            },
          ]),
        );
      }
      attempts++;
      return attempts === 1
        ? new Response("Rate limit", { status: 403 })
        : new Response(JSON.stringify([comment]));
    };
    try {
      expect(
        (await commentSnapshots(directory))["Test snapshot"]?.comments,
      ).toEqual([]);
      expect(
        JSON.parse(
          await readFile(join(directory, "blog-comments.json"), "utf8"),
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
  });

  test("Loads GA4 only when configured and initializes it once with default storage", async ({
    page,
  }) => {
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
    await page.waitForFunction(() => typeof window.gtag === "function");
    const state = () =>
      page.evaluate(() => ({
        calls: window.dataLayer.map((entry) => Array.from(entry)),
      }));
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
    for (const image of await images.all())
      await expect(image).toHaveAttribute("height", /^[1-9]\d*$/);
  });

  test("Maps all analytics event names to valid GA4 identifiers", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "framework", "analytics.ts"),
      "utf8",
    );
    expect(source).not.toContain('ga("send"');
    expect(source).toContain('action.replaceAll("-", "_")');
    // Helpers are safe during SSR, where no browser tracker exists.
    expect(() => appThemeLoaded("light")).not.toThrow();
    expect(() => pwaInstallPromoClicked("button", true)).not.toThrow();
    expect(() => searchResultSelected("ASP.NET")).not.toThrow();
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
        const spacing = parseFloat(getComputedStyle(probe).width);
        probe.remove();
        return {
          fontSize: parseFloat(
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
    const schema = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "",
    );
    expect(schema.mainEntityOfPage["@id"]).toBe(
      "https://rehansaeed.com/on-the-etiquette-of-pull-request-comments/",
    );
    expect(schema.dateModified).toBe(schema.datePublished);
    expect(schema.image[0]).toHaveProperty("caption");
    expect(schema.author).toHaveProperty("image");
    expect(schema.author).not.toHaveProperty("logo");
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
});
