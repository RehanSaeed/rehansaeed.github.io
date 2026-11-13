import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import sharp from "sharp";
import { tagStyleOptions } from "../../app/design/tag-style-options";
import { tagPath } from "../../shared/utils/tag";
import { expect, test } from "./fixtures";

const openComparison = async (page: Page) => {
  await page.goto("/__design/tags/", { waitUntil: "domcontentloaded" });
  // Initial router scrolling must finish before testing a pointer hover.
  await expect(
    page.getByRole("button", { name: "Toggle dark/light" }),
  ).toBeEnabled();
};

const allowReviewBadges = async (page: Page) => {
  if (process.env.TAG_STYLE_SCREENSHOT_DIR) {
    await page.route("https://img.shields.io/**", (route) => route.continue());
  }
};

const captureReview = async (page: Page, name: string) => {
  const screenshotDir = process.env.TAG_STYLE_SCREENSHOT_DIR;
  if (!screenshotDir) {
    return;
  }
  await mkdir(screenshotDir, { recursive: true });
  const portfolioImages = page.locator(".portfolio-card__image");
  await portfolioImages.evaluateAll((images) => {
    for (const image of images) {
      if (image instanceof HTMLImageElement) {
        image.loading = "eager";
      }
    }
  });
  await expect
    .poll(() =>
      portfolioImages.evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
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

const captureRaisedReview = async (page: Page, name: string) => {
  const screenshotDir = process.env.TAG_STYLE_SCREENSHOT_DIR;
  if (!screenshotDir) {
    return;
  }
  await mkdir(screenshotDir, { recursive: true });
  await page.addStyleTag({
    content:
      "#nuxt-devtools-container, nuxt-devtools-inspect-panel { display: none !important; }",
  });
  const panels = [];
  let height = 0;
  let width = 0;
  for (const option of await page.locator(".tag-study__option").all()) {
    const tag = option.locator(".tags__link").first();
    await tag.hover();
    await expect(tag).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    const input = await option.screenshot();
    const size = await sharp(input).metadata();
    panels.push({ input, top: height, left: 0 });
    height += size.height;
    width = Math.max(width, size.width);
  }
  await sharp({
    create: { width, height, channels: 4, background: "#00000000" },
  })
    .composite(panels)
    .png()
    .toFile(join(screenshotDir, `${name}.png`));
};

// Opt in against `npm run dev -- --port 8097` with TAG_STYLE_PREVIEW=1
// and BASE_URL=http://localhost:8097. The normal static suite checks isolation.
if (process.env.TAG_STYLE_PREVIEW === "1") {
  test("optional tag icons reuse style 10 without replacing icon-free designs", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await openComparison(page);
    const reference = page.locator("#tag-label .tags__link").first();
    const iconMask = await reference.evaluate(
      (element) => getComputedStyle(element, "::after").maskImage,
    );
    expect(iconMask).not.toBe("none");
    for (const id of ["code-token", "code-token-rounded", "keycap"]) {
      const section = page.locator(`#${id}`);
      const checkbox = section.getByRole("checkbox", {
        name: "Add the tag icon",
        exact: true,
      });
      const tag = section.locator(".tags__link").first();
      await expect(checkbox).not.toBeChecked();
      await expect(tag).toHaveCSS("text-decoration-line", "none");
      expect(
        await tag.evaluate(
          (element) => getComputedStyle(element, "::after").content,
        ),
      ).toBe("none");
      await checkbox.check();
      await expect(tag).toHaveAccessibleName("C#");
      for (const control of [
        tag,
        section.getByRole("button", { name: "Example button", exact: true }),
      ]) {
        await expect
          .poll(() =>
            control.evaluate(
              (element) => getComputedStyle(element, "::after").maskImage,
            ),
          )
          .toBe(iconMask);
      }
      await expect(
        section.getByRole("link", { name: /View the full portfolio/ }),
      ).toHaveAttribute("href", new RegExp(`style=${id}&icons=tag$`));
      await checkbox.uncheck();
      await expect(tag).not.toHaveClass(/button--tag-icon/);
    }
    expect(
      await reference.evaluate(
        (element) => getComputedStyle(element, "::after").maskImage,
      ),
    ).toBe(iconMask);
  });

  test("portfolio icon toggle preserves both states, styles and navigation on dark mobile", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto("/__design/tags/portfolio/?style=code-token", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("button", { name: "Toggle dark/light" }),
    ).toBeEnabled();
    const toggle = page.getByRole("checkbox", {
      name: "Add the tag icon to styles 6 and 8 (including 6b)",
      exact: true,
    });
    const selector = page.getByLabel("Preview tag style");
    const tags = page.locator(".portfolio-card .tags__link");
    await expect(toggle).not.toBeChecked();
    await expect(page.locator(".button--tag-icon")).toHaveCount(0);
    const originalNames = await tags.allTextContents();
    for (const variant of ["code-token", "keycap", "code-token-rounded"]) {
      await selector.selectOption(variant);
      await toggle.check();
      await expect(page).toHaveURL(new RegExp(`style=${variant}&icons=tag$`));
      await expect(page.locator(".button--tag-icon")).toHaveCount(
        originalNames.length,
      );
      await expect(tags).toHaveText(originalNames);
      await expect(tags.first()).toHaveAttribute("href", "/tag/windows/");
      await tags.first().focus();
      await expect(tags.first()).toHaveCSS("outline-width", "3px");
      await toggle.uncheck();
      await expect(page.locator(".button--tag-icon")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390);
    }
    await selector.selectOption("tag-label");
    await expect(toggle).toBeDisabled();
    expect(
      await tags
        .first()
        .evaluate((element) => getComputedStyle(element, "::after").maskImage),
    ).not.toBe("none");
  });

  test("selected alternatives are reusable native button and link variants", async ({
    page,
  }) => {
    await openComparison(page);
    await expect(page.locator(".tag-study__number")).toHaveText([
      "01",
      "02",
      "04",
      "06",
      "06b",
      "08",
      "10",
    ]);
    for (const option of tagStyleOptions) {
      const section = page.locator(`#${option.id}`);
      const button = section.getByRole("button", {
        name: "Example button",
        exact: true,
      });
      await expect(button).toHaveClass(
        `button button--${option.id} button--tag`,
      );
      await button.click();
      await expect(section.locator("output")).toHaveText("Clicks: 1");
      await expect(
        section.getByRole("button", { name: "Disabled button", exact: true }),
      ).toBeDisabled();
      const link = section.locator(".tags__link").first();
      await expect(link).toHaveClass(
        `button button--${option.id} button--tag tags__link`,
      );
      await expect(link).toHaveAttribute("href", "/tag/c/");
      await expect(link).not.toHaveAttribute("type", "button");
    }
  });

  test("requested colours and both code-token corner treatments", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await openComparison(page);
    for (const id of ["quiet-pill", "hairline-capsule"]) {
      const link = page.locator(`#${id} .tags__link`).first();
      await expect(link).toHaveCSS("color", "rgb(0, 0, 0)");
      await link.hover();
      await expect(link).toHaveCSS("color", "rgb(0, 0, 0)");
      await link.focus();
      await expect(link).toHaveCSS("color", "rgb(0, 0, 0)");
    }
    const token = page.locator("#code-token .tags__link").first();
    await expect(token).toHaveCSS("border-top-left-radius", "0px");
    await expect(token).toHaveCSS("border-top-right-radius", "0px");
    await expect(token).toHaveCSS("border-bottom-left-radius", "0px");
    const rounded = page.locator("#code-token-rounded .tags__link").first();
    const radius = await token.evaluate(
      (element) => getComputedStyle(element).borderBottomRightRadius,
    );
    expect(Number.parseFloat(radius)).toBeGreaterThan(0);
    for (const corner of [
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-left-radius",
      "border-bottom-right-radius",
    ]) {
      await expect(rounded).toHaveCSS(corner, radius);
    }
    const muted = await page
      .locator("#solid-lozenge .tags__link")
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d")!;
        const rgb = (colour: string) => {
          context.fillStyle = colour;
          context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
        };
        const fill = rgb(style.backgroundColor);
        const accent = rgb(style.getPropertyValue("--global-accent-color"));
        return {
          fill,
          accent,
          saturation: Math.max(...fill) - Math.min(...fill),
          accentSaturation: Math.max(...accent) - Math.min(...accent),
        };
      });
    expect(muted.fill).not.toEqual(muted.accent);
    expect(muted.saturation).toBeLessThan(muted.accentSaturation / 2);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`raised tag interactions match the original button / ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: "no-preference",
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await openComparison(page);
      await page.locator(".tag-study__baseline summary").click();
      const original = page.locator(".tag-study__baseline .button--secondary");
      await original.hover();
      await expect(original).toHaveCSS(
        "transform",
        "matrix(1, 0, 0, 1, 0, -2)",
      );
      await expect
        .poll(() =>
          original.evaluate(
            (element) => getComputedStyle(element, "::before").opacity,
          ),
        )
        .toBe("1");
      const raised = await original.evaluate((element) => ({
        shadow: getComputedStyle(element, "::before").boxShadow,
        transition: getComputedStyle(element).transition,
        shadowTransition: getComputedStyle(element, "::before").transition,
      }));
      await page.mouse.down();
      await expect(original).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
      const pressedShadow = await original.evaluate(
        (element) => getComputedStyle(element, "::before").boxShadow,
      );
      await page.mouse.move(0, 0);
      await page.mouse.up();

      const tags = page.locator(".tag-study__option .tags > a:first-child");
      await expect(tags).toHaveCount(tagStyleOptions.length * 2);
      for (const tag of await tags.all()) {
        await tag.hover();
        await expect(tag).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
        await expect(tag).toHaveCSS("transition", raised.transition);
        await expect
          .poll(() =>
            tag.evaluate((element) => ({
              shadow: getComputedStyle(element, "::before").boxShadow,
              opacity: getComputedStyle(element, "::before").opacity,
              transition: getComputedStyle(element, "::before").transition,
            })),
          )
          .toEqual({
            shadow: raised.shadow,
            opacity: "1",
            transition: raised.shadowTransition,
          });
        await page.mouse.down();
        await expect(tag).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
        expect(
          await tag.evaluate(
            (element) => getComputedStyle(element, "::before").boxShadow,
          ),
        ).toBe(pressedShadow);
        await page.mouse.move(0, 0);
        await page.mouse.up();
        await page.keyboard.press("Tab");
        await tag.focus();
        await expect(tag).toHaveCSS("outline-width", "3px");
        await expect(tag).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
      }
    });

    if (process.env.TAG_STYLE_SCREENSHOT_DIR) {
      test(`raised tag review capture / ${theme}`, async ({ page }) => {
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: "no-preference",
        });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await openComparison(page);
        await expect(page.locator(".tag-study__option")).toHaveCount(7);
        await captureRaisedReview(page, `tag-styles-raised-${theme}`);
      });
    }
  }

  test("reduced motion keeps raised shadows without movement", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openComparison(page);
    const tags = page.locator(".tag-study__option .tags > a:first-child");
    await expect(tags).toHaveCount(tagStyleOptions.length * 2);
    for (const tag of await tags.all()) {
      await tag.hover();
      await expect(tag).toHaveCSS("transform", "none");
      await expect(tag).toHaveCSS("transition-duration", "0s");
      await expect
        .poll(() =>
          tag.evaluate(
            (element) => getComputedStyle(element, "::before").opacity,
          ),
        )
        .toBe("1");
      const shadow = await tag.evaluate((element) => ({
        shadow: getComputedStyle(element, "::before").boxShadow,
        opacity: getComputedStyle(element, "::before").opacity,
        duration: getComputedStyle(element, "::before").transitionDuration,
      }));
      expect(shadow.shadow).not.toBe("none");
      expect(shadow.opacity).toBe("1");
      expect(shadow.duration).toBe("0s");
    }
  });

  for (const theme of ["light", "dark"] as const) {
    for (const width of [1440, 390]) {
      const minimumRows = width === 390 ? 2 : 1;

      test(`selected contextual button variants / ${theme} / ${width}`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width, height: 1000 });
        await openComparison(page);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          "Small tags. Different personalities.",
        );
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          "noindex, nofollow",
        );
        const options = page.locator(".tag-study__option");
        await expect(options).toHaveCount(7);
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
          await expect(first).toHaveCSS("text-decoration-line", "none");

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
    await openComparison(page);
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
    await openComparison(page);
    await page.locator("#quiet-pill .tags__link").first().click();
    await expect(page).toHaveURL(/\/tag\/c\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "# C#", exact: true }),
    ).toBeVisible();
  });

  for (const theme of ["light", "dark"] as const) {
    for (const width of [1440, 390]) {
      for (const option of tagStyleOptions) {
        test(`full portfolio / ${option.id} / ${theme} / ${width}`, async ({
          page,
        }) => {
          await page.emulateMedia({
            colorScheme: theme,
            reducedMotion: "no-preference",
          });
          await page.setViewportSize({ width, height: 1000 });
          await allowReviewBadges(page);
          await page.goto(`/__design/tags/portfolio/?style=${option.id}`, {
            waitUntil: "domcontentloaded",
          });
          await expect(
            page.getByRole("button", { name: "Toggle dark/light" }),
          ).toBeEnabled();
          await expect(page.getByLabel("Preview tag style")).toHaveValue(
            option.id,
          );
          await expect(page.locator("meta[name=robots]")).toHaveAttribute(
            "content",
            "noindex, nofollow",
          );
          await expect(
            page.locator(".navigation").getByRole("link", { name: "Home" }),
          ).toBeVisible();
          await expect(
            page.getByRole("heading", {
              level: 1,
              name: "Portfolio",
              exact: true,
            }),
          ).toBeVisible();
          const cards = page.locator(".portfolio-card");
          expect(await cards.count()).toBeGreaterThan(10);
          await expect(
            page.getByRole("heading", { name: "Contributions at Microsoft" }),
          ).toBeVisible();
          await expect(page.locator(".portfolio-statistics")).toHaveCount(1);
          const tags = page.locator(".portfolio-card .tags__link");
          const decorations = await tags.evaluateAll((links) =>
            links.map((link) => getComputedStyle(link).textDecorationLine),
          );
          expect(decorations.length).toBeGreaterThan(20);
          expect(decorations.every((line) => line === "none")).toBe(true);
          const tag = tags.first();
          await tag.hover();
          await expect(tag).toHaveCSS("text-decoration-line", "none");
          await expect(tag).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
          await page.keyboard.press("Tab");
          await tag.focus();
          await expect(tag).toHaveCSS("outline-width", "3px");
          await expect(tag).toHaveCSS("text-decoration-line", "none");
          await expect(tag).toHaveAttribute(
            "href",
            tagPath((await tag.textContent())!.trim()),
          );
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
          await captureReview(
            page,
            `tag-portfolio-${option.id}-${theme}-${width}`,
          );
        });
      }
    }
  }

  test("portfolio selector switches all tags without changing production", async ({
    page,
  }) => {
    await openComparison(page);
    await page
      .getByRole("link", {
        name: "View the full portfolio with Quiet pill",
        exact: true,
      })
      .click();
    await expect(
      page.locator(".portfolio__open-source .portfolio-card__title").first(),
    ).toBeVisible();
    const titles = await page
      .locator(".portfolio-card__title")
      .allTextContents();
    for (const option of tagStyleOptions) {
      await page.getByLabel("Preview tag style").selectOption(option.id);
      await expect(
        page.locator(".portfolio-card .tags__link").first(),
      ).toHaveClass(`button button--${option.id} button--tag tags__link`);
      await expect(page).toHaveURL(new RegExp(`style=${option.id}$`));
    }
    await page.goto("/portfolio/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".button--tag")).toHaveCount(0);
    await expect(page.locator(".portfolio-card__title")).toHaveText(titles);
    await expect(page.locator(".tags__link").first()).toHaveCSS(
      "font-family",
      /Audiowide/,
    );
  });
} else {
  test("design comparison is absent from the production site", async ({
    page,
  }) => {
    const response = await page.goto("/__design/tags/");
    expect(response?.status()).toBe(404);
    await expect(page.locator(".tag-study")).toHaveCount(0);
    const portfolioPreview = await page.goto("/__design/tags/portfolio/");
    expect(portfolioPreview?.status()).toBe(404);
    await page.goto("/portfolio/");
    await expect(page.locator(".portfolio-card__tags").first()).toBeVisible();
    await expect(page.locator(".tag-study__option")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /tag style comparison/i }),
    ).toHaveCount(0);
  });
}
