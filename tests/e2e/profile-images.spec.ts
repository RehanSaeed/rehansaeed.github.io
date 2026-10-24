import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./fixtures";

const authorDirectory = "images/author/Muhammad-Rehan-Saeed";
const iconSizes = [16, 48, 72, 96, 120, 128, 144, 152, 180, 192, 384, 512];
const pngPixelHashes: Record<number, string> = {
  16: "416cc52f4308f01827f3d2b0ffe485ef044bd463b489d0e897fc80aa13d050e7",
  48: "6e4e530c1bf59897b0180254ed1dc1d38531d81293dfe9d360e48ce174b5bbb4",
  64: "62e7f8bf10df9a40e1be35de6fbb96e6b893049bf37bc29e0990710cf6ab4f78",
  72: "83eef04f1583e6f9971aa24cc9aa58ea6e1bcc02b6b7ba3cc9e8c35626234ca9",
  96: "c74f677de8501118b1eb24566eb72dc46d6b7e4b8c7aeb2730700d1f0030bda0",
  120: "c9a58c2e559234cdccf69ffd31fb4989fc57588d7aa923c8dc547ff3038ff99a",
  128: "75e247e1540638b2412b484fb06a39c200bdd51648e9045519c19f9011abe025",
  144: "86684c47b76be9352f36104930271b7dabcb3df7626146ebda71d36159bb206c",
  152: "d1bf93fe1aa2a217b17927f28b936876abfbafcff3cbc2bc23382dd36f998b51",
  180: "7ca7ed88374176db9b699b7f4aa077ffb14e14449d924fcdea470fd061a54d20",
  192: "fc0586e7cefa2b5bc0db2920989fb35ce8e4e308f3e51f339fc25745922b73dd",
  384: "5fb850431056dea763c990bda1793057173a6203703e593dd0c2c33e25a623b3",
  512: "b9f2657cb4e0f587428f07dc1fba3a387a27fed6d9fb743627c7d37216349a51",
};

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
      // Expand implicit commands so lossless SVGO serialization keeps the D1 fingerprint.
      expect(portrait[0], filename).not.toMatch(/[^MLC\d\s,.-]/);
      const d1Commands = [...portrait[0].matchAll(/([MLC])([^MLC]*)/g)].flatMap(
        ([, command, coordinates]) => {
          const numbers = coordinates.match(/-?\d*\.?\d+/g)!.map(Number);
          const arity = command === "C" ? 6 : 2;
          expect(numbers.length % arity, filename).toBe(0);
          return Array.from({ length: numbers.length / arity }, (_, index) => [
            command === "M" && index > 0 ? "L" : command,
            ...numbers.slice(index * arity, (index + 1) * arity),
          ]);
        },
      );
      expect(
        createHash("sha256").update(JSON.stringify(d1Commands)).digest("hex"),
        `${filename}: unchanged D1 face, hair and shirt`,
      ).toBe(
        "754c884b163959c22b514afa8c029c976d0e6042fa035e9f2a332ce18ae0f216",
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
      if (metadata.format === "png") {
        const pixels = await sharp(join("public", path))
          .toColourspace("srgb")
          .ensureAlpha()
          .raw()
          .toBuffer();
        expect(
          createHash("sha256").update(pixels).digest("hex"),
          `${path}: lossless decoded sRGB pixels and alpha`,
        ).toBe(pngPixelHashes[width]);
      }
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
