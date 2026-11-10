import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { load } from "cheerio";
import sharp from "sharp";
import site from "../site.json" with { type: "json" };

/**
 * Mailchimp's RSSITEM:IMAGE reads Media RSS, not an enclosure. Read the completed
 * pages rather than duplicating nuxt-og-image's URL hashing and template defaults.
 * Keep existing enclosures and the Atom/JSON feeds unchanged for other readers.
 */
export const addFeedImages = async (directory = "dist") => {
    const root = resolve(directory);
    const localPath = (url: string) => {
        const parsed = new URL(url);
        assert.equal(parsed.origin, site.url, `${url}: external feed URL`);
        assert(!parsed.search && !parsed.hash, `${url}: unexpected URL suffix`);
        const path = resolve(root, `.${decodeURIComponent(parsed.pathname)}`);
        const relativePath = relative(root, path);
        assert(
            !relativePath.startsWith("..") && !isAbsolute(relativePath),
            `${url}: path outside generated site`,
        );
        return path;
    };
    const images = new Map<string, string>();
    const outputs = [];
    for (const file of ["rss.xml", join("feed", "index.xml")]) {
        const path = join(root, file);
        const rss = load(await readFile(path, "utf8"), { xml: true });
        assert.equal(rss("rss").length, 1, `${file}: missing RSS root`);
        const items = rss("channel > item").toArray();
        assert(items.length, `${file}: no RSS items`);
        rss("rss").attr("xmlns:media", "http://search.yahoo.com/mrss/");
        for (const node of items) {
            const item = rss(node);
            const url = item.children("link").text();
            if (!images.has(url)) {
                const html = load(
                    await readFile(join(localPath(url), "index.html"), "utf8"),
                );
                const meta = html('meta[property="og:image"]');
                assert.equal(meta.length, 1, `${url}: expected one og:image`);
                const image = meta.attr("content");
                assert(image, `${url}: missing og:image URL`);
                assert.match(
                    new URL(image).pathname,
                    /^\/_og\/s\/o_[a-f0-9]+\.png$/,
                    `${url}: expected a prerendered OG PNG`,
                );
                const metadata = await sharp(localPath(image)).metadata();
                assert.equal(metadata.format, "png", `${image}: image format`);
                assert.equal(metadata.width, 1200, `${image}: image width`);
                assert.equal(metadata.height, 630, `${image}: image height`);
                images.set(url, image);
            }
            const image = images.get(url);
            assert(image, `${url}: missing resolved OG image`);
            item.children("media\\:content").remove();
            item.append(
                rss("<media:content/>").attr({
                    url: image,
                    medium: "image",
                    type: "image/png",
                    width: "1200",
                    height: "630",
                }),
            );
        }
        outputs.push({ path, content: rss.xml() });
    }
    // Validate every page and asset before changing either RSS endpoint.
    for (const { path, content } of outputs) {
        await writeFile(path, content);
    }
    return images.size;
};

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
    const count = await addFeedImages(process.argv[2]);
    console.log(
        `Added generated OG images to both RSS feeds (${count} articles).`,
    );
}
