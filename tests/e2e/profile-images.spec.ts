import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import sharp from "sharp";
import { parse as parseYaml } from "yaml";
import { expect, test } from "./fixtures";

const authorDirectory = "images/author/Muhammad-Rehan-Saeed";
const iconSizes = [16, 48, 72, 96, 120, 128, 144, 152, 180, 192, 384, 512];
const pngPixelHashes: Record<number, string> = {
  16: "fb83d34d929b0e20e18b0e2d2f9bb8b841add997832fad4437769513aca9aa86",
  48: "15d51aff8126338a8524c15a297895a8e1d64b9c938eccb0ed52d0a55d635b0b",
  64: "587489ace3c62d6eace52b1a13db5deff48ae4fd11dc15c1220e496b57537cf0",
  72: "2a4a083fe1a099d2406ecdd0b64e9dce077c38f5b90af6e162d7467838cc0cc1",
  96: "5951c495e74068f25c5194f955df958469af6d60e6f45bf4dcc783d57de5a2e1",
  120: "2acfe4c85a30f8914157f9f087596e057c327ab6f3288123328718ac272ab842",
  128: "0cde068cc9970951c687c14379f458b89d668d2cb7841b844fe97c56d254ced1",
  144: "d74595f50ee4e94982f24dc4b47c40873d6e8d1ec1d2e45070f013a2c5239f17",
  152: "6a9aa8957d633e3fb67e5951847226541db1fb4c8c344460633783eed22799d8",
  180: "f3c4306d928371227a014635310d84c650cae687e88f7f1d80a2a9e4b0096d53",
  192: "dd3f4dfa1c106302d0dead0231ba709db756960b47515b38113c8057921e0c94",
  384: "f2699b55b9e4878e86392e1e406a9e67df8f43c1047715c9d729b559b2ef1678",
  512: "b982693776b546944236652c3c61c77728ba813c43de6dad0b4d1673e776ed06",
};

unitTest(
  "Purple avatars share a vector portrait with no embedded photo",
  async () => {
    const paths: string[] = [];
    for (const filename of [
      join("public", "favicon.svg"),
      join("public", authorDirectory, "Logo.svg"),
      join("app", "assets", "icons", "rehan.svg"),
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
  "The circle logo joins both shoulders and torso to the ring without changing the portrait",
  async () => {
    const source = await readFile(
      join("public", authorDirectory, "Logo.svg"),
      "utf8",
    );
    const previous = source
      .replace(/\s*<polygon\b[^>]*\/>/, "")
      .replace('r="108"', 'r="107.5"');
    const render = (svg: string) =>
      sharp(Buffer.from(svg)).resize(980, 980).ensureAlpha().raw().toBuffer();
    const [pixels, original] = await Promise.all([
      render(source),
      render(previous),
    ]);
    expect(
      pixels
        .subarray(0, 720 * 980 * 4)
        .equals(original.subarray(0, 720 * 980 * 4)),
      "Face, hair and ear pixels above the shoulders remain identical",
    ).toBe(true);
    const regions = {
      left: { checked: 0, previousGaps: 0 },
      right: { checked: 0, previousGaps: 0 },
      bottom: { checked: 0, previousGaps: 0 },
      spot: { checked: 0, previousGaps: 0 },
    };
    for (let y = 0; y < 980; y++) {
      for (let x = 0; x < 980; x++) {
        const sx = (x + 0.5) / 4;
        const sy = (y + 0.5) / 4;
        if (Math.hypot(sx - 122.5, sy - 122.5) > 107.25) continue;
        const region =
          sx < 39 && sy > 206.55 - 0.48 * sx + 0.5
            ? "left"
            : sx > 205.5 && sy > 88.03 + 0.4616 * sx + 0.5
              ? "right"
              : sx > 42 && sx < 46 && sy > 188 && sy < 189
                ? "spot"
                : sy > 227
                  ? "bottom"
                  : undefined;
        if (!region) continue;
        const offset = (y * 980 + x) * 4;
        regions[region].checked++;
        if (
          original[offset] === 249 &&
          original[offset + 1] === 250 &&
          original[offset + 2] === 251
        ) {
          regions[region].previousGaps++;
        }
        expect(
          [...pixels.subarray(offset, offset + 4)],
          `${region}: no white gap at (${sx}, ${sy})`,
        ).toEqual([107, 23, 232, 255]);
      }
    }
    for (const [region, coverage] of Object.entries(regions)) {
      expect(coverage.checked, `${region}: coverage`).toBeGreaterThan(0);
      expect(
        coverage.previousGaps,
        `${region}: detects the previous white gap`,
      ).toBeGreaterThan(0);
    }
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
        expect(metadata.isPalette, `${path}: no palette quantization`).toBe(
          false,
        );
        const pixels = await sharp(join("public", path))
          .toColourspace("srgb")
          .ensureAlpha()
          .raw()
          .toBuffer();
        expect(
          createHash("sha256").update(pixels).digest("hex"),
          `${path}: lossless decoded sRGB pixels and alpha`,
        ).toBe(pngPixelHashes[width]);
        if (width === 512) {
          const colors = new Set<number>();
          for (let index = 0; index < pixels.length; index += 4) {
            colors.add(pixels.readUInt32LE(index));
          }
          expect(
            colors.size,
            `${path}: retained photographic colour detail`,
          ).toBeGreaterThan(40_000);
        }
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
      expect(metadata.isPalette, `${size}px ICO: no palette quantization`).toBe(
        false,
      );
      await sharp(image).raw().toBuffer();
      if (iconSizes.includes(size)) {
        expect(image).toEqual(
          await readFile(
            join("public", "images", "icons", `favicon-${size}x${size}.png`),
          ),
        );
      }
    }
    expect(sizes).toEqual([48, 32, 16]);
  },
);

unitTest(
  "Both compression workflows preserve profile photo exports",
  async () => {
    for (const workflow of [
      "compress-images.yml",
      "compress-images-on-demand.yml",
    ]) {
      const source = await readFile(
        join(".github", "workflows", workflow),
        "utf8",
      );
      const configuration = parseYaml(source);
      const step = configuration.jobs.build.steps.find(
        (step: { uses?: string }) =>
          step.uses?.startsWith("calibreapp/image-actions@"),
      );
      expect(step.with.ignorePaths.split(","), workflow).toEqual(
        expect.arrayContaining([
          `public/${authorDirectory}/Profile-320x480.jpg`,
          `public/${authorDirectory}/Logo-*.png`,
          "public/favicon.png",
          "public/images/icons/favicon-*.png",
        ]),
      );
    }
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
