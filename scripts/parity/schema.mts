export interface SchemaImage {
    /** Schema.org type identifying this entity. */
    "@type": "ImageObject";
    /** URL identifying the referenced resource. */
    url: string;
    /** Image width in pixels. */
    width: number | string;
    /** Image height in pixels. */
    height: number | string;
    /** Caption describing the image. */
    caption?: string;
    /** Legacy image caption. */
    alternativeHeadline?: string;
}

interface Reference {
    /** Stable identifier used to reference this entity. */
    "@id": string;
}

interface GraphNode extends Reference {
    /** Display name of the entity. */
    name?: string;
    /** URL identifying the referenced resource. */
    url?: string;
}

export type SchemaNode =
    | (GraphNode & {
          /** Schema.org type identifying this entity. */
          "@type": "Person";
      })
    | (GraphNode & {
          /** Schema.org type identifying this entity. */
          "@type": "Organization";
          /** Logo representing the entity. */
          logo: SchemaImage | string;
      })
    | (GraphNode & {
          /** Schema.org type identifying this entity. */
          "@type": "WebSite";
          /** Reference to the author. */
          author: Reference;
          /** Reference to the publisher. */
          publisher: Reference;
          /** Actions supported by the website. */
          potentialAction: {
              /** Destination of the action. */
              target: {
                  /** URL template used for website search. */
                  urlTemplate: string;
              };
          }[];
      })
    | (GraphNode & {
          /** Schema.org type identifying this entity. */
          "@type":
              | "WebPage"
              | "CollectionPage"
              | "ProfilePage"
              | ("WebPage" | "CollectionPage" | "ProfilePage")[];
          /** Reference to the page's main entity. */
          mainEntity?: Reference;
      })
    | (GraphNode & {
          /** Schema.org type identifying this entity. */
          "@type": "Article";
          /** Article headline. */
          headline: string;
          /** Description of the article. */
          description?: string;
          /** Keywords associated with the article. */
          keywords?: string[];
          /** Reference to the author. */
          author: Reference;
          /** Reference to the publisher. */
          publisher: Reference;
          /** Reference to the article's containing page. */
          mainEntityOfPage: Reference;
          /** Images describing the entity. */
          image: SchemaImage[];
          /** Original publication date. */
          datePublished: string;
          /** Last modification date. */
          dateModified: string;
      })
    | (GraphNode & {
          /** Schema.org type identifying this entity. */
          "@type": "ItemList";
          /** Ordered entries in the list. */
          itemListElement: {
              /** One-based position in the list. */
              position: number;
              /** URL identifying the referenced resource. */
              url?: string;
              /** Resource represented by the list entry. */
              item?: {
                  /** URL of the list entry. */
                  url: string;
              };
          }[];
      })
    | (GraphNode & {
          /** Schema.org type identifying this entity. */
          "@type": "BreadcrumbList";
          /** Ordered entries in the list. */
          itemListElement: {
              /** Resource represented by the breadcrumb. */
              item: Reference | string;
          }[];
      })
    | (GraphNode & SchemaImage);

export interface SchemaGraph {
    /** Schema.org vocabulary URL. */
    "@context": string;
    /** Entities in the structured-data graph. */
    "@graph": SchemaNode[];
}

interface LegacyIdentity {
    /** Logo representing the entity. */
    logo?: SchemaImage[];
    /** Images describing the entity. */
    image?: SchemaImage[];
}

export type LegacySchema = {
    /** Reference to the author. */
    author?: LegacyIdentity;
    /** Images describing the entity. */
    image: SchemaImage[];
    /** URL identifying the referenced resource. */
    url: string;
} & (
    | {
          /** Schema.org type identifying this entity. */
          "@type": "WebSite";
      }
    | {
          /** Schema.org type identifying this entity. */
          "@type": "Article";
          /** Article headline. */
          headline: string;
          /** Description of the article. */
          description: string;
          /** Keywords associated with the article. */
          keywords: string;
          /** Reference to the article's containing page. */
          mainEntityOfPage: Reference;
          /** Original publication date. */
          datePublished: string;
          /** Last modification date. */
          dateModified: string | null;
      }
);
