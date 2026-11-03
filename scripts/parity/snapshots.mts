export interface PageSnapshot<Schema> {
    /** HTTP response status. */
    status: number;
    /** Language declared by the document. */
    lang: string | null;
    /** Document title. */
    title: string;
    /** Metadata values keyed by property or name. */
    meta: Partial<Record<string, string | string[]>>;
    /** Document links grouped by relationship. */
    links: {
        /** Snapshot alternate value. */
        alternate: string[];
        /** Snapshot canonical value. */
        canonical?: string;
    };
    /** Parsed structured-data blocks. */
    jsonLd: Schema[];
    /** Top-level heading texts. */
    h1: string[];
    /** Card destination URLs. */
    cards: string[];
}

export interface ArtifactSnapshots<Schema> {
    /** Captured response for /404. */
    "/404": PageSnapshot<Schema>;
    /** Captured response for /rss.xml. */
    "/rss.xml": {
        /** Snapshot link value. */
        link: string;
        /** Snapshot items value. */
        items: { link: string; categories?: string[] }[];
    };
    /** Captured response for /feed/index.xml. */
    "/feed/index.xml": {
        /** Snapshot link value. */
        link: string;
        /** Snapshot items value. */
        items: { link: string; categories?: string[] }[];
    };
    /** Captured response for /feed.json. */
    "/feed.json": { items: { url: string; tags?: string[] }[] };
    /** Captured response for /atom.xml. */
    "/atom.xml": unknown;
    /** Captured response for /atom.xml.atom. */
    "/atom.xml.atom": unknown;
    /** Captured response for /sitemap.xml. */
    "/sitemap.xml": {
        /** Snapshot urls value. */
        urls: {
            /** Snapshot loc value. */
            loc: string;
            /** Snapshot lastmod value. */
            lastmod: string | null;
            /** Snapshot changefreq value. */
            changefreq: string | null;
            /** Snapshot priority value. */
            priority: string | null;
        }[];
    };
    /** Captured response for /robots.txt. */
    "/robots.txt": { status: number; body: string };
    /** Captured response for /security.txt. */
    "/security.txt": { status: number; body: string };
    /** Captured response for /opensearch.xml. */
    "/opensearch.xml": { status: number; body: string };
    /** Captured response for /manifest.webmanifest. */
    "/manifest.webmanifest": {
        /** Snapshot icons value. */
        icons: { purpose?: string; sizes: string }[];
        /** Snapshot scope value. */
        scope?: string;
        /** Snapshot id value. */
        id?: string;
        /** Snapshot screenshots value. */
        screenshots?: {
            /** Snapshot src value. */
            src: string;
            /** Snapshot sizes value. */
            sizes: string;
            /** Snapshot type value. */
            type: string;
            /** Snapshot form_factor value. */
            form_factor?: "wide" | "narrow";
            /** Snapshot label value. */
            label?: string;
        }[];
    };
    /** Captured response for /service-worker.js. */
    "/service-worker.js": { status: number; bytes: number };
    /** Captured response for /flexsearch.json. */
    "/flexsearch.json": { status: number; bytes: number };
}
