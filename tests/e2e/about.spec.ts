import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import { expect, test } from "./fixtures";
import { readImageDimensions } from "../../modules/blog-content/images";

const badges = [
  {
    filename: "Microsoft-MSAI-Security-Champs-Recognition-300x300.png",
    alt: "Microsoft MSAI Security Champs Recognition",
  },
  {
    filename: "Microsoft-MSAI-Security-Champs-2026-03-300x300.png",
    alt: "Microsoft MSAI Security Champs March 2026",
  },
  ...[2026, 2025, 2024, 2023].map((year) => ({
    filename: `Microsoft-Global-Hackathon-${year}-300x300.png`,
    alt: `Microsoft Global Hackathon ${year} Participant`,
  })),
];

unitTest(
  "New Credly PNG filenames match their intrinsic 300px dimensions",
  async () => {
    for (const { filename } of badges) {
      expect(
        await readImageDimensions(
          join(process.cwd(), "public", "images", "about", filename),
        ),
      ).toEqual({ width: 300, height: 300 });
    }
  },
);

for (const width of [375, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`About Credly badges at ${width}px in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/about/");
      const awards = page.locator(".about_awards-images");
      await expect(awards.locator(".about__badge-image")).toHaveCount(9);
      for (const { filename, alt } of badges) {
        const image = awards.getByRole("img", { name: alt, exact: true });
        await expect(image).toHaveAttribute("width", "300");
        await expect(image).toHaveAttribute("height", "300");
        await expect(image).toHaveAttribute(
          "src",
          new RegExp(`/images/about/${filename.replaceAll(".", "\\.")}$`),
        );
        await expect(
          awards.getByRole("link", { name: alt, exact: true }),
        ).toHaveAttribute(
          "href",
          "https://www.credly.com/users/muhammad_rehan_saeed/badges",
        );
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (node: HTMLImageElement) =>
                node.complete &&
                node.naturalWidth === 300 &&
                node.naturalHeight === 300,
            ),
          )
          .toBe(true);
        const bounds = await image.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.width).toBe(150);
        expect(bounds!.height).toBe(150);
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
      await expect(
        awards.getByRole("img", {
          name: "Microsoft Global Hackathon 2022.png",
        }),
      ).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    });
  }
}
