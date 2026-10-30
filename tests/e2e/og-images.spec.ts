import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import { Renderer, type Node } from "@takumi-rs/core";
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
  if (!exports.useBlogOgImage) {
    throw new Error("Missing social card composable");
  }
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
  if (!exports.default) {
    throw new Error("Missing social card component");
  }
  const $ = load(
    await renderToString(
      h(exports.default, { title: cssTitle, heroImage: cssHero, author }),
    ),
  );
  expect($("img").first().attr("src")).toBe(cssHero);
  expect($("img").first().parent().children()).toHaveLength(2);
  expect($('[style*="linear-gradient"]')).toHaveLength(0);
  expect($("img").last().attr("src")).toBe(
    "/images/author/Muhammad-Rehan-Saeed/Logo.svg",
  );
  expect($.text()).toContain(cssTitle);
  expect($.text()).toContain("RehanSaeed.com");
  expect($.text()).not.toContain("Software Developer");
  expect($.text()).not.toContain(".NET");
  expect($.text()).not.toContain("rehansaeed.com");
  expect(
    $("div").filter(
      (_, element) => $(element).text().trim() === "RehanSaeed.com",
    ),
  ).toHaveLength(1);
  const heading = $("div").filter(
    (_, element) => $(element).text().trim() === cssTitle,
  );
  expect(heading).toHaveLength(1);
  expect(heading.prev()).toHaveLength(0);
  expect(heading.parent().children()).toHaveLength(2);
  expect(heading.css("background")).toBe("rgba(255, 255, 255, 0.85)");
  expect(heading.css("opacity")).toBeUndefined();
  expect(heading.css("color")).toBe("#000000");
  expect(heading.css("border-radius")).toBe("8px");
  expect(heading.css("padding")).toBe("20px 24px");
  expect(heading.css("max-width")).toBe("100%");
  expect(heading.css("box-sizing")).toBe("border-box");
  expect(heading.css("align-self")).toBe("flex-start");
  expect(heading.next().text()).toContain(author);
  expect(heading.parent().css("justify-content")).toBe("space-between");
  expect(heading.parent().css("border-bottom")).toBe("12px solid #6b17e8");
  const panel = heading.next();
  expect(panel.css("background")).toBe("rgba(255, 255, 255, 0.85)");
  expect(panel.css("opacity")).toBeUndefined();
  expect(panel.css("color")).toBe("#242424");
  expect(panel.css("border-radius")).toBe("8px");
  expect(panel.css("align-self")).toBe("flex-start");
  expect(panel.children()).toHaveLength(3);
  expect(panel.children().first().attr("width")).toBe("76");
  expect(panel.children().eq(1).css("background")).toBe("#6b17e8");
  expect(panel.children().eq(1).css("height")).toBe("76px");
  const identity = panel.children().last();
  expect(identity.children().first().text().trim()).toBe(author);
  expect(identity.children().first().css("font-size")).toBe("40px");
  expect(identity.children().last().text().trim()).toBe("RehanSaeed.com");
  expect(identity.children().last().css("color")).toBe("#6f6f6f");
});

test("Native title backgrounds fit each wrapped line without fading the text", async () => {
  const source = await readFile("server/utils/og-title-lines.ts", "utf8");
  const exports: {
    fitOgTitleLines?: typeof import("../../server/utils/og-title-lines").fitOgTitleLines;
  } = {};
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ESNext,
      },
    }).outputText,
    { exports },
  );
  if (!exports.fitOgTitleLines) {
    throw new Error("Missing title layout helper");
  }
  const renderer = new Renderer();
  await renderer.registerFont({
    name: "Audiowide",
    data: await readFile(
      "node_modules/@fontsource/audiowide/files/audiowide-latin-400-normal.woff",
    ),
    weight: 400,
  });
  for (const [title, lineCount] of [
    ["Blog", 1],
    [cssTitle, 2],
    ["I Was Awarded as an Open UK Honouree", 2],
    [
      "Portable Class Library Version of NotificationsExtensions NuGet Package",
      3,
    ],
    [
      "A longer article title with more than eighty characters to exercise the smallest title font size",
      3,
    ],
  ] as const) {
    const root: Node = {
      type: "container",
      style: { width: 1200, height: 630, fontFamily: "Audiowide" },
      children: [
        { type: "container" },
        {
          type: "container",
          children: [
            {
              type: "text",
              text: title,
              style: {
                maxWidth: "100%",
                boxSizing: "border-box",
                padding: "20px 24px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.85)",
                color: "#000000",
                fontSize: title.length > 80 ? 42 : title.length > 50 ? 48 : 56,
                lineHeight: 1.25,
              },
            },
          ],
        },
      ],
    };
    await exports.fitOgTitleLines(
      { type: "container", children: [root] },
      renderer,
    );
    const foreground = root.children?.[1];
    if (foreground?.type !== "container") {
      throw new Error("Missing foreground");
    }
    const heading = foreground.children?.[0];
    if (heading?.type !== "container" || !heading.children) {
      throw new Error("Missing fitted title lines");
    }
    expect(
      heading.children
        .map((line) => line.type === "text" && line.text)
        .join(" "),
    ).toBe(title);
    expect(heading.style?.background).toBeUndefined();
    expect(heading.children.length, title).toBe(lineCount);
    for (const line of heading.children) {
      const measured = await renderer.measure(
        { ...line, style: { ...line.style, fontFamily: "Audiowide" } },
        { width: 1088, height: 630 },
      );
      expect(measured.runs).toHaveLength(1);
      expect(measured.width).toBeLessThanOrEqual(1088);
      expect(measured.width - measured.runs[0]!.width).toBeGreaterThanOrEqual(
        48,
      );
      expect(measured.width - measured.runs[0]!.width).toBeLessThan(49);
      expect(line.style?.background).toBe("rgba(255, 255, 255, 0.85)");
      expect(line.style?.opacity).toBeUndefined();
    }
    if (title === cssTitle) {
      expect(Number(heading.children[1]!.style?.width)).toBeLessThan(
        Number(heading.children[0]!.style?.width),
      );
    }
  }
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
    const bar = await sharp(buffer)
      .extract({ left: 0, top: 618, width: 1200, height: 12 })
      .removeAlpha()
      .toBuffer();
    const { channels } = await sharp(bar).stats();
    expect(
      channels.map(({ min, max }) => [min, max]),
      path,
    ).toEqual([
      [107, 107],
      [23, 23],
      [232, 232],
    ]);
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
