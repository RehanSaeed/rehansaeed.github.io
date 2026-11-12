import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { tagPath } from "../../shared/utils/tag";
import { expect, test } from "./fixtures";

const captureReview = async (page: Page, name: string) => {
  const screenshotDir = process.env.TAG_STYLE_SCREENSHOT_DIR;
  if (!screenshotDir) {
    return;
  }
  await mkdir(screenshotDir, { recursive: true });
  await page.mouse.move(0, 0);
  await page.locator("h1").click();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      "#nuxt-devtools-container, nuxt-devtools-inspect-panel { display: none !important; }",
  });
  await page.screenshot({
    path: join(screenshotDir, `${name}.png`),
    fullPage: true,
  });
};

// Opt in against `npm run dev -- --port 8097` with TAG_STYLE_PREVIEW=1
// and BASE_URL=http://localhost:8097. The normal static suite checks isolation.
if (process.env.TAG_STYLE_PREVIEW === "1") {
  for (const theme of ["light", "dark"] as const) {
    for (const width of [1440, 390]) {
      const minimumRows = width === 390 ? 2 : 1;

      test(`ten contextual tag alternatives / ${theme} / ${width}`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width, height: 1000 });
        await page.goto("/__design/tags/");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          "Small tags. Different personalities.",
        );
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          "noindex, nofollow",
        );
        const options = page.locator(".tag-study__option");
        await expect(options).toHaveCount(10);
        await page.keyboard.press("Tab");

        for (const option of await options.all()) {
          await expect(option.getByRole("article")).toHaveCount(2);
          const tags = option.locator(".tags__link");
          await expect(tags).toHaveCount(10);
          for (const tag of await tags.all()) {
            await expect(tag).toHaveAttribute(
              "href",
              tagPath((await tag.textContent())!.trim()),
            );
            const box = await tag.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.width).toBeGreaterThanOrEqual(24);
            expect(box!.height).toBeGreaterThanOrEqual(24);
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          }
          const first = tags.first();
          await first.focus();
          await expect(first).toBeFocused();
          await expect(first).toHaveCSS("outline-style", "solid");
          await expect(first).toHaveCSS("outline-width", "3px");
          await first.hover();
          await expect(first).toHaveCSS("text-decoration-line", "underline");

          const rows = await option
            .locator(".tags")
            .first()
            .locator("a")
            .evaluateAll(
              (links) =>
                new Set(
                  links.map((link) =>
                    Math.round(link.getBoundingClientRect().top),
                  ),
                ).size,
            );
          expect(rows).toBeGreaterThanOrEqual(minimumRows);
        }

        const contrast = await page
          .locator(".tag-study__option .tags__link")
          .evaluateAll((links) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d")!;
            const rgba = (colour: string) => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = colour;
              context.fillRect(0, 0, 1, 1);
              return Array.from(context.getImageData(0, 0, 1, 1).data);
            };
            const luminance = (rgb: number[]) =>
              rgb.slice(0, 3).reduce((sum, channel, index) => {
                const value = channel / 255;
                return (
                  sum +
                  [0.2126, 0.7152, 0.0722][index]! *
                    (value <= 0.04045
                      ? value / 12.92
                      : ((value + 0.055) / 1.055) ** 2.4)
                );
              }, 0);
            return links.map((link) => {
              const layers: number[][] = [];
              for (
                let element: Element | null = link;
                element;
                element = element.parentElement
              ) {
                layers.unshift(rgba(getComputedStyle(element).backgroundColor));
              }
              const background = layers.reduce(
                (base, layer) => {
                  const alpha = layer[3]! / 255;
                  return base.map(
                    (value, index) =>
                      layer[index]! * alpha + value * (1 - alpha),
                  );
                },
                [255, 255, 255],
              );
              const foreground = luminance(rgba(getComputedStyle(link).color));
              const behind = luminance(background);
              return (
                (Math.max(foreground, behind) + 0.05) /
                (Math.min(foreground, behind) + 0.05)
              );
            });
          });
        expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);

        await captureReview(page, `tag-styles-${theme}-${width}`);
      });
    }
  }

  test("theme control, forced colours and 200% equivalent reflow", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/__design/tags/");
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.emulateMedia({ forcedColors: "active" });
    await page.setViewportSize({ width: 720, height: 450 });
    await page.keyboard.press("Tab");
    for (const option of await page.locator(".tag-study__option").all()) {
      const link = option.locator(".tags__link").first();
      await link.focus();
      await expect(link).toHaveCSS("outline-style", "solid");
      await expect(link).toHaveCSS("border-top-style", /solid|dashed/);
      const colours = await link.evaluate((element) => {
        const style = getComputedStyle(element);
        return { foreground: style.color, background: style.backgroundColor };
      });
      expect(colours.foreground).not.toBe(colours.background);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(720);
  });

  test("tag links still navigate to the existing tag page", async ({
    page,
  }) => {
    await page.goto("/__design/tags/");
    await page.locator("#quiet-pill .tags__link").first().click();
    await expect(page).toHaveURL(/\/tag\/c\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "# C#", exact: true }),
    ).toBeVisible();
  });
} else {
  test("design comparison is absent from the production site", async ({
    page,
  }) => {
    const response = await page.goto("/__design/tags/");
    expect(response?.status()).toBe(404);
    await expect(page.locator(".tag-study")).toHaveCount(0);
    await page.goto("/portfolio/");
    await expect(page.locator(".portfolio-card__tags").first()).toBeVisible();
    await expect(page.locator(".tag-study__option")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /tag style comparison/i }),
    ).toHaveCount(0);
  });
}
