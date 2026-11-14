import { load } from "cheerio";
import { tagPath } from "../../shared/utils/tag";
import { expect, test } from "./fixtures";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

test("selected tags render accessible navigation before hydration", async ({
  request,
}) => {
  for (const path of ["/portfolio/", postPath, "/"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const $ = load(await response.text());
    const tags = $(".tags__link");
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags.toArray()) {
      const link = $(tag);
      expect(link.is("a.link-button--tag")).toBe(true);
      expect(link.find(".link-button__tag-surface").attr("aria-hidden")).toBe(
        "true",
      );
      expect(link.attr("href")).toBe(tagPath(link.text().trim()));
      expect(link.attr("aria-disabled")).toBeUndefined();
      expect(link.attr("tabindex")).toBeUndefined();
    }
  }
});

for (const { theme, width, minimumRows } of [
  { theme: "light", width: 1440, minimumRows: 1 },
  { theme: "dark", width: 390, minimumRows: 2 },
] as const) {
  test(`selected pointed tags preserve holes, raised silhouettes and navigation / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: theme,
      reducedMotion: "no-preference",
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/portfolio/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "Toggle dark/light" }),
    ).toBeEnabled();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const tags = page.locator(".portfolio-card .tags__link");
    const first = tags.first();
    await expect(first).toHaveClass(/(?:^|\s)link-button--tag(?:\s|$)/);
    await expect(first).toHaveAccessibleName("Windows");
    await expect(first).toHaveAttribute("href", "/tag/windows/");
    await expect(first).toHaveCSS("text-decoration-line", "none");
    await expect(first).toHaveCSS("border-top-left-radius", "0px");
    await expect(first).toHaveCSS("border-bottom-left-radius", "0px");
    const radius = await first.evaluate(
      (element) => getComputedStyle(element).borderBottomRightRadius,
    );
    expect(Number.parseFloat(radius)).toBeGreaterThan(0);
    await expect(first).toHaveCSS("border-top-right-radius", radius);
    const hole = await first.evaluate((element) => {
      const style = getComputedStyle(element, "::after");
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--global-accent-color)";
      element.append(probe);
      const accent = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        width: style.width,
        height: style.height,
        radius: style.borderRadius,
        colour: style.backgroundColor,
        accent,
      };
    });
    expect(Number.parseFloat(hole.width)).toBeGreaterThan(0);
    expect(hole.width).toBe(hole.height);
    expect(hole.radius).toBe("50%");
    expect(hole.colour).toBe(hole.accent);
    const raisedShadow = await first.evaluate((element) => {
      const probe = document.createElement("span");
      probe.style.filter =
        "drop-shadow(var(--global-shadow-2-near)) drop-shadow(var(--global-shadow-2-middle)) drop-shadow(var(--global-shadow-2-far))";
      element.append(probe);
      const shadow = getComputedStyle(probe).filter;
      probe.remove();
      return shadow;
    });
    await first.evaluate((element) => {
      element.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await first.hover();
    await expect(first).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    const surface = first.locator(".link-button__tag-surface");
    await expect(surface).toHaveCSS("filter", raisedShadow);
    expect(
      await first.evaluate(
        (element) => getComputedStyle(element, "::before").content,
      ),
    ).toBe("none");
    await page.screenshot({
      path: test.info().outputPath(`portfolio-${theme}-pointed.png`),
    });
    await page.mouse.down();
    await expect(first).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await page.mouse.move(0, 0);
    // Cancel native link dragging before testing an independent fresh hover.
    await page.keyboard.press("Escape");
    await page.mouse.up();
    expect(await first.evaluate((element) => element.matches(":active"))).toBe(
      false,
    );
    await expect(page).toHaveURL("/portfolio/");

    const longTag = page.getByRole("link", {
      name: "Windows Presentation Foundation (WPF)",
      exact: true,
    });
    await longTag.scrollIntoViewIfNeeded();
    const box = await longTag.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    const rows = await longTag
      .locator("..")
      .locator("a")
      .evaluateAll(
        (links) =>
          new Set(
            links.map((link) => Math.round(link.getBoundingClientRect().top)),
          ).size,
      );
    expect(rows).toBeGreaterThanOrEqual(minimumRows);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await first.hover();
    await expect(first).toHaveCSS("transform", "none");
    await expect(first).toHaveCSS("transition-duration", "0s");
    await expect(surface).toHaveCSS("transition-duration", "0s");
    await expect(surface).toHaveCSS("filter", raisedShadow);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(postPath, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "Toggle dark/light" }),
    ).toBeEnabled();
    const postTag = page.locator(".post__tags .tags__link").first();
    await expect(postTag).toHaveClass(/(?:^|\s)link-button--tag(?:\s|$)/);
    const name = (await postTag.textContent())!.trim();
    await expect(postTag).toHaveAccessibleName(name);
    await expect(postTag).toHaveCSS("text-decoration-line", "none");
    await postTag.evaluate((element) => {
      element.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await postTag.hover();
    await expect(postTag).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    await expect(postTag.locator(".link-button__tag-surface")).toHaveCSS(
      "filter",
      raisedShadow,
    );
    await page.screenshot({
      path: test.info().outputPath(`article-${theme}-pointed.png`),
    });
    await page.emulateMedia({ forcedColors: "active" });
    await page.keyboard.press("Tab");
    await postTag.focus();
    await expect(postTag).toBeFocused();
    await expect(postTag).toHaveCSS("outline-width", "3px");
    await expect(postTag).toHaveCSS("border-top-style", "solid");
    const postSurface = postTag.locator(".link-button__tag-surface");
    await expect(postSurface).toHaveCSS("filter", "none");
    const colours = await postSurface.evaluate((element) => ({
      edge: getComputedStyle(element, "::before").backgroundColor,
      fill: getComputedStyle(element, "::after").backgroundColor,
    }));
    expect(colours.edge).not.toBe(colours.fill);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(tagPath(name));
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: `# ${name}`,
        exact: true,
      }),
    ).toBeVisible();
    await page.emulateMedia({ forcedColors: "none" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cardTag = page.locator(".post-card__tags .tags__link").first();
    await expect(cardTag).toHaveClass(/(?:^|\s)link-button--tag(?:\s|$)/);
    const cardName = (await cardTag.textContent())!.trim();
    await expect(cardTag).toHaveAccessibleName(cardName);
    await expect(cardTag).toHaveAttribute("href", tagPath(cardName));
    await cardTag.evaluate((element) => {
      element.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await cardTag.hover();
    await expect(cardTag).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    await expect(cardTag.locator(".link-button__tag-surface")).toHaveCSS(
      "filter",
      raisedShadow,
    );
    await page.screenshot({
      path: test.info().outputPath(`post-card-${theme}-pointed.png`),
    });
  });
}
