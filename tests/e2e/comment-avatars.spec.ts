import { expect, test } from "./fixtures";

const postPath =
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const commentsPath =
  "**/api.github.com/repos/RehanSaeed/rehansaeed.github.io/issues/607/comments*";

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/webmention\.io\/api\/mentions\?/, (route) =>
    route.fulfill({ json: { links: [] } }),
  );
  await page.route("https://avatars.githubusercontent.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="purple"/></svg>',
    }),
  );
});

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [375, 1280]) {
    test(`Comment avatars use the shared circular frame in ${colorScheme} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.route(commentsPath, (route) =>
        route.fulfill({ status: 403, json: { message: "Offline" } }),
      );
      await page.goto(postPath);
      await expect(
        page.getByRole("button", { name: "Open search", exact: true }),
      ).toBeEnabled({ timeout: 60_000 });
      await page.locator(".webmentions").scrollIntoViewIfNeeded();
      await expect(
        page.locator(".webmentions__links-container"),
      ).toBeAttached();
      await page.locator(".comments").scrollIntoViewIfNeeded();
      await expect(page.locator(".comments [role=status]")).toContainText(
        "showing saved comments",
      );
      const comment = page.locator(".comment").first();
      const avatar = comment.locator(".comment__avatar");
      const author = comment.locator(".comment__author a");
      const login = (await author.textContent())!.trim();
      await expect(avatar).toHaveClass(/\bavatar\b/);
      await expect(avatar).toHaveAttribute(
        "href",
        (await author.getAttribute("href"))!,
      );
      await expect(avatar).toHaveAccessibleName(login);
      await expect(avatar).not.toHaveAttribute("title");
      await expect(avatar.locator("img")).toHaveAttribute("alt", login);
      await expect(avatar.locator("img")).toHaveAttribute("loading", "lazy");
      await expect
        .poll(() =>
          avatar
            .locator("img")
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
      await expect(avatar).toHaveCSS("border-radius", "100%");
      await expect(avatar).toHaveCSS("scale", "none");
      const bounds = await avatar.boundingBox();
      const headerBounds = await comment
        .locator(".comment__header")
        .boundingBox();
      expect(bounds!.y, "Avatar aligns with the comment header").toBeCloseTo(
        headerBounds!.y,
        1,
      );
      expect(bounds!.width).toBe(bounds!.height);
      const expectedSize = await avatar.evaluate(
        () =>
          3 * parseFloat(getComputedStyle(document.documentElement).fontSize),
      );
      expect(bounds!.width).toBeCloseTo(expectedSize, 1);

      for (const interaction of ["hover", "focus"] as const) {
        await page.mouse.move(0, 0);
        await avatar.evaluate((element: HTMLElement) => element.blur());
        if (interaction === "hover") {
          await avatar.hover();
        } else {
          await avatar.focus();
          await expect(avatar).toBeFocused();
        }
        await expect(avatar).toHaveCSS("scale", "1.4");
        await expect(avatar).toHaveAccessibleDescription(login);
        await expect(avatar).toHaveCSS("opacity", "1");
        const unclippedEdges = await avatar.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return [
            [bounds.left + 2, bounds.top + bounds.height / 2],
            [bounds.right - 2, bounds.top + bounds.height / 2],
            [bounds.left + bounds.width / 2, bounds.top + 2],
            [bounds.left + bounds.width / 2, bounds.bottom - 2],
          ].map(([x, y]) => element.contains(document.elementFromPoint(x, y)));
        });
        expect(
          unclippedEdges,
          `${interaction}: avatar edges are not clipped`,
        ).toEqual([true, true, true, true]);
        const frame = await avatar.evaluate((element) => {
          const style = getComputedStyle(element);
          const border = getComputedStyle(element, "::after");
          return {
            border: border.borderTopColor,
            accent: style.getPropertyValue("--global-accent-color").trim(),
            radius: border.borderTopLeftRadius,
          };
        });
        const accent = await avatar.evaluate((element, color) => {
          const probe = document.createElement("span");
          probe.style.color = color;
          element.append(probe);
          const resolved = getComputedStyle(probe).color;
          probe.remove();
          return resolved;
        }, frame.accent);
        expect(frame.border).toBe(accent);
        expect(frame.radius).toBe("100%");
      }
    });
  }
}

test("Refreshed comments retain lazy shared avatars and omit deleted-user avatars", async ({
  page,
}) => {
  const comment = {
    id: 987654321,
    html_url:
      "https://github.com/RehanSaeed/rehansaeed.github.io/issues/607#issuecomment-987654321",
    body_html: "<p>A refreshed comment.</p>",
    created_at: "2026-01-02T00:00:00Z",
    user: {
      login: "reader",
      avatar_url: "https://avatars.githubusercontent.com/u/1",
      html_url: "https://github.com/reader",
    },
  };
  await page.route(commentsPath, (route) =>
    route.fulfill({
      json: [comment, { ...comment, id: 987654322, user: null }],
    }),
  );
  await page.goto(postPath);
  await page.locator(".comments").scrollIntoViewIfNeeded();
  const comments = page.locator(".comment");
  await expect(comments).toHaveCount(2);
  const avatar = comments.first().locator(".comment__avatar.avatar");
  await expect(avatar).toHaveAccessibleName("reader");
  await expect(avatar).toHaveAttribute("href", comment.user.html_url);
  await expect(avatar.locator("img")).toHaveAttribute(
    "src",
    comment.user.avatar_url,
  );
  await expect(avatar.locator("img")).toHaveAttribute("loading", "lazy");
  await expect(comments.last().locator(".comment__avatar")).toHaveCount(0);
  await expect(comments.last().locator(".comment__author")).toHaveText(
    "Deleted user",
  );
});
