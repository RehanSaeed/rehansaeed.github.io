import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { expect, test } from "@playwright/test";

const shortcuts = [
  { name: "Blog", slug: "blog", url: "/" },
  { name: "Portfolio", slug: "portfolio", url: "/portfolio/" },
  { name: "About", slug: "about", url: "/about/" },
];

test("PWA shortcut PNGs match their branded SVG sources", async () => {
  for (const { slug } of shortcuts) {
    const filename = join("public", "images", "icons", slug);
    const image = sharp(`${filename}.png`);
    const metadata = await image.metadata();
    expect([metadata.width, metadata.height]).toEqual([192, 192]);
    expect(metadata.format).toBe("png");
    expect(metadata.exif).toBeUndefined();
    const pixels = await image.ensureAlpha().raw().toBuffer();
    const source = await sharp(`${filename}.svg`)
      .resize(192, 192)
      .ensureAlpha()
      .raw()
      .toBuffer();
    expect(pixels.equals(source), `${slug}: reproducible export`).toBe(true);

    let foreground = 0;
    let transparent = 0;
    let outsideSafeCircle = 0;
    for (let y = 0; y < 192; y++) {
      for (let x = 0; x < 192; x++) {
        const offset = (y * 192 + x) * 4;
        if (pixels[offset + 3] !== 255) {
          transparent++;
        }
        const background =
          pixels[offset] === 107 &&
          pixels[offset + 1] === 23 &&
          pixels[offset + 2] === 232;
        if (!background) {
          foreground++;
          if (Math.hypot(x + 0.5 - 96, y + 0.5 - 96) >= 192 * 0.4) {
            outsideSafeCircle++;
          }
        }
      }
    }
    expect(transparent, `${slug}: opaque background`).toBe(0);
    expect(outsideSafeCircle, `${slug}: mask-safe artwork`).toBe(0);
    expect(foreground, `${slug}: visible glyph`).toBeGreaterThan(1_000);
  }
});

test("The manifest serves the redesigned icons for all three shortcuts", async ({
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.shortcuts).toHaveLength(shortcuts.length);
  for (const { name, slug, url } of shortcuts) {
    const shortcut = manifest.shortcuts.find(
      (shortcut: { name: string }) => shortcut.name === name,
    );
    expect(shortcut).toMatchObject({
      url,
      icons: [{ src: `/images/icons/${slug}.png`, sizes: "192x192" }],
    });
    const icon = await request.get(shortcut.icons[0].src);
    expect(icon.ok()).toBe(true);
    expect(icon.headers()["content-type"]).toContain("image/png");
    expect(await icon.body()).toEqual(
      await readFile(join("public", "images", "icons", `${slug}.png`)),
    );
  }
});
