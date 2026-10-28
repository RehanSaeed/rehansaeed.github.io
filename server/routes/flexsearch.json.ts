import { queryCollection } from "@nuxt/content/server";

// Prerendered at the existing search-index URL. The browser builds the
// FlexSearch index from these documents (see app/components/search/search.vue).
export default defineEventHandler(async (event) => {
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
    ...posts.map((doc) => ({ ...doc, index: "post" })),
    ...portfolio.map((doc) => ({ ...doc, index: "portfolio" })),
  ].map((doc, id) => ({ id, ...doc }));
});
