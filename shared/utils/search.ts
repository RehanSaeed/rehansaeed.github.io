import { z } from "zod";

export const searchDocumentSchema = z.object({
  id: z.number(),
  index: z.enum(["post", "portfolio"]),
  title: z.string(),
  description: z.string(),
  heroImage: z.string(),
  permalink: z.string(),
});

export type SearchDocument = z.infer<typeof searchDocumentSchema>;
