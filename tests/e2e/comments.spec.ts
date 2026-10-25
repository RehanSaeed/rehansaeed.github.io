import { expect, test } from "./fixtures";
import { load } from "cheerio";
import { commentSchema, type GitHubComment } from "../../shared/utils/comments";
import { commentReactions } from "../../app/utils/comment-presentation";

const postPath =
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const commentsPath =
  "**/api.github.com/repos/RehanSaeed/rehansaeed.github.io/issues/607/comments*";
const owner: GitHubComment = {
  id: 987654321,
  html_url:
    "https://github.com/RehanSaeed/rehansaeed.github.io/issues/607#issuecomment-987654321",
  body_html: "<p>A helpful reply.</p>",
  created_at: "2022-02-04T09:59:27Z",
  updated_at: "2022-02-05T10:00:00Z",
  author_association: "OWNER",
  user: {
    login: "RehanSaeed",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/RehanSaeed",
  },
  reactions: {
    url: "https://api.github.com/repos/RehanSaeed/rehansaeed.github.io/issues/comments/987654321/reactions",
    total_count: 10,
    "+1": 3,
    "-1": 1,
    laugh: 1,
    hooray: 1,
    confused: 1,
    heart: 1,
    rocket: 1,
    eyes: 1,
  },
};

test.describe("GitHub comments", () => {
  test("Keeps API metadata and accepts older snapshots without it", () => {
    expect(commentSchema.parse(owner)).toEqual(owner);
    const { author_association, updated_at, ...legacy } = owner;
    expect(author_association).toBe("OWNER");
    expect(updated_at).toBeDefined();
    expect(commentSchema.parse(legacy)).toEqual(legacy);
  });

  test("Maps only supported, positive reaction counts to emoji", () => {
    expect(commentReactions(owner).map(({ emoji }) => emoji)).toEqual([
      "👍",
      "👎",
      "😄",
      "🎉",
      "😕",
      "❤️",
      "🚀",
      "👀",
    ]);
    expect(
      commentReactions({
        ...owner,
        reactions: {
          "+1": 0,
          "-1": -1,
          laugh: "2",
          heart: 0.5,
          unknown: 8,
          total_count: 10,
        },
      }),
    ).toEqual([]);
    expect(commentReactions({ ...owner, reactions: undefined })).toEqual([]);
  });

  for (const width of [375, 1280]) {
    test(`Shows API-backed badges, dates, links and reactions at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route(commentsPath, (route) =>
        route.fulfill({ json: [owner] }),
      );
      const refreshed = page.waitForResponse(
        (response) =>
          response.url().includes("/issues/607/comments") && response.ok(),
      );
      const response = await page.goto(`${postPath}#comments`);
      const saved = load(await response!.text());
      expect(saved(".vssue-comment-badge").first().text()).toBe("Owner");
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      await refreshed;
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: "GitHub Comments",
          exact: true,
        }),
      ).toHaveAttribute("id", "comments");
      const comment = page.locator(".vssue-comment");
      await expect(comment).toHaveCount(1);
      await expect(comment.locator(".badge.vssue-comment-badge")).toHaveText(
        "Owner",
      );
      const githubLink = page.getByRole("link", { name: "Comment on GitHub" });
      await expect(githubLink).toHaveCount(1);
      await expect(githubLink).toHaveAttribute("href", /issues\/607$/);
      await expect(
        comment.getByRole("link", { name: "Comment on GitHub" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("heading", { level: 3, name: "1 Comment", exact: true }),
      ).toBeVisible();
      const date = comment.locator(".vssue-comment-created-at > time");
      await expect(date).toHaveAttribute("datetime", owner.created_at);
      await expect(date.locator("..")).not.toHaveJSProperty("tagName", "A");
      await expect(
        comment.locator(".vssue-comment-edited time"),
      ).toHaveAttribute("datetime", owner.updated_at!);
      await expect(
        comment.locator(".badge.vssue-comment-reaction"),
      ).toHaveCount(8);
      await expect(
        comment.getByRole("img", { name: "Thumbs up: 3" }),
      ).toHaveText("👍3");
      await expect(comment.getByRole("img", { name: "Heart: 1" })).toHaveText(
        "❤️1",
      );
      const layout = await page.locator(".comments").evaluate((element) => {
        const link = element.querySelector(".comments__github")!;
        const toolbar = element.querySelector(".comments__toolbar")!;
        const count = element.querySelector(".comments__count")!;
        const timestamp = element.querySelector(".vssue-comment-created-at")!;
        const body = element.querySelector(".vssue-comment-body")!;
        const linkBounds = link.getBoundingClientRect();
        const countBounds = count.getBoundingClientRect();
        const typography = (heading: Element) => {
          const style = getComputedStyle(heading);
          return {
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            color: style.color,
            textShadow: style.textShadow,
          };
        };
        return {
          countTypography: typography(count),
          reactionCountFont: getComputedStyle(
            element.querySelector(".vssue-comment-reaction-count")!,
          ).fontFamily,
          bodyFontFamily: getComputedStyle(body).fontFamily,
          reactions: Array.from(
            element.querySelectorAll(".vssue-comment-reaction"),
            (reaction) => {
              const emoji = reaction.querySelector(
                ".vssue-comment-reaction-emoji",
              )!;
              const count = reaction.querySelector(
                ".vssue-comment-reaction-count",
              )!;
              const emojiBounds = emoji.getBoundingClientRect();
              const countBounds = count.getBoundingClientRect();
              return {
                emojiSize: getComputedStyle(emoji).fontSize,
                countSize: getComputedStyle(count).fontSize,
                centerDifference: Math.abs(
                  emojiBounds.top +
                    emojiBounds.height / 2 -
                    countBounds.top -
                    countBounds.height / 2,
                ),
              };
            },
          ),
          repliesTypography: typography(
            document.querySelector(".webmentions__reply-count")!,
          ),
          rightGap: Math.abs(
            linkBounds.right - toolbar.getBoundingClientRect().right,
          ),
          inline:
            countBounds.top < linkBounds.bottom &&
            linkBounds.top < countBounds.bottom,
          timestampFont: getComputedStyle(timestamp).fontSize,
          bodyFont: getComputedStyle(body).fontSize,
          overflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        };
      });
      expect(layout.rightGap).toBeLessThan(2);
      expect(layout.inline).toBe(width === 1280);
      expect(layout.countTypography).toEqual(layout.repliesTypography);
      expect(layout.reactionCountFont).toBe(layout.bodyFontFamily);
      for (const reaction of layout.reactions) {
        expect(reaction.emojiSize).toBe(reaction.countSize);
        expect(reaction.centerDifference).toBeLessThanOrEqual(1);
      }
      expect(parseFloat(layout.timestampFont)).toBeLessThan(
        parseFloat(layout.bodyFont),
      );
      expect(layout.overflow).toBe(false);
      await githubLink.focus();
      await expect(githubLink).toHaveCSS("outline-style", "solid");
      await page.reload();
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      await expect(page.locator(".vssue-comment")).toHaveCount(1);
      await expect(page.locator(".vssue-comment-badge")).toHaveText("Owner");
      await expect(page.locator(".vssue-comment-reaction")).toHaveCount(8);
    });
  }

  test("Does not infer ownership from usernames or show empty metadata", async ({
    page,
  }) => {
    const reader = {
      ...owner,
      author_association: "NONE",
      updated_at: owner.created_at,
      reactions: { total_count: 0, "+1": 0 },
    };
    const { author_association, updated_at, ...legacy } = reader;
    expect(author_association).toBe("NONE");
    expect(updated_at).toBe(reader.created_at);
    await page.route(commentsPath, (route) =>
      route.fulfill({
        json: [
          reader,
          { ...legacy, id: 987654322, user: null },
          { ...reader, id: 987654323, author_association: "CONTRIBUTOR" },
        ],
      }),
    );
    await page.goto(postPath);
    await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
    await expect(page.locator(".vssue-comment")).toHaveCount(3);
    await expect(page.locator(".comments__count")).toHaveText("3 Comments");
    await expect(page.locator(".vssue-comment-badge")).toHaveText(
      "Contributor",
    );
    await expect(page.locator(".vssue-comment-edited")).toHaveCount(0);
    await expect(page.locator(".vssue-comment-footer")).toHaveCount(0);
    await expect(page.locator(".vssue-comment-author").nth(1)).toHaveText(
      "Deleted user",
    );
  });

  for (const count of [0, 6]) {
    test(`Wraps the shared GitHub action below ${count} comments on mobile`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 900 });
      await page.route(commentsPath, (route) =>
        route.fulfill({
          json: Array.from({ length: count }, (_, index) => ({
            ...owner,
            id: owner.id + index,
          })),
        }),
      );
      await page.goto(postPath);
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      await expect(page.locator(".vssue-comment")).toHaveCount(count);
      const label = page.locator(".comments__count");
      const link = page.getByRole("link", { name: "Comment on GitHub" });
      await expect(label).toHaveText(`${count} Comments`);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", /issues\/607$/);
      const belowCount = await page
        .locator(".comments__toolbar")
        .evaluate((toolbar) => {
          const labelBounds = toolbar
            .querySelector(".comments__count")!
            .getBoundingClientRect();
          const linkBounds = toolbar
            .querySelector(".comments__github")!
            .getBoundingClientRect();
          return linkBounds.top >= labelBounds.bottom;
        });
      expect(belowCount).toBe(true);
    });
  }

  for (const width of [375, 686, 1280]) {
    test(`Keeps comment spacing, quoted text and purple badges within the card at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route(commentsPath, (route) =>
        route.fulfill({
          json: [
            {
              ...owner,
              body_html:
                "<blockquote><p>Hi, thank you for the great article! One question. I have multiple C# applications: .NET Core, legacy WinForms apps. Is it possible to use OpenTelemetry in WinForms apps? How to?</p></blockquote><p>You certainly can. With ASP.NET Core, there are packages which set up some basic telemetry for you. With desktop apps, you would have to do all that yourself.</p>",
            },
          ],
        }),
      );
      await page.goto(`${postPath}#comments`);
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      const comment = page.locator(".vssue-comment");
      await expect(comment).toHaveCount(1);
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        const layout = await comment.evaluate((element) => {
          const identity = element
            .querySelector(".vssue-comment-identity")!
            .getBoundingClientRect();
          const date = element
            .querySelector(".vssue-comment-created-at")!
            .getBoundingClientRect();
          const main = element.querySelector(".vssue-comment-main")!;
          const body = element
            .querySelector(".vssue-comment-body")!
            .getBoundingClientRect();
          const card = element.closest(".comments")!;
          const cardBounds = card.getBoundingClientRect();
          const badge = element.querySelector(".vssue-comment-badge")!;
          const avatar = element
            .querySelector(".vssue-comment-avatar")!
            .getBoundingClientRect();
          const swatch = document.createElement("span");
          swatch.style.color = "var(--global-accent-color)";
          element.append(swatch);
          const accent = getComputedStyle(swatch).color;
          swatch.remove();
          return {
            nameDateGap: date.top - identity.bottom,
            avatarGap: identity.left - avatar.right,
            avatarColumnGap: parseFloat(getComputedStyle(element).columnGap),
            minimumAvatarGap:
              parseFloat(getComputedStyle(document.documentElement).fontSize) *
              0.75,
            dateContentGap: main.getBoundingClientRect().top - date.bottom,
            minimumContentGap:
              parseFloat(getComputedStyle(document.documentElement).fontSize) *
              0.75,
            paragraphsFit: Array.from(main.querySelectorAll("p")).every(
              (paragraph) => {
                const bounds = paragraph.getBoundingClientRect();
                return (
                  bounds.left >= body.left - 1 && bounds.right <= body.right + 1
                );
              },
            ),
            rightInset: cardBounds.right - body.right,
            cardPadding: parseFloat(getComputedStyle(card).paddingInlineEnd),
            badgeColor: getComputedStyle(badge).color,
            accent,
            badgeBackground: getComputedStyle(badge).backgroundColor,
            badgeBorderColor: getComputedStyle(badge).borderTopColor,
            badgesArePills: Array.from(
              element.querySelectorAll(".badge"),
            ).every(
              (badge) =>
                parseFloat(getComputedStyle(badge).borderTopLeftRadius) >=
                badge.getBoundingClientRect().height / 2,
            ),
          };
        });
        expect(layout.nameDateGap).toBeLessThanOrEqual(1);
        expect(layout.avatarGap).toBeGreaterThanOrEqual(
          layout.minimumAvatarGap - 1,
        );
        expect(layout.avatarColumnGap).toBeGreaterThanOrEqual(
          layout.minimumAvatarGap / 0.75 - 1,
        );
        expect(layout.dateContentGap).toBeGreaterThanOrEqual(
          layout.minimumContentGap - 1,
        );
        expect(layout.paragraphsFit).toBe(true);
        expect(layout.rightInset).toBeGreaterThanOrEqual(
          layout.cardPadding - 1,
        );
        expect(layout.badgeColor).toBe(layout.accent);
        expect(layout.badgeBackground).toBe("rgba(0, 0, 0, 0)");
        expect(layout.badgeBorderColor).toBe(layout.accent);
        expect(layout.badgesArePills).toBe(true);
      }
    });
  }
});
