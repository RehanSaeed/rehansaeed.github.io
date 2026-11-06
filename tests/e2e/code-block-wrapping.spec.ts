import { expect, test } from "./fixtures";

const path = "/cheat-sheet/";

// Kept separate from code-blocks.spec.ts, which enables native scrollbars for every test.
for (const colorScheme of ["light", "dark"] as const) {
  test(`Wrapping fits a narrow viewport in ${colorScheme} mode without changing source or highlighting`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ colorScheme });
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const block = page
      .locator(".code-block")
      .filter({ hasText: "Wrapped code" });
    await block.hover();
    const code = block.locator("code");
    const source = await code.textContent();
    const markup = await code.innerHTML();
    const wrap = block.getByRole("button", { name: "Wrap lines" });
    await expect(wrap).toHaveAttribute("aria-pressed", "true");
    await expect(code).toHaveCSS("white-space", "pre-wrap");
    const pre = block.locator("pre");
    expect(
      await pre.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
    await wrap.click();
    await expect(code).toHaveCSS("white-space", "pre");
    expect(
      await pre.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeGreaterThan(100);
    await wrap.click();
    await expect(code).toHaveText(source);
    expect(await code.innerHTML()).toBe(markup);
    expect(await code.locator("span span").count()).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(375);

    const numbered = page.locator(".code-block").filter({
      has: page.locator(".has-highlighted-lines pre.line-numbers"),
    });
    await numbered.hover();
    await numbered.getByRole("button", { name: "Wrap lines" }).click();
    await expect(numbered.locator("code")).toHaveCSS("white-space", "pre-wrap");
    await expect(numbered.locator(".line.highlight").first()).toBeVisible();
    await expect(numbered.locator(".line.highlight").first()).toHaveCSS(
      "display",
      "inline",
    );
    expect(
      await numbered
        .locator(".line")
        .first()
        .evaluate((node) => getComputedStyle(node, "::before").content),
    ).toBe("counter(linenumber)");
  });
}
