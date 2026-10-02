// Captures a parity snapshot of a running site (live or a locally served `dist`).
// Usage: node scripts/parity/snapshot.mjs --base https://rehansaeed.com --out tests/parity/baseline
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import * as cheerio from "cheerio";

const { values: args } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:8080" },
    out: { type: "string", default: ".parity/local" },
    urls: { type: "string", default: "tests/parity/urls.txt" },
    concurrency: { type: "string", default: "8" },
  },
});

const base = args.base.replace(/\/$/, "");
const origin = new URL(base).origin;
const ORIGIN_TOKEN = "{origin}";
const LIVE_ORIGIN = "https://rehansaeed.com";

// Normalise absolute URLs so live and local snapshots are comparable.
const norm = (value) =>
  typeof value === "string"
    ? value.split(origin).join(ORIGIN_TOKEN).split(LIVE_ORIGIN).join(ORIGIN_TOKEN)
    : value;

const normDeep = (value) => {
  if (Array.isArray(value)) return value.map(normDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normDeep(v)]),
    );
  }
  return norm(value);
};

const get = async (path) => {
  const response = await fetch(base + path, { redirect: "manual" });
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    location: response.headers.get("location"),
    body: await response.text(),
  };
};

const text = ($el) => $el.text().replace(/\s+/g, " ").trim();

const extractHead = (html) => {
  const $ = cheerio.load(html);
  const meta = {};
  $("meta").each((_, el) => {
    const key = $(el).attr("property") ?? $(el).attr("name");
    if (!key || key === "viewport" || key === "generator") return;
    const content = norm($(el).attr("content") ?? "");
    meta[key] = key in meta ? [meta[key], content].flat() : content;
  });

  const links = {};
  $("link[rel]").each((_, el) => {
    const rel = $(el).attr("rel");
    if (!/^(canonical|prev|next|alternate|search|manifest|me|webmention|pingback)$/.test(rel))
      return;
    const value = [norm($(el).attr("href")), $(el).attr("type"), $(el).attr("title")]
      .filter(Boolean)
      .join(" | ");
    links[rel] = rel in links ? [links[rel], value].flat() : value;
  });

  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(normDeep(JSON.parse($(el).html())));
    } catch {
      jsonLd.push({ invalid: $(el).html() });
    }
  });

  const cards = $(".post-card__title")
    .map((_, el) => text($(el)))
    .get();

  return {
    lang: $("html").attr("lang") ?? null,
    title: text($("head > title")),
    meta,
    links,
    jsonLd,
    h1: $("h1")
      .map((_, el) => text($(el)))
      .get(),
    cards,
  };
};

const pool = async (items, size, worker) => {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i]);
      }
    }),
  );
  return results;
};

const summariseRss = (xml) => {
  const $ = cheerio.load(xml, { xml: true });
  return {
    title: text($("channel > title")),
    link: norm(text($("channel > link"))),
    items: $("item")
      .map((_, el) => ({
        title: text($(el).find("title")),
        link: norm(text($(el).find("link"))),
        guid: norm(text($(el).find("guid"))),
        pubDate: text($(el).find("pubDate")),
        categories: $(el)
          .find("category")
          .map((_, c) => text($(c)))
          .get(),
      }))
      .get(),
  };
};

const summariseAtom = (xml) => {
  const $ = cheerio.load(xml, { xml: true });
  return {
    title: text($("feed > title")),
    id: norm(text($("feed > id"))),
    entries: $("entry")
      .map((_, el) => ({
        title: text($(el).find("title")),
        id: norm(text($(el).find("id"))),
        link: norm($(el).find("link").attr("href")),
        updated: text($(el).find("updated")),
        published: text($(el).find("published")),
      }))
      .get(),
  };
};

const summariseJsonFeed = (body) => {
  const feed = JSON.parse(body);
  return {
    version: feed.version,
    title: feed.title,
    home_page_url: norm(feed.home_page_url),
    feed_url: norm(feed.feed_url),
    items: (feed.items ?? []).map((item) => ({
      id: norm(item.id),
      url: norm(item.url),
      title: item.title,
      date_published: item.date_published,
      date_modified: item.date_modified,
      tags: item.tags,
    })),
  };
};

const summariseSitemap = (xml) => {
  const $ = cheerio.load(xml, { xml: true });
  return {
    urls: $("url")
      .map((_, el) => ({
        loc: norm(text($(el).find("loc"))),
        lastmod: text($(el).find("lastmod")) || null,
        changefreq: text($(el).find("changefreq")) || null,
        priority: text($(el).find("priority")) || null,
      }))
      .get()
      .sort((a, b) => a.loc.localeCompare(b.loc)),
  };
};

const artifact = async (path, summarise) => {
  const response = await get(path);
  if (response.status !== 200) return { status: response.status };
  try {
    return { status: 200, ...(summarise ? summarise(response.body) : { body: norm(response.body) }) };
  } catch (error) {
    return { status: 200, error: String(error) };
  }
};

const main = async () => {
  const urls = (await readFile(args.urls, "utf8"))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();

  console.log(`Snapshotting ${urls.length} pages from ${base}`);
  const pages = {};
  let done = 0;
  await pool(urls, Number(args.concurrency), async (path) => {
    const response = await get(path);
    pages[path] =
      response.status === 200
        ? { status: 200, ...extractHead(response.body) }
        : { status: response.status, location: norm(response.location) };
    if (++done % 50 === 0) console.log(`  ${done}/${urls.length}`);
  });

  const notFound = await get("/this-does-not-exist/");
  const artifacts = {
    "/404": { status: notFound.status, ...extractHead(notFound.body) },
    "/rss.xml": await artifact("/rss.xml", summariseRss),
    "/feed/index.xml": await artifact("/feed/index.xml", summariseRss),
    "/atom.xml": await artifact("/atom.xml", summariseAtom),
    "/atom.xml.atom": await artifact("/atom.xml.atom", summariseAtom),
    "/feed.json": await artifact("/feed.json", summariseJsonFeed),
    "/sitemap.xml": await artifact("/sitemap.xml", summariseSitemap),
    "/robots.txt": await artifact("/robots.txt"),
    "/security.txt": await artifact("/security.txt"),
    "/opensearch.xml": await artifact("/opensearch.xml"),
    "/manifest.webmanifest": await artifact("/manifest.webmanifest", (b) =>
      normDeep(JSON.parse(b)),
    ),
    "/service-worker.js": await artifact("/service-worker.js", (b) => ({
      bytes: b.length,
    })),
    "/flexsearch.json": await artifact("/flexsearch.json", (b) => ({
      bytes: b.length,
    })),
  };

  const sortedPages = Object.fromEntries(
    Object.keys(pages)
      .sort()
      .map((key) => [key, pages[key]]),
  );

  await mkdir(args.out, { recursive: true });
  await writeFile(join(args.out, "pages.json"), JSON.stringify(sortedPages, null, 2) + "\n");
  await writeFile(join(args.out, "artifacts.json"), JSON.stringify(artifacts, null, 2) + "\n");

  const failed = Object.entries(pages).filter(([, page]) => page.status !== 200);
  console.log(`Wrote ${args.out} (${failed.length} non-200 pages)`);
  for (const [path, page] of failed) console.log(`  ${page.status} ${path}`);
};

await main();
