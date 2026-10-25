import type {
  PostsCollectionItem,
  PortfolioCollectionItem,
} from "@nuxt/content";

export type PostMeta = Pick<
  PostsCollectionItem,
  "date" | "dateModified" | "timeToRead"
>;

export type PostCard = PostMeta &
  Pick<PostsCollectionItem, "id" | "title" | "description" | "permalink"> &
  Partial<Pick<PostsCollectionItem, "heroImage" | "tags">> & {
    poster?: string;
  };

export type PostContent = Pick<
  PostsCollectionItem,
  "title" | "body" | "meta" | "heroImage" | "tags" | "stem" | "extension"
>;

export type PortfolioCard = Pick<
  PortfolioCollectionItem,
  | "id"
  | "title"
  | "description"
  | "heroImage"
  | "permalink"
  | "tags"
  | "repository"
  | "stars"
  | "forks"
  | "nugetPackages"
  | "nugetDownloads"
>;
