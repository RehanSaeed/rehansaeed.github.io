import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import { expect, test } from "./fixtures";
import { readImageDimensions } from "../../modules/blog-content/images";
import sharp from "sharp";

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

unitTest(
  "Badge canvases are transparent without removing enclosed light artwork",
  async () => {
    for (const { filename, lightPixel, minimumBlue } of [
      {
        filename: "Microsoft-MSAI-Security-Champs-Recognition-2025-300x300.png",
        lightPixel: [150, 30],
        minimumBlue: 200,
      },
      {
        filename: "Microsoft-Global-Hackathon-2024-300x300.png",
        lightPixel: [84, 205],
        minimumBlue: 245,
      },
      {
        filename: "Microsoft-Global-Hackathon-2023-300x300.png",
        lightPixel: [119, 212],
        minimumBlue: 245,
      },
    ] as const) {
      const { data, info } = await sharp(
        join(process.cwd(), "public", "images", "about", filename),
      )
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect([info.width, info.height]).toEqual([300, 300]);
      for (let i = 0; i < 300; i++) {
        for (const [x, y] of [
          [i, 0],
          [i, 299],
          [0, i],
          [299, i],
        ] as const) {
          expect(data[(y * info.width + x) * 4 + 3]).toBe(0);
        }
      }
      expect(data[(150 * info.width + 150) * 4 + 3]).toBe(255);
      const pixel = (lightPixel[1] * info.width + lightPixel[0]) * 4;
      expect(data[pixel]).toBeGreaterThanOrEqual(245);
      expect(data[pixel + 1]).toBeGreaterThanOrEqual(235);
      expect(data[pixel + 2]).toBeGreaterThanOrEqual(minimumBlue);
      expect(data[pixel + 3]).toBe(255);
      expect(
        data.some((value, i) => i % 4 === 3 && value > 0 && value < 255),
      ).toBe(true);
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
      await expect(
        page
          .locator(".about__description")
          .filter({ hasText: "If it’s written" }),
      ).toContainText(
        "If it’s written in HTML/CSS/JS, C# or .NET, I have probably written something using it in anger!",
      );
      await expect(
        page
          .locator(".about__description")
          .filter({ hasText: "I occasionally appear" }),
      ).toHaveText(
        "I occasionally appear on Youtube and Twitch where you can watch my software development escapades.",
      );
      const descriptions = await page
        .locator(".about__description")
        .allTextContents();
      const youtubeIndex = descriptions.findIndex((text) =>
        text.includes("I occasionally appear"),
      );
      expect(youtubeIndex).toBeGreaterThanOrEqual(0);
      expect(
        descriptions.findIndex((text) =>
          text.includes("open source projects that I have founded"),
        ),
      ).toBeGreaterThan(youtubeIndex);
      expect(
        await page
          .locator(".about__github-image")
          .evaluateAll((images) =>
            images.map((image) => image.getAttribute("alt")),
          ),
      ).toEqual(["GitHub stars", "GitHub follower count", "GitHub sponsors"]);
      expect(
        await page
          .locator(
            ".about__container > .about__github-images, .about__container > .about__youtube-images, .about__container > .about_awards-images, .about__container > .about__mvp-images",
          )
          .evaluateAll((sections) =>
            sections.map((section) => section.className),
          ),
      ).toEqual([
        "about__youtube-images",
        "about__github-images",
        "about_awards-images",
        "about__mvp-images",
      ]);
      for (const [alt, statistic] of [
        ["Youtube views", "viewCount"],
        ["Youtube subscribers", "subscriberCount"],
      ]) {
        const src = await page
          .getByRole("img", { name: alt, exact: true })
          .getAttribute("src");
        const url = new URL(src!);
        expect(url.origin + url.pathname).toBe(
          "https://img.shields.io/badge/dynamic/json",
        );
        expect(url.searchParams.get("url")).toBe(
          "https://api.socialcounts.org/youtube-live-subscriber-count/UC6geox4JkY11093RqecELGA",
        );
        expect(url.searchParams.get("query")).toBe(
          `$.counters.api.${statistic}`,
        );
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(width);
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
      const expectedAwards = expectedOrder.flatMap((filename) =>
        filename === "Microsoft-Global-Hackathon-2022-300x300.png"
          ? ["Open-UK-Honours-2022-1288x396.jpg", filename]
          : [filename],
      );
      expect(
        await awards
          .locator("img")
          .evaluateAll((images) =>
            images.map((image) => image.getAttribute("src")!.split("/").at(-1)),
          ),
      ).toEqual(expectedAwards);
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
                node.naturalWidth > 0 &&
                node.naturalWidth === node.naturalHeight &&
                node.currentSrc.includes("f_avif"),
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
