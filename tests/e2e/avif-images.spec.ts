import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import { load } from "cheerio";
import sharp from "sharp";
import { listFiles } from "../../modules/blog-content/scan";
import { getAvifSource } from "../../shared/utils/images";
import { expect, test } from "./fixtures";

unitTest(
  "Every PNG/JPG has a plain AVIF companion, preferring PNG for shared basenames",
  async () => {
    unitTest.setTimeout(120_000);
    let count = 0;
    let originalBytes = 0;
    let avifBytes = 0;
    for (const directory of ["public", "content"]) {
      const files = await listFiles(directory);
      const checked = new Set<string>();
      for (const file of files) {
        expect(file).not.toMatch(/\.jpeg$/i);
        expect(file).not.toMatch(/\.(png|jpg)\.avif$/i);
        if (!/\.(png|jpg)$/.test(file)) continue;
        const basename = file.replace(/\.(png|jpg)$/, "");
        const preferredSource = files.includes(`${basename}.png`)
          ? `${basename}.png`
          : file;
        const original = await readFile(join(directory, preferredSource));
        const avif = await readFile(join(directory, `${basename}.avif`));
        const source = await sharp(original).metadata();
        const encoded = await sharp(avif).metadata();
        expect(encoded.format, file).toBe("heif");
        expect(encoded.compression, file).toBe("av1");
        expect(encoded.autoOrient, file).toEqual(source.autoOrient);
        expect(encoded.hasAlpha, file).toBe(source.hasAlpha);
        expect(encoded.exif, file).toBeUndefined();
        expect(encoded.xmp, file).toBeUndefined();
        await sharp(avif).raw().toBuffer();
        if (!checked.has(basename)) {
          originalBytes += original.length;
          avifBytes += avif.length;
          checked.add(basename);
        }
        if (file.endsWith(".jpg") && preferredSource.endsWith(".png")) {
          expect(avif, `${file}: shared AVIF encoded from PNG`).toEqual(
            await sharp(original)
              .autoOrient()
              .avif({ quality: 60, effort: 4, chromaSubsampling: "4:4:4" })
              .toBuffer(),
          );
        }
        count++;
      }
    }
    expect(count).toBeGreaterThan(300);
    expect(avifBytes).toBeLessThan(originalBytes);
  },
);

unitTest(
  "Static sources share plain AVIF URLs for PNG/JPG pairs and leave external images alone",
  () => {
    expect(getAvifSource("/images/example.png")).toBe("/images/example.avif");
    expect(getAvifSource("/images/example.jpg")).toBe("/images/example.avif");
    for (const src of [
      "https://example.com/photo.jpg",
      "//example.com/photo.jpg",
      "data:image/png;base64,AAAA",
      "/images/logo.svg",
    ]) {
      expect(getAvifSource(src)).toBeUndefined();
    }
  },
);

unitTest(
  "Generated responsive images use AVIF sources without picture fallbacks",
  async () => {
    for (const path of [
      "/",
      "/about/",
      "/portfolio/",
      "/gitattributes-best-practices/",
    ]) {
      const $ = load(await readFile(join("dist", path, "index.html"), "utf8"));
      const images = $("img[data-nuxt-img]").filter((_, element) =>
        ($(element).attr("src") ?? "").includes("f_avif"),
      );
      expect(images.length, path).toBeGreaterThan(0);
      expect($("picture").length, path).toBe(0);
      for (const element of images) {
        const image = $(element);
        expect(image.attr("src"), path).toMatch(/f_avif[,&/]/);
        expect(image.attr("src"), path).toMatch(/\.avif$/);
        expect(image.attr("srcset"), path).not.toMatch(
          /\.(png|jpe?g)(?:[ ,]|$)/,
        );
        expect(image.attr("srcset"), path).toMatch(/\d+[wx]/);
      }
    }
  },
);

unitTest(
  "Every generated page delivers local raster content as AVIF",
  async () => {
    const files = await listFiles("dist");
    let count = 0;
    for (const file of files.filter((file) => file.endsWith(".html"))) {
      const $ = load(await readFile(join("dist", file), "utf8"));
      expect($("picture").length, file).toBe(0);
      for (const element of $("img")) {
        const image = $(element);
        const src = image.attr("src") ?? "";
        if (!src.startsWith("/") || src.startsWith("//")) continue;
        expect(src, `${file}: ${src}`).not.toMatch(/\.(png|jpe?g)(?:[?#]|$)/i);
        expect(image.attr("srcset") ?? "", file).not.toMatch(
          /\.(png|jpe?g)(?:[ ?,]|$)/i,
        );
        count++;
      }
      for (const element of $('link[rel="preload"][as="image"]')) {
        expect($(element).attr("href"), file).toMatch(/\.avif$/);
        expect($(element).attr("imagesrcset"), file).not.toMatch(
          /\.(png|jpg) /,
        );
      }
    }
    expect(count).toBeGreaterThan(1000);
  },
);

for (const deviceScaleFactor of [1, 2]) {
  test.describe(`Intrinsic portrait at ${deviceScaleFactor}x density`, () => {
    test.use({ deviceScaleFactor });
    test("Retains the former picture's intrinsic grid frame", async ({
      page,
    }) => {
      await page.goto("/about/");
      const portrait = page.locator(".about__image");
      await expect
        .poll(() =>
          portrait.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const dimensions = await portrait.evaluate((image: HTMLImageElement) => ({
        width: image.getBoundingClientRect().width,
        intrinsic: image.naturalWidth,
      }));
      expect(dimensions.width).toBe(Math.min(320, dimensions.intrinsic));
    });
  });
}

test("Browsers load responsive AVIF with hero priority preserved", async ({
  page,
}) => {
  await page.goto("/gitattributes-best-practices/");
  const image = page.locator(".post__photo");
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete &&
          element.naturalWidth > 0 &&
          element.currentSrc.includes("f_avif"),
      ),
    )
    .toBe(true);
  await expect(image).toHaveAttribute("fetchpriority", "high");
  const response = await page.request.get(
    await image.evaluate((element: HTMLImageElement) => element.currentSrc),
  );
  expect((await sharp(await response.body()).metadata()).compression).toBe(
    "av1",
  );
});

test("About award sources match their CSS widths without changing their frames", async ({
  page,
}) => {
  await page.goto("/about/");
  const badges = page.locator(".about__badge-image");
  await expect(badges).toHaveCount(10);
  for (const badge of await badges.all()) {
    const wide = (await badge.getAttribute("class"))?.includes(
      "about__badge-image--wide",
    );
    const width = wide ? 180 : 150;
    await expect(badge).toHaveCSS("width", `${width}px`);
    await expect(badge).toHaveCSS("height", "150px");
    await expect(badge).toHaveAttribute("sizes", `${width}px`);
    const source = badge;
    await expect(source).toHaveAttribute("sizes", `${width}px`);
    await expect(source).toHaveAttribute(
      "srcset",
      new RegExp(`s_${width}x\\d+.* ${width}w`),
    );
    await expect(source).toHaveAttribute(
      "srcset",
      new RegExp(`s_${width * 2}x\\d+.* ${width * 2}w`),
    );
  }
  const honours = page.locator(".about__open-uk-honours-image");
  await expect(honours).toHaveCSS("width", "322px");
  await expect(honours).toHaveAttribute("sizes", "322px");
  await expect(honours).toHaveAttribute(
    "srcset",
    /s_322x99.* 322w.*s_644x198.* 644w/,
  );
});

test("Images retain block layout without picture wrappers", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/about/",
    "/portfolio/",
    "/asp-net-mvc-boilerplate/",
  ]) {
    await page.goto(path);
    const displays = await page
      .locator("img[data-nuxt-img]")
      .evaluateAll((images) =>
        images.map((image) => getComputedStyle(image).display),
      );
    await expect(page.locator("picture")).toHaveCount(0);
    expect(displays.length, path).toBeGreaterThan(0);
    expect(
      displays.every((display) => display === "block"),
      path,
    ).toBe(true);
  }
});

test("Runtime search results load pre-generated AVIF without an image server", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open search" }).click();
  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill("Schema.NET");
  const image = page.locator(".search-result__image").first();
  await expect(image).toHaveCSS("display", "block");
  await expect(image).toHaveCSS("grid-area", "image");
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete &&
          element.naturalWidth > 0 &&
          element.currentSrc.endsWith("/Schema.NET-1366x768.avif") &&
          !element.currentSrc.includes("/_ipx/"),
      ),
    )
    .toBe(true);
  const imageBox = await image.boundingBox();
  const titleBox = await page
    .locator(".search-result__title")
    .first()
    .boundingBox();
  expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(titleBox!.x);
});

test("PNG/JPG thumbnail inputs resolve to the same AVIF-only image", async ({
  page,
}) => {
  const basename = "/images/thumbnails/Blank";
  await page.goto(
    `/streaming/thumbnail/?${new URLSearchParams({
      image1: `${basename}.png`,
      image2: `${basename}.jpg`,
      background: "/images/hero/Code-1600x900.jpg",
    })}`,
  );
  await expect(page.locator(".thumbnail")).toHaveCSS(
    "background-image",
    /\/images\/hero\/Code-1600x900\.avif/,
  );
  for (const index of [0, 1]) {
    const image = page.locator(`img.thumbnail__image${index + 1}`);
    await expect(image).toHaveCSS("display", "block");
    await expect(image).toHaveCSS("grid-area", "content");
    await expect(image).toHaveAttribute("src", `${basename}.avif`);
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement, basename) =>
            element.complete &&
            element.naturalWidth > 0 &&
            new URL(element.currentSrc).pathname === `${basename}.avif`,
          basename,
        ),
      )
      .toBe(true);
  }
});

test("Runtime thumbnails preserve SVGs and third-party image URLs", async ({
  page,
}) => {
  const remote = "https://example.com/photo.jpg";
  await page.route(remote, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="purple"/></svg>',
    }),
  );
  await page.goto(
    `/streaming/thumbnail/?${new URLSearchParams({
      image1: "/favicon.svg",
      image2: remote,
      background: remote,
    })}`,
  );
  await expect(page.locator("img.thumbnail__image1")).toHaveAttribute(
    "src",
    "/favicon.svg",
  );
  const image = page.locator("img.thumbnail__image2");
  await expect(image).toHaveAttribute("src", remote);
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(page.locator(".thumbnail")).toHaveCSS(
    "background-image",
    `url("${remote}")`,
  );
});

test.describe("AVIF-only delivery without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const path of [
    "/gitattributes-best-practices/",
    "/on-the-etiquette-of-pull-request-comments/",
  ]) {
    test(`Loads AVIF without scripts on ${path}`, async ({ page }) => {
      await page.goto(path);
      const image = page.locator(".post__photo");
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete &&
              element.naturalWidth > 0 &&
              element.currentSrc.includes("f_avif"),
          ),
        )
        .toBe(true);
    });
  }
});

unitTest(
  "Precache retains PNG installation assets but no PNG/JPG content fallbacks",
  async () => {
    const worker = await readFile(join("dist", "service-worker.js"), "utf8");
    const urls = [...worker.matchAll(/\burl:"([^"]+)"/g)].map(
      (match) => match[1]!,
    );
    expect(urls.length).toBeGreaterThan(1000);
    const rasters = urls.filter((url) => /\.(png|jpe?g)$/i.test(url));
    expect(rasters.length).toBeGreaterThan(0);
    for (const url of rasters) {
      expect(url).toMatch(
        /^(?:favicon\.png|images\/(?:icons|screenshots)\/.+\.png)$/,
      );
    }
    expect(urls).toContain("images/hero/Schema.NET-1366x768.avif");
    expect(
      urls.some((url) => url.startsWith("_ipx/") && url.includes("f_avif")),
    ).toBe(true);
  },
);

// Keep routing fixtures out of the real service-worker navigation check.
unitTest.describe("Offline AVIF content", () => {
  unitTest.use({ serviceWorkers: "allow" });
  unitTest(
    "A fresh offline page and runtime search need no PNG/JPG content",
    async ({ page, context }) => {
      test.setTimeout(120_000);
      await page.goto("/");
      await page.evaluate(async () => {
        await navigator.serviceWorker.register("/service-worker.js");
        await navigator.serviceWorker.ready;
      });
      await expect
        .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
        .toBe(true);
      await context.setOffline(true);
      await page.goto("/gitattributes-best-practices/");
      const hero = page.locator(".post__photo");
      await expect
        .poll(() =>
          hero.evaluate(
            (image: HTMLImageElement) =>
              image.complete &&
              image.naturalWidth > 0 &&
              image.currentSrc.includes("f_avif"),
          ),
        )
        .toBe(true);
      await page.getByRole("button", { name: "Open search" }).click();
      await page
        .getByRole("searchbox", { name: "Search", exact: true })
        .fill("Schema.NET");
      const result = page.locator(".search-result__image").first();
      await expect
        .poll(() =>
          result.evaluate(
            (image: HTMLImageElement) =>
              image.complete &&
              image.naturalWidth > 0 &&
              image.currentSrc.endsWith(".avif"),
          ),
        )
        .toBe(true);
    },
  );
});
