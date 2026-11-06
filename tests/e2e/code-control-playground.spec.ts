import { expect, test } from "./fixtures";

// eslint-disable-next-line playwright/no-skipped-test -- This route exists only in development.
test.skip(
  process.env.CODE_CONTROLS_PLAYGROUND !== "1",
  "The comparison route exists only in development. Set CODE_CONTROLS_PLAYGROUND=1 and BASE_URL to the dev server.",
);

test.beforeEach(async ({ page }) => {
  await page.goto("/dev/code-controls/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByLabel("Narrow examples", { exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Toggle dark/light", exact: true }),
  ).toBeVisible();
  expect(
    (await page.locator("[data-tab-style]").first().boundingBox())!.width,
  ).toBeGreaterThan(280);
});

test("Comparison options change the preview without choosing a production design", async ({
  page,
}) => {
  await expect(page.locator(".controls-lab__card[data-tab-style]")).toHaveCount(
    6,
  );
  await page.getByLabel("Narrow examples", { exact: true }).check();
  await expect
    .poll(
      async () =>
        (await page.locator(".controls-lab__example").first().boundingBox())!
          .width,
    )
    .toBeLessThanOrEqual(400);
  const theme = await page.locator("html").getAttribute("data-theme");
  await page
    .getByRole("button", { name: "Toggle dark/light", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    theme === "dark" ? "light" : "dark",
  );
});

for (const style of [
  "attached",
  "underline",
  "segmented",
  "pills",
  "editor",
  "editor-wide",
]) {
  test(`${style} tabs preserve semantics and highlighting`, async ({
    page,
  }) => {
    const card = page.locator(`[data-tab-style="${style}"]`);
    const title = await card.getByRole("heading").textContent();
    const bash = card.getByRole("tab", { name: "Bash", exact: true });
    const powershell = card.getByRole("tab", {
      name: "PowerShell",
      exact: true,
    });
    await expect(card.getByRole("tablist")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    await expect(bash).toHaveAttribute("aria-selected", "true");
    await bash.focus();
    await page.keyboard.press("ArrowRight");
    await expect(powershell).toBeFocused();
    await expect(powershell).toHaveAttribute("aria-selected", "true");
    const panel = card.getByRole("tabpanel");
    await expect(panel).toHaveAttribute(
      "id",
      (await powershell.getAttribute("aria-controls"))!,
    );
    await expect(panel).toHaveAttribute(
      "aria-labelledby",
      (await powershell.getAttribute("id"))!,
    );
    await expect(panel.locator("pre")).toHaveClass(/\bshiki\b/);
    const widths = await card.getByRole("tablist").evaluate((element) => {
      const tabs = [...element.querySelectorAll('[role="tab"]')];
      const first = tabs[0]!.getBoundingClientRect();
      const last = tabs[1]!.getBoundingClientRect();
      return {
        available: element.clientWidth,
        filled: last.right - first.left,
        first: first.width,
        last: last.width,
      };
    });
    expect(
      style !== "editor-wide" ||
        Math.abs(widths.filled - widths.available) <= 1,
    ).toBe(true);
    expect(
      style !== "editor-wide" || Math.abs(widths.first - widths.last) <= 1,
    ).toBe(true);
    expect(style !== "editor" || widths.filled < widths.available - 1).toBe(
      true,
    );
    const corners = await panel.locator("pre").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        topLeft: style.borderTopLeftRadius,
        topRight: style.borderTopRightRadius,
        bottomRight: style.borderBottomRightRadius,
      };
    });
    expect(corners.topLeft).toBe("0px");
    expect(corners.topRight).toBe(
      style === "attached" ? corners.bottomRight : "0px",
    );
    expect(
      style !== "attached" || Number.parseFloat(corners.topRight) > 0,
    ).toBe(true);
    const command = panel.locator("code .line > span").first();
    await expect(command).toHaveCSS("color", "rgb(102, 217, 239)");
    await page
      .getByRole("button", { name: "Toggle dark/light", exact: true })
      .click();
    await expect(command).toHaveCSS("color", "rgb(102, 217, 239)");
    await card.getByRole("radio").check();
    await expect(page.locator("[data-tab-preference]")).toContainText(
      `Tab preference: ${title}.`,
    );
    await expect(
      page
        .locator("[data-tab-style]")
        .locator('[role="tab"][aria-selected="true"]'),
    ).toHaveCount(6);
    await expect(
      page
        .locator('[data-tab-style] [role="tab"][aria-selected="true"]')
        .filter({ hasText: "Bash" }),
    ).toHaveCount(5);
  });
}
