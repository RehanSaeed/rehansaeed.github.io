import { z } from "zod";
import type { Document } from "flexsearch";

export const searchDocumentSchema = z.object({
  id: z.number(),
  index: z.enum(["post", "portfolio"]),
  title: z.string(),
  description: z.string(),
  heroImage: z.string(),
  permalink: z.string(),
  published: z.boolean(),
  tags: z.array(z.string()),
});

export type SearchDocument = z.infer<typeof searchDocumentSchema>;

export const minimumSearchTermLength = 3;
export const searchResultLimit = 8;

// A single lazy cache serves the search UI and the browser tools. Failed loads
// are evicted so a later request can recover without reloading the page.
export const createSearchService = (fetchDocuments: () => Promise<unknown>) => {
  let documentsPromise: Promise<SearchDocument[]> | undefined;
  let indexPromise:
    | Promise<{
        all: Document<SearchDocument>;
        articles: Document<SearchDocument>;
      }>
    | undefined;

  const loadDocuments = () => {
    documentsPromise ??= fetchDocuments()
      .then((response) => z.array(searchDocumentSchema).parse(response))
      .catch((error: unknown) => {
        documentsPromise = undefined;
        throw error;
      });
    return documentsPromise;
  };

  const loadIndex = () => {
    indexPromise ??= Promise.all([loadDocuments(), import("flexsearch")])
      .then(([documents, { Document }]) => {
        const createIndex = (entries: SearchDocument[]) => {
          const index = new Document<SearchDocument>({
            tokenize: "forward",
            document: {
              id: "id",
              index: ["title", "description"],
              store: true,
            },
          });
          for (const entry of entries) {
            index.add(entry);
          }
          return index;
        };
        return {
          all: createIndex(documents),
          articles: createIndex(
            documents.filter((doc) => doc.index === "post" && doc.published),
          ),
        };
      })
      .catch((error: unknown) => {
        indexPromise = undefined;
        throw error;
      });
    return indexPromise;
  };

  const search = async (
    term: string,
    limit = searchResultLimit,
    articlesOnly = false,
  ) => {
    if (term.length < minimumSearchTermLength) {
      return [];
    }
    const indexes = await loadIndex();
    const index = articlesOnly ? indexes.articles : indexes.all;
    // FlexSearch limits each field; limit the merged results again.
    return index
      .search(term, { limit, enrich: true, merge: true })
      .slice(0, limit)
      .map((result) => {
        if (!result.doc) {
          throw new Error("The search index returned a missing document");
        }
        return result.doc;
      });
  };

  return { loadDocuments, loadIndex, search };
};
