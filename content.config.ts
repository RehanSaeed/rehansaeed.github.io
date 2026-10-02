import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod";

const schema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  permalink: z.string(),
  // OG image dimensions and alt text are parsed from the file name.
  heroImage: z.string().regex(/^\/images\/.+-\d+x\d+\.(png|jpe?g)$/),
  date: z.string(),
  dateModified: z.string().nullable().optional(),
  published: z.boolean(),
  categories: z.array(z.string()),
  tags: z.array(z.string()),
  series: z.string().optional(),
  seriesOrder: z.number().optional(),
  rawbody: z.string(),
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
      schema,
    }),
  },
});
