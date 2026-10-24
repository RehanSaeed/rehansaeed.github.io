import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./fixtures";

const authorDirectory = "images/author/Muhammad-Rehan-Saeed";
const iconSizes = [16, 48, 72, 96, 120, 128, 144, 152, 180, 192, 384, 512];

unitTest(
  "Purple avatars share a vector portrait with no embedded photo",
  async () => {
    const paths: string[] = [];
    for (const filename of [
      join("public", "favicon.svg"),
      join("public", authorDirectory, "Logo.svg"),
      join("app", "components", "shared", "icons", "icon-rehan.vue"),
    ]) {
      const source = await readFile(filename, "utf8");
      const portrait = [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(portrait, filename).toHaveLength(2);
      expect(
        createHash("sha256").update(portrait[0]).digest("hex"),
        `${filename}: unchanged D1 face, hair and shirt`,
      ).toBe(
        "7bd0843cabb6a62d4991e016aea9e87a2394cd01154f2567316c1d0f13130895",
      );
      paths.push(JSON.stringify(portrait));
      expect(source, filename).not.toMatch(/<image\b|data:image/);
      const { data, info } = await sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 245 245" width="245" height="245">${portrait.map((d) => `<path fill="#6b17e8" fill-rule="evenodd" d="${d}" />`).join("")}</svg>`,
        ),
      )
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect([info.width, info.height]).toEqual([245, 245]);
      const filled = data.filter(
        (value, index) => index % 4 === 3 && value === 255,
      );
      expect(filled.length).toBeGreaterThan(12_000);
      expect(filled.length).toBeLessThan(30_000);
      let earPixels = 0;
      for (let y = 90; y < 123; y++) {
        for (let x = 173; x < 181; x++) {
          if (data[(y * info.width + x) * 4 + 3] > 127) earPixels++;
        }
      }
      expect(earPixels, `${filename}: restored ear contour`).toBeGreaterThan(
        25,
      );

      const { data: ear, info: earInfo } = await sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 245 245" width="980" height="980"><path fill="#6b17e8" fill-rule="evenodd" d="${portrait[1]}" /></svg>`,
        ),
      )
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const earFilled = ear.filter(
        (value, index) => index % 4 === 3 && value > 127,
      );
      expect(earFilled.length, `${filename}: fuller R6 ear`).toBeGreaterThan(
        3_500,
      );
      expect(earFilled.length, `${filename}: retained ear detail`).toBeLessThan(
        4_300,
      );
      for (const [x, y] of [
        [174, 92],
        [176, 110],
        [173, 116],
      ]) {
        expect(
          ear[(y * 4 * earInfo.width + x * 4) * 4 + 3],
          `${filename}: filled R6 ear at (${x}, ${y})`,
        ).toBe(255);
      }
      for (const [x, y] of [
        [173, 101],
        [170.75, 112.5],
        [171.5, 121],
      ]) {
        expect(
          ear[(y * 4 * earInfo.width + x * 4) * 4 + 3],
          `${filename}: inner ear negative space at (${x}, ${y})`,
        ).toBe(0);
      }
    }
    expect(new Set(paths).size).toBe(1);
  },
);

unitTest(
  "The purple SVG favicon follows the browser color scheme",
  async ({ page }) => {
    const favicon = await readFile(join("public", "favicon.svg"), "utf8");
    await page.setContent(favicon);
    for (const [colorScheme, color] of [
      ["light", "rgb(107, 23, 232)"],
      ["dark", "rgb(204, 189, 255)"],
    ] as const) {
      await page.emulateMedia({ colorScheme });
      await expect(page.locator(".favicon-container")).toHaveCSS("fill", color);
    }
  },
);

unitTest(
  "Profile photos retain their published dimensions without metadata",
  async () => {
    const images = [
      {
        path: `${authorDirectory}/Profile-320x480.jpg`,
        width: 320,
        height: 480,
      },
      ...[64, 192, 512].map((size) => ({
        path: `${authorDirectory}/Logo-${size}x${size}.png`,
        width: size,
        height: size,
      })),
      ...iconSizes.map((size) => ({
        path: `images/icons/favicon-${size}x${size}.png`,
        width: size,
        height: size,
      })),
      { path: "favicon.png", width: 512, height: 512 },
    ];
    for (const { path, width, height } of images) {
      const metadata = await sharp(join("public", path)).metadata();
      expect([metadata.width, metadata.height], path).toEqual([width, height]);
      expect(metadata.exif, path).toBeUndefined();
      expect(metadata.xmp, path).toBeUndefined();
    }
    for (const size of [192, 512]) {
      expect(
        await readFile(
          join("public", authorDirectory, `Logo-${size}x${size}.png`),
        ),
      ).toEqual(
        await readFile(
          join("public", "images", "icons", `favicon-${size}x${size}.png`),
        ),
      );
    }
    expect(await readFile(join("public", "favicon.png"))).toEqual(
      await readFile(join("public", authorDirectory, "Logo-512x512.png")),
    );
  },
);

unitTest(
  "The favicon contains decodable square profile photos at every ICO size",
  async () => {
    const ico = await readFile(join("public", "favicon.ico"));
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    const sizes: number[] = [];
    for (let index = 0; index < ico.readUInt16LE(4); index++) {
      const entry = 6 + index * 16;
      const size = ico[entry] || 256;
      expect(ico[entry + 1] || 256).toBe(size);
      sizes.push(size);
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      const image = ico.subarray(offset, offset + length);
      const metadata = await sharp(image).metadata();
      expect([metadata.width, metadata.height]).toEqual([size, size]);
      await sharp(image).raw().toBuffer();
    }
    expect(sizes).toEqual([48, 32, 16]);
  },
);

for (const width of [375, 1280]) {
  test(`Portrait and square profile photos load at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about/");
    const portrait = page.locator(".about__image");
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute("width", "320");
    await expect(portrait).toHaveAttribute("height", "480");
    await expect
      .poll(() =>
        portrait.evaluate(
          (image: HTMLImageElement) =>
            image.complete &&
            image.naturalWidth === 320 &&
            image.naturalHeight === 480,
        ),
      )
      .toBe(true);
    const navigation = page.locator(".navigation__image");
    await expect(navigation).toBeVisible();
    await expect
      .poll(() =>
        navigation.evaluate(
          (image: HTMLImageElement) =>
            image.complete &&
            image.naturalWidth > 0 &&
            image.naturalWidth === image.naturalHeight,
        ),
      )
      .toBe(true);
    const bounds = await portrait.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width / bounds!.height).toBeCloseTo(2 / 3, 3);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  });
}
