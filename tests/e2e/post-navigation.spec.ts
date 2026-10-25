import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { load } from "cheerio";
import { parse } from "yaml";
import { expect, test } from "./fixtures";

interface Post {
  title: string;
  permalink: string;
  date: string;
  published: boolean;
}

const directory = join(process.cwd(), "content", "posts");
const posts = readdirSync(directory, { recursive: true })
  .filter((path) => typeof path === "string" && path.endsWith("index.md"))
  .map((path) => {
    const source = readFileSync(join(directory, String(path)), "utf8");
    return parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]!) as Post;
  });
const published = posts
  .filter((post) => post.published)
  .sort(
    (a, b) =>
      Date.parse(a.date) - Date.parse(b.date) ||
      (a.permalink < b.permalink ? -1 : a.permalink > b.permalink ? 1 : 0),
  );

test("Every post has chronological navigation in static HTML, excluding drafts", async ({
  request,
}) => {
  test.setTimeout(120_000);
  for (const post of posts) {
    const response = await request.get(post.permalink);
    expect(response.ok(), post.permalink).toBe(true);
    const $ = load(await response.text());
    const navigation = $('nav[aria-label="Post navigation"]');
    const index = published.findIndex(
      (item) => item.permalink === post.permalink,
    );
    const previous = index > 0 ? published[index - 1] : undefined;
    const next = index >= 0 ? published[index + 1] : undefined;
    expect(navigation.length, post.permalink).toBe(previous || next ? 1 : 0);
    for (const [rel, target, label] of [
      ["prev", previous, "Previous post"],
      ["next", next, "Next post"],
    ] as const) {
      const link = navigation.find(`a[rel="${rel}"]`);
      expect(link.length, `${post.permalink} ${rel}`).toBe(target ? 1 : 0);
      if (target) {
        expect(link.attr("href")).toBe(target.permalink);
        expect(link.find("strong").text()).toBe(label);
        expect(link.find("span").text()).toBe(target.title);
      }
    }
    if (navigation.length) {
      expect(navigation.prev().hasClass("post-page__content")).toBe(true);
      expect(navigation.next().hasClass("post-page__webmentions")).toBe(true);
    }
  }
});

for (const width of [375, 1280]) {
  test(`Reader navigation works in both directions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    const index = Math.floor(published.length / 2);
    const current = published[index]!;
    const previous = published[index - 1]!;
    const next = published[index + 1]!;
    const navigation = page.getByRole("navigation", {
      name: "Post navigation",
      exact: true,
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/hydration|Failed to resolve component/i.test(message.text())) {
        errors.push(message.text());
      }
    });

    await page.goto(current.permalink);
    await expect(navigation).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: "Previous post" }),
    ).toContainText(previous.title);
    await expect(
      navigation.getByRole("link", { name: "Next post" }),
    ).toContainText(next.title);
    const bounds = await navigation.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(width);

    const previousLink = navigation.getByRole("link", {
      name: "Previous post",
    });
    await previousLink.focus();
    await expect(previousLink).toBeFocused();
    await previousLink.press("Enter");
    await expect(page).toHaveURL(previous.permalink);
    await expect(page.locator("h1").first()).toHaveText(previous.title);
    await navigation.getByRole("link", { name: "Next post" }).click();
    await expect(page).toHaveURL(current.permalink);
    await navigation.getByRole("link", { name: "Next post" }).click();
    await expect(page).toHaveURL(next.permalink);
    await expect(page.locator("h1").first()).toHaveText(next.title);
    expect(errors).toEqual([]);
  });
}
