import { z } from "zod";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

type TestTool = {
  name: string;
  annotations: { readOnlyHint: boolean; consequentialHint: boolean };
  execute: (
    input: unknown,
    options: { signal: AbortSignal },
  ) => Promise<unknown>;
};
declare global {
  interface Window {
    webmcpTestTools: Map<string, TestTool>;
  }
}

const installMock = (page: Page) =>
  page.addInitScript(() => {
    window.webmcpTestTools = new Map();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: (tool: TestTool, { signal }: { signal: AbortSignal }) => {
          if (window.webmcpTestTools.has(tool.name)) {
            return Promise.reject(new Error("Duplicate WebMCP tool"));
          }
          window.webmcpTestTools.set(tool.name, tool);
          signal.addEventListener(
            "abort",
            () => window.webmcpTestTools.delete(tool.name),
            { once: true },
          );
          return Promise.resolve();
        },
      },
    });
  });

const runTool = (page: Page, name: string, input: object) =>
  page.evaluate(
    async ({ name, input }) => {
      const tool = window.webmcpTestTools.get(name);
      if (!tool) {
        throw new Error(`Tool not registered: ${name}`);
      }
      return tool.execute(input, { signal: new AbortController().signal });
    },
    { name, input },
  );

const outlineSchema = z.object({
  title: z.string(),
  url: z.url(),
  headings: z.array(
    z.object({ level: z.number(), text: z.string(), url: z.url() }),
  ),
  truncated: z.boolean(),
});

test("Mocked API registers lazily and both tool search and ordinary accessible search reuse one index", async ({
  page,
}) => {
  await installMock(page);
  let downloads = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/flexsearch.json") {
      downloads++;
    }
  });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.webmcpTestTools.size))
    .toBe(3);
  expect(downloads).toBe(0);
  const results = z
    .object({
      articles: z.array(
        z.object({ title: z.string(), description: z.string(), url: z.url() }),
      ),
    })
    .parse(await runTool(page, "search_articles", { query: "CSS", limit: 3 }));
  expect(results.articles.length).toBeGreaterThan(0);
  expect(results.articles.length).toBeLessThanOrEqual(3);
  for (const article of results.articles) {
    expect(article.url).toMatch(/^https:\/\/rehansaeed.com\//);
  }
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  const input = page.getByRole("searchbox", { name: "Search", exact: true });
  await expect(input).toBeFocused();
  await input.fill("CSS");
  await expect(page.locator(".search-result__link").first()).toBeVisible();
  expect(downloads).toBe(1);
  await expect(input).toBeFocused();
  const topics = z
    .object({
      topics: z.array(
        z.object({ name: z.string(), articleCount: z.number(), url: z.url() }),
      ),
    })
    .parse(await runTool(page, "list_topics", { query: "CSS" }));
  expect(topics.topics.length).toBeGreaterThan(0);
  for (const topic of topics.topics) {
    expect(topic.articleCount).toBeGreaterThan(0);
    expect(topic.url).toMatch(/^https:\/\/rehansaeed.com\/tag\//);
  }
  expect(downloads).toBe(1);
});

test("Mocked outline matches rendered heading fragments and stays fresh after ordinary SPA search navigation", async ({
  page,
}) => {
  await installMock(page);
  await page.goto(
    "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
  );
  await expect
    .poll(() => page.evaluate(() => window.webmcpTestTools.size))
    .toBe(3);
  const first = outlineSchema.parse(
    await runTool(page, "get_article_outline", {}),
  );
  const expected = await page
    .locator(".post__content :is(h1,h2,h3,h4,h5,h6)[id]")
    .evaluateAll((headings) =>
      headings.map((heading) => ({
        id: heading.id,
        text: heading.textContent.trim(),
      })),
    );
  expect(first.headings.length).toBeGreaterThan(0);
  expect(
    first.headings.map((heading) => ({
      id: decodeURIComponent(new URL(heading.url).hash.slice(1)),
      text: heading.text,
    })),
  ).toEqual(expected);
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill("CSS");
  const link = page
    .locator(".search-result[data-view-transition-source] .search-result__link")
    .first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).not.toBeNull();
  const path = new URL(href!, page.url()).pathname;
  await link.click();
  await expect(page.locator(".post-page")).toHaveAttribute(
    "data-post-permalink",
    path,
  );
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeHidden();
  const next = outlineSchema.parse(
    await runTool(page, "get_article_outline", {}),
  );
  expect(next.url).toBe(`https://rehansaeed.com${path}`);
  expect(next.url).not.toBe(first.url);
  for (const heading of next.headings) {
    expect(heading.url).toContain(next.url);
  }
  expect(await page.evaluate(() => window.webmcpTestTools.size)).toBe(3);
  // Simulate a committed new route before replacement DOM has rendered.
  await page.locator(".post-page").evaluate((article) => {
    article.setAttribute("data-post-permalink", "/previous-route/");
  });
  await expect(runTool(page, "get_article_outline", {})).rejects.toThrow(
    /no rendered published article/,
  );
});

test("Mocked outline rejects drafts and invalid arguments", async ({
  page,
}) => {
  await installMock(page);
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.webmcpTestTools.size))
    .toBe(3);
  await expect(runTool(page, "get_article_outline", {})).rejects.toThrow(
    /no rendered published article/,
  );
  await expect(
    runTool(page, "search_articles", { query: "ab" }),
  ).rejects.toThrow();
  await page.goto(
    "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
  );
  await expect
    .poll(() => page.evaluate(() => window.webmcpTestTools.size))
    .toBe(3);
  await page.locator(".post-page").evaluate((article) => {
    article.setAttribute("data-post-published", "false");
  });
  await expect(runTool(page, "get_article_outline", {})).rejects.toThrow(
    /no rendered published article/,
  );
});

test("Unsupported current API leaves ordinary search and keyboard focus unchanged", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "modelContext", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  const input = page.getByRole("searchbox", { name: "Search", exact: true });
  await expect(input).toBeFocused();
  await input.fill("CSS");
  await expect(page.locator(".search-result__link").first()).toBeVisible();
  await expect(input).toBeFocused();
});
