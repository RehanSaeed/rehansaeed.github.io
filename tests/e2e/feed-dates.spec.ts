import { globSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { expect, test } from "@playwright/test";
import { load } from "cheerio";
import type { Feed } from "feed";
import { ModuleKind, transpileModule } from "typescript";
import { parse } from "yaml";
import { z } from "zod";

const origin = "https://rehansaeed.com";
const posts = [
  {
    stem: "posts/2026/unchanged/index",
    title: "Unchanged post",
    description: "An unchanged post.",
    author: "Example author",
    permalink: "/unchanged/",
    heroImage: "/images/hero/Code-1600x900.jpg",
    date: "2026-10-01T10:00:00Z",
    dateModified: null,
    tags: [],
    rawbody: "An unchanged post.",
  },
  {
    stem: "posts/2020/updated/index",
    title: "Updated post",
    description: "A substantively updated post.",
    author: "Example author",
    permalink: "/updated/",
    heroImage: "/images/hero/Code-1600x900.jpg",
    date: "2020-01-02T12:00:00Z",
    dateModified: "2026-11-04T15:00:00Z",
    tags: [],
    rawbody: "A substantively updated post.",
  },
];

const source = transpileModule(readFileSync("server/utils/feed.ts", "utf8"), {
  compilerOptions: { module: ModuleKind.CommonJS },
}).outputText;
const requireDependency = createRequire(join(process.cwd(), "package.json"));
const jsonFeedSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      date_modified: z.string(),
      date_published: z.string(),
    }),
  ),
});

const generateFeed = async (entries = posts) => {
  let selectedFields: (keyof (typeof posts)[number])[] | undefined;
  const query = {
    where: () => query,
    order: () => query,
    select: (...fields: (keyof (typeof posts)[number])[]) => {
      selectedFields = fields;
      return query;
    },
    all: () => {
      const fields = selectedFields;
      return Promise.resolve(
        fields
          ? entries.map((entry) =>
              Object.fromEntries(fields.map((field) => [field, entry[field]])),
            )
          : entries,
      );
    },
  };
  const exports: {
    createFeed?: () => Promise<Feed>;
    rss2?: (feed: Feed) => string;
  } = {};
  runInNewContext(source, {
    exports,
    require: (id: string): unknown => {
      if (id === "@nuxt/content/server") {
        return { queryCollection: () => query };
      }
      if (id === "../../modules/blog-content/paths") {
        return { contentImagesBaseURL: "/content-images" };
      }
      if (id === "../../site.json") {
        return requireDependency("./site.json");
      }
      return requireDependency(id);
    },
  });
  if (!exports.createFeed || !exports.rss2) {
    throw new Error("Missing feed exports");
  }
  const feed = await exports.createFeed();
  // RSS intentionally removes item IDs, so generate it last.
  return {
    atom: load(feed.atom1(), { xml: true }),
    json: jsonFeedSchema.parse(JSON.parse(feed.json1())),
    rss: load(exports.rss2(feed), { xml: true }),
  };
};

test("Generated feeds preserve original publication dates and stable identifiers after an update", async () => {
  const { atom, json, rss } = await generateFeed();
  expect(rss("channel > item")).toHaveLength(posts.length);
  expect(atom("feed > entry")).toHaveLength(posts.length);
  expect(json.items).toHaveLength(posts.length);
  for (const [index, post] of posts.entries()) {
    const url = `${origin}${post.permalink}`;
    const published = new Date(post.date);
    const modified = new Date(post.dateModified ?? post.date);
    const rssItem = rss("channel > item").eq(index);
    expect(rssItem.find("link").text()).toBe(url);
    expect(rssItem.find("guid").text()).toBe(url);
    expect(rssItem.find("guid").attr("isPermaLink")).toBe("true");
    expect(rssItem.find("pubDate").text()).toBe(published.toUTCString());
    const atomEntry = atom("feed > entry").eq(index);
    expect(atomEntry.find("id").text()).toBe(url);
    expect(atomEntry.find("link").attr("href")).toBe(url);
    expect(atomEntry.find("published").text()).toBe(published.toISOString());
    expect(atomEntry.find("updated").text()).toBe(modified.toISOString());
    expect(json.items[index]).toMatchObject({
      id: url,
      url,
      date_published: published.toISOString(),
      date_modified: modified.toISOString(),
    });
  }
});

test("Feed-level update timestamps use the most recently modified post, not the first publication", async () => {
  const { atom, rss } = await generateFeed();
  const latest = new Date(posts[1]!.dateModified!);
  expect(atom("feed > updated").text()).toBe(latest.toISOString());
  expect(rss("channel > lastBuildDate").text()).toBe(latest.toUTCString());
});

test("An empty generated feed retains a valid library-default update timestamp", async () => {
  const before = Date.now();
  const { atom, json, rss } = await generateFeed([]);
  expect(atom("feed > entry")).toHaveLength(0);
  expect(rss("channel > item")).toHaveLength(0);
  expect(json.items).toEqual([]);
  for (const value of [
    atom("feed > updated").text(),
    rss("channel > lastBuildDate").text(),
  ]) {
    // RSS dates have second precision.
    expect(Date.parse(value)).toBeGreaterThanOrEqual(before - 1000);
    expect(Date.parse(value)).toBeLessThanOrEqual(Date.now());
  }
});

test("Built RSS, Atom and JSON feeds use the published articles' source dates", () => {
  const metadataSchema = z.object({
    permalink: z.string(),
    published: z.boolean(),
    date: z.string(),
    dateModified: z.string().nullable(),
  });
  const publishedPosts = globSync("content/posts/**/index.md")
    .map((file) => {
      const source = readFileSync(file, "utf8");
      const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
      if (!frontMatter) {
        throw new Error(`Missing front matter: ${file}`);
      }
      return metadataSchema.parse(parse(frontMatter));
    })
    .filter((post) => post.published);
  const json = jsonFeedSchema.parse(
    JSON.parse(readFileSync(join("dist", "feed.json"), "utf8")),
  );
  const atom = load(readFileSync(join("dist", "atom.xml"), "utf8"), {
    xml: true,
  });
  const rss = load(readFileSync(join("dist", "rss.xml"), "utf8"), {
    xml: true,
  });
  const atomEntries = new Map(
    atom("feed > entry")
      .toArray()
      .map((entry) => [atom(entry).find("id").text(), atom(entry)]),
  );
  const rssItems = new Map(
    rss("channel > item")
      .toArray()
      .map((item) => [rss(item).find("link").text(), rss(item)]),
  );
  expect(publishedPosts.length).toBeGreaterThan(0);
  expect(json.items).toHaveLength(publishedPosts.length);
  expect(atom("feed > entry")).toHaveLength(publishedPosts.length);
  expect(rss("channel > item")).toHaveLength(publishedPosts.length);
  for (const post of publishedPosts) {
    const url = `${origin}${post.permalink}`;
    const jsonItem = json.items.find((item) => item.id === url);
    const published = new Date(post.date);
    const modified = new Date(post.dateModified ?? post.date);
    expect(jsonItem).toMatchObject({
      url,
      date_published: published.toISOString(),
      date_modified: modified.toISOString(),
    });
    expect(atomEntries.get(url)?.find("published").text()).toBe(
      published.toISOString(),
    );
    expect(atomEntries.get(url)?.find("updated").text()).toBe(
      modified.toISOString(),
    );
    expect(rssItems.get(url)?.find("pubDate").text()).toBe(
      published.toUTCString(),
    );
  }
  const latest = new Date(
    Math.max(
      ...publishedPosts.map((post) =>
        new Date(post.dateModified ?? post.date).getTime(),
      ),
    ),
  );
  expect(atom("feed > updated").text()).toBe(latest.toISOString());
  expect(rss("channel > lastBuildDate").text()).toBe(latest.toUTCString());
});
