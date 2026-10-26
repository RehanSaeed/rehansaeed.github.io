import { expect, test } from "./fixtures";

for (const colorScheme of ["light", "dark"] as const) {
  test(`Tooltips use the page background and accent border in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    const search = page.getByRole("button", {
      name: "Open search",
      exact: true,
    });
    await expect(search).toBeEnabled();
    await search.hover();
    const tooltip = page.getByRole("tooltip", { name: "Search", exact: true });
    await expect(tooltip).toBeVisible();
    await expect(search).toHaveAccessibleDescription("Search");
    await expect(search).not.toHaveAttribute("title");
    const colours = await tooltip.evaluate((element) => {
      const style = getComputedStyle(element);
      const probe = document.createElement("span");
      probe.style.color = "var(--global-accent-color)";
      document.body.append(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      const arrow = getComputedStyle(element, "::before");
      return {
        background: style.backgroundColor,
        pageBackground: getComputedStyle(document.body).backgroundColor,
        border: style.borderTopColor,
        accent,
        arrowBackground: arrow.backgroundColor,
        arrowBorder: arrow.borderBottomColor,
        arrowTransform: arrow.transform,
        topLayer: element.matches(":popover-open"),
      };
    });
    expect(colours.topLayer).toBe(true);
    expect(colours.arrowTransform).not.toBe("none");
    expect(colours.background).toBe(colours.pageBackground);
    expect(colours.border).toBe(colours.accent);
    expect(colours.arrowBackground).toBe(colours.background);
    expect(colours.arrowBorder).toBe(colours.border);
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.waitForTimeout(200);
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await page.mouse.move(0, 0);
    await search.focus();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(search).toBeFocused();
    await expect(search).not.toHaveAttribute("aria-describedby");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("tooltip")).toHaveText(
      colorScheme === "dark" ? "Enable light theme" : "Enable dark theme",
    );
    await page.keyboard.press("Enter");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme === "dark" ? "light" : "dark",
    );
  });
}

test("Tooltips flip, clamp, track resizing and stay above dialogs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const search = page.getByRole("button", { name: "Open search", exact: true });
  await expect(search).toBeEnabled();
  await search.evaluate((element) => {
    element.style.position = "fixed";
    element.style.left = "4px";
    element.style.top = "4px";
  });
  await search.focus();
  const tooltip = page.getByRole("tooltip", { name: "Search", exact: true });
  await expect(tooltip).toHaveAttribute("data-placement", "right");
  for (const width of [375, 280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect
      .poll(async () => {
        const bounds = await tooltip.boundingBox();
        return (
          !!bounds &&
          bounds.x >= 8 &&
          bounds.y >= 8 &&
          bounds.x + bounds.width <= width - 8
        );
      })
      .toBe(true);
  }
  await search.click();
  await expect(tooltip).toBeHidden();
  const dialog = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(dialog).toBeVisible();
  // Move an existing trigger into the modal to exercise the shared component's top layer.
  const theme = page.getByRole("button", { name: "Toggle dark/light" });
  await theme.evaluate((element) => {
    document.querySelector("dialog[open] .dialog__content")!.append(element);
  });
  await theme.focus();
  const modalTooltip = page.getByRole("tooltip");
  await expect(modalTooltip).toBeVisible();
  expect(
    await modalTooltip.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return element.contains(
        document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        ),
      );
    }),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(modalTooltip).toBeHidden();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Tooltip triggers retain native layout and touch activation", async ({
  page,
}) => {
  await page.goto("/portfolio/");
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled();
  const badge = page.locator(".portfolio-card__nuget").first();
  await badge.focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("total NuGet downloads at last build");
  await expect(tooltip).toHaveAttribute("data-placement", "top");
  expect(
    await badge.evaluate((element) =>
      element.parentElement?.classList.contains("portfolio-card__nuget-badges"),
    ),
  ).toBe(true);
  await badge.evaluate((element) => {
    const card = element.closest<HTMLElement>(".card")!;
    card.style.transition = "none";
    card.style.willChange = "auto";
    card.style.translate = "none";
    element.style.position = "fixed";
    element.style.top = "4px";
    element.style.left = "4px";
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("resize"));
  });
  await expect(tooltip).toHaveAttribute("data-placement", "bottom");
  await page.setViewportSize({ width: 280, height: 812 });
  await expect
    .poll(async () => {
      const bounds = await tooltip.boundingBox();
      return !!bounds && bounds.x >= 8 && bounds.x + bounds.width <= 272;
    })
    .toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const search = page.getByRole("button", { name: "Open search", exact: true });
  await expect(search).toBeEnabled();
  await search.dispatchEvent("pointerenter", { pointerType: "touch" });
  await page.waitForTimeout(400);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await search.click();
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
