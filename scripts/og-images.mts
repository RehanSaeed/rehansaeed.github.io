import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { load } from "cheerio";
import sharp from "sharp";

const escape = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

export async function createOgImageGallery(directory = "dist") {
    const root = resolve(directory);
    const files = (await readdir(root, { recursive: true }))
        .filter(
            (file) => file === "index.html" || /[/\\]index\.html$/.test(file),
        )
        .sort();
    const images = new Map();
    const cards = [];
    for (const file of files) {
        const $ = load(await readFile(join(root, file), "utf8"));
        const canonical = $('link[rel="canonical"]').attr("href");
        assert(canonical, `${file}: missing canonical URL`);
        const title =
            $('meta[property="og:title"]').attr("content") || $("title").text();
        const image = $('meta[property="og:image"]').attr("content");
        let preview =
            '<p class="missing">No og:image defined for this page.</p>';
        if (image) {
            const url = new URL(image, canonical);
            assert.equal(
                url.origin,
                new URL(canonical).origin,
                `${file}: external social image`,
            );
            assert.match(
                url.pathname,
                /^\/_og\/s\/o_[a-f0-9]+\.png$/,
                `${file}: not a static social card`,
            );
            const imagePath = resolve(
                root,
                `.${decodeURIComponent(url.pathname)}`,
            );
            const imageRelativePath = relative(root, imagePath);
            assert(
                !imageRelativePath.startsWith("..") &&
                    !isAbsolute(imageRelativePath),
            );
            if (!images.has(image)) {
                const preview = await sharp(imagePath)
                    .resize({ width: 600, withoutEnlargement: true })
                    .webp({ quality: 85 })
                    .toBuffer();
                images.set(
                    image,
                    `data:image/webp;base64,${preview.toString("base64")}`,
                );
            }
            const alt =
                $('meta[property="og:image:alt"]').attr("content") || title;
            preview = `<a class="preview" download="${escape(
                url.pathname
                    .split("/")
                    .pop()!
                    .replace(/\.png$/, ".webp"),
            )}"><img src="${images.get(image)}" width="1200" height="630" loading="lazy" alt="${escape(alt)}"></a>`;
        }
        cards.push(`<article>
${preview}
<div class="caption"><h2><a href="${escape(canonical)}">${escape(title)}</a></h2>
<p>${escape(new URL(canonical).pathname)}</p>
${image ? `<p><a href="${escape(image)}">Image URL (after deployment)</a></p>` : ""}
</div></article>`);
    }
    assert(
        cards.length,
        `No generated pages found in ${directory}. Run npm run build first.`,
    );
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>RehanSaeed.com social images</title>
<script>
  (() => {
    const param = new URLSearchParams(window.location.search).get("scoutTheme");
    const theme =
      param || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  })();
</script>
<style>
:root {
  color-scheme: light;
  --cp-bg: #f7f4ef;
  --cp-bg-elevated: #fcfbf8;
  --cp-surface: #ffffff;
  --cp-surface-soft: #f5f5f5;
  --cp-border: #dedede;
  --cp-border-strong: #919191;
  --cp-text: #242424;
  --cp-text-muted: #5c5c5c;
  --cp-text-soft: #6f6f6f;
  --cp-accent: #b11f4b;
  --cp-accent-hover: #9a1a41;
  --cp-accent-soft: rgba(177, 31, 75, 0.08);
  --cp-accent-fg: #ffffff;
  --cp-success: #16a34a;
  --cp-danger: #dc2626;
  --cp-warning: #f59e0b;
  --cp-link: #0078d4;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.12);
  --cp-overlay: rgba(255, 255, 255, 0.8);
  --cp-panel: rgba(255, 255, 255, 0.86);
  --cp-panel-strong: rgba(255, 255, 255, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.55);
  --cp-highlight: rgba(177, 31, 75, 0.12);
}
html[data-theme="dark"] {
  color-scheme: dark;
  --cp-bg: #3d3b3a;
  --cp-bg-elevated: #343231;
  --cp-surface: #292929;
  --cp-surface-soft: #2e2e2e;
  --cp-border: #474747;
  --cp-border-strong: #5f5f5f;
  --cp-text: #dedede;
  --cp-text-muted: #919191;
  --cp-text-soft: #b0b0b0;
  --cp-accent: #fd8ea1;
  --cp-accent-hover: #fb7b91;
  --cp-accent-soft: rgba(253, 142, 161, 0.14);
  --cp-accent-fg: #1a1a1a;
  --cp-success: #4ade80;
  --cp-danger: #f87171;
  --cp-warning: #fbbf24;
  --cp-link: #4da6ff;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
  --cp-overlay: rgba(41, 41, 41, 0.88);
  --cp-panel: rgba(41, 41, 41, 0.72);
  --cp-panel-strong: rgba(41, 41, 41, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.04);
  --cp-highlight: rgba(253, 142, 161, 0.12);
}
* { box-sizing: border-box; }
body { margin: 0; padding: 32px; background: var(--cp-bg); color: var(--cp-text); font-family: "Segoe UI", Aptos, Calibri, -apple-system, BlinkMacSystemFont, sans-serif; }
header { max-width: 960px; margin-bottom: 32px; }
h1 { margin: 0 0 16px; }
header p { color: var(--cp-text-muted); }
label { display: block; margin-bottom: 8px; font-weight: 600; }
input { width: 100%; padding: 12px; border: 1px solid var(--cp-border-strong); border-radius: .625rem; background: var(--cp-surface); color: var(--cp-text); font: inherit; }
a { color: var(--cp-link); overflow-wrap: anywhere; }
a:focus-visible, input:focus-visible { outline: 3px solid var(--cp-accent); outline-offset: 4px; }
main { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr)); gap: 24px; }
article { min-width: 0; overflow: hidden; border: 1px solid var(--cp-border); border-radius: 16px; background: var(--cp-surface); }
article[hidden] { display: none; }
img { display: block; width: 100%; height: auto; }
.caption { padding: 20px; }
h2 { margin: 0 0 12px; font-size: 1.125rem; }
.caption p { margin: 8px 0 0; color: var(--cp-text-muted); }
.missing { padding: 48px 24px; color: var(--cp-text-muted); }
@media (max-width: 600px) { body { padding: 16px; } }
</style></head><body>
<header><h1>RehanSaeed.com social images</h1>
<p>All ${cards.length} generated pages, including unlisted pages. ${images.size} distinct social images with compact previews embedded from the local build. Click a preview to save its WebP; image links point to the full-size PNG after deployment. Page links open the live site.</p>
<label for="filter">Filter by title or URL</label><input id="filter" type="search" placeholder="Try CSS, About or /tag/">
<p id="count" role="status">${cards.length} pages</p></header>
<main>${cards.join("\n")}</main>
<script>
const cards = [...document.querySelectorAll("article")];
for (const preview of document.querySelectorAll(".preview")) preview.href = preview.querySelector("img").src;
document.querySelector("#filter").addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  for (const card of cards) card.hidden = !card.textContent.toLowerCase().includes(query);
  document.querySelector("#count").textContent = cards.filter((card) => !card.hidden).length + " of " + cards.length + " pages";
});
</script></body></html>`;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
    const output = resolve(process.argv[2] ?? ".nuxt/og-images.html");
    const html = await createOgImageGallery(process.argv[3] ?? "dist");
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, html);
    console.log(`Social image gallery: ${output}`);
}
