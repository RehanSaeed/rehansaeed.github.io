import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

export type SiteCase = {
  /** Inline size applied to the site container, in CSS pixels. */
  width: number;
  /** Whether the navigation should stick to the top of the viewport. */
  sticky: boolean;
  /** Whether the compact layout without main padding should apply. */
  compact: boolean;
};

/** Derives the expected site layout from the 36em and 75em breakpoints. */
export const siteCase = (width: number, emSize: number): SiteCase => ({
  width,
  sticky: width >= 75 * emSize,
  compact: width <= 36 * emSize,
});

export const resizeSite = async (page: Page, width: number) => {
  await page.locator(".site-shell").evaluate((element, width) => {
    element.style.inlineSize = `${String(width)}px`;
  }, width);
};

export const expectSiteLayout = async (
  page: Page,
  { sticky, compact }: SiteCase,
) => {
  await expect(page.locator(".navigation")).toHaveCSS(
    "position",
    sticky ? "sticky" : "static",
  );
  const padding = await page
    .locator("#main")
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingInlineStart),
    );
  expect(padding > 0).toBe(!compact);
};
