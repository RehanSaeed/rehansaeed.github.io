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

export interface PageSnapshot<Schema> {
    status: number;
    lang: string | null;
    title: string;
    meta: Record<string, string | string[]>;
    links: {
        alternate: string[];
        canonical?: string;
    };
    jsonLd: Schema[];
    h1: string[];
    cards: string[];
}

export interface ArtifactSnapshots<Schema> {
    "/404": PageSnapshot<Schema>;
    "/rss.xml": {
        link: string;
        items: { link: string; categories?: string[] }[];
    };
    "/feed/index.xml": {
        link: string;
        items: { link: string; categories?: string[] }[];
    };
    "/feed.json": { items: { url: string; tags?: string[] }[] };
    "/atom.xml": unknown;
    "/atom.xml.atom": unknown;
    "/sitemap.xml": {
        urls: {
            loc: string;
            lastmod: string | null;
            changefreq: string | null;
            priority: string | null;
        }[];
    };
    "/robots.txt": { status: number; body: string };
    "/security.txt": { status: number; body: string };
    "/opensearch.xml": { status: number; body: string };
    "/manifest.webmanifest": {
        icons: { purpose?: string; sizes: string }[];
        scope?: string;
        id?: string;
    };
    "/service-worker.js": { status: number; bytes: number };
    "/flexsearch.json": { status: number; bytes: number };
}
