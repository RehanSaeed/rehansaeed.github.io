import { expect, test } from "./fixtures";

test.skip(
  process.env.CODE_CONTROLS_PLAYGROUND !== "1",
  "The comparison route exists only in development. Set CODE_CONTROLS_PLAYGROUND=1 and BASE_URL to the dev server.",
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("comparison-copy", text);
        },
      },
    });
  });
  await page.goto("/dev/code-controls/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByLabel("Narrow examples", { exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByLabel("Show all controls", { exact: true }),
  ).not.toBeChecked();
  await page.getByLabel("Show all controls", { exact: true }).check();
});

for (const style of ["current", "plain", "bordered", "soft", "grouped"]) {
  test(`${style} uses the intended component and supports copy and wrap`, async ({
    page,
  }) => {
    const card = page.locator(`[data-style="${style}"]`);
    const buttons = card.locator(".code-block__toolbar button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.first()).toBeEnabled();
    await expect(card.locator(".code-block__toolbar .button")).toHaveCount(
      style === "current" ? 0 : 2,
    );
    await expect(
      card.locator(".code-block__toolbar .button--bordered"),
    ).toHaveCount(style === "bordered" ? 2 : 0);
    await expect(
      card.locator(".code-block__toolbar .button--contrast"),
    ).toHaveCount(style === "soft" ? 2 : 0);
    const code = card.locator("code");
    const source = await code.textContent();
    const tokens = await code.innerHTML();
    expect(await code.locator("span").count()).toBeGreaterThan(0);
    const wrap = card.getByRole("button", { name: "Wrap lines", exact: true });
    await expect(wrap).toHaveAttribute("aria-pressed", "false");
    await wrap.click();
    await expect(code).toHaveCSS("white-space", "pre-wrap");
    await card.getByRole("button", { name: "Copy code", exact: true }).click();
    await expect(
      card.getByRole("button", { name: "Copied!", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => sessionStorage.getItem("comparison-copy")),
    ).toBe(source);
    expect(await code.innerHTML()).toBe(tokens);
  });
}

test("Comparison options change the preview without choosing a production design", async ({
  page,
}) => {
  await expect(page.locator(".controls-lab__card[data-style]")).toHaveCount(5);
  await expect(page.locator(".controls-lab__card[data-tab-style]")).toHaveCount(
    5,
  );
  await page.getByLabel("Narrow examples", { exact: true }).check();
  await expect
    .poll(
      async () =>
        (await page.locator(".controls-lab__example").first().boundingBox())!
          .width,
    )
    .toBeLessThanOrEqual(400);
  await page.getByLabel("Show all controls", { exact: true }).uncheck();
  await page.mouse.move(0, 0);
  const current = page.locator('[data-style="current"]');
  await expect(current.locator(".code-block__toolbar")).toHaveCSS(
    "opacity",
    "0",
  );
  await page.keyboard.press("Tab");
  await current
    .getByRole("button", { name: "Wrap lines", exact: true })
    .focus();
  await expect(current.locator(".code-block__toolbar")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(
    current.getByRole("button", { name: "Wrap lines", exact: true }),
  ).toHaveCSS("outline-style", "solid");
  await page.getByLabel("Prefer C", { exact: true }).check();
  await expect(page.locator("[data-control-preference]")).toContainText(
    "Preference: C.",
  );
  await expect(page.locator(".code-block--controls-current")).toHaveCount(1);
  const theme = await page.locator("html").getAttribute("data-theme");
  await page
    .getByRole("button", { name: "Toggle dark/light", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    theme === "dark" ? "light" : "dark",
  );
});

for (const style of ["attached", "underline", "segmented", "pills", "editor"]) {
  test(`${style} tabs preserve semantics, highlighting and code interactions`, async ({
    page,
  }) => {
    const card = page.locator(`[data-tab-style="${style}"]`);
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
    const command = panel.locator("code .line > span").first();
    await expect(command).toHaveCSS("color", "rgb(102, 217, 239)");
    await page
      .getByRole("button", { name: "Toggle dark/light", exact: true })
      .click();
    await expect(command).toHaveCSS("color", "rgb(102, 217, 239)");
    await card.hover();
    await card.getByRole("button", { name: "Wrap lines", exact: true }).click();
    await expect(panel.locator("code")).toHaveCSS("white-space", "pre-wrap");
    await card.getByRole("button", { name: "Copy code", exact: true }).click();
    expect(
      await page.evaluate(() => sessionStorage.getItem("comparison-copy")),
    ).toBe(await panel.locator("code").textContent());
    await card.getByRole("radio").check();
    await expect(page.locator("[data-tab-preference]")).toContainText(
      `Tab preference: ${style.charAt(0).toUpperCase() + style.slice(1)}.`,
    );
    await expect(
      page
        .locator("[data-tab-style]")
        .locator('[role="tab"][aria-selected="true"]'),
    ).toHaveCount(5);
    await expect(
      page
        .locator('[data-tab-style] [role="tab"][aria-selected="true"]')
        .filter({ hasText: "Bash" }),
    ).toHaveCount(4);
  });
}
