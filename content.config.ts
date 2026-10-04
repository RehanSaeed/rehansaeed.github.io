import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod";
import { commentSnapshotSchema } from "./shared/utils/comments";

const schema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  permalink: z.string(),
  // Alt text uses the file name; dimensions are read from the image during the build.
  heroImage: z.string().regex(/^\/images\/.+-\d+x\d+\.(png|jpe?g)$/),
  date: z.string(),
  dateModified: z.string().nullable().optional(),
  published: z.boolean(),
  categories: z.array(z.string()),
  tags: z.array(z.string()),
  series: z.string().optional(),
  seriesOrder: z.number().optional(),
  rawbody: z.string(),
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
      schema,
    }),
  },
});
