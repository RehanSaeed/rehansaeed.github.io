import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { delayClientScripts, expect, test } from "./fixtures";
import { parse } from "yaml";
import { timeToRead } from "../../modules/blog-content/fields";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

test.describe("Nuxt best practices", () => {
  for (const width of [375, 1280]) {
    for (const colorScheme of ["light", "dark"] as const) {
      test(`Footer fits ${width}px in ${colorScheme} mode before and after rendering`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        await page.goto("/");
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBe(width);
        const newsletter = page.locator(".newsletter");
        await newsletter.scrollIntoViewIfNeeded();
        await newsletter
          .getByLabel(/Stay up to date/)
          .fill("reader@example.com");
        for (const control of await newsletter
          .locator('input[type="email"], button[type="submit"]')
          .all()) {
          const bounds = await control.boundingBox();
          expect(bounds).not.toBeNull();
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        }
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBe(width);
      });
    }
  }

  test("Keeps JavaScript controls disabled until their handlers are attached", async ({
    page,
  }) => {
    const scripts = await delayClientScripts(page);
    try {
      await page.goto("/", { waitUntil: "commit" });
      const open = page.getByRole("button", { name: "Open search" });
      await expect(open).toBeDisabled();
      await expect(
        page.locator('.newsletter button[type="submit"]'),
      ).toBeEnabled();
      scripts.resume();
      await expect(open).toBeEnabled();
      await open.click();
      await expect(
        page.getByRole("searchbox", { name: "Search", exact: true }),
      ).toBeVisible();
    } finally {
      await scripts.dispose();
    }
  });

  test("Announces client-side route changes", async ({ page }) => {
    await page.goto("/");
    await page
      .locator("nav")
      .getByRole("link", { name: "About", exact: true })
      .click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.locator("h1#about")).toBeVisible();

    const announcer = page.locator(
      '.nuxt-route-announcer [aria-live="polite"]',
    );
    await expect(announcer).toHaveCount(1);
    await expect(announcer).toContainText("About - Muhammad Rehan Saeed");
  });

  test("Skip link moves keyboard focus into the main content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Skip to content" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("main#main")).toBeFocused();
  });

  test("Preloads the post hero with dimensions and high priority", async ({
    page,
  }) => {
    await page.goto(postPath);
    const hero = page.locator("img.post__photo");
    await expect(hero).toHaveAttribute("width", "1600");
    await expect(hero).toHaveAttribute("height", /^[1-9]\d*$/);
    await expect(hero).toHaveAttribute("loading", "eager");
    await expect(hero).toHaveAttribute("fetchpriority", "high");
    await expect(
      page.locator('link[rel="preload"][as="image"][fetchpriority="high"]'),
    ).toHaveCount(1);
    await expect
      .poll(() =>
        hero.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  });

  test("Preloads the unchanged local heading font with metric-adjusted fallbacks", async ({
    page,
  }) => {
    const response = await page.goto(postPath);
    const html = await response!.text();
    const preload = page.locator('link[rel="preload"][as="font"]');
    await expect(preload).toHaveCount(1);
    const href = await preload.getAttribute("href");
    expect(href).toMatch(/^\/_nuxt\/fonts\/[^/]+\.woff2$/);
    expect(html).toContain("size-adjust:");
    expect(html).toContain("ascent-override:");
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");

    const files = readdirSync(join(process.cwd(), "dist", "_nuxt", "fonts"));
    expect(files).toEqual([href!.split("/").at(-1)]);
    expect(readFileSync(join(process.cwd(), "dist", href!.slice(1)))).toEqual(
      readFileSync(
        join(
          process.cwd(),
          "node_modules",
          "@fontsource",
          "audiowide",
          "files",
          "audiowide-latin-400-normal.woff2",
        ),
      ),
    );
    const heading = page.locator("h1").first();
    expect(
      await heading.evaluate((element) => getComputedStyle(element).fontFamily),
    ).toContain("Audiowide Fallback");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    expect(
      await page.evaluate(() =>
        [...document.fonts].some(
          (face) => face.family === "Audiowide" && face.status === "loaded",
        ),
      ),
    ).toBe(true);
  });

  test("Runs lint in CI and before committing supported source files", () => {
    const workflow = parse(
      readFileSync(
        join(process.cwd(), ".github", "workflows", "build.yml"),
        "utf8",
      ),
    );
    expect(workflow.jobs.build.steps).toContainEqual({
      name: "Lint",
      run: "npm run lint",
    });
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    );
    expect(packageJson.scripts.lint).toBe("eslint . --max-warnings=0");
    expect(packageJson["lint-staged"]["*.{js,mjs,cjs,ts,mts,cts,vue}"]).toEqual(
      ["eslint --fix --max-warnings=0", "prettier --write"],
    );
  });

  test("Post payload omits unused raw Markdown without removing feed content", async ({
    request,
  }) => {
    const response = await request.get(`${postPath}_payload.json`);
    expect(response.ok()).toBe(true);
    const payload = await response.json();
    const post = payload.find(
      (value: unknown) =>
        value !== null &&
        typeof value === "object" &&
        "permalink" in value &&
        "body" in value,
    );
    expect(post).toBeDefined();
    expect(post).not.toHaveProperty("rawbody");
    expect(post).toHaveProperty("stem");
    expect(post).toHaveProperty("extension");
    const feed = await request.get("/feed.json");
    expect(feed.ok()).toBe(true);
    expect((await feed.json()).items[0].content_html).toContain("<p>");
  });

  test("Renders every Mermaid diagram after hydration and client navigation", async ({
    page,
  }) => {
    await page.route(
      /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//,
      (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><title>YouTube player test double</title>",
        }),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/hydration|\[Vue warn\]/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    const response = await page.goto("/cheat-sheet/");
    expect(await response!.text()).toContain("<pre>flowchart TD");
    const diagrams = page.locator(".mermaid svg");
    await expect(diagrams).toHaveCount(2, { timeout: 15_000 });
    for (const diagram of await diagrams.all()) {
      await expect(diagram).toBeAttached();
      expect(await diagram.getAttribute("viewBox")).toBeTruthy();
    }
    const ids = await diagrams.evaluateAll((nodes) =>
      nodes.map((node) => node.id),
    );
    expect(new Set(ids).size).toBe(2);
    await expect(page.locator(".mermaid [role=alert]")).toHaveCount(0);

    await page
      .locator("nav")
      .getByRole("link", { name: "About", exact: true })
      .click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.locator("h1#about")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/cheat-sheet\/$/);
    await expect(diagrams).toHaveCount(2, { timeout: 15_000 });
    expect(errors).toEqual([]);
  });

  test("Counts Mermaid source in reading time without counting it twice", () => {
    const code = "word ".repeat(460);
    expect(
      timeToRead({
        value: [["mermaid-diagram", { code }, code]],
      }),
    ).toBe(2);
    expect(timeToRead({ value: [["mermaid-diagram", { code }]] })).toBe(2);
  });

  test("Does not publish source maps or a bundle analysis report", () => {
    expect(
      readdirSync(join(process.cwd(), "dist"), { recursive: true }).filter(
        (path) => /\.map$|(^|[\\/])report\.html$/.test(String(path)),
      ),
    ).toEqual([]);
    const workflow = readFileSync(
      join(process.cwd(), ".github/workflows/build.yml"),
      "utf8",
    );
    expect(workflow).not.toContain("google.com/ping");
    expect(workflow).not.toContain("bing.com/ping");
  });

  test("Defers expensive PR workflows until ready for review", () => {
    for (const [file, job] of [
      ["build.yml", "build"],
      ["codeql-analysis.yml", "analyze"],
      ["compress-images.yml", "build"],
    ] as const) {
      const workflow = parse(
        readFileSync(join(process.cwd(), ".github", "workflows", file), "utf8"),
      );
      expect(workflow.on.pull_request.types).toEqual([
        "opened",
        "synchronize",
        "reopened",
        "ready_for_review",
      ]);
      expect(workflow.jobs[job].if).toBe(
        file === "compress-images.yml"
          ? "github.event.pull_request.head.repo.full_name == github.repository && !github.event.pull_request.draft && github.actor != 'github-actions[bot]'"
          : "github.event_name != 'pull_request' || !github.event.pull_request.draft",
      );
    }
  });
});
