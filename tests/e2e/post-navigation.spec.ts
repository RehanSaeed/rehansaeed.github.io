import { globSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { load } from "cheerio";
import { parse } from "yaml";
import { test as browserTest } from "./fixtures";

type Post = {
  title: string;
  permalink: string;
  date: string;
  published: boolean;
};

const posts = globSync("content/posts/**/index.md").map((file) => {
  const source = readFileSync(file, "utf8");
  return parse(source.split("---")[1]!) as Post;
});
const published = posts
  .filter((post) => post.published)
  .sort((a, b) =>
    a.date < b.date
      ? -1
      : a.date > b.date
        ? 1
        : a.permalink < b.permalink
          ? -1
          : a.permalink > b.permalink
            ? 1
            : 0,
  );

test("Every published post has the correct static chronological neighbours", async ({
  request,
}) => {
  test.setTimeout(120_000);
  expect(published.length).toBeGreaterThan(2);
  for (const [index, post] of published.entries()) {
    const response = await request.get(post.permalink);
    expect(response.status(), post.permalink).toBe(200);
    const $ = load(await response.text());
    const nav = $('nav[aria-label="Post navigation"]');
    expect(nav.length, post.permalink).toBe(1);
    const neighbours = [
      { rel: "prev", label: "Previous post", post: published[index - 1] },
      { rel: "next", label: "Next post", post: published[index + 1] },
    ];
    for (const neighbour of neighbours) {
      const link = nav.find(`a[rel="${neighbour.rel}"]`);
      expect(link.length, `${post.permalink}: ${neighbour.rel}`).toBe(
        neighbour.post ? 1 : 0,
      );
      if (neighbour.post) {
        expect(link.attr("href")).toBe(neighbour.post.permalink);
        expect(link.text()).toContain(neighbour.label);
        expect(link.text()).toContain(neighbour.post.title);
      }
    }
    expect(nav.find("a").length).toBe(
      index === 0 || index === published.length - 1 ? 1 : 2,
    );
    expect($(".post-page__content").next().is(nav)).toBe(true);
  }
});

test("Drafts remain directly accessible without post navigation", async ({
  request,
}) => {
  const drafts = posts.filter((post) => !post.published);
  expect(drafts.length).toBeGreaterThan(0);
  for (const post of drafts) {
    const response = await request.get(post.permalink);
    expect(response.status(), post.permalink).toBe(200);
    const $ = load(await response.text());
    expect($('nav[aria-label="Post navigation"]').length).toBe(0);
  }
});

for (const width of [1280, 375]) {
  browserTest(
    `Post links support keyboard and client navigation at ${width}px`,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const index = Math.floor(published.length / 2);
      const post = published[index]!;
      const older = published[index - 1]!;
      const newer = published[index + 1]!;
      await page.goto(post.permalink);
      await page.waitForFunction(
        () =>
          !!document.querySelector<HTMLElement & { __vue_app__?: unknown }>(
            "#__nuxt",
          )?.__vue_app__,
      );
      const nav = page.getByRole("navigation", { name: "Post navigation" });
      const previous = nav.getByRole("link", {
        name: `Previous post ${older.title}`,
        exact: true,
      });
      const next = nav.getByRole("link", {
        name: `Next post ${newer.title}`,
        exact: true,
      });
      await expect(previous).toBeVisible();
      await expect(next).toBeVisible();
      for (const link of [previous, next]) {
        const box = await link.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      await previous.focus();
      await page.keyboard.press("Tab");
      await expect(next).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(newer.permalink);
      await expect(page.locator(".post-page__title-container h1")).toHaveText(
        newer.title,
      );
      await nav
        .getByRole("link", { name: `Previous post ${post.title}` })
        .click();
      await expect(page).toHaveURL(post.permalink);
      await expect(previous).toHaveAttribute("href", older.permalink);
      await previous.click();
      await expect(page).toHaveURL(older.permalink);
      await expect(page.locator(".post-page__title-container h1")).toHaveText(
        older.title,
      );
    },
  );
}
