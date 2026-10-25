import { expect, test } from "./fixtures";
import { load } from "cheerio";
import { commentSchema, type GitHubComment } from "../../shared/utils/comments";
import {
  commentAssociation,
  commentReactions,
} from "../../app/utils/comment-presentation";

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

  test("Formats API associations without a fixed list and validates their format", () => {
    for (const [value, label] of [
      ["OWNER", "Owner"],
      ["FIRST_TIMER", "First timer"],
      ["FIRST_TIME_CONTRIBUTOR", "First time contributor"],
      ["FUTURE_REVIEWER", "Future reviewer"],
    ]) {
      expect(
        commentSchema.parse({ ...owner, author_association: value })
          .author_association,
      ).toBe(value);
      expect(commentAssociation(value)).toBe(label);
    }
    expect(commentAssociation("NONE")).toBeUndefined();
    expect(commentAssociation(undefined)).toBeUndefined();
    for (const value of ["", "owner", "<script>", " OWNER "]) {
      expect(
        commentSchema.safeParse({ ...owner, author_association: value })
          .success,
      ).toBe(false);
    }
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
      expect(saved(".github-comment__association").first().text()).toBe(
        "Owner",
      );
      expect(saved(".comments__list > article.github-comment").length).toBe(
        saved(".github-comment").length,
      );
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      await refreshed;
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: "GitHub Comments",
          exact: true,
        }),
      ).toHaveAttribute("id", "comments");
      const comment = page.locator(".github-comment");
      await expect(comment).toHaveCount(1);
      await expect(
        page.locator(".comments__list > article.github-comment"),
      ).toHaveCount(1);
      await expect(
        page.getByRole("region", { name: "GitHub Comments", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("article", { name: owner.user!.login, exact: true }),
      ).toHaveAttribute("id", `github-comment-${owner.id}`);
      const reactions = comment.getByRole("list", { name: "Reactions" });
      await expect(reactions.getByRole("listitem")).toHaveCount(8);
      await expect(
        comment.locator(".badge.github-comment__association"),
      ).toHaveText("Owner");
      const githubLink = page.getByRole("link", { name: "Comment on GitHub" });
      await expect(githubLink).toHaveCount(1);
      await expect(githubLink).toHaveAttribute("href", /issues\/607$/);
      await expect(
        comment.getByRole("link", { name: "Comment on GitHub" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("heading", { level: 3, name: "1 Comment", exact: true }),
      ).toBeVisible();
      const date = comment.locator(".github-comment__timestamp > time");
      await expect(date).toHaveAttribute("datetime", owner.created_at);
      await expect(date.locator("..")).not.toHaveJSProperty("tagName", "A");
      await expect(
        comment.locator(".github-comment__edited time"),
      ).toHaveAttribute("datetime", owner.updated_at!);
      await expect(
        comment.locator(".badge.github-comment__reaction"),
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
        const timestamp = element.querySelector(".github-comment__timestamp")!;
        const body = element.querySelector(".github-comment__body")!;
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
            element.querySelector(".github-comment__reaction-count")!,
          ).fontFamily,
          bodyFontFamily: getComputedStyle(body).fontFamily,
          reactions: Array.from(
            element.querySelectorAll(".github-comment__reaction"),
            (reaction) => {
              const emoji = reaction.querySelector(
                ".github-comment__reaction-emoji",
              )!;
              const count = reaction.querySelector(
                ".github-comment__reaction-count",
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
      await expect(page.locator(".github-comment")).toHaveCount(1);
      await expect(page.locator(".github-comment__association")).toHaveText(
        "Owner",
      );
      await expect(page.locator(".github-comment__reaction")).toHaveCount(8);
    });
  }

  test("Updates presentation when refreshing a saved comment with the same ID", async ({
    page,
    request,
  }) => {
    const response = await request.get(postPath);
    const saved = load(await response.text());
    const id = Number(
      saved(".github-comment")
        .first()
        .attr("id")!
        .replace("github-comment-", ""),
    );
    expect(id).toBeGreaterThan(0);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(commentsPath, async (route) => {
      await pending;
      await route.fulfill({
        json: [
          {
            ...owner,
            id,
            user: null,
            author_association: "CONTRIBUTOR",
            updated_at: owner.created_at,
            reactions: { heart: 2 },
          },
        ],
      });
    });
    try {
      const refreshed = page.waitForRequest((request) =>
        request.url().includes("/issues/607/comments"),
      );
      await page.goto(`${postPath}#comments`);
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      await refreshed;
      const comment = page.locator(`#github-comment-${id}`);
      const article = await comment.elementHandle();
      release();
      await expect(page.locator(".github-comment")).toHaveCount(1);
      await expect(comment).toHaveAccessibleName("Deleted user");
      await expect(comment.locator(".github-comment__avatar")).toHaveCount(0);
      await expect(comment.locator(".github-comment__association")).toHaveText(
        "Contributor",
      );
      await expect(comment.locator(".github-comment__edited")).toHaveCount(0);
      await expect(comment.locator(".github-comment__content")).toHaveText(
        "A helpful reply.",
      );
      await expect(comment.locator(".github-comment__reaction")).toHaveCount(1);
      await expect(comment.getByRole("img", { name: "Heart: 2" })).toHaveText(
        "❤️2",
      );
      expect(
        await comment.evaluate((element, saved) => element === saved, article),
      ).toBe(true);
    } finally {
      release();
    }
  });

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
          { ...reader, id: 987654324, author_association: "FUTURE_REVIEWER" },
        ],
      }),
    );
    await page.goto(postPath);
    await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
    await expect(page.locator(".github-comment")).toHaveCount(4);
    await expect(page.locator(".comments__count")).toHaveText("4 Comments");
    await expect(page.locator(".github-comment__association")).toHaveText([
      "Contributor",
      "Future reviewer",
    ]);
    await expect(page.locator(".github-comment__edited")).toHaveCount(0);
    await expect(page.locator(".github-comment__footer")).toHaveCount(0);
    await expect(page.locator(".github-comment__author").nth(1)).toHaveText(
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
      await expect(page.locator(".github-comment")).toHaveCount(count);
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

  for (const width of [320, 375, 1280]) {
    test(`Uses gap-based layouts and contains rich comments at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const longText = "unbroken".repeat(60);
      await page.route(commentsPath, (route) =>
        route.fulfill({
          json: [
            {
              ...owner,
              user: { ...owner.user, login: "reader".repeat(12) },
              body_html: `<p>${longText}</p><pre><code>${longText}</code></pre><ul><li><p>First point</p></li><li><p>Second point</p></li></ul><table><thead><tr><th>Example</th></tr></thead><tbody><tr><td>${longText}</td></tr></tbody></table><details><summary>More information</summary><p>A detail.</p></details>`,
            },
            {
              ...owner,
              id: owner.id + 1,
              user: null,
              body_html: "<p>A deleted user's comment.</p>",
              reactions: {},
            },
          ],
        }),
      );
      await page.goto(`${postPath}#comments`);
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      const comments = page.locator(".github-comment");
      await expect(comments).toHaveCount(2);
      const deleted = page.getByRole("article", { name: "Deleted user" });
      await expect(deleted).toHaveClass(/github-comment--without-avatar/);
      await expect(deleted.locator(".github-comment__avatar")).toHaveCount(0);
      const layout = await page.locator(".comments").evaluate((element) => {
        const first = element.querySelector(".github-comment")!;
        const body = first.querySelector(".github-comment__body")!;
        const header = first.querySelector(".github-comment__header")!;
        const content = first.querySelector(".github-comment__content")!;
        const footer = first.querySelector(".github-comment__footer")!;
        const deleted = element.querySelector(
          ".github-comment--without-avatar",
        )!;
        const deletedBody = deleted.querySelector(".github-comment__body")!;
        const bodyGap = parseFloat(getComputedStyle(body).rowGap);
        const sectionHeader = element.querySelector(".comments__header")!;
        const title = element.querySelector(".comments__title")!;
        const summary = element.querySelector(".comments__summary")!;
        const list = content.querySelector("ul")!;
        const firstParagraph = list.querySelector("li:first-child > p")!;
        const lastParagraph = list.querySelector("li:last-child > p")!;
        return {
          titleGap:
            summary.getBoundingClientRect().top -
            title.getBoundingClientRect().bottom,
          expectedTitleGap: parseFloat(getComputedStyle(sectionHeader).rowGap),
          listStartGap:
            firstParagraph.getBoundingClientRect().top -
            list.getBoundingClientRect().top,
          listEndGap:
            list.getBoundingClientRect().bottom -
            lastParagraph.getBoundingClientRect().bottom,
          reactionsFitItems: Array.from(
            element.querySelectorAll(".github-comment__reaction-item"),
          ).every(
            (item) =>
              Math.abs(
                item.getBoundingClientRect().height -
                  item.querySelector(".badge")!.getBoundingClientRect().height,
              ) < 0.1,
          ),
          sectionDisplay: getComputedStyle(element).display,
          commentDisplay: getComputedStyle(first).display,
          bodyDisplay: getComputedStyle(body).display,
          contentDisplay: getComputedStyle(content).display,
          bodyGap,
          headerContentGap:
            content.getBoundingClientRect().top -
            header.getBoundingClientRect().bottom,
          contentFooterGap:
            footer.getBoundingClientRect().top -
            content.getBoundingClientRect().bottom,
          wraps: [
            ".comments__toolbar",
            ".github-comment__identity",
            ".github-comment__reactions",
          ].every((selector) => {
            const style = getComputedStyle(element.querySelector(selector)!);
            return (
              style.display === "flex" &&
              style.flexWrap === "wrap" &&
              parseFloat(style.gap) > 0
            );
          }),
          deletedWidth: deleted.getBoundingClientRect().width,
          deletedBodyWidth: deletedBody.getBoundingClientRect().width,
          contentMargins: Array.from(content.children, (child) => {
            const style = getComputedStyle(child);
            return [style.marginBlockStart, style.marginBlockEnd];
          }),
          overflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        };
      });
      expect(layout.sectionDisplay).toBe("grid");
      expect(layout.titleGap).toBeCloseTo(layout.expectedTitleGap, 1);
      expect(layout.listStartGap).toBeCloseTo(0, 1);
      expect(layout.listEndGap).toBeCloseTo(0, 1);
      expect(layout.reactionsFitItems).toBe(true);
      expect(layout.commentDisplay).toBe("grid");
      expect(layout.bodyDisplay).toBe("grid");
      expect(layout.contentDisplay).toBe("grid");
      expect(layout.bodyGap).toBeGreaterThan(0);
      expect(layout.headerContentGap).toBeCloseTo(layout.bodyGap, 1);
      expect(layout.contentFooterGap).toBeCloseTo(layout.bodyGap, 1);
      expect(layout.wraps).toBe(true);
      expect(layout.deletedBodyWidth).toBeCloseTo(layout.deletedWidth, 1);
      expect(
        layout.contentMargins.every(
          ([start, end]) => start === "0px" && end === "0px",
        ),
      ).toBe(true);
      expect(layout.overflow).toBe(false);
      await expect(
        comments
          .first()
          .getByRole("listitem")
          .filter({ hasText: "First point" }),
      ).toHaveCount(1);
      await expect(comments.first().getByRole("table")).toBeVisible();
      await comments
        .first()
        .getByText("More information", { exact: true })
        .click();
      await expect(
        comments.first().getByText("A detail.", { exact: true }),
      ).toBeVisible();
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
      const comment = page.locator(".github-comment");
      await expect(comment).toHaveCount(1);
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        const layout = await comment.evaluate((element) => {
          const identity = element
            .querySelector(".github-comment__identity")!
            .getBoundingClientRect();
          const date = element
            .querySelector(".github-comment__timestamp")!
            .getBoundingClientRect();
          const main = element.querySelector(".github-comment__content")!;
          const body = element
            .querySelector(".github-comment__body")!
            .getBoundingClientRect();
          const card = element.closest(".comments")!;
          const cardBounds = card.getBoundingClientRect();
          const badge = element.querySelector(".github-comment__association")!;
          const avatar = element
            .querySelector(".github-comment__avatar")!
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
