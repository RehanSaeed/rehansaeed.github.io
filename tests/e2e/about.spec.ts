import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import { expect, test } from "./fixtures";
import { readImageDimensions } from "../../modules/blog-content/images";

const badges = [
  {
    filename: "Microsoft-Global-Hackathon-2026-300x300.png",
    alt: "Microsoft Global Hackathon 2026 Participant",
    issuedAt: "2026-08-20",
  },
  {
    filename: "Microsoft-MSAI-Security-Champs-2026-300x300.png",
    alt: "Microsoft MSAI Security Champs March 2026",
    issuedAt: "2026-03-31",
  },
  {
    filename: "Microsoft-Global-Hackathon-2025-300x300.png",
    alt: "Microsoft Global Hackathon 2025 Participant",
    issuedAt: "2025-08-05",
  },
  {
    filename: "Microsoft-MSAI-Security-Champs-Recognition-2025-300x300.png",
    alt: "Microsoft MSAI Security Champs Recognition 2025",
    issuedAt: "2025-09-30",
  },
  ...[
    [2024, "2024-08-02"],
    [2023, "2023-08-24"],
  ].map(([year, issuedAt]) => ({
    filename: `Microsoft-Global-Hackathon-${year}-300x300.png`,
    alt: `Microsoft Global Hackathon ${year} Participant`,
    issuedAt: String(issuedAt),
  })),
];
const existingBadges = [
  {
    filename: "Microsoft-Global-Hackathon-2022-300x300.png",
    issuedAt: "2022-08-25",
  },
  {
    filename: "Microsoft-Global-Hackathon-2021-300x300.png",
    issuedAt: "2021-09-02",
  },
  {
    filename: "Microsoft-Global-Hackathon-2020-350x300.png",
    issuedAt: "2020-06-22",
  },
  {
    filename: "Microsoft-Most-Valuable-Professional-Alumni-2023-300x300.png",
    issuedAt: "2023-05-18",
  },
];

unitTest(
  "Credly PNG filenames include their issue year and match their intrinsic dimensions",
  async () => {
    for (const { filename, issuedAt } of [...badges, ...existingBadges]) {
      expect(filename).toMatch(
        new RegExp(`-${issuedAt.slice(0, 4)}-\\d+x\\d+\\.png$`),
      );
      expect(
        await readImageDimensions(
          join(process.cwd(), "public", "images", "about", filename),
        ),
      ).toEqual({
        width: filename.includes("350x300") ? 350 : 300,
        height: 300,
      });
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
      const credly = page.locator(
        'a[href="https://www.credly.com/users/muhammad_rehan_saeed/badges"] .about__badge-image',
      );
      await expect(credly).toHaveCount(10);
      const expectedOrder = [...badges, ...existingBadges].map(
        ({ filename }) => filename,
      );
      expect(
        await credly.evaluateAll((images) =>
          images.map((image) => image.getAttribute("src")!.split("/").at(-1)),
        ),
      ).toEqual(expectedOrder);
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
        expect(bounds!.width).toBeCloseTo(150, 3);
        expect(bounds!.height).toBeCloseTo(150, 3);
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
      await expect(
        awards.getByRole("img", {
          name: "Microsoft Global Hackathon 2022.png",
        }),
      ).toHaveCount(1);
      const awardsLayout = await awards.evaluate((node) => ({
        left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
      }));
      expect(awardsLayout.left).toBeGreaterThanOrEqual(0);
      expect(awardsLayout.right).toBeLessThanOrEqual(width);
      expect(awardsLayout.scrollWidth).toBe(awardsLayout.clientWidth);
    });
  }
}
