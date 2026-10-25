import { queryCollection } from "@nuxt/content/server";
import type { SearchDocument } from "../../shared/types/search";

// Prerendered at the existing search-index URL. The browser builds the
// FlexSearch index from these documents (see app/components/search/search.vue).
export default defineEventHandler(async (event): Promise<SearchDocument[]> => {
  const fields = ["title", "description", "heroImage", "permalink"] as const;
  const [posts, portfolio] = await Promise.all([
    queryCollection(event, "posts")
      .select(...fields)
      .all(),
    queryCollection(event, "portfolio")
      .select(...fields)
      .all(),
  ]);
  return [
    ...posts.map((doc) => ({ ...doc, index: "post" as const })),
    ...portfolio.map((doc) => ({ ...doc, index: "portfolio" as const })),
  ].map((doc, id) => ({ id, ...doc }));
});
