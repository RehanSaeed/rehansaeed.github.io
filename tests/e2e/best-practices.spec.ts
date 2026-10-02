import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { timeToRead } from "../../modules/blog-content/fields";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

test.describe("Nuxt best practices", () => {
  test("Announces client-side route changes", async ({ page }) => {
    await page.goto("/");
    await page
      .locator("nav")
      .getByRole("link", { name: "About", exact: true })
      .click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.locator("h1#about")).toBeVisible();

    const announcer = page.locator('[aria-live="polite"]');
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
    await expect(hero).toHaveAttribute("width", "860");
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
});
