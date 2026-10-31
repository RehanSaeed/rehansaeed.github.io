import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod";
import { defineRobotsSchema, defineSitemapSchema } from "@nuxtjs/seo/content";
import { commentSnapshotSchema } from "./shared/utils/comments";

const schema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  permalink: z.string(),
  // Alt text uses the file name; dimensions are read from the image during the build.
  heroImage: z.string().regex(/^\/images\/.+-\d+x\d+\.(png|jpg)$/),
  date: z.string(),
  dateModified: z.string().nullable().optional(),
  published: z.boolean(),
  categories: z.array(z.string()),
  tags: z.array(z.string()),
  series: z.string().optional(),
  seriesOrder: z.number().optional(),
  rawbody: z.string(),
  robots: defineRobotsSchema(),
  sitemap: defineSitemapSchema({
    name: "posts",
    filter: (entry) =>
      entry.published === true &&
      typeof entry.permalink === "string" &&
      entry.permalink.startsWith("/"),
    onUrl: (url, entry) => {
      if (typeof entry.permalink === "string") {
        url.loc = entry.permalink;
      }
      if (typeof (entry.dateModified ?? entry.date) === "string") {
        url.lastmod = String(entry.dateModified ?? entry.date);
      }
      if (typeof entry.heroImage === "string") {
        url.images = [{ loc: entry.heroImage }];
      }
    },
  }),
  comments: commentSnapshotSchema,
  // Computed in modules/blog-content (content:file:afterParse).
  timeToRead: z.number().optional(),
  headings: z
    .array(z.object({ depth: z.number(), value: z.string() }))
    .optional(),
});

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      type: "page",
      source: "posts/**/index.md",
      schema,
    }),
    portfolio: defineCollection({
      type: "page",
      source: "portfolio/**/index.md",
      schema: schema.extend({
        kind: z.enum(["open-source", "microsoft"]).default("open-source"),
        heroImageSource: z.url().optional(),
        position: z.number().int().nonnegative().default(0),
        repository: z
          .string()
          .regex(/^[\w-]+\/[\w.-]+$/)
          .optional(),
        stars: z.number().int().nonnegative().default(0),
        forks: z.number().int().nonnegative().default(0),
        nugetDownloads: z.number().int().nonnegative().default(0),
        nugetPackages: z
          .array(
            z.object({
              id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/),
              downloads: z.number().int().nonnegative(),
            }),
          )
          .default([]),
        sitemap: defineSitemapSchema({
          name: "portfolio",
          filter: () => false,
        }),
      }),
    }),
  },
});
