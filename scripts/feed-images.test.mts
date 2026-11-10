import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { load } from "cheerio";
import { Feed } from "feed";
import sharp from "sharp";
import { addFeedImages } from "./feed-images.mts";

const origin = "https://rehansaeed.com";
const image = `${origin}/_og/s/o_123abc.png`;
const hero = `${origin}/images/hero/original.jpg`;
const fixture = async (context: TestContext) => {
    const directory = await mkdtemp(join(tmpdir(), "feed-images-"));
    context.after(() => rm(directory, { recursive: true, force: true }));
    await mkdir(join(directory, "article"), { recursive: true });
    await mkdir(join(directory, "_og", "s"), { recursive: true });
    await mkdir(join(directory, "feed"), { recursive: true });
    const feed = new Feed({
        title: "Blog",
        id: origin,
        copyright: "Author",
    });
    feed.addItem({
        title: "Article & title",
        link: `${origin}/article/`,
        description: "A summary & more",
        content:
            '<p>Content with <a href="https://example.com/">a link</a>.</p>',
        date: new Date("2026-11-10"),
        image: hero,
    });
    const rss = feed.rss2();
    for (const file of ["rss.xml", join("feed", "index.xml")]) {
        await writeFile(join(directory, file), rss);
    }
    await writeFile(join(directory, "atom.xml"), feed.atom1());
    await writeFile(join(directory, "feed.json"), feed.json1());
    await writeFile(
        join(directory, "article", "index.html"),
        `<meta property="og:image" content="${image}">`,
    );
    await sharp({
        create: {
            width: 1200,
            height: 630,
            channels: 3,
            background: "#ffffff",
        },
    })
        .png()
        .toFile(join(directory, "_og", "s", "o_123abc.png"));
    return { directory, rss };
};

await test("RSS images exactly match rendered OG metadata without changing existing feed fields", async (context) => {
    const { directory, rss: original } = await fixture(context);
    const untouched = await Promise.all(
        ["atom.xml", "feed.json"].map((file) =>
            readFile(join(directory, file), "utf8"),
        ),
    );
    assert.equal(await addFeedImages(directory), 1);
    const first = await readFile(join(directory, "rss.xml"), "utf8");
    assert.equal(
        await readFile(join(directory, "feed", "index.xml"), "utf8"),
        first,
    );
    const rss = load(first, { xml: true });
    assert.equal(
        rss("rss").attr("xmlns:media"),
        "http://search.yahoo.com/mrss/",
    );
    const media = rss("item").children("media\\:content");
    assert.equal(media.length, 1);
    assert.deepEqual(media.attr(), {
        url: image,
        medium: "image",
        type: "image/png",
        width: "1200",
        height: "630",
    });
    assert.notEqual(media.attr("url"), hero);
    assert.equal(rss("enclosure").attr("url"), hero);
    media.remove();
    rss("rss").removeAttr("xmlns:media");
    assert.equal(rss.xml(), load(original, { xml: true }).xml());
    assert.deepEqual(
        await Promise.all(
            ["atom.xml", "feed.json"].map((file) =>
                readFile(join(directory, file), "utf8"),
            ),
        ),
        untouched,
    );
    await addFeedImages(directory);
    assert.equal(await readFile(join(directory, "rss.xml"), "utf8"), first);

    const replacement = image.replace("123abc", "456def");
    await writeFile(
        join(directory, "article", "index.html"),
        `<meta property="og:image" content="${replacement}">`,
    );
    await writeFile(
        join(directory, "_og", "s", "o_456def.png"),
        await readFile(join(directory, "_og", "s", "o_123abc.png")),
    );
    await addFeedImages(directory);
    const updated = load(await readFile(join(directory, "rss.xml"), "utf8"), {
        xml: true,
    });
    assert.equal(updated("media\\:content").attr("url"), replacement);
});

for (const [name, html, failure] of [
    ["missing", "<title>No image</title>", /expected one og:image/],
    [
        "multiple",
        `<meta property="og:image" content="${image}"><meta property="og:image" content="${image}">`,
        /expected one og:image/,
    ],
    [
        "raw hero",
        `<meta property="og:image" content="${hero}">`,
        /expected a prerendered OG PNG/,
    ],
    [
        "external",
        `<meta property="og:image" content="https://example.com/_og/s/o_123abc.png">`,
        /external feed URL/,
    ],
    [
        "unemitted",
        `<meta property="og:image" content="${image.replace("123abc", "999")}">`,
        /Input file is missing/,
    ],
] as const) {
    await test(`Rejects ${name} OG metadata before modifying RSS`, async (context) => {
        const { directory, rss } = await fixture(context);
        await writeFile(join(directory, "article", "index.html"), html);
        await assert.rejects(addFeedImages(directory), failure);
        for (const file of ["rss.xml", join("feed", "index.xml")]) {
            assert.equal(await readFile(join(directory, file), "utf8"), rss);
        }
    });
}

await test("Missing legacy RSS endpoint prevents partially updated feeds", async (context) => {
    const { directory, rss } = await fixture(context);
    await rm(join(directory, "feed", "index.xml"));
    await assert.rejects(addFeedImages(directory), /ENOENT/);
    assert.equal(await readFile(join(directory, "rss.xml"), "utf8"), rss);
});
