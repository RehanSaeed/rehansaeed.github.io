import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "cheerio";
import { test as unitTest } from "@playwright/test";
import { expect, test } from "./fixtures";
import { fromMarkdown } from "mdast-util-from-markdown";
import { remarkSoftBreaks } from "../../modules/blog-content/markdown";
import { pageHeadingId } from "../../shared/utils/headings";

const post = "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const timestamp = "2022-05-17T23:08:49Z";

unitTest(
  "Initial absolute dates are identical in UTC, London, New York and Tokyo",
  () => {
    for (const TZ of [
      "UTC",
      "Europe/London",
      "America/New_York",
      "Asia/Tokyo",
    ]) {
      const result = execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `
      import { getAbsoluteDisplayDateFromString } from './app/framework/date.js';
      console.log(JSON.stringify(['2022-05-17T23:08:49Z', '2022-05-17T01:08:49Z']
        .map(getAbsoluteDisplayDateFromString)));
    `,
        ],
        { env: { ...process.env, TZ }, encoding: "utf8" },
      );
      expect(JSON.parse(result), TZ).toEqual(["17 May 2022", "17 May 2022"]);
    }
  },
);

unitTest(
  "Soft breaks separate inline content without changing code or hard breaks",
  () => {
    const tree = fromMarkdown(
      "[Link](https://example.com)\n[Empty Link]()\n\n`a`\n**b**  \nc\n\n```\na\nb\n```",
    );
    remarkSoftBreaks()(tree);
    const paragraph = tree.children[0];
    expect(paragraph).toMatchObject({
      children: [
        { type: "link" },
        { type: "text", value: " " },
        { type: "link" },
      ],
    });
    expect(tree.children[1]).toMatchObject({
      children: [
        { type: "inlineCode", value: "a" },
        { type: "text", value: " " },
        { type: "strong" },
        { type: "break" },
        { type: "text", value: "c" },
      ],
    });
    expect(tree.children[2]).toMatchObject({ type: "code", value: "a\nb" });
  },
);

unitTest(
  "Page titles preserve Markdown fragment IDs and avoid nested collisions",
  () => {
    expect(pageHeadingId("Example Title")).toBe("example-title");
    expect(
      pageHeadingId("Example", [
        ["div", {}, ["h2", { id: "example" }, "Example"]],
        ["h3", { id: "example-title-1" }, "Another heading"],
      ]),
    ).toBe("example-title-2");
  },
);

unitTest(
  "Every generated reference page and the custom 404 have unique IDs",
  () => {
    const routes = readFileSync(
      join(process.cwd(), "tests/parity/urls.txt"),
      "utf8",
    )
      .trim()
      .split(/\r?\n/);
    for (const path of [...routes, "/404.html"]) {
      const file = path.endsWith(".html") ? path : `${path}index.html`;
      const $ = load(readFileSync(join(process.cwd(), "dist", file), "utf8"));
      const ids = $("[id]")
        .map((_, element) => $(element).attr("id"))
        .get();
      expect(ids.length, path).toBe(new Set(ids).size);
    }
  },
);

test("Adjacent Markdown links remain visibly separated after hydration", async ({
  page,
}) => {
  const response = await page.goto("/cheat-sheet/");
  const $ = load(await response!.text());
  expect(
    $(".post__content p")
      .filter((_, element) => $(element).text().includes("Empty Link"))
      .text()
      .trim(),
  ).toBe("Link Empty Link");
  await expect(
    page.locator(".post__content p").filter({ hasText: "Empty Link" }),
  ).toHaveText("Link Empty Link");
});

for (const timezoneId of ["Europe/London", "America/New_York", "Asia/Tokyo"]) {
  test.describe(`Date hydration in ${timezoneId}`, () => {
    test.use({ timezoneId });
    test("Starts in UTC and deliberately switches to the browser date after mounting", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (/hydration.*mismatch|hydration completed/i.test(message.text()))
          errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      let resume!: () => void;
      const blocked = new Promise<void>((resolve) => {
        resume = resolve;
      });
      await page.route("**/_nuxt/*.js", async (route) => {
        await blocked;
        await route.continue();
      });
      try {
        await page.goto(post, { waitUntil: "commit" });
        const date = page.locator(
          `.vssue-comment time[datetime="${timestamp}"]`,
        );
        await expect(date).toHaveText("17 May 2022");
        resume();
        await expect(
          page.getByRole("button", { name: "Open search" }),
        ).toBeEnabled();
        const local = await page.evaluate(
          (timestamp) =>
            new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(timestamp)),
          timestamp,
        );
        await expect(date).toHaveText(local);
        expect(errors).toEqual([]);
      } finally {
        resume();
      }
    });
  });
}

test("Search has a unique labelled input and cannot duplicate page or result headings", async ({
  page,
}) => {
  await page.goto("/asp-net-mvc-boilerplate/");
  await expect(page.locator(".post__content #search")).toHaveCount(1);
  await page.getByRole("button", { name: "Open search" }).click();
  const search = page.getByRole("searchbox", { name: "Search", exact: true });
  await search.fill("ASP.NET Core Boilerplate");
  await expect(page.locator(".search-result__link").first()).toBeVisible();
  await search.fill("NET Boxed");
  await expect(
    page.locator(".search-result__title").filter({ hasText: /^\.NET Boxed$/ }),
  ).toHaveCount(2);
  const ids = await page
    .locator("[id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(ids.length).toBe(new Set(ids).size);
});
