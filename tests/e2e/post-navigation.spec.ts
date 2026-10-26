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
  heroImage: string;
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
  const readingTimes = new Map<string, string>();
  const neighbourTimes: { permalink: string; text: string }[] = [];
  for (const [index, post] of published.entries()) {
    const response = await request.get(post.permalink);
    expect(response.status(), post.permalink).toBe(200);
    const $ = load(await response.text());
    const nav = $('nav[aria-label="Post navigation"]');
    expect(nav.length, post.permalink).toBe(1);
    expect(nav.find("> ul > li > a").length).toBe(nav.find("a").length);
    for (const element of nav.find("[style]")) {
      expect($(element).attr("style")).toBe("");
    }
    const readingTime = $(".post-page__title-container .post-meta")
      .text()
      .match(/\d+ min read/)?.[0];
    expect(readingTime, post.permalink).toBeTruthy();
    readingTimes.set(post.permalink, readingTime!);
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
        expect(link.find("h2").text().trim()).toBe(neighbour.post.title);
        const image = link.find("img");
        expect(image.attr("alt")).toBe("");
        expect(image.attr("loading")).toBe("lazy");
        expect(decodeURIComponent(image.attr("src")!)).toContain(
          neighbour.post.heroImage,
        );
        expect(Number(image.attr("width"))).toBeGreaterThan(0);
        expect(Number(image.attr("height"))).toBeGreaterThan(0);
        expect(image.attr("srcset")).toBeTruthy();
        expect(image.attr("sizes")).toBeTruthy();
        expect(link.find('svg.icon[aria-hidden="true"]').length).toBe(1);
        expect(
          link.find("svg.icon path, svg.icon line, svg.icon polyline").length,
        ).toBeGreaterThan(0);
        expect(link.find("time").attr("datetime")).toMatch(/^PT\d+M$/);
        neighbourTimes.push({
          permalink: neighbour.post.permalink,
          text: link
            .find(`#${link.attr("aria-describedby")}`)
            .text()
            .trim(),
        });
      }
    }
    expect(nav.find("a").length).toBe(
      index === 0 || index === published.length - 1 ? 1 : 2,
    );
    expect($(".post-page__content").next().is(nav)).toBe(true);
  }
  for (const neighbour of neighbourTimes) {
    expect(neighbour.text, neighbour.permalink).toBe(
      readingTimes.get(neighbour.permalink),
    );
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

for (const width of [1280, 768, 375, 320]) {
  browserTest(
    `Post links support keyboard and client navigation at ${width}px`,
    async ({ page, baseURL }) => {
      const iconRequests: string[] = [];
      page.on("request", (request) => {
        if (/iconify|_nuxt_icon/.test(request.url())) {
          iconRequests.push(request.url());
        }
      });
      await page.route(
        (url) => url.origin !== new URL(baseURL!).origin,
        (route) => route.fulfill({ status: 204 }),
      );
      await page.setViewportSize({ width, height: 900 });
      const longestTitleIndex = published.reduce(
        (longest, post, index) =>
          post.title.length > published[longest]!.title.length
            ? index
            : longest,
        0,
      );
      const index = Math.min(
        Math.max(longestTitleIndex + 1, 1),
        published.length - 2,
      );
      const post = published[index]!;
      const older = published[index - 1]!;
      const newer = published[index + 1]!;
      await page.goto(post.permalink, { waitUntil: "domcontentloaded" });
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
      await expect(nav.getByRole("list")).toBeVisible();
      await expect(nav.getByRole("listitem")).toHaveCount(2);
      await expect(nav.getByRole("heading", { level: 2 })).toHaveCount(2);
      await expect(nav.locator("svg.icon")).toHaveCount(2);
      for (const link of [previous, next]) {
        const box = await link.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      await nav.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          nav
            .locator("img")
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  image instanceof HTMLImageElement &&
                  image.complete &&
                  image.naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      await page.evaluate(() => document.fonts.ready);
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        const cards = await nav.locator("a").evaluateAll((links) =>
          links.map((link) => {
            const image = link.querySelector("img")!;
            const direction = link.querySelector(
              ".post-navigation__direction",
            )!;
            const meta = link.querySelector(".post-navigation__meta")!;
            const time = meta.lastElementChild!;
            const caption = link.querySelector(".post-navigation__caption")!;
            const title = link.querySelector("h2")!;
            const box = link.getBoundingClientRect();
            const directionBox = direction.getBoundingClientRect();
            const timeBox = time.getBoundingClientRect();
            const captionBox = caption.getBoundingClientRect();
            const imageBox = image.getBoundingClientRect();
            return {
              top: box.top,
              captionTop: captionBox.top,
              captionHeight: captionBox.height,
              captionBackground: getComputedStyle(caption).backgroundImage,
              surfaceColor: getComputedStyle(link.parentElement!)
                .backgroundColor,
              extension: box.height - imageBox.height,
              ratio: imageBox.width / imageBox.height,
              // Resized image variants round pixels; layout uses source dimensions.
              imageRatio:
                Number(image.getAttribute("width")) /
                Number(image.getAttribute("height")),
              sameRow:
                Math.abs(
                  directionBox.top +
                    directionBox.height / 2 -
                    (timeBox.top + timeBox.height / 2),
                ) < 1,
              opposite:
                link.rel === "prev"
                  ? directionBox.right < timeBox.left
                  : timeBox.right < directionBox.left,
              captionFits: [caption, title, meta].every((element) => {
                const rect = element.getBoundingClientRect();
                return (
                  rect.top >= box.top - 1 &&
                  rect.bottom <= box.bottom + 1 &&
                  rect.left >= box.left - 1 &&
                  rect.right <= box.right + 1
                );
              }),
            };
          }),
        );
        for (const card of cards) {
          expect(card.ratio).toBeCloseTo(card.imageRatio, 2);
          expect(card.sameRow).toBe(true);
          expect(card.opposite).toBe(true);
          expect(card.captionFits).toBe(true);
          expect(card.extension).toBeCloseTo(64, 0);
          expect(card.captionBackground).toContain("/ 0.65");
          expect(card.captionBackground).toContain("/ 0.88");
          expect(card.captionBackground).toContain(card.surfaceColor);
        }
        if (Math.abs(cards[0]!.top - cards[1]!.top) < 1) {
          expect(cards[0]!.captionTop).toBeCloseTo(cards[1]!.captionTop, 1);
          expect(cards[0]!.captionHeight).toBeCloseTo(
            cards[1]!.captionHeight,
            1,
          );
        }
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
      expect(iconRequests).toEqual([]);
    },
  );
}
