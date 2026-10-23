import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

const expectedDir = process.argv[2] ?? "tests/parity/baseline";
const actualDir = process.argv[3] ?? ".parity/local";
const load = async (dir, file) =>
    JSON.parse(await readFile(join(dir, file), "utf8"));
const live = await load(expectedDir, "pages.json");
const local = await load(actualDir, "pages.json");
const liveArtifacts = await load(expectedDir, "artifacts.json");
const localArtifacts = await load(actualDir, "artifacts.json");
const excluded = new Set(["/streaming/border/", "/streaming/thumbnail/"]);
const postDates = new Map();
const postTags = new Map();
const correctedImageDimensions = {
    "{origin}/images/hero/Git-1366x768.png": {
        width: "1200",
        height: "768",
    },
    "{origin}/images/hero/Elysium-1366x768.png": {
        width: "1024",
        height: "640",
    },
};
const site = JSON.parse(await readFile("site.json", "utf8"));

function verifySchema(path, expected, actual) {
    if (path === "/404") {
        assert.deepEqual(actual, []);
        return;
    }
    assert.equal(actual.length, 1, `${path}: single JSON-LD graph`);
    assert.equal(actual[0]["@context"], "https://schema.org");
    const nodes = actual[0]["@graph"];
    const ids = nodes.map((node) => node["@id"]);
    assert.equal(new Set(ids).size, ids.length, `${path}: unique graph IDs`);
    const person = nodes.find((node) => node["@id"] === "{origin}/#identity");
    const publisher = nodes.find(
        (node) => node["@id"] === "{origin}/#publisher",
    );
    assert.equal(person.name, site.author.name);
    assert.equal(person.url, "{origin}/about/");
    assert.equal(publisher.name, site.name);
    assert.equal(publisher.url, "{origin}");
    const logo = publisher.logo;
    assert.equal(
        typeof logo === "string" ? logo : logo.url,
        "{origin}/images/schema/Publisher-600x60.png",
    );
    for (const schema of expected) {
        if (schema["@type"] !== "Article") continue;
        const article = nodes.find((node) => node["@type"] === "Article");
        assert(article, `${path}: preserved Article`);
        for (const field of ["headline", "description", "url"]) {
            assert.equal(
                article[field] ?? (field === "description" ? "" : undefined),
                schema[field],
                `${path}: Article ${field}`,
            );
        }
        assert.equal(
            (article.keywords ?? []).join(","),
            schema.keywords,
            `${path}: Article keywords`,
        );
        for (const field of ["datePublished", "dateModified"]) {
            assert.equal(
                Date.parse(article[field]),
                Date.parse(schema[field]),
                `${path}: Article ${field} instant`,
            );
        }
        assert.deepEqual(
            article.image.map((image) => ({
                ...image,
                width: String(image.width),
                height: String(image.height),
            })),
            schema.image,
            `${path}: original hero image schema`,
        );
        assert.equal(article.author["@id"], person["@id"]);
        assert.equal(article.publisher["@id"], publisher["@id"]);
        const webpage = nodes.find(
            (node) => node["@id"] === article.mainEntityOfPage["@id"],
        );
        assert.equal(webpage.url, schema.url);
    }
}

for (const file of await readdir("content/posts", { recursive: true })) {
    if (!file.endsWith("index.md")) continue;
    const source = await readFile(join("content/posts", file), "utf8");
    const data = parse(source.match(/^---\r?\n([\s\S]+?)\r?\n---/)[1]);
    if (!data.published) excluded.add(data.permalink);
    else
        postDates.set(
            `{origin}${data.permalink}`,
            new Date(data.dateModified ?? data.date)
                .toISOString()
                .replace(/T00:00:00\.000Z$/, "")
                .replace(/\.000Z$/, "Z"),
        );
    postTags.set(`{origin}${data.permalink}`, data.tags ?? []);
}

// Only the explicitly approved migration/SEO changes are applied to the reference.
function approvedPage(path, source, actual) {
    const page = structuredClone(source);
    page.lang = "en-GB";
    delete page.meta["gridsome:hash"];
    page.meta["msapplication-TileColor"] = "#6b17e8";
    page.meta["msapplication-TileImage"] = "{origin}/favicon.png";
    page.meta["twitter:card"] = "summary_large_image";
    for (const key of ["description", "og:description", "keywords"]) {
        if (page.meta[key] === "") delete page.meta[key];
    }
    if (page.links.canonical) page.links.canonical = `{origin}${path}`;
    if (path === "/" || /^\/\d+\/$/.test(path))
        page.meta["og:url"] = `{origin}${path}`;
    if (excluded.has(path)) page.meta.robots = "noindex, follow";
    const dimensions = correctedImageDimensions[page.meta["og:image"]];
    if (dimensions) {
        page.meta["og:image:width"] = dimensions.width;
        page.meta["og:image:height"] = dimensions.height;
    }
    for (const schema of page.jsonLd) {
        if (schema.author?.logo) {
            schema.author.image = schema.author.logo;
            delete schema.author.logo;
        }
        if (schema["@type"] === "Article") {
            schema.mainEntityOfPage["@id"] = schema.url;
            schema.dateModified ??= schema.datePublished;
            page.meta["article:modified_time"] = schema.dateModified;
            for (const image of schema.image) {
                image.caption = image.alternativeHeadline;
                delete image.alternativeHeadline;
                Object.assign(image, correctedImageDimensions[image.url] ?? {});
            }
        }
    }
    verifySchema(path, page.jsonLd, actual.jsonLd);
    page.jsonLd = actual.jsonLd;
    page.meta["og:type"] ??= "website";
    page.meta["og:title"] ??= page.title;
    page.meta["og:locale"] ??= "en_GB";
    page.meta["og:site_name"] ??= site.name;
    if (!("description" in source.meta))
        page.meta.description ??= site.description;
    if (!("og:description" in source.meta))
        page.meta["og:description"] ??= page.meta.description;
    if (path !== "/404") {
        page.meta.robots ??=
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
        page.links.canonical ??= `{origin}${path}`;
        page.meta["og:url"] ??= `{origin}${path}`;
    }
    if (source.meta["og:image"]) {
        const image = actual.meta["og:image"];
        assert.match(image, /^\{origin\}\/_og\/s\/o_[a-f0-9]+\.png$/);
        const title = /^\/\d+\/$/.test(path)
            ? `Blog - Page ${path.split("/")[1]}`
            : path.startsWith("/tag/")
              ? `# ${page.meta["og:title"]}`
              : page.meta["og:title"];
        Object.assign(page.meta, {
            "og:image": image,
            "og:image:width": "1200",
            "og:image:height": "630",
            "og:image:type": "image/png",
            "og:image:alt": `${title} - ${site.author.name}`,
            "twitter:image": image,
            "twitter:image:alt": `${title} - ${site.author.name}`,
        });
    }
    if (path !== "/404" && !excluded.has(path)) {
        const markdown =
            path === "/" ? "/index.md" : `${path.replace(/\/$/, "")}.md`;
        page.links.alternate.push(`${markdown} | text/markdown`);
    }
    return page;
}
assert.deepEqual(
    Object.keys(local).sort(),
    Object.keys(live).sort(),
    "Generated page URL set",
);
for (const [path, page] of Object.entries(live)) {
    assert.deepEqual(
        local[path],
        approvedPage(path, page, local[path]),
        `Unexpected page/head difference on ${path}`,
    );
}
assert.deepEqual(
    localArtifacts["/404"],
    approvedPage("/404", liveArtifacts["/404"], localArtifacts["/404"]),
    "404 response and head",
);

for (const path of ["/rss.xml", "/feed/index.xml"]) {
    const expected = structuredClone(liveArtifacts[path]);
    expected.link = "{origin}/";
    for (const item of expected.items)
        item.categories = postTags.get(item.link);
    assert.deepEqual(
        localArtifacts[path],
        expected,
        `${path} item identities, order, dates and categories`,
    );
}
const json = structuredClone(liveArtifacts["/feed.json"]);
for (const item of json.items) item.tags = postTags.get(item.url);
assert.deepEqual(
    localArtifacts["/feed.json"],
    json,
    "JSON feed identities, order, dates and tags",
);
assert.deepEqual(
    localArtifacts["/atom.xml"],
    liveArtifacts["/atom.xml.atom"],
    "Repaired Atom endpoint",
);
assert.deepEqual(
    localArtifacts["/atom.xml.atom"],
    liveArtifacts["/atom.xml.atom"],
    "Legacy Atom alias",
);

const sitemap = liveArtifacts["/sitemap.xml"].urls
    .filter((entry) => !excluded.has(entry.loc.replace("{origin}", "")))
    .map((entry) => ({ ...entry, lastmod: postDates.get(entry.loc) ?? null }))
    .concat([
        {
            loc: "{origin}/tag/ai/",
            lastmod: null,
            changefreq: null,
            priority: null,
        },
    ])
    .sort((a, b) => a.loc.localeCompare(b.loc));
assert.deepEqual(
    localArtifacts["/sitemap.xml"].urls,
    sitemap,
    "Sitemap URL set and content lastmod",
);
assert.deepEqual(
    localArtifacts["/robots.txt"],
    {
        status: 200,
        body: "User-agent: *\nAllow: /\nDisallow: \nContent-Usage: train-ai=y\nContent-Signal: ai-train=yes, search=yes, ai-input=yes\n\nSitemap: {origin}/sitemap.xml",
    },
    "Explicit search/input/training Robots policy",
);
for (const path of ["/security.txt", "/opensearch.xml"]) {
    const normalize = (value) => ({
        ...value,
        body: value.body.replaceAll("\r\n", "\n"),
    });
    assert.deepEqual(
        normalize(localArtifacts[path]),
        normalize(liveArtifacts[path]),
        path,
    );
}
const { icons: oldIcons, ...oldManifest } =
    liveArtifacts["/manifest.webmanifest"];
const { icons, scope, id, ...manifest } =
    localArtifacts["/manifest.webmanifest"];
assert.deepEqual(manifest, oldManifest, "Preserved PWA manifest fields");
assert.equal(scope, "/");
assert.equal(id, "/");
assert.deepEqual(
    icons
        .filter((icon) => icon.purpose === "any")
        .map((icon) => icon.sizes)
        .sort(),
    oldIcons.map((icon) => icon.sizes).sort(),
    "PWA icon sizes",
);
assert.ok(
    icons.some(
        (icon) => icon.purpose === "maskable" && icon.sizes === "512x512",
    ),
);
for (const path of ["/service-worker.js", "/flexsearch.json"]) {
    assert.equal(localArtifacts[path].status, 200);
    assert.ok(localArtifacts[path].bytes > 0);
}
console.log(
    `Verified ${Object.keys(live).length} pages plus 404, 102-item feeds, ${sitemap.length} sitemap URLs, manifest and static artifacts; only approved differences.`,
);
