import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import { load } from "cheerio";
import sharp from "sharp";
import ts from "typescript";
import { h, type Component } from "vue";
import { compileScript, parse } from "vue/compiler-sfc";
import { renderToString } from "vue/server-renderer";

const author = "Muhammad Rehan Saeed";
const cssTitle = "A System for Grouping & Sorting CSS Properties";
const cssHero = "/images/hero/CSS-1600x900.png";
const defaultHero = "/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg";

test("Social card props preserve each page's title, hero and template cache identity", async () => {
  const source = await readFile("app/composables/use-blog-og-image.ts", "utf8");
  const exports: {
    useBlogOgImage?: (
      title: string,
      hero?: string,
      author?: string,
    ) => unknown[];
  } = {};
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      useAppConfig: () => ({ site: { author: { name: author } } }),
      defineOgImage: (...args: unknown[]) => args,
    },
  );
  if (!exports.useBlogOgImage)
    throw new Error("Missing social card composable");
  for (const [title, hero] of [
    [cssTitle, cssHero],
    ["Blog", defaultHero],
    ["About", defaultHero],
    ["Blog - Page 2", defaultHero],
    ["# CSS", defaultHero],
  ]) {
    expect(exports.useBlogOgImage(title, hero)).toEqual([
      "BlogTakumi",
      { title, author, heroImage: hero },
      { alt: `${title} - ${author}` },
    ]);
  }
});

test("Rendered social cards use the post hero, title and current branding", async () => {
  const source = await readFile(
    "app/components/OgImage/Blog.takumi.vue",
    "utf8",
  );
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, {
    id: "og-image-test",
    inlineTemplate: true,
    templateOptions: { ssr: true },
  });
  const exports: { default?: Component } = {};
  runInNewContext(
    ts.transpileModule(compiled.content, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ESNext,
      },
    }).outputText,
    { exports, require: createRequire(join(process.cwd(), "package.json")) },
  );
  if (!exports.default) throw new Error("Missing social card component");
  const $ = load(
    await renderToString(
      h(exports.default, { title: cssTitle, heroImage: cssHero, author }),
    ),
  );
  expect($("img").first().attr("src")).toBe(cssHero);
  expect($("img").last().attr("src")).toBe(
    "/images/author/Muhammad-Rehan-Saeed/Logo.svg",
  );
  expect($.text()).toContain(cssTitle);
  expect($.text()).toContain("RehanSaeed.com");
  expect($.text()).toContain("Software Developer · Open Source");
  expect($.text()).not.toContain(".NET");
  expect($.text()).not.toContain("rehansaeed.com");
});

test("The CSS article and other page types advertise distinct static social cards", async ({
  request,
}) => {
  const images = new Set<string>();
  for (const [path, title] of [
    ["/system-for-grouping-and-sorting-css-properties/", cssTitle],
    ["/", "Blog"],
    ["/about/", "About"],
    ["/portfolio/", "Portfolio"],
    ["/2/", "Blog - Page 2"],
    ["/tag/css/", "# CSS"],
  ]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    const $ = load(await response.text());
    expect($('meta[property="og:image"]').length, path).toBe(1);
    expect($('meta[property="og:image:alt"]').attr("content"), path).toBe(
      `${title} - ${author}`,
    );
    const image = $('meta[property="og:image"]').attr("content")!;
    expect(images.has(image), path).toBe(false);
    images.add(image);
    const png = await request.get(new URL(image).pathname);
    expect(png.ok(), image).toBe(true);
    expect(png.headers()["content-type"]).toContain("image/png");
    const buffer = await png.body();
    expect(buffer.readUInt32BE(16), path).toBe(1200);
    expect(buffer.readUInt32BE(20), path).toBe(630);
  }
});

test("The gallery embeds cards, includes unlisted pages and filters by title or URL", async ({
  page,
}) => {
  const directory = await mkdtemp(join(tmpdir(), "og-images-"));
  try {
    await mkdir(join(directory, "_og", "s"), { recursive: true });
    const png = await sharp({
      create: { width: 1200, height: 630, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();
    const preview = await sharp(png)
      .resize({ width: 600 })
      .webp({ quality: 85 })
      .toBuffer();
    const previewUrl = `data:image/webp;base64,${preview.toString("base64")}`;
    await writeFile(join(directory, "_og", "s", "o_123abc.png"), png);
    for (const [path, title, hasImage] of [
      ["", "Blog", true],
      ["css", "CSS & <Title>", true],
      ["streaming", "Unlisted", false],
    ] as const) {
      const folder = join(directory, path);
      await mkdir(folder, { recursive: true });
      await writeFile(
        join(folder, "index.html"),
        `<title>${title.replaceAll("<", "&lt;")}</title>
<link rel="canonical" href="https://rehansaeed.com/${path ? `${path}/` : ""}">
${hasImage ? '<meta property="og:image" content="https://rehansaeed.com/_og/s/o_123abc.png">' : '<meta name="robots" content="noindex">'}`,
      );
    }
    const output = join(directory, "gallery.html");
    await promisify(execFile)(process.execPath, [
      join("scripts", "og-images.mjs"),
      output,
      directory,
    ]);
    const html = await readFile(output, "utf8");
    await page.setContent(html);
    await expect(page.locator("article")).toHaveCount(3);
    await expect(page.locator("article img")).toHaveCount(2);
    await expect(page.locator("article img").first()).toHaveAttribute(
      "src",
      previewUrl,
    );
    await expect(page.locator(".preview").first()).toHaveAttribute(
      "href",
      previewUrl,
    );
    await expect
      .poll(() =>
        page
          .locator("article img")
          .first()
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete &&
              image.naturalWidth === 600 &&
              image.naturalHeight === 315,
          ),
      )
      .toBe(true);
    await expect(page.locator(".missing")).toHaveText(
      "No og:image defined for this page.",
    );
    await page.getByLabel("Filter by title or URL").fill("CSS & <Title>");
    await expect(page.locator("article:visible")).toHaveCount(1);
    await expect(page.locator("article:visible h2")).toHaveText(
      "CSS & <Title>",
    );
    await page.getByLabel("Filter by title or URL").fill("/streaming/");
    await expect(page.locator("article:visible")).toHaveCount(1);
    await expect(page.getByRole("status")).toHaveText("1 of 3 pages");
    await page.getByLabel("Filter by title or URL").fill("no matches");
    await expect(page.locator("article:visible")).toHaveCount(0);
    await page.getByLabel("Filter by title or URL").clear();
    await expect(page.locator("article:visible")).toHaveCount(3);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
