import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { load } from "cheerio";
import { test as unitTest } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  rehypeHeadingAnchors,
  remarkYouTube,
} from "../../modules/blog-content/markdown";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

unitTest(
  "Article headings retain fragments and sizes below the page title",
  () => {
    const tree = {
      type: "root",
      children: [1, 2, 5, 6].map((level) => ({
        type: "element",
        tagName: `h${level}`,
        properties: { id: `section-${level}`, className: ["existing"] },
        children: [{ type: "text", value: `Section ${level}` }],
      })),
    };
    rehypeHeadingAnchors()(tree);
    for (const [index, level] of [1, 2, 5, 6].entries()) {
      const heading = tree.children[index]!;
      expect(heading.tagName).toBe(`keep-h${Math.min(level + 1, 6)}`);
      expect(heading.properties).toEqual({
        id: `section-${level}`,
        className: ["existing", `post-heading--${level}`],
      });
      expect(heading.children[0]).toMatchObject({
        tagName: "anchor-link",
        properties: {
          href: `#section-${level}`,
          label: "Link to this section",
        },
      });
    }
  },
);

unitTest("Generated video and playlist players have accessible names", () => {
  for (const url of [
    "https://youtu.be/example",
    "https://www.youtube.com/playlist?list=example",
  ]) {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "link", url }],
        },
      ],
    };
    remarkYouTube()(tree);
    expect(tree.children[0]).toMatchObject({
      type: "html",
      value: expect.stringContaining('title="YouTube video player"'),
    });
  }
});

unitTest(
  "Every generated app page uses native landmarks and valid UI lists",
  () => {
    const root = join(process.cwd(), "dist");
    const files = readdirSync(root, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".html") && file !== "200.html");
    expect(files.length).toBeGreaterThanOrEqual(408);
    for (const file of files) {
      const $ = load(readFileSync(join(root, file), "utf8"));
      expect($("main").length, file).toBe(1);
      $("ul[role=list], ol[role=list]").each((_, list) => {
        expect(
          $(list).children(":not(li)").length,
          `${file}: list children`,
        ).toBe(0);
      });
      if (!$("main#main").length) continue;
      expect($(".navigation").is('nav[aria-label="Main"]'), file).toBe(true);
      expect($("footer.footer").length, file).toBe(1);
      expect($("footer h1").length, file).toBe(0);
      expect($("footer h2#footer-author").length, file).toBe(1);
      expect($(".footer__text").is("p"), file).toBe(true);
      $(".not-found__content").each((_, card) => {
        expect($(card).is("div"), file).toBe(true);
      });
      expect(
        $(".newsletter").is('section[aria-labelledby="newsletter"]'),
        file,
      ).toBe(true);
      expect($(".post__content h1").length, file).toBe(0);
      expect($('a[aria-hidden="true"]').length, file).toBe(0);
      $(".pager").each((_, pager) => {
        expect($(pager).is('nav[aria-label="Pagination"]'), file).toBe(true);
        expect($(pager).find("a:not([href]), a[href='']").length, file).toBe(0);
      });
      $(".posts__items, .tag-page__items, .portfolio__items, .tags").each(
        (_, list) => {
          expect($(list).is('ul[role="list"]'), file).toBe(true);
        },
      );
      $(".comments, .webmentions").each((_, region) => {
        expect($(region).is("section[aria-labelledby]"), file).toBe(true);
      });
    }
  },
);

test("Collections, pagination and article headings expose native semantics", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Main", exact: true }),
  ).toBeVisible();
  const posts = page.getByRole("list", { name: "Blog posts", exact: true });
  await expect(posts.locator(":scope > li > article")).toHaveCount(10);
  const pagination = page.getByRole("navigation", { name: "Pagination" });
  await expect(pagination.getByRole("link", { name: "Previous" })).toHaveCount(
    0,
  );
  await pagination.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/\/2\/$/);
  await expect(
    pagination.getByRole("link", { name: "Previous" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await page.goto("/portfolio/");
  for (const name of ["Contributions at Microsoft", "Open Source"]) {
    const projects = page.getByRole("list", { name, exact: true });
    await expect(
      projects.locator(":scope > li > article").first(),
    ).toBeVisible();
  }
  await page.goto(postPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Being Short", level: 2 }),
  ).toBeVisible();
  const article = page.getByRole("article", {
    name: "On the Etiquette of Pull Request Comments",
    exact: true,
  });
  await expect(article).toBeAttached();
  const sectionLink = article.locator('a.anchor-link[href="#being-short"]');
  await sectionLink.focus();
  await expect(sectionLink).toBeFocused();
  await expect(sectionLink).toHaveCSS("opacity", "1");
  await sectionLink.press("Enter");
  await expect(page).toHaveURL(/#being-short$/);
  await expect(
    page.getByRole("region", { name: "GitHub Comments", exact: true }),
  ).toBeAttached();
});

test("Search exposes a named search landmark and a list of article results", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open search" }).click();
  const search = page.getByRole("search", { name: "Site", exact: true });
  await search
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill("ASP.NET");
  const results = page.getByRole("list", {
    name: "Search results",
    exact: true,
  });
  await expect(results.locator(":scope > li > article").first()).toBeVisible();
  await expect(search.locator("input")).toHaveAttribute("name", "search");
});

test("Web mentions use named regions, lists and correctly nested author headings", async ({
  page,
}) => {
  await page.route(/^https:\/\/webmention\.io\/api\/mentions\?/, (route) =>
    route.fulfill({
      json: {
        links: ["link", "reply"].map((type, index) => ({
          id: index + 1,
          source: `https://example.com/${type}`,
          activity: { type },
          data: {
            url: `https://example.com/${type}`,
            author: { name: "Reader" },
            published: "2026-01-02T00:00:00Z",
            content: "A useful article.",
          },
        })),
      },
    }),
  );
  await page.goto(postPath);
  const mentions = page.getByRole("region", {
    name: "Web Mentions",
    exact: true,
  });
  await mentions.scrollIntoViewIfNeeded();
  await expect(mentions).toHaveAttribute("aria-busy", "false");
  for (const name of ["Links", "Replies"]) {
    const list = mentions.getByRole("list", { name, exact: true });
    await expect(list.locator(":scope > li > article")).toHaveCount(1);
    await expect(
      list.getByRole("heading", {
        name: name === "Links" ? "example.com" : "Reader",
        level: 4,
      }),
    ).toBeVisible();
  }
});

test("Thumbnail options have a clickable label and the border is decorative", async ({
  page,
}) => {
  await page.goto("/streaming/thumbnail/?title=Example&subtitle=Subtitle");
  const background = page.getByLabel("background", { exact: true });
  await page.locator('label[for="thumbnail-background"]').click();
  await expect(background).toBeFocused();
  await background.fill("light");
  await expect(page.locator(".thumbnail")).toHaveClass(
    /thumbnail--background-light/,
  );
  await page.goto("/streaming/border/");
  await expect(page.locator(".border")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("article")).toHaveCount(0);
});
