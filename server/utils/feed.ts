import { posix } from "node:path";
import type { H3Event } from "h3";
import { queryCollection } from "@nuxt/content/server";
import { Feed } from "feed";
import { marked } from "marked";
import { contentImagesBaseURL } from "../../modules/blog-content/paths";
import site from "../../site.json";

const frontMatterPattern = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const relativeImagePattern =
  /^(?![a-z][a-z\d+.-]*:|\/|#).+\.(png|jpe?g|gif|svg|webp|avif)$/i;
const urlAttributePattern = /\b(href|src)="([^"]*)"/g;

/**
 * Feed readers can't resolve site-relative URLs, so make root-relative links absolute and point
 * co-located images (e.g. `images/foo.png`) at their copies under contentImagesBaseURL.
 */
function absoluteUrls(html: string, contentDir: string): string {
  return html.replace(urlAttributePattern, (match, attribute, value) => {
    if (value.startsWith("/") && !value.startsWith("//")) {
      return `${attribute}="${site.url}${value}"`;
    }
    if (relativeImagePattern.test(value)) {
      const path = posix.join(contentImagesBaseURL, contentDir, value);
      return `${attribute}="${site.url}${path}"`;
    }
    return match;
  });
}

/** The RSS, Atom and JSON feeds of published posts, as previously built by gridsome-plugin-feed. */
export async function createFeed(event: H3Event): Promise<Feed> {
  const posts = await queryCollection(event, "posts")
    .where("published", "=", true)
    .order("date", "DESC")
    .select(
      "stem",
      "title",
      "description",
      "author",
      "permalink",
      "heroImage",
      "date",
      "tags",
      "rawbody",
    )
    .all();

  const feed = new Feed({
    title: site.name,
    description: site.description,
    id: site.url,
    link: site.url,
    language: site.language,
    image: `${site.url}/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg`,
    favicon: `${site.url}/favicon.ico`,
    copyright: `Copyright © ${new Date().getFullYear()} ${site.author.name}`,
    generator: "Nuxt",
    feedLinks: {
      atom: `${site.url}/atom.xml`,
      json: `${site.url}/feed.json`,
      rss: `${site.url}/rss.xml`,
    },
    author: { name: site.author.name, link: site.url },
  });

  for (const post of posts) {
    const contentDir = posix.dirname(post.stem);
    const markdown = post.rawbody.replace(frontMatterPattern, "");
    const url = site.url + post.permalink;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: absoluteUrls(post.description, contentDir),
      content: absoluteUrls(await marked(markdown), contentDir),
      author: [{ name: post.author, link: site.url }],
      date: new Date(post.date),
      category: post.tags.map((name) => ({ name })),
      image: site.url + post.heroImage,
    });
  }

  return feed;
}

/** RSS 2.0. Items without an id get permalink guids, matching the Gridsome feed. */
export function rss2(feed: Feed): string {
  for (const item of feed.items) {
    delete item.id;
  }
  return feed.rss2();
}
