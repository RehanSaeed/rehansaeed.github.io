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
        screenshots?: {
            src: string;
            sizes: string;
            type: string;
            form_factor?: "wide" | "narrow";
            label?: string;
        }[];
    };
    "/service-worker.js": { status: number; bytes: number };
    "/flexsearch.json": { status: number; bytes: number };
}
