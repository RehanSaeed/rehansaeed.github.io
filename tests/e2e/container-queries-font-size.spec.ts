import { expect, test } from "./fixtures";
import { expectSiteLayout, resizeSite, siteCase } from "./site-container";

const largeDefaultFontSize = 32;

test.use({
  launchOptions: {
    firefoxUserPrefs: {
      "font.size.variable.x-western": largeDefaultFontSize,
    },
  },
});

test.beforeEach(async ({ page, browserName }) => {
  // Firefox receives the default font size through launch preferences.
  if (browserName === "chromium") {
    const session = await page.context().newCDPSession(page);
    await session.send("Page.setFontSizes", {
      fontSizes: { standard: largeDefaultFontSize },
    });
  }
});

for (const testCase of [1152, 1153, 2399, 2400].map((width) =>
  siteCase(width, largeDefaultFontSize),
)) {
  test(`Site breakpoints scale for a ${String(testCase.width)}px container`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2600, height: 1080 });
    await page.goto("/");
    await expect(page.locator(".site-shell")).toHaveCSS(
      "font-size",
      `${String(largeDefaultFontSize)}px`,
    );
    await resizeSite(page, testCase.width);
    await expectSiteLayout(page, testCase);
  });
}
