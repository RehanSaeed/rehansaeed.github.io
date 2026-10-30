export type SearchDocument = {
  id: number;
  title: string;
  description: string;
  heroImage: string;
  permalink: string;
  index: "post" | "portfolio";
};
