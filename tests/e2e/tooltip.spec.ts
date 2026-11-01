import { expect, test } from "./fixtures";

for (const colorScheme of ["light", "dark"] as const) {
  test(`Tooltips use the page background and accent border in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    const search = page.getByRole("button", {
      name: "Open search",
      exact: true,
    });
    await expect(search).toBeEnabled();
    await search.hover();
    const tooltip = page.getByRole("tooltip", { name: "Search", exact: true });
    await expect(tooltip).toBeVisible();
    await expect(search).toHaveAccessibleDescription("Search");
    await expect(search).not.toHaveAttribute("title");
    const colours = await tooltip.evaluate((element) => {
      const style = getComputedStyle(element);
      const probe = document.createElement("span");
      probe.style.color = "var(--global-accent-color)";
      document.body.append(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      const arrow = getComputedStyle(element.querySelector(".tooltip__arrow")!);
      return {
        background: style.backgroundColor,
        pageBackground: getComputedStyle(document.body).backgroundColor,
        border: style.borderTopColor,
        accent,
        arrowBackground: arrow.backgroundColor,
        arrowBorder: arrow.borderBottomColor,
        arrowTransform: arrow.transform,
        topLayer: element.matches(":popover-open"),
      };
    });
    expect(colours.topLayer).toBe(true);
    expect(colours.arrowTransform).not.toBe("none");
    expect(colours.background).toBe(colours.pageBackground);
    expect(colours.border).toBe(colours.accent);
    expect(colours.arrowBackground).toBe(colours.background);
    expect(colours.arrowBorder).toBe(colours.border);
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    // Hovering the tooltip must keep it open beyond the delayed close deadline.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await page.mouse.move(0, 0);
    await search.evaluate((element) => {
      element.focus();
      element.dispatchEvent(
        new PointerEvent("pointerleave", { pointerType: "mouse" }),
      );
    });
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(search).toBeFocused();
    await expect(search).not.toHaveAttribute("aria-describedby");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("tooltip")).toHaveText(
      colorScheme === "dark" ? "Enable light theme" : "Enable dark theme",
    );
    await page.keyboard.press("Enter");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme === "dark" ? "light" : "dark",
    );
  });
}

test("Tooltips flip, clamp, track resizing and stay above dialogs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const search = page.getByRole("button", { name: "Open search", exact: true });
  await expect(search).toBeEnabled();
  await search.evaluate((element) => {
    element.style.position = "fixed";
    element.style.left = "4px";
    element.style.top = "4px";
  });
  await search.focus();
  const tooltip = page.getByRole("tooltip", { name: "Search", exact: true });
  await expect(tooltip).toHaveAttribute("data-placement", "right");
  for (const width of [375, 280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect
      .poll(async () => {
        const bounds = await tooltip.boundingBox();
        return (
          !!bounds &&
          bounds.x >= 8 &&
          bounds.y >= 8 &&
          bounds.x + bounds.width <= width - 8
        );
      })
      .toBe(true);
  }
  await search.click();
  await expect(tooltip).toBeHidden();
  const dialog = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close Search" }).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  const modalTooltip = page.getByRole("tooltip", { name: "Close Search" });
  await expect(modalTooltip).toBeVisible();
  expect(
    await modalTooltip.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return element.contains(
        document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        ),
      );
    }),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(modalTooltip).toBeHidden();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Pointer focus does not pin hover tooltips, while keyboard focus does", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("button", { name: "Open search", exact: true });
  const theme = page.getByRole("button", {
    name: "Toggle dark/light",
    exact: true,
  });
  await expect(search).toBeEnabled();
  await theme.click();
  await expect(theme).toBeFocused();
  await page.mouse.move(0, 0);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await theme.hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(theme).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(search).toBeFocused();
  const tooltip = page.getByRole("tooltip", { name: "Search", exact: true });
  await expect(tooltip).toBeVisible();
  await search.hover();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
  await expect(search).toBeFocused();

  await theme.hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect(theme).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("Tooltip triggers retain native layout and touch activation", async ({
  page,
}) => {
  await page.goto("/portfolio/");
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled();
  const badge = page.locator(".portfolio-card__nuget").first();
  await badge.focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("total NuGet downloads at last build");
  await expect(tooltip).toHaveAttribute("data-placement", "top");
  expect(
    await badge.evaluate((element) =>
      element.parentElement?.classList.contains("portfolio-card__nuget-badges"),
    ),
  ).toBe(true);
  await badge.evaluate((element) => {
    const card = element.closest<HTMLElement>(".card")!;
    card.style.transition = "none";
    card.style.willChange = "auto";
    card.style.translate = "none";
    element.style.position = "fixed";
    element.style.top = "4px";
    element.style.left = "4px";
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("resize"));
  });
  await expect(tooltip).toHaveAttribute("data-placement", "bottom");
  await page.setViewportSize({ width: 280, height: 812 });
  await expect
    .poll(async () => {
      const bounds = await tooltip.boundingBox();
      return !!bounds && bounds.x >= 8 && bounds.x + bounds.width <= 272;
    })
    .toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const search = page.getByRole("button", { name: "Open search", exact: true });
  await expect(search).toBeEnabled();
  await search.dispatchEvent("pointerenter", { pointerType: "touch" });
  // A touch pointer must not open a tooltip after the hover delay has elapsed.
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(400);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await search.click();
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("Tooltips try a perpendicular side and dismiss when their trigger is clipped", async ({
  page,
}) => {
  await page.setViewportSize({ width: 140, height: 812 });
  await page.goto("/");
  const search = page.getByRole("button", { name: "Open search", exact: true });
  await expect(search).toBeEnabled();
  await search.evaluate((element) => {
    element.style.position = "fixed";
    element.style.left = "50px";
    element.style.top = "300px";
  });
  await search.focus();
  const tooltip = page.getByRole("tooltip", { name: "Search", exact: true });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveAttribute("data-placement", "top");
  const target = await search.boundingBox();
  const bounds = await tooltip.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThan(target!.y);
  expect(bounds!.x).toBeGreaterThanOrEqual(8);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(132);
  await search.evaluate((element) => {
    element.style.transform = "translateY(50px)";
  });
  await expect
    .poll(async () => {
      const currentTarget = await search.boundingBox();
      const currentTooltip = await tooltip.boundingBox();
      return Math.abs(
        currentTarget!.y - currentTooltip!.y - currentTooltip!.height - 12,
      );
    })
    .toBeLessThanOrEqual(1);
  await search.evaluate((element) => {
    element.style.top = "-100px";
  });
  await expect(tooltip).toBeHidden();
  await expect(search).not.toHaveAttribute("aria-describedby");
});

test("About image links describe their destinations without changing their layout", async ({
  page,
}) => {
  await page.goto("/about/");
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  const groups = [
    {
      selector: ".about__youtube-images a",
      text: "View my YouTube channel",
      count: 2,
    },
    {
      selector: ".about__github-images a:nth-child(1)",
      text: "View my GitHub profile",
      count: 1,
    },
    {
      selector: ".about__github-images a:nth-child(2)",
      text: "View my GitHub followers",
      count: 1,
    },
    {
      selector: ".about__github-images a:nth-child(3)",
      text: "Sponsor me on GitHub",
      count: 1,
    },
    {
      selector: ".about__github-statistics a",
      text: "View my GitHub profile",
      count: 1,
    },
    {
      selector: ".about_awards-images a[href*='credly']",
      text: "View my credentials on Credly",
      count: 10,
    },
    {
      selector: ".about_awards-images a[href='/open-uk-honouree/']",
      text: "Read about my Open UK honour",
      count: 1,
    },
    {
      selector: "a:has(.about__stack-overflow-image)",
      text: "View my Stack Overflow profile",
      count: 1,
    },
    {
      selector: ".about__mvp-images a",
      text: "View the Microsoft MVP programme",
      count: 1,
    },
  ];
  for (const { selector, text, count } of groups) {
    const links = page.locator(selector);
    await expect(links).toHaveCount(count);
    for (const link of await links.all()) {
      await link.scrollIntoViewIfNeeded();
      await link.focus();
      await expect(link).toHaveAccessibleDescription(text);
      await expect(
        page.getByRole("tooltip", { name: text, exact: true }),
      ).toBeVisible();
      await expect(link).not.toHaveAttribute("title");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    }
  }
});

test("GitHub badges describe stargazer and fork lists rather than actions", async ({
  page,
}) => {
  await page.goto("/portfolio/");
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  const card = page
    .locator(".portfolio-card:has(.portfolio-card__github)")
    .first();
  const project = await card.locator(".portfolio-card__title").innerText();
  for (const [selector, destination] of [
    [".portfolio-card__stars", "stargazers"],
    [".portfolio-card__forks", "forks"],
  ]) {
    const link = card.locator(`a:has(${selector})`);
    await link.focus();
    await expect(link).toHaveAttribute("href", new RegExp(`/${destination}$`));
    await expect(link).toHaveAccessibleDescription(
      `View ${project} ${destination} on GitHub`,
    );
    await expect(page.getByRole("tooltip")).toHaveText(
      `View ${project} ${destination} on GitHub`,
    );
    await page.keyboard.press("Escape");
  }
});

test("Article section links prerender as accessible links and navigate without copying", async ({
  page,
  request,
}) => {
  const path = "/on-the-etiquette-of-pull-request-comments/";
  const response = await request.get(path);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toMatch(
    /<a[^>]+class="anchor-link"[^>]+href="#being-short"[^>]+aria-label="Link to this section"/,
  );
  await page.goto(path);
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  const link = page.locator("a.anchor-link[href='#being-short']");
  await expect(link).toHaveAccessibleName("Link to this section");
  await expect(link).not.toHaveAttribute("aria-hidden");
  await expect(link.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await link.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(link).toHaveCSS("opacity", "0");
  await expect(link).toHaveCSS("width", "22px");
  await expect(link).toHaveCSS("height", "22px");
  await expect(link.locator("svg")).toHaveCSS("display", "inline");
  await page.locator("#being-short").hover();
  await expect(link).toHaveCSS("opacity", "1");
  await page.mouse.move(0, 0);
  await expect(link).toHaveCSS("opacity", "0");
  await link.focus();
  await expect(link).toHaveCSS("opacity", "1");
  await expect(link).toHaveAccessibleDescription("Link to this section");
  await expect(
    page.getByRole("tooltip", { name: "Link to this section" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#being-short$/);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
