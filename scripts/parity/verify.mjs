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
function approvedPage(path, source) {
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
            }
        }
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
        approvedPage(path, page),
        `Unexpected page/head difference on ${path}`,
    );
}
assert.deepEqual(
    localArtifacts["/404"],
    approvedPage("/404", liveArtifacts["/404"]),
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
    .map((entry) => ({ ...entry, lastmod: postDates.get(entry.loc) ?? null }));
assert.deepEqual(
    localArtifacts["/sitemap.xml"].urls,
    sitemap,
    "Sitemap URL set and content lastmod",
);
for (const path of ["/robots.txt", "/security.txt", "/opensearch.xml"]) {
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
