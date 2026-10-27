import {
  mkdtemp,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { prepareImageCache } from "../../modules/image-cache/cache";

const image = "public/images/photo.png";
const variant = "_ipx/f_avif&s_20x10/images/photo.png";
const bytes = Buffer.from([0, 255, 128, 32, 10, 13]);

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "blog-image-cache-"));
  for (const file of [
    "package-lock.json",
    "nuxt.config.ts",
    "modules/image-cache/index.ts",
    "modules/image-cache/cache.ts",
    "modules/blog-content/paths.ts",
    "content/posts/example/index.md",
    image,
    `dist/${variant}`,
  ]) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), bytes);
  }
  return root;
}

test("A warm image cache preserves binary output and can accumulate new sizes", async () => {
  const root = await fixture();
  try {
    const cold = await prepareImageCache(root);
    expect(cold.hit).toBe(false);
    await cold.save(join(root, "dist"));
    const warm = await prepareImageCache(root);
    expect(warm.hit).toBe(true);
    expect(await readFile(join(warm.publicDir, variant))).toEqual(bytes);

    const additional = variant.replace("20x10", "40x20");
    await mkdir(dirname(join(root, "dist", additional)), { recursive: true });
    await writeFile(join(root, "dist", additional), bytes);
    await warm.save(join(root, "dist"));
    const next = await prepareImageCache(root);
    expect(next.hit).toBe(true);
    expect(await readFile(join(next.publicDir, additional))).toEqual(bytes);

    await writeFile(join(root, "content/posts/example/index.md"), "New text");
    expect((await prepareImageCache(root)).hit).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const file of [
  image,
  "package-lock.json",
  "nuxt.config.ts",
  "modules/image-cache/index.ts",
  "modules/image-cache/cache.ts",
  "modules/blog-content/paths.ts",
]) {
  test(`Changing ${file} invalidates and removes stale image output`, async () => {
    const root = await fixture();
    try {
      const cold = await prepareImageCache(root);
      await cold.save(join(root, "dist"));
      await writeFile(join(root, file), "Changed bytes");
      const changed = await prepareImageCache(root);
      expect(changed.hit).toBe(false);
      await expect(
        readFile(join(changed.publicDir, variant)),
      ).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("Renaming or removing an image invalidates cached URLs", async () => {
  const root = await fixture();
  try {
    const cold = await prepareImageCache(root);
    await cold.save(join(root, "dist"));
    await rename(join(root, image), join(root, "public/images/renamed.png"));
    const renamed = await prepareImageCache(root);
    expect(renamed.hit).toBe(false);
    await renamed.save(join(root, "dist"));
    await rm(join(root, "public/images/renamed.png"));
    expect((await prepareImageCache(root)).hit).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Missing fingerprint inputs fail rather than reusing unverified output", async () => {
  const root = await fixture();
  try {
    await rm(join(root, "package-lock.json"));
    await expect(prepareImageCache(root)).rejects.toThrow("ENOENT");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("A failed image-output save cannot mark a cold cache as complete", async () => {
  const root = await fixture();
  try {
    const cold = await prepareImageCache(root);
    await rm(join(root, "dist", "_ipx"), { recursive: true });
    await expect(cold.save(join(root, "dist"))).rejects.toThrow("ENOENT");
    expect((await prepareImageCache(root)).hit).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("CI persists only the responsive image cache before generation", async () => {
  const workflow = parse(await readFile(".github/workflows/build.yml", "utf8"));
  const steps = workflow.jobs.build.steps;
  const cacheIndex = steps.findIndex(
    (step: { name: string }) => step.name === "Cache Responsive Images",
  );
  expect(cacheIndex).toBeGreaterThan(-1);
  expect(cacheIndex).toBeLessThan(
    steps.findIndex((step: { name: string }) => step.name === "NPM Build"),
  );
  expect(steps[cacheIndex].with.path).toBe(".cache/nuxt-images");
  for (const input of [
    "runner.os",
    "runner.arch",
    "package-lock.json",
    "nuxt.config.ts",
    "modules/image-cache/**",
    "public/**",
    "content/**/*.png",
    "github.sha",
  ]) {
    expect(steps[cacheIndex].with.key).toContain(input);
  }
});
