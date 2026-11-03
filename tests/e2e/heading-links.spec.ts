import { expect, test } from "./fixtures";
import { rehypeHeadingAnchors } from "../../modules/blog-content/markdown";

test("Section heading grid preserves inline text markup and fragment IDs", () => {
  const children = [
    { type: "text", value: "A heading with " },
    {
      type: "element",
      tagName: "em",
      children: [{ type: "text", value: "emphasis" }],
    },
    {
      type: "element",
      tagName: "a",
      properties: { href: "/about/" },
      children: [{ type: "text", value: " and a link" }],
    },
  ];
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "h2",
        properties: { id: "example" },
        children,
      },
    ],
  };
  rehypeHeadingAnchors()(tree);
  expect(tree.children[0]).toMatchObject({
    tagName: "keep-h2",
    properties: { id: "example", "data-section-heading": "" },
    children: [
      {
        tagName: "anchor-link",
        properties: { href: "#example", label: "Link to this section" },
      },
      {
        tagName: "span",
        properties: { className: ["heading__text"] },
        children,
      },
    ],
  });
});

for (const width of [280, 320, 375, 576, 768, 1280]) {
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
      await heading.scrollIntoViewIfNeeded();
      const beforeHover = await heading.boundingBox();
      expect(beforeHover).not.toBeNull();
      await heading.hover();
      await expect(link).toHaveCSS("opacity", "1");
      await expect(link.locator("svg")).toBeVisible();
      const afterHover = await heading.boundingBox();
      expect(afterHover).not.toBeNull();
      expect(afterHover!.x).toBeCloseTo(beforeHover!.x, 1);
      expect(afterHover!.y).toBeCloseTo(beforeHover!.y, 1);
      expect(afterHover!.width).toBeCloseTo(beforeHover!.width, 1);
      expect(afterHover!.height).toBeCloseTo(beforeHover!.height, 1);

      const layout = await link.evaluate((anchor) => {
        const heading = anchor.parentElement!;
        const post = anchor.closest(".post")!;
        const anchorBox = anchor.getBoundingClientRect();
        const iconBox = anchor.querySelector("svg")!.getBoundingClientRect();
        const postBox = post.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(heading.querySelector(".heading__text")!);
        const textRects = range.getClientRects();
        const textBox = textRects[0]!;
        const textBounds = heading
          .querySelector(".heading__text")!
          .getBoundingClientRect();
        const probe = document.createElement("span");
        probe.style.display = "block";
        probe.style.position = "absolute";
        probe.style.width = "var(--heading-anchor-gap)";
        anchor.append(probe);
        const gap = probe.getBoundingClientRect().width;
        probe.remove();
        const headingBox = heading.getBoundingClientRect();
        const grid = getComputedStyle(heading).display === "grid";
        const padding = Number.parseFloat(getComputedStyle(post).paddingLeft);
        return {
          anchorLeft: anchorBox.left,
          iconLeft: iconBox.left,
          iconRight: iconBox.right,
          postLeft: postBox.left,
          postRight: postBox.right,
          textLeft: textBox.left,
          headingLeft: headingBox.left,
          textRight: textBounds.right,
          expectedAnchorLeft: grid
            ? (textRects.length === 1 ? textBox.right : textBounds.right) + gap
            : headingBox.left - Math.min(anchorBox.width + gap, padding),
          anchorCenter: anchorBox.top + anchorBox.height / 2,
          expectedAnchorCenter: grid
            ? textBounds.bottom -
              Number.parseFloat(getComputedStyle(heading).lineHeight) / 2
            : anchorBox.top + anchorBox.height / 2,
          maximumTextRight: grid ? anchorBox.left - gap : headingBox.right,
          iconWidth: iconBox.width,
          iconHeight: iconBox.height,
          anchorWidth: anchorBox.width,
          anchorHeight: anchorBox.height,
          hitLeftEdge:
            document
              .elementFromPoint(
                anchorBox.left + 1,
                anchorBox.top + anchorBox.height / 2,
              )
              ?.closest("a") === anchor,
          overflow: getComputedStyle(post).overflow,
          headingWidth: heading.scrollWidth,
          headingClientWidth: heading.clientWidth,
        };
      });
      expect(layout.anchorLeft).toBeGreaterThanOrEqual(layout.postLeft);
      expect(layout.iconLeft).toBeGreaterThanOrEqual(layout.postLeft);
      expect(layout.iconRight).toBeLessThanOrEqual(layout.postRight);
      expect(layout.anchorLeft).toBeGreaterThanOrEqual(0);
      expect(layout.iconRight).toBeLessThanOrEqual(width);
      expect(layout.anchorLeft).toBeCloseTo(layout.expectedAnchorLeft, 1);
      expect(layout.anchorCenter).toBeCloseTo(layout.expectedAnchorCenter, 1);
      expect(layout.textRight).toBeLessThanOrEqual(layout.maximumTextRight + 1);
      expect(layout.textLeft).toBeCloseTo(layout.headingLeft, 1);
      expect(layout.iconWidth).toBeGreaterThan(0);
      expect(layout.iconWidth).toBeCloseTo(layout.iconHeight, 1);
      expect(layout.iconWidth).toBeCloseTo(layout.anchorWidth, 1);
      expect(layout.iconHeight).toBeCloseTo(layout.anchorHeight, 1);
      expect(layout.hitLeftEdge).toBe(true);
      expect(layout.overflow).toBe("hidden");
      expect(layout.headingWidth).toBeLessThanOrEqual(
        layout.headingClientWidth,
      );
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
