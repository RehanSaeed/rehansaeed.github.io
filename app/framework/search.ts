import { createSearchService } from "#shared/utils/search";

export const siteSearch = createSearchService(() =>
  $fetch<unknown>("/flexsearch.json"),
);
