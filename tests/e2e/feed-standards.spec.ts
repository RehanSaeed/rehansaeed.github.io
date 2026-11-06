import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { load } from "cheerio";
import { z } from "zod";
import { scanContent } from "../../modules/blog-content/scan";

const origin = "https://rehansaeed.com";
const jsonFeedSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      tags: z.array(z.string()).optional(),
    }),
  ),
});

test("Feeds preserve article tags as Atom terms, RSS categories and JSON tags", async ({
  request,
}) => {
  const posts = (await scanContent(join(process.cwd(), "content")))
    .filter((entry) => entry.collection === "posts" && entry.data.published)
    .map((entry) => entry.data);
  expect(posts.length).toBeGreaterThan(0);
  expect(posts.some((post) => post.tags.length > 0)).toBe(true);

  const [atomResponse, rssResponse, jsonResponse] = await Promise.all([
    request.get("/atom.xml"),
    request.get("/rss.xml"),
    request.get("/feed.json"),
  ]);
  expect(atomResponse.ok()).toBe(true);
  expect(rssResponse.ok()).toBe(true);
  expect(jsonResponse.ok()).toBe(true);
  const atom = load(await atomResponse.text(), { xml: true });
  const rss = load(await rssResponse.text(), { xml: true });
  const json = jsonFeedSchema.parse(await jsonResponse.json());
  const atomEntries = new Map(
    atom("feed > entry")
      .toArray()
      .map((entry) => [atom(entry).children("id").text(), atom(entry)]),
  );
  const rssItems = new Map(
    rss("channel > item")
      .toArray()
      .map((item) => [rss(item).children("link").text(), rss(item)]),
  );
  const jsonItems = new Map(json.items.map((item) => [item.id, item]));
  expect(atom("feed > entry")).toHaveLength(posts.length);
  expect(rss("channel > item")).toHaveLength(posts.length);
  expect(json.items).toHaveLength(posts.length);
  expect(atomEntries.size).toBe(posts.length);
  expect(rssItems.size).toBe(posts.length);
  expect(jsonItems.size).toBe(posts.length);

  for (const post of posts) {
    const url = `${origin}${post.permalink}`;
    const categories = atomEntries.get(url)?.children("category").toArray();
    expect(jsonItems.has(url), `${post.permalink}: JSON item`).toBe(true);
    expect(
      categories?.map((category) => atom(category).attr("term")),
      `${post.permalink}: Atom terms`,
    ).toEqual(post.tags);
    expect(
      categories?.map((category) => atom(category).attr("label")),
      `${post.permalink}: Atom labels`,
    ).toEqual(post.tags);
    expect(
      rssItems
        .get(url)
        ?.children("category")
        .toArray()
        .map((category) => rss(category).text()),
      `${post.permalink}: RSS categories`,
    ).toEqual(post.tags);
    expect(
      jsonItems.get(url)?.tags ?? [],
      `${post.permalink}: JSON tags`,
    ).toEqual(post.tags);
  }
});

test("Rendered feed discovery declares the format-specific media types", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const html = load(await response.text());
  const alternates = html('head link[rel~="alternate"]');

  for (const [path, type] of [
    ["/atom.xml", "application/atom+xml"],
    ["/feed.json", "application/feed+json"],
    ["/rss.xml", "application/rss+xml"],
  ]) {
    const links = alternates.filter(
      (_, link) => html(link).attr("href") === `${origin}${path}`,
    );
    expect(links, path).toHaveLength(1);
    expect(links.attr("type"), path).toBe(type);
  }
});
