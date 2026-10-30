import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import type { Page } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./fixtures";
import { readImageDimensions } from "../../modules/blog-content/images";
import { aboutCredentials } from "../../app/data/about";
import metadata from "../../site.json";

async function openAbout(page: Page) {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Map unavailable during About tests" }),
  );
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
}

unitTest(
  "Credential filenames match their years and intrinsic dimensions",
  async () => {
    for (const { filename, year, width } of aboutCredentials) {
      expect(filename).toMatch(new RegExp(`-${year}-${width}x300\\.png$`));
      expect(
        await readImageDimensions(
          join(process.cwd(), "public", "images", "about", filename),
        ),
      ).toEqual({ width, height: 300 });
    }
  },
);

unitTest(
  "Badge canvases preserve transparency and enclosed light artwork",
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

for (const width of [320, 375, 768, 1440]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Editorial About at ${width}px in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await openAbout(page);
      const article = page.getByRole("article");
      await expect(article.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(article.getByRole("heading", { level: 1 })).toHaveText(
        /Software is\s*a human\s*endeavour\./,
      );
      await expect(article.getByRole("blockquote")).toContainText(
        "If it’s written in HTML/CSS/JS, C# or .NET",
      );
      await expect(article.getByRole("navigation")).toHaveCount(0);
      await expect(article.locator(":scope > footer")).toHaveCount(0);
      expect(
        await article
          .locator(":scope > section[id]")
          .evaluateAll((sections) => sections.map((section) => section.id)),
      ).toEqual([
        "youtube",
        "github",
        "awards",
        "stackoverflow",
        "microsoft-mvp",
      ]);
      await expect(article.locator(".about__sources")).toHaveCount(0);
      await expect(article.locator(".location-map")).toHaveCount(1);
      await expect(
        article.locator(
          ".about__masthead, .about__motion-toggle, .about__person",
        ),
      ).toHaveCount(0);
      await expect(article.locator(".about__hero")).toContainText(
        "I am a professional Software Developer at Microsoft.",
      );
      await expect(
        article
          .locator(".about__hero")
          .getByRole("img", { name: "Muhammad Rehan Saeed", exact: true }),
      ).toHaveCount(1);
      await expect(
        page.getByRole("link", { name: "Portfolio", exact: true }),
      ).toHaveCount(1);
      await expect(article.getByRole("heading", { level: 1 })).toHaveCSS(
        "font-family",
        /Audiowide/,
      );
      expect(
        await article.evaluate((element) => {
          const pageStyle = getComputedStyle(element);
          const siteStyle = getComputedStyle(document.documentElement);
          return [
            ["--cp-bg", "--global-background-color"],
            ["--cp-accent", "--global-accent-color"],
            ["--cp-text", "--global-body-color"],
          ].every(
            ([local, global]) =>
              pageStyle.getPropertyValue(local!).trim() ===
              siteStyle.getPropertyValue(global!).trim(),
          );
        }),
      ).toBe(true);
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
        "href",
        "https://rehansaeed.com/about/",
      );
      await expect(article.locator("iframe")).toHaveCount(0);
      await expect(article.locator('img[src^="https:"]')).toHaveCount(7);
      await expect(
        article.locator(
          ".about__scrolly, .about__diagram, .about__project-story",
        ),
      ).toHaveCount(0);
      await expect(article).not.toContainText("From input to output");
      await expect(article).not.toContainText("Start with the useful bits.");
      await expect(article).not.toContainText("Make the failure legible.");
      await expect(article).not.toContainText("Give information a shape.");
      const galleries = page.getByRole("list", {
        name: /^\d{4} credentials and participation$/,
      });
      await expect(galleries).toHaveCount(7);
      await expect(galleries.getByRole("listitem")).toHaveCount(9);
      await expect(article.locator(".about__credential-year")).toHaveText([
        "2026",
        "2025",
        "2024",
        "2023",
        "2022",
        "2021",
        "2020",
      ]);
      for (const year of [
        "2026",
        "2025",
        "2024",
        "2023",
        "2022",
        "2021",
        "2020",
      ]) {
        const group = article.getByRole("region", { name: year, exact: true });
        await expect(
          group.getByRole("heading", { name: year, exact: true }),
        ).toHaveCount(1);
        await expect(group.getByRole("listitem")).toHaveCount(
          ["2026", "2025"].includes(year) ? 2 : 1,
        );
      }
      for (const text of await galleries
        .getByRole("listitem")
        .allTextContents()) {
        expect(text).not.toMatch(/\b20\d{2}\b/);
      }
      for (const credential of aboutCredentials) {
        const image = article.getByRole("img", {
          name: credential.label,
          exact: true,
        });
        await expect(image).toHaveAttribute("width", `${credential.width}`);
        await expect(image).toHaveAttribute("height", "300");
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (node: HTMLImageElement) =>
                node.complete &&
                node.naturalWidth > 0 &&
                node.currentSrc.includes("f_avif"),
            ),
          )
          .toBe(true);
        const bounds = await image.boundingBox();
        expect(bounds!.width).toBeCloseTo(150, 3);
        expect(bounds!.height).toBeCloseTo(150, 3);
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      const copy = article.locator(".about__feature-copy");
      const paragraph = copy.locator(".about__standfirst");
      const copyBounds = await copy.boundingBox();
      const paragraphBounds = await paragraph.boundingBox();
      expect(paragraphBounds!.width).toBeLessThanOrEqual(copyBounds!.width);
    });
  }
}

test("Original channel badges and profile artwork remain in their sections", async ({
  page,
}) => {
  await openAbout(page);
  for (const [label, statistic] of [
    ["Views", "viewCount"],
    ["Subscribers", "subscriberCount"],
  ] as const) {
    const image = page.locator("#youtube").getByRole("img", {
      name: `Youtube ${label.toLowerCase()}`,
      exact: true,
    });
    const source = new URL((await image.getAttribute("src"))!);
    expect(source.origin + source.pathname).toBe(
      "https://img.shields.io/badge/dynamic/json",
    );
    expect(source.searchParams.get("url")).toBe(
      `https://api.socialcounts.org/youtube-live-subscriber-count/${metadata.author.youtube.user}`,
    );
    expect(source.searchParams.get("query")).toBe(
      `$.counters.api.${statistic}`,
    );
    expect(source.searchParams.get("label")).toBe(label);
    await expect(
      page.locator("#youtube").getByRole("link", {
        name: `Youtube ${label.toLowerCase()}`,
        exact: true,
      }),
    ).toHaveAttribute("href", metadata.author.youtube.url);
  }
  for (const [name, statistic] of [
    ["GitHub stars", "stars"],
    ["GitHub follower count", "followers"],
    ["GitHub sponsors", "sponsors"],
  ]) {
    await expect(
      page.locator("#github").getByRole("img", { name, exact: true }),
    ).toHaveAttribute(
      "src",
      new RegExp(
        `^https://img\\.shields\\.io/github/${statistic}/${metadata.author.gitHub.user}\\?`,
      ),
    );
  }
  await expect(page.locator(".about__github-statistics-image")).toHaveAttribute(
    "width",
    "1280",
  );
  await expect(page.locator(".about__github-statistics-image")).toHaveAttribute(
    "height",
    "850",
  );
  await expect(
    page
      .locator("#stackoverflow")
      .getByRole("link", { name: "Stack Overflow profile statistics" }),
  ).toHaveAttribute("href", metadata.author.stackOverflow.url);
  await expect(
    page.locator("#microsoft-mvp").getByRole("link", {
      name: "Microsoft Most Valuable Professional (MVP)",
      exact: true,
    }),
  ).toHaveAttribute("href", /^https:\/\/mvp\.microsoft\.com\//);
});

test("Profile artwork follows the site theme and reduced motion preference", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await openAbout(page);
  const graphic = page.locator(".about__github-statistics-image");
  const flair = page.getByRole("img", {
    name: "Stack Overflow profile statistics",
  });
  await expect(graphic).toHaveAttribute("src", /profile-green-animate\.svg$/);
  await expect(flair).toHaveAttribute(
    "src",
    new RegExp(
      `/flair/${metadata.author.stackOverflow.user}\\.png\\?theme=dark$`,
    ),
  );
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect(graphic).toHaveAttribute("src", /profile-night-green\.svg$/);
  await expect(flair).toHaveAttribute("src", /\?theme=light$/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await graphic.scrollIntoViewIfNeeded();
  await expect
    .poll(() => graphic.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toMatch(/\/profile-green\.svg$/);
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect(flair).toHaveAttribute("src", /\?theme=dark$/);
  await expect
    .poll(() => graphic.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toMatch(/\/profile-green\.svg$/);
});

test("Sections animate into view as the reader scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openAbout(page);
  await expect(page.locator(".about")).toHaveClass(/about--motion/);
  for (const selector of [
    "#youtube .about__feature-copy",
    "#github .about__work-header",
    "#awards .about__recognition-header",
    "#stackoverflow",
    "#microsoft-mvp",
  ]) {
    const section = page.locator(selector);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute("data-revealed", "");
  }
});

test("The introduction link works with the keyboard", async ({ page }) => {
  await openAbout(page);
  const link = page.getByRole("link", {
    name: "Explore the work",
    exact: true,
  });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#youtube$/);
  await expect(
    page.getByRole("heading", { name: "YouTube", level: 2 }),
  ).toBeInViewport();
});

test("Reduced motion is respected on load and when the system preference changes", async ({
  page,
}) => {
  await openAbout(page);
  await expect(page.getByRole("button", { name: /Animations:/ })).toHaveCount(
    0,
  );
  await expect(page.locator(".about")).not.toHaveClass(/about--motion/);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".about")).toHaveClass(/about--motion/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".about")).not.toHaveClass(/about--motion/);
  await page.locator("#youtube .about__feature-copy").scrollIntoViewIfNeeded();
  await expect(page.locator("#youtube .about__feature-copy")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("About remains readable and navigable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
    viewport: { width: 375, height: 900 },
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/about/`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /Animations:/ })).toHaveCount(
      0,
    );
    await expect(page.locator(".about__project-controls")).toHaveCount(0);
    await page
      .getByRole("link", { name: "Explore the work", exact: true })
      .click();
    await expect(page).toHaveURL(/#youtube$/);
    await expect(
      page.getByRole("heading", {
        name: "YouTube",
        level: 2,
      }),
    ).toBeInViewport();
    await expect(page.locator(".about__sources")).toHaveCount(0);
    await expect(page.locator(".location-map__illustration")).toBeVisible();
    for (const section of await page.locator(".about > section[id]").all()) {
      await expect(section).toHaveCSS("opacity", "1");
    }
  } finally {
    await context.close();
  }
});
