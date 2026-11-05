import { z } from "zod";

const timestampSchema = z
  .string()
  .refine((value) => value === "" || Number.isFinite(Date.parse(value)), {
    message: "Web Mention has an invalid timestamp",
  });

export const webMentionSchema = z.object({
  id: z.union([z.number(), z.string()]),
  source: z.string().optional(),
  verified_date: timestampSchema.optional(),
  activity: z.object({
    type: z.string(),
    sentence_html: z.string().optional(),
  }),
  data: z.object({
    url: z.string().optional(),
    published: timestampSchema.nullish(),
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
  if (!URL.canParse(url)) {
    throw new Error(`Web Mention ${mention.id} has an invalid URL`);
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
  return timestampSchema.parse(timestamp);
}
