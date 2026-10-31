export interface SchemaImage {
    "@type": "ImageObject";
    url: string;
    width: number | string;
    height: number | string;
    caption?: string;
    alternativeHeadline?: string;
}

interface Reference {
    "@id": string;
}

interface GraphNode extends Reference {
    name?: string;
    url?: string;
}

export type SchemaNode =
    | (GraphNode & {
          "@type": "Person";
      })
    | (GraphNode & {
          "@type": "Organization";
          logo: SchemaImage | string;
      })
    | (GraphNode & {
          "@type": "WebSite";
          author: Reference;
          publisher: Reference;
          potentialAction: { target: { urlTemplate: string } }[];
      })
    | (GraphNode & {
          "@type":
              | "WebPage"
              | "CollectionPage"
              | "ProfilePage"
              | ("WebPage" | "CollectionPage" | "ProfilePage")[];
          mainEntity?: Reference;
      })
    | (GraphNode & {
          "@type": "Article";
          headline: string;
          description?: string;
          keywords?: string[];
          author: Reference;
          publisher: Reference;
          mainEntityOfPage: Reference;
          image: SchemaImage[];
          datePublished: string;
          dateModified: string;
      })
    | (GraphNode & {
          "@type": "ItemList";
          itemListElement: {
              position: number;
              url?: string;
              item?: { url: string };
          }[];
      })
    | (GraphNode & {
          "@type": "BreadcrumbList";
          itemListElement: { item: Reference | string }[];
      })
    | (GraphNode & SchemaImage);

export interface SchemaGraph {
    "@context": string;
    "@graph": SchemaNode[];
}

interface LegacyIdentity {
    logo?: SchemaImage[];
    image?: SchemaImage[];
}

export type LegacySchema = {
    author?: LegacyIdentity;
    image: SchemaImage[];
    url: string;
} & (
    | { "@type": "WebSite" }
    | {
          "@type": "Article";
          headline: string;
          description: string;
          keywords: string;
          mainEntityOfPage: Reference;
          datePublished: string;
          dateModified: string | null;
      }
);
