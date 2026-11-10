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
      date_published: z.iso.datetime(),
      date_modified: z.iso.datetime(),
    }),
  ),
});

test("Feeds preserve article tags and distinguish publication from modification dates", async ({
  request,
}) => {
  const posts = (await scanContent(join(process.cwd(), "content")))
    .filter((entry) => entry.collection === "posts" && entry.data.published)
    .map((entry) => entry.data);
  expect(posts.length).toBeGreaterThan(0);
  expect(posts.some((post) => post.tags.length > 0)).toBe(true);
  expect(posts.some((post) => post.dateModified)).toBe(true);
  expect(posts.some((post) => !post.dateModified)).toBe(true);

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
    const published = new Date(post.date);
    const modified = new Date(post.dateModified ?? post.date);
    expect(
      atomEntries.get(url)?.children("published").text(),
      `${post.permalink}: Atom published`,
    ).toBe(published.toISOString());
    expect(
      atomEntries.get(url)?.children("updated").text(),
      `${post.permalink}: Atom updated`,
    ).toBe(modified.toISOString());
    expect(
      rssItems.get(url)?.children("pubDate").text(),
      `${post.permalink}: RSS publication date`,
    ).toBe(published.toUTCString());
    expect(
      jsonItems.get(url)?.date_published,
      `${post.permalink}: JSON published`,
    ).toBe(published.toISOString());
    expect(
      jsonItems.get(url)?.date_modified,
      `${post.permalink}: JSON modified`,
    ).toBe(modified.toISOString());
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

test("Both RSS endpoints expose each article's generated OG image to Mailchimp", async ({
  request,
}) => {
  const [response, legacyResponse] = await Promise.all([
    request.get("/rss.xml"),
    request.get("/feed/index.xml"),
  ]);
  expect(response.ok()).toBe(true);
  expect(legacyResponse.ok()).toBe(true);
  const xml = await response.text();
  const rss = load(xml, { xml: true });
  const legacy = load(await legacyResponse.text(), { xml: true });
  expect(legacy("rss").attr("xmlns:media")).toBe(
    "http://search.yahoo.com/mrss/",
  );
  expect(legacy("channel > item").toString()).toBe(
    rss("channel > item").toString(),
  );
  expect(rss("rss").attr("xmlns:media")).toBe("http://search.yahoo.com/mrss/");
  const items = rss("channel > item").toArray();
  expect(items.length).toBeGreaterThan(0);

  for (const node of items) {
    const item = rss(node);
    const url = item.children("link").text();
    const page = await request.get(new URL(url).pathname);
    expect(page.ok(), url).toBe(true);
    const html = load(await page.text());
    const media = item.children("media\\:content");
    const image = html('meta[property="og:image"]').attr("content");
    expect(media, url).toHaveLength(1);
    expect(media.attr("url"), url).toBe(image);
    expect(media.attr("medium"), url).toBe("image");
    expect(media.attr("type"), url).toBe("image/png");
    expect(media.attr("width"), url).toBe("1200");
    expect(media.attr("height"), url).toBe("630");
    expect(image, url).toMatch(
      /^https:\/\/rehansaeed\.com\/_og\/s\/o_[a-f0-9]+\.png$/,
    );
    const png = await request.get(new URL(image!).pathname);
    expect(png.ok(), image).toBe(true);
    expect(png.headers()["content-type"], image).toContain("image/png");
    const buffer = await png.body();
    expect(buffer.readUInt32BE(16), image).toBe(1200);
    expect(buffer.readUInt32BE(20), image).toBe(630);
  }
});
