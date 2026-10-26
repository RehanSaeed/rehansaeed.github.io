import { expect, test } from "./fixtures";

for (const width of [320, 375, 576, 768, 1280]) {
  test(`Heading links fit the post gutter at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
    );
    await page.evaluate(() => document.fonts.ready);
    const links = page.locator(
      '.post__content :is(h1, h2, h3, h4, h5, h6) > a[aria-hidden="true"]',
    );
    expect(await links.count()).toBeGreaterThan(0);

    for (const link of await links.all()) {
      const heading = link.locator("..");
      await heading.hover();
      await expect(link).toHaveCSS("opacity", "1");
      await expect(link.locator("svg")).toBeVisible();

      const layout = await link.evaluate((anchor) => {
        const heading = anchor.parentElement!;
        const post = anchor.closest(".post")!;
        const anchorBox = anchor.getBoundingClientRect();
        const iconBox = anchor.querySelector("svg")!.getBoundingClientRect();
        const postBox = post.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(heading);
        range.setStartAfter(anchor);
        const textBox = range.getBoundingClientRect();
        return {
          anchorLeft: anchorBox.left,
          iconLeft: iconBox.left,
          iconRight: iconBox.right,
          postLeft: postBox.left,
          postRight: postBox.right,
          textLeft: textBox.left,
          headingLeft: heading.getBoundingClientRect().left,
          offset: heading.getBoundingClientRect().left - anchorBox.left,
          padding: Number.parseFloat(getComputedStyle(post).paddingLeft),
          hitLeftEdge:
            document
              .elementFromPoint(
                anchorBox.left + 1,
                anchorBox.top + anchorBox.height / 2,
              )
              ?.closest("a") === anchor,
          overflow: getComputedStyle(post).overflow,
          pageWidth: document.documentElement.scrollWidth,
        };
      });
      expect(layout.anchorLeft).toBeGreaterThanOrEqual(layout.postLeft);
      expect(layout.iconLeft).toBeGreaterThanOrEqual(layout.postLeft);
      expect(layout.iconRight).toBeLessThanOrEqual(layout.postRight);
      expect(layout.textLeft).toBeCloseTo(layout.headingLeft, 1);
      expect(layout.offset).toBeCloseTo(Math.min(30, layout.padding), 1);
      expect(layout.hitLeftEdge).toBe(true);
      expect(layout.overflow).toBe("hidden");
      expect(layout.pageWidth).toBeLessThanOrEqual(width);
    }

    const firstLink = links.first();
    await page.mouse.move(width - 1, 0);
    await firstLink.scrollIntoViewIfNeeded();
    await expect(firstLink).toHaveCSS("opacity", "0");
    await firstLink.focus();
    await expect(firstLink).toHaveCSS("opacity", "1");
    const href = await firstLink.getAttribute("href");
    expect(href).toMatch(/^#.+/);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
}
