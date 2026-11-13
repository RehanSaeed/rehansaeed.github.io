import { load } from "cheerio";
import { tagPath } from "../../shared/utils/tag";
import { expect, test } from "./fixtures";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

test("selected tags render accessible navigation before hydration", async ({
  request,
}) => {
  for (const path of ["/portfolio/", postPath]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const $ = load(await response.text());
    expect($(".tag-style-switcher")).toHaveLength(0);
    const tags = $(".tags__link");
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags.toArray()) {
      const link = $(tag);
      expect(link.is("a.button--code-token.button--tag-icon")).toBe(true);
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
  test(`selected tags preserve icons, raised interaction and navigation / ${theme}`, async ({
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
    expect(
      await first.evaluate(
        (element) => getComputedStyle(element, "::after").maskImage,
      ),
    ).not.toBe("none");
    const raisedShadow = await first.evaluate((element) => {
      const probe = document.createElement("span");
      probe.style.boxShadow = "var(--global-shadow-2)";
      element.append(probe);
      const shadow = getComputedStyle(probe).boxShadow;
      probe.remove();
      return shadow;
    });
    await first.hover();
    await expect(first).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    await expect
      .poll(() =>
        first.evaluate((element) => ({
          shadow: getComputedStyle(element, "::before").boxShadow,
          opacity: getComputedStyle(element, "::before").opacity,
        })),
      )
      .toEqual({ shadow: raisedShadow, opacity: "1" });
    await page.mouse.down();
    await expect(first).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await page.mouse.move(0, 0);
    await page.mouse.up();

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
    await expect
      .poll(() =>
        first.evaluate(
          (element) => getComputedStyle(element, "::before").opacity,
        ),
      )
      .toBe("1");

    await page.goto(postPath, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "Toggle dark/light" }),
    ).toBeEnabled();
    const postTag = page.locator(".post__tags .tags__link").first();
    await expect(postTag).toHaveClass(/button--code-token/);
    await expect(postTag).toHaveClass(/button--tag-icon/);
    const name = (await postTag.textContent())!.trim();
    await expect(postTag).toHaveAccessibleName(name);
    await expect(postTag).toHaveCSS("text-decoration-line", "none");
    await page.emulateMedia({ forcedColors: "active" });
    await page.keyboard.press("Tab");
    await postTag.focus();
    await expect(postTag).toBeFocused();
    await expect(postTag).toHaveCSS("outline-width", "3px");
    await expect(postTag).toHaveCSS("border-top-style", "solid");
    const colours = await postTag.evaluate((element) => {
      const style = getComputedStyle(element);
      return { text: style.color, background: style.backgroundColor };
    });
    expect(colours.text).not.toBe(colours.background);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(tagPath(name));
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: `# ${name}`,
        exact: true,
      }),
    ).toBeVisible();
  });
}

if (process.env.TAG_STYLE_PREVIEW === "true") {
  test("development preview switches real portfolio and article tags without changing their links", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const { theme, width } of [
      { theme: "light", width: 1440 },
      { theme: "dark", width: 390 },
    ] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width, height: 1100 });
      for (const { path, context } of [
        { path: "/portfolio/", context: "portfolio" },
        { path: postPath, context: "article" },
      ]) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(
          page.getByRole("button", { name: "Toggle dark/light" }),
        ).toBeEnabled();
        const code = page.getByRole("radio", {
          name: "Code token with tag icon",
        });
        const pointed = page.getByRole("radio", {
          name: "Pointed tag with purple hole",
        });
        await expect(code).toBeChecked();
        const tags = page.locator(".tags__link");
        const namesAndLinks = await tags.evaluateAll((elements) =>
          elements.map((element) => ({
            name: element.textContent.trim(),
            href: element.getAttribute("href"),
          })),
        );
        expect(namesAndLinks.length).toBeGreaterThan(0);
        await tags.first().scrollIntoViewIfNeeded();
        await page.screenshot({
          path: test.info().outputPath(`${context}-${theme}-code-token.png`),
        });
        await code.focus();
        await page.keyboard.press("ArrowDown");
        await expect(pointed).toBeChecked();
        await expect(tags.first()).toHaveClass(/button--tag-shaped/);
        await expect(
          page.locator(".tags__link.button--code-token"),
        ).toHaveCount(0);
        expect(
          await tags.evaluateAll((elements) =>
            elements.map((element) => ({
              name: element.textContent.trim(),
              href: element.getAttribute("href"),
            })),
          ),
        ).toEqual(namesAndLinks);
        await expect(tags.first()).toHaveAccessibleName(namesAndLinks[0]!.name);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        await tags.first().scrollIntoViewIfNeeded();
        await page.screenshot({
          path: test.info().outputPath(`${context}-${theme}-tag-shaped.png`),
        });
        await code.check();
        await expect(tags.first()).toHaveClass(/button--code-token/);
        await expect(tags.first()).toHaveClass(/button--tag-icon/);
        await expect(
          page.locator(".tags__link.button--tag-shaped"),
        ).toHaveCount(0);
      }
    }
  });
}
