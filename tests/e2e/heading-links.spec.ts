import { expect, test } from "./fixtures";

for (const width of [320, 375, 576, 768, 1280]) {
  test(`Heading links fit the post gutter at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
    );
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    const links = page.locator(
      ".post__content :is(h1, h2, h3, h4, h5, h6) > a.anchor-link",
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
        const probe = document.createElement("span");
        probe.style.display = "block";
        probe.style.width = "var(--heading-anchor-gap)";
        anchor.append(probe);
        const gap = probe.getBoundingClientRect().width;
        probe.remove();
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
          iconWidth: iconBox.width,
          iconHeight: iconBox.height,
          anchorWidth: anchorBox.width,
          anchorHeight: anchorBox.height,
          gap,
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
      expect(layout.iconWidth).toBeGreaterThan(0);
      expect(layout.iconWidth).toBeCloseTo(layout.iconHeight, 1);
      expect(layout.iconWidth).toBeCloseTo(layout.anchorWidth, 1);
      expect(layout.iconHeight).toBeCloseTo(layout.anchorHeight, 1);
      expect(layout.offset).toBeCloseTo(
        Math.min(layout.iconWidth + layout.gap, layout.padding),
        1,
      );
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
    const tooltip = page.getByRole("tooltip", {
      name: "Link to this section",
      exact: true,
    });
    await expect(tooltip).toBeVisible();
    await expect(firstLink).toHaveAccessibleName("Link to this section");
    await expect(firstLink).toHaveAccessibleDescription("Link to this section");
    expect(
      await tooltip.evaluate((element) => element.matches(":popover-open")),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(firstLink).toBeFocused();
    const href = await firstLink.getAttribute("href");
    expect(href).toMatch(/^#.+/);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
}
