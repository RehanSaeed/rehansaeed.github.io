import { expect, test } from "./fixtures";

for (const width of [390, 1440]) {
  for (const path of ["/", "/2/"]) {
    test(`Post pagination has breathing room above and below on ${path} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path);
      const pager = page.locator(".posts__pager");
      await pager.scrollIntoViewIfNeeded();
      const gaps = await page.evaluate(() => {
        const posts = document.querySelector(".posts__items")!;
        const pagination = document.querySelector(".posts__pager")!;
        const footer = document.querySelector(".footer")!;
        const paginationBounds = pagination.getBoundingClientRect();
        const footerBounds = footer.getBoundingClientRect();
        const footerStyle = getComputedStyle(footer);
        const infoBounds = pagination
          .querySelector(".pager__info")!
          .getBoundingClientRect();
        return {
          above: paginationBounds.top - posts.getBoundingClientRect().bottom,
          below: footerBounds.top - paginationBounds.bottom,
          footerMargin: Number.parseFloat(footerStyle.marginBlockStart),
          betweenCards: Number.parseFloat(getComputedStyle(posts).rowGap),
          infoCenterOffset:
            (infoBounds.left +
              infoBounds.right -
              paginationBounds.left -
              paginationBounds.right) /
            2,
        };
      });
      expect(gaps.above).toBeGreaterThanOrEqual(11.9);
      expect(gaps.above).toBeCloseTo(gaps.betweenCards, 1);
      expect(gaps.below).toBeCloseTo(gaps.above, 1);
      expect(gaps.below).toBeCloseTo(gaps.footerMargin, 1);
      expect(gaps.infoCenterOffset).toBeCloseTo(0, 1);
      const nextLink = pager.getByRole("link", {
        name: "Next page",
        exact: true,
      });
      await expect(nextLink).toHaveAttribute(
        "href",
        path === "/" ? "/2/" : "/3/",
      );
      await expect(pager.locator("a svg[aria-hidden='true']")).toHaveCount(
        path === "/" ? 1 : 2,
      );
      const previousLink = pager.getByRole("link", {
        name: "Previous page",
        exact: true,
      });
      await expect(previousLink).toHaveCount(path === "/" ? 0 : 1);
    });
  }
}

for (const width of [320, 390, 1440]) {
  test(`Pagination icon links are centred and accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/2/");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const iconAlignment = await page
      .locator(".posts__pager")
      .evaluate((element) => {
        const previous = element.querySelector(".pager__previous-button")!;
        const next = element.querySelector(".pager__next-button")!;
        const info = element.querySelector(".pager__info")!;
        const bounds = (selector: string) => {
          return element.querySelector(selector)!.getBoundingClientRect();
        };
        const previousButton = previous.getBoundingClientRect();
        const nextButton = next.getBoundingClientRect();
        const infoBounds = info.getBoundingClientRect();
        const previousIcon = bounds(".pager__previous-button .pager__icon");
        const nextIcon = bounds(".pager__next-button .pager__icon");
        return {
          previousWidth: previousButton.width,
          previousHeight: previousButton.height,
          nextWidth: nextButton.width,
          nextHeight: nextButton.height,
          previousVerticalDifference:
            (previousIcon.top + previousIcon.bottom) / 2 -
            (previousButton.top + previousButton.bottom) / 2,
          nextVerticalDifference:
            (nextIcon.top + nextIcon.bottom) / 2 -
            (nextButton.top + nextButton.bottom) / 2,
          previousHorizontalDifference:
            (previousIcon.left + previousIcon.right) / 2 -
            (previousButton.left + previousButton.right) / 2,
          nextHorizontalDifference:
            (nextIcon.left + nextIcon.right) / 2 -
            (nextButton.left + nextButton.right) / 2,
          previousOverflow: previous.scrollWidth - previous.clientWidth,
          nextOverflow: next.scrollWidth - next.clientWidth,
          iconVariant: [previous, next].every((link) =>
            link.classList.contains("link-button--icon"),
          ),
          infoOverlapsButton: [previousButton, nextButton].some(
            (button) =>
              button.left < infoBounds.right &&
              button.right > infoBounds.left &&
              button.top < infoBounds.bottom &&
              button.bottom > infoBounds.top,
          ),
          previousLeft: previousButton.left,
          nextRight: nextButton.right,
          viewportWidth: document.documentElement.clientWidth,
        };
      });
    expect(iconAlignment.previousWidth).toBeGreaterThanOrEqual(44);
    expect(iconAlignment.nextWidth).toBeGreaterThanOrEqual(44);
    expect(iconAlignment.previousWidth).toBeCloseTo(
      iconAlignment.previousHeight,
      1,
    );
    expect(iconAlignment.nextWidth).toBeCloseTo(iconAlignment.nextHeight, 1);
    expect(iconAlignment.previousVerticalDifference).toBeCloseTo(0, 1);
    expect(iconAlignment.nextVerticalDifference).toBeCloseTo(0, 1);
    expect(iconAlignment.previousHorizontalDifference).toBeCloseTo(0, 1);
    expect(iconAlignment.nextHorizontalDifference).toBeCloseTo(0, 1);
    expect(iconAlignment.previousOverflow).toBeLessThanOrEqual(1);
    expect(iconAlignment.nextOverflow).toBeLessThanOrEqual(1);
    expect(iconAlignment.iconVariant).toBe(true);
    expect(iconAlignment.infoOverlapsButton).toBe(false);
    expect(iconAlignment.previousLeft).toBeGreaterThanOrEqual(0);
    expect(iconAlignment.nextRight).toBeLessThanOrEqual(
      iconAlignment.viewportWidth,
    );
    const previousLink = page.getByRole("link", {
      name: "Previous page",
      exact: true,
    });
    const nextLink = page.getByRole("link", { name: "Next page", exact: true });
    await expect(previousLink).toHaveAttribute("href", "/");
    await expect(nextLink).toHaveAttribute("href", "/3/");
    await previousLink.focus();
    await expect(previousLink).toBeFocused();
    await expect(previousLink).toHaveCSS("outline-style", "solid");
    await previousLink.press("Tab");
    await expect(nextLink).toBeFocused();
  });
}

for (const { width, height } of [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 768, height: 1000 },
  { width: 1440, height: 1000 },
]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Post discovery fits the first viewport at ${width}px in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const author = page.getByRole("main").locator(".author");
      await expect(author.getByRole("heading", { level: 1 })).toHaveCount(1);
      const portrait = author.getByRole("img");
      await expect(portrait).toBeInViewport({ ratio: 0.99 });
      await expect(author.locator(".author__description")).toBeVisible();
      const authorSizes = await page.evaluate(() => {
        const home = document.querySelector(".posts__author--home")!;
        const footer = document.querySelector(".footer .author")!;
        const sizes = (element: Element) => ({
          portrait: element
            .querySelector(".author__portrait")!
            .getBoundingClientRect().width,
          heading: getComputedStyle(
            element.querySelector(".author__site-title")!,
          ).fontSize,
          description: getComputedStyle(
            element.querySelector(".author__description")!,
          ).fontSize,
        });
        return { home: sizes(home), footer: sizes(footer) };
      });
      expect(authorSizes.home).toEqual(authorSizes.footer);
      const obstructingNavigation = await page.evaluate(() => {
        const portrait = document
          .querySelector(".posts__author--home .author__portrait")!
          .getBoundingClientRect();
        return [
          ...document.querySelectorAll(".navigation a, .navigation button"),
        ]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              portrait.left < rect.right &&
              portrait.right > rect.left &&
              portrait.top < rect.bottom &&
              portrait.bottom > rect.top
            );
          })
          .map(
            (element) =>
              element.getAttribute("aria-label") ?? element.textContent,
          );
      });
      expect(obstructingNavigation).toEqual([]);
      const authorRowGaps = await author.evaluate((element) => {
        const rows = [...element.children];
        return rows.slice(0, -1).map((row, index) => {
          const nextRow = rows[index + 1]!;
          return (
            nextRow.getBoundingClientRect().top -
            row.getBoundingClientRect().bottom
          );
        });
      });
      const [portraitToName, nameToTagline, taglineToSocial] = authorRowGaps;
      expect(portraitToName).toBeGreaterThanOrEqual(5.9);
      expect(nameToTagline).toBeGreaterThanOrEqual(5.9);
      expect(taglineToSocial).toBeGreaterThanOrEqual(11.9);
      const authorHeadingMetrics = await author
        .locator(".author__site-title")
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            fontSize: Number.parseFloat(style.fontSize),
            lineHeight: Number.parseFloat(style.lineHeight),
          };
        });
      expect(authorHeadingMetrics.lineHeight).toBeLessThanOrEqual(
        authorHeadingMetrics.fontSize * 1.25,
      );
      const descriptionMetrics = await author
        .locator(".author__description")
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            fontSize: Number.parseFloat(style.fontSize),
            lineHeight: Number.parseFloat(style.lineHeight),
          };
        });
      expect(descriptionMetrics.lineHeight).toBeGreaterThanOrEqual(
        descriptionMetrics.fontSize * 1.39,
      );
      const links = author.locator(".social").getByRole("link");
      await expect(links).toHaveCount(8);
      const bounds = await links.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            width: document.documentElement.clientWidth,
          };
        }),
      );
      for (const rect of bounds) {
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(rect.width);
      }
      const arrowBottom = await page
        .locator(".posts__arrows")
        .evaluate((element) => element.getBoundingClientRect().bottom);
      const firstPostTop = await page
        .locator(".posts__items > .post-card")
        .first()
        .evaluate((element) => element.getBoundingClientRect().top);
      expect(firstPostTop - arrowBottom).toBeGreaterThanOrEqual(23.9);
      const title = page.locator(".post-card__title").first();
      const titleBounds = await title.boundingBox();
      expect(titleBounds).not.toBeNull();
      expect(titleBounds!.y + titleBounds!.height).toBeLessThan(height);
      await title.getByRole("link").focus();
      await expect(title.getByRole("link")).toBeFocused();
      const destination = await title.getByRole("link").getAttribute("href");
      await title.getByRole("link").press("Enter");
      await expect(page).toHaveURL(destination!);
    });
  }
}

test("Paginated post indexes retain the original author sizes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/2/");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const authorSizes = await page.evaluate(() => {
    const sizes = (element: Element) => ({
      portrait: element
        .querySelector(".author__portrait")!
        .getBoundingClientRect().width,
      heading: getComputedStyle(element.querySelector(".author__site-title")!)
        .fontSize,
      description: getComputedStyle(
        element.querySelector(".author__description")!,
      ).fontSize,
    });
    return {
      index: sizes(document.querySelector("main .author")!),
      footer: sizes(document.querySelector(".footer .author")!),
    };
  });
  expect(authorSizes.index).toEqual(authorSizes.footer);
});

test("The desktop author portrait is larger than the navigation avatar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const navigationAvatar = page
    .getByRole("link", { name: "Home", exact: true })
    .locator(".navigation__image");
  const portrait = page.getByRole("main").locator(".author").getByRole("img");
  const navigationBounds = await navigationAvatar.boundingBox();
  const portraitBounds = await portrait.boundingBox();
  expect(navigationBounds).not.toBeNull();
  expect(portraitBounds).not.toBeNull();
  expect(portraitBounds!.width).toBeGreaterThan(navigationBounds!.width * 2);
});

for (const interaction of ["hover", "focus"] as const) {
  test(`Article data prefetch waits for title ${interaction}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const requestedPaths: string[] = [];
    page.on("request", (request) => {
      requestedPaths.push(new URL(request.url()).pathname);
    });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeEnabled();
    const link = page.locator(".post-card__title").first().getByRole("link");
    await expect(link).toBeInViewport();
    const destination = await link.getAttribute("href");
    const payloadPath = `${destination}_payload.json`;
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestIdleCallback(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        }),
    );
    expect(requestedPaths).not.toContain(payloadPath);
    const prefetch = page.waitForRequest(
      (request) => new URL(request.url()).pathname === payloadPath,
    );
    await link[interaction]();
    await prefetch;
    await expect(page).toHaveURL("/");
    await link.click();
    await expect(page).toHaveURL(destination!);
  });
}

for (const path of [
  "/",
  "/about/",
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
]) {
  test(`Footer author does not introduce another primary heading on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(
      page.getByRole("contentinfo").getByRole("heading", { level: 1 }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("contentinfo")
        .getByRole("heading", { name: "Muhammad Rehan Saeed", level: 2 }),
    ).toBeAttached();
  });
}
