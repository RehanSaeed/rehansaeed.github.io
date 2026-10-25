import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import { load } from "cheerio";
import sharp from "sharp";
import { listFiles } from "../../modules/blog-content/scan";
import { getAvifSource } from "../../shared/utils/images";
import { expect, test } from "./fixtures";

unitTest(
  "Every PNG/JPG has a decodable AVIF companion with the same dimensions and alpha",
  async () => {
    unitTest.setTimeout(120_000);
    let count = 0;
    let originalBytes = 0;
    let avifBytes = 0;
    for (const directory of ["public", "content"]) {
      for (const file of await listFiles(directory)) {
        expect(file).not.toMatch(/\.jpeg$/i);
        if (!/\.(png|jpg)$/.test(file)) continue;
        const original = await readFile(join(directory, file));
        const avif = await readFile(join(directory, `${file}.avif`));
        const source = await sharp(original).metadata();
        const encoded = await sharp(avif).metadata();
        expect(encoded.format, file).toBe("heif");
        expect(encoded.compression, file).toBe("av1");
        expect(encoded.autoOrient, file).toEqual(source.autoOrient);
        expect(encoded.hasAlpha, file).toBe(source.hasAlpha);
        expect(encoded.exif, file).toBeUndefined();
        expect(encoded.xmp, file).toBeUndefined();
        await sharp(avif).raw().toBuffer();
        originalBytes += original.length;
        avifBytes += avif.length;
        count++;
      }
    }
    expect(count).toBeGreaterThan(300);
    expect(avifBytes).toBeLessThan(originalBytes);
  },
);

unitTest(
  "Static sources distinguish PNG/JPG collisions and leave external images alone",
  () => {
    expect(getAvifSource("/images/example.png")).toBe(
      "/images/example.png.avif",
    );
    expect(getAvifSource("/images/example.jpg")).toBe(
      "/images/example.jpg.avif",
    );
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
  "Generated responsive pictures prefer AVIF and retain PNG/JPG fallback srcsets",
  async () => {
    for (const path of [
      "/",
      "/about/",
      "/portfolio/",
      "/gitattributes-best-practices/",
    ]) {
      const $ = load(await readFile(join("dist", path, "index.html"), "utf8"));
      const images = $("img[data-nuxt-pic]");
      expect(images.length, path).toBeGreaterThan(0);
      for (const element of images) {
        const image = $(element);
        const source = image.parent("picture").children("source");
        expect(source.length, path).toBe(1);
        expect(source.attr("type"), path).toBe("image/avif");
        expect(source.attr("srcset"), path).toContain("f_avif");
        expect(image.attr("src"), path).toMatch(/f_(png|jpg)[,&/]/);
        expect(image.attr("srcset"), path).toMatch(/\d+[wx]/);
      }
    }
  },
);

test("Browsers choose AVIF for responsive pictures", async ({ page }) => {
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

test("Runtime search results load pre-generated AVIF without an image server", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open search" }).click();
  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill("Schema.NET");
  const image = page.locator(".search-result__image").first();
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete &&
          element.naturalWidth > 0 &&
          element.currentSrc.endsWith(".png.avif") &&
          !element.currentSrc.includes("/_ipx/"),
      ),
    )
    .toBe(true);
});

test.describe("Native fallback without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const [path, format] of [
    ["/gitattributes-best-practices/", "png"],
    ["/on-the-etiquette-of-pull-request-comments/", "jpg"],
  ] as const) {
    test(`Browsers skip unsupported formats and load the ${format.toUpperCase()} fallback`, async ({
      page,
    }) => {
      await page.route(`**${path}`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: (await response.text()).replaceAll(
            'type="image/avif"',
            'type="image/unsupported"',
          ),
        });
      });
      await page.goto(path);
      const image = page.locator(".post__photo");
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement, format) =>
              element.complete &&
              element.naturalWidth > 0 &&
              element.currentSrc.includes(`f_${format}`),
            format,
          ),
        )
        .toBe(true);
    });
  }
});
