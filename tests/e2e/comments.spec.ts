import { expect, test } from "./fixtures";
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
      expect(await response!.text()).toContain(
        'class="vssue-comment-badge">Owner</span>',
      );
      await page.locator(".comments__toolbar").scrollIntoViewIfNeeded();
      await refreshed;
      const comment = page.locator(".vssue-comment");
      await expect(comment).toHaveCount(1);
      await expect(comment.locator(".vssue-comment-badge")).toHaveText("Owner");
      const githubLink = page.getByRole("link", { name: "View on GitHub" });
      await expect(githubLink).toHaveCount(1);
      await expect(githubLink).toHaveAttribute("href", /issues\/607$/);
      await expect(
        comment.getByRole("link", { name: "View on GitHub" }),
      ).toHaveCount(0);
      await expect(page.locator(".comments__count")).toHaveText("1 comment");
      const date = comment.locator(".vssue-comment-created-at > time");
      await expect(date).toHaveAttribute("datetime", owner.created_at);
      await expect(date.locator("..")).not.toHaveJSProperty("tagName", "A");
      await expect(
        comment.locator(".vssue-comment-edited time"),
      ).toHaveAttribute("datetime", owner.updated_at!);
      await expect(comment.locator(".vssue-comment-reaction")).toHaveCount(8);
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
        return {
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
      expect(layout.inline).toBe(true);
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
    await expect(page.locator(".comments__count")).toHaveText("3 comments");
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
    test(`Keeps the shared GitHub action inline with ${count} comments on mobile`, async ({
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
      const link = page.getByRole("link", { name: "View on GitHub" });
      await expect(label).toHaveText(`${count} comments`);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", /issues\/607$/);
      const inline = await page
        .locator(".comments__toolbar")
        .evaluate((toolbar) => {
          const labelBounds = toolbar
            .querySelector(".comments__count")!
            .getBoundingClientRect();
          const linkBounds = toolbar
            .querySelector(".comments__github")!
            .getBoundingClientRect();
          return (
            labelBounds.top < linkBounds.bottom &&
            linkBounds.top < labelBounds.bottom
          );
        });
      expect(inline).toBe(true);
    });
  }
});
