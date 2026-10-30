import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";
import sharp from "sharp";
import { parse } from "yaml";

const directory = process.argv[2] ?? "dist";
const site = JSON.parse(await readFile("site.json", "utf8"));
const read = (file) => readFile(join(directory, file), "utf8");
const localFile = (url) => {
    const parsed = new URL(url, site.url);
    assert.equal(
        parsed.origin,
        site.url,
        `Unexpected external SEO URL: ${url}`,
    );
    return decodeURIComponent(parsed.pathname).replace(/^\//, "");
};
const markdownPath = (path) =>
    path === "/" ? "index.md" : `${path.replace(/\/$/, "").slice(1)}.md`;
const sitemap = load(await read("sitemap.xml"), { xml: true });
const urls = sitemap("url > loc")
    .map((_, node) => sitemap(node).text())
    .get();
assert.equal(new Set(urls).size, urls.length, "Duplicate sitemap URL");
const full = await read("llms-full.txt");
const sourceKey = (url) => new URL(url).href.replace(/\/$/, "");
const fullSources = new Set(
    [...full.matchAll(/^- \*\*Source:\*\* (https:\/\/\S+)$/gm)].map(([, url]) =>
        sourceKey(url),
    ),
);
const discovery = await read("llms.txt");
const markdownSitemap = await read("sitemap.md");
const markdownLinks = (text) =>
    new Set(
        [
            ...text.matchAll(
                /\]\((https:\/\/rehansaeed\.com\/[^\s)]+)(?:\s+"[^"]*")?\)/g,
            ),
        ].map(([, url]) => url),
    );
const discoveryLinks = markdownLinks(discovery);
const sitemapLinks = markdownLinks(markdownSitemap);
const images = new Map();
let articles = 0;

for (const url of urls) {
    const path = new URL(url).pathname;
    const $ = load(await read(join(localFile(url), "index.html")));
    const meta = (name) =>
        $(`meta[property="${name}"],meta[name="${name}"]`).attr("content");
    assert.equal(
        $("link[rel=canonical]").length,
        1,
        `${path}: canonical count`,
    );
    assert.equal($("link[rel=canonical]").attr("href"), url);
    assert(
        !meta("robots")?.includes("noindex"),
        `${path}: indexed noindex page`,
    );
    const image = meta("og:image");
    assert.match(
        image,
        /^https:\/\/rehansaeed\.com\/_og\/s\/o_[a-f0-9]+\.png$/,
    );
    assert.equal(meta("og:image:width"), "1200");
    assert.equal(meta("og:image:height"), "630");
    assert.equal(meta("twitter:image"), image);
    assert.equal(meta("twitter:card"), "summary_large_image");
    const title = path.startsWith("/tag/")
        ? `# ${meta("og:title")}`
        : /^\/\d+\/$/.test(path)
          ? `Blog - Page ${path.split("/")[1]}`
          : meta("og:title");
    assert.equal(
        meta("og:image:alt"),
        `${title} - ${meta("author")}`,
        `${path}: social image title and author`,
    );
    if (!images.has(image)) {
        images.set(
            image,
            await sharp(join(directory, localFile(image))).metadata(),
        );
    }
    assert.equal(images.get(image).width, 1200);
    assert.equal(images.get(image).height, 630);

    const scripts = $('script[type="application/ld+json"]');
    assert.equal(scripts.length, 1, `${path}: coherent schema graph`);
    const graph = JSON.parse(scripts.text());
    assert.equal(graph["@context"], "https://schema.org");
    const nodes = graph["@graph"];
    const ids = nodes.map((node) => node["@id"]);
    assert.equal(
        new Set(ids).size,
        ids.length,
        `${path}: duplicate schema IDs`,
    );
    const find = (id) => {
        const node = nodes.find((node) => node["@id"] === id);
        assert(node, `${path}: missing graph reference ${id}`);
        return node;
    };
    const webpage = find(`${url}#webpage`);
    assert.equal(webpage.url, url);
    const website = find(`${site.url}/#website`);
    assert.equal(website.publisher["@id"], `${site.url}/#publisher`);
    assert.equal(website.author["@id"], `${site.url}/#identity`);
    assert.equal(find(website.publisher["@id"])["@type"], "Organization");
    assert.equal(find(website.author["@id"])["@type"], "Person");
    assert.equal(
        website.potentialAction[0].target.urlTemplate,
        `${site.url}/?search={search_term_string}`,
    );
    const article = nodes.find((node) => node["@type"] === "Article");
    if (article) {
        articles++;
        assert.equal(article.url, url);
        assert.equal(article.mainEntityOfPage["@id"], webpage["@id"]);
        assert.equal(article.author["@id"], `${site.url}/#identity`);
        assert.equal(article.publisher["@id"], `${site.url}/#publisher`);
        assert.equal(
            Date.parse(article.datePublished),
            Date.parse(meta("article:published_time")),
        );
        assert.equal(
            Date.parse(article.dateModified),
            Date.parse(meta("article:modified_time")),
        );
        assert(article.image[0].caption);
        const hero = $(".post__photo");
        assert.equal(
            Number(article.image[0].width),
            Number(hero.attr("width")),
        );
        assert.equal(
            Number(article.image[0].height),
            Number(hero.attr("height")),
        );
    }
    if (path === "/about/") {
        assert([webpage["@type"]].flat().includes("ProfilePage"));
        assert.equal(webpage.mainEntity["@id"], `${site.url}/#identity`);
    }
    const list = nodes.find((node) => node["@type"] === "ItemList");
    if (list) {
        list.itemListElement.forEach((item, index) =>
            assert.equal(item.position, index + 1),
        );
        const cards = $(".post-card__title a, .portfolio-card__title a")
            .map((_, a) => new URL($(a).attr("href"), site.url).href)
            .get();
        if (cards.length) {
            assert.deepEqual(
                list.itemListElement.map((item) => item.url ?? item.item?.url),
                cards,
            );
        }
    }
    if (path !== "/") {
        const breadcrumb = nodes.find(
            (node) => node["@type"] === "BreadcrumbList",
        );
        assert(breadcrumb, `${path}: missing breadcrumbs`);
        assert.equal(
            breadcrumb.itemListElement[0].item["@id"] ??
                breadcrumb.itemListElement[0].item,
            `${site.url}/`,
        );
    }

    const mdPath = markdownPath(path);
    const markdown = await read(mdPath);
    const frontmatter = markdown.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    assert(frontmatter, `${path}: Markdown frontmatter`);
    assert.equal(parse(frontmatter[1]).canonical_url, url);
    assert(
        markdown.slice(frontmatter[0].length).trim().length > 50,
        `${path}: empty Markdown`,
    );
    const mdUrl = `${site.url}/${mdPath}`;
    assert.equal(
        new URL(
            $('link[rel=alternate][type="text/markdown"]').attr("href"),
            site.url,
        ).href,
        mdUrl,
    );
    assert(discoveryLinks.has(mdUrl), `${path}: llms discovery`);
    assert(sitemapLinks.has(mdUrl), `${path}: Markdown sitemap`);
    assert(fullSources.has(sourceKey(url)), `${path}: full export`);
}

const referenceRoutes = (await readFile("tests/parity/urls.txt", "utf8"))
    .trim()
    .split(/\r?\n/);
const additionalPublicRoutes = [
    "/tag/ai/",
    "/tag/artificial-intelligence-ai/",
    "/ai-gone-rogue/",
];
for (const path of [
    ...referenceRoutes,
    ...additionalPublicRoutes,
    "/404-not-found/",
]) {
    const htmlPath =
        path === "/404-not-found/"
            ? "404.html"
            : join(path.slice(1), "index.html");
    const $ = load(await read(htmlPath));
    if (!$("meta[name=robots]").attr("content")?.includes("noindex")) {
        continue;
    }
    assert(
        !$('link[rel=alternate][type="text/markdown"]').length,
        `${path}: noindex Markdown advertisement`,
    );
    assert(!urls.includes(`${site.url}${path}`), `${path}: sitemap exclusion`);
    assert(
        !fullSources.has(sourceKey(`${site.url}${path}`)),
        `${path}: full export exclusion`,
    );
    await assert.rejects(access(join(directory, markdownPath(path))), {
        code: "ENOENT",
    });
}
for (const links of [discoveryLinks, sitemapLinks]) {
    for (const url of links) {
        await access(join(directory, localFile(url)));
    }
}
const robots = await read("robots.txt");
assert.deepEqual(
    [...fullSources].sort(),
    urls.map(sourceKey).sort(),
    "Full export includes only public sitemap pages",
);
assert.match(robots, /Content-Usage: train-ai=y/);
assert.match(robots, /Content-Signal: ai-train=yes, search=yes, ai-input=yes/);
assert.match(robots, /User-agent: \*\s+Allow: \//);
assert(!/^Disallow:\s*\/.+/m.test(robots));
for (const path of additionalPublicRoutes) {
    assert(
        urls.includes(`${site.url}${path}`),
        `${path}: approved public page`,
    );
}
assert.equal(
    urls.length,
    referenceRoutes.length - 5 + additionalPublicRoutes.length,
    "All and only public reference pages and approved additions indexed",
);
assert.equal(articles, 103, "Every published article has a schema graph");
assert.equal(
    images.size,
    urls.length,
    "Every public page has a distinct social card, not the homepage card",
);
console.log(
    `Verified ${urls.length} public SEO/Markdown pages, ${articles} articles, ${images.size} 1200x630 social cards and explicit AI training policy.`,
);
