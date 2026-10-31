import { z } from "zod";

export const webMentionSchema = z.object({
  id: z.union([z.number(), z.string()]),
  source: z.string().optional(),
  verified_date: z.string().optional(),
  activity: z.object({
    type: z.string(),
    sentence_html: z.string().optional(),
  }),
  data: z.object({
    url: z.string().optional(),
    published: z.string().nullish(),
    content: z.string().optional(),
    author: z
      .object({
        name: z.string().nullish(),
        photo: z.string().nullish(),
      })
      .nullish(),
  }),
});

export type WebMention = z.infer<typeof webMentionSchema>;

export function webMentionUrl(mention: WebMention): string {
  const url =
    mention.activity.type === "link" && !mention.data.author?.photo
      ? mention.source
      : mention.data.url;
  if (!url) {
    throw new Error(`Web Mention ${mention.id} has no URL for its activity`);
  }
  return url;
}

export function webMentionTimestamp(mention: WebMention): string {
  const timestamp = mention.data.published ?? mention.verified_date;
  if (!timestamp) {
    throw new Error(
      `Web Mention ${mention.id} has no published or verified timestamp`,
    );
  }
  return timestamp;
}
