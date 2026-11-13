import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {} from "@nuxt/nitro-server/augments";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { prepareImageCache as prepareCache } from "../../modules/image-cache/cache";
import cacheModule from "../../modules/image-cache/index";

const image = "public/images/photo.png";
const variant = "_ipx/f_avif&s_20x10/images/photo.png";
const bytes = Buffer.from([0, 255, 128, 32, 10, 13]);
const settings = {
  image: { quality: 80, format: ["avif"], screens: { sm: 640, lg: 1024 } },
  ipx: { sharpOptions: { animated: true }, alias: { "/photo": "/images" } },
};
const prepareImageCache = (
  root: string,
  inputs: unknown = settings,
  dirs: string[] = [],
) => prepareCache(root, inputs, dirs);

async function fixture(root: string) {
  for (const file of [
    "package-lock.json",
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

test("Bundled icons and unrelated Nuxt settings preserve cached image bytes", async ({}, info) => {
  const root = await fixture(info.outputPath("image-cache"));
  try {
    const cold = await prepareImageCache(root);
    await cold.save(join(root, "dist"));
    await writeFile(
      join(root, "nuxt.config.ts"),
      'export default { icon: { clientBundle: { icons: ["fa-solid:minus", "fa-solid:plus"] } }, app: { head: { title: "New title" } } };',
    );
    const warm = await prepareImageCache(root);
    expect(warm.hit).toBe(true);
    expect(await readFile(join(warm.publicDir, variant))).toEqual(bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const [label, inputs] of Object.entries({
  quality: { ...settings, image: { ...settings.image, quality: 60 } },
  format: { ...settings, image: { ...settings.image, format: ["webp"] } },
  screens: { ...settings, image: { ...settings.image, screens: { sm: 720 } } },
  provider: {
    ...settings,
    image: { ...settings.image, provider: "ipxStatic" },
  },
  alias: {
    ...settings,
    ipx: { ...settings.ipx, alias: { "/photo": "/other" } },
  },
  sharp: {
    ...settings,
    ipx: { ...settings.ipx, sharpOptions: { animated: false } },
  },
  runtime: { ...settings, ipx: { ...settings.ipx, maxOutputDimension: 1024 } },
  environment: { ...settings, environment: { VIPS_MAX_COORD: "32768" } },
})) {
  test(`Changing effective ${label} settings removes stale image output`, async ({}, info) => {
    const root = await fixture(info.outputPath("image-cache"));
    try {
      const cold = await prepareImageCache(root);
      await cold.save(join(root, "dist"));
      const changed = await prepareImageCache(root, inputs);
      expect(changed.hit).toBe(false);
      await expect(
        readFile(join(changed.publicDir, variant)),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("Equivalent relevant settings are stable regardless of property order or omitted values", async ({}, info) => {
  const root = await fixture(info.outputPath("image-cache"));
  try {
    const cold = await prepareImageCache(root);
    await cold.save(join(root, "dist"));
    const warm = await prepareImageCache(root, {
      ipx: { alias: { "/photo": "/images" }, sharpOptions: { animated: true } },
      image: {
        screens: { lg: 1024, sm: 640 },
        format: ["avif"],
        quality: 80,
        unused: undefined,
      },
    });
    expect(warm.hit).toBe(true);
    expect(await readFile(join(warm.publicDir, variant))).toEqual(bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("A restored cache is portable between equivalent checkout roots", async ({}, info) => {
  const root = info.outputPath("checkouts");
  const first = await fixture(join(root, "first"));
  const second = await fixture(join(root, "second"));
  try {
    const cold = await prepareImageCache(first, { dir: join(first, "public") });
    await cold.save(join(first, "dist"));
    await cp(join(first, ".cache"), join(second, ".cache"), {
      recursive: true,
    });
    const restored = await prepareImageCache(second, {
      dir: join(second, "public"),
    });
    expect(restored.hit).toBe(true);
    expect(await readFile(join(restored.publicDir, variant))).toEqual(bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Configured source roots are hashed and a missing source fails closed", async ({}, info) => {
  const root = await fixture(info.outputPath("image-cache"));
  const extra = join(root, "extra");
  try {
    await mkdir(extra);
    await writeFile(join(extra, "image.svg"), "<svg/>");
    const cold = await prepareImageCache(root, settings, [extra]);
    await cold.save(join(root, "dist"));
    expect((await prepareImageCache(root, settings, [extra])).hit).toBe(true);
    await writeFile(join(extra, "image.svg"), '<svg width="2"/>');
    const changed = await prepareImageCache(root, settings, [extra]);
    expect(changed.hit).toBe(false);
    await expect(
      readFile(join(changed.publicDir, variant)),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await rm(extra, { recursive: true });
    await expect(prepareImageCache(root, settings, [extra])).rejects.toThrow(
      "ENOENT",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const [label, input] of Object.entries({
  function: {
    plugin: () => "same function text cannot verify closed-over values",
  },
  class: { plugin: new Map([["setting", true]]) },
  cycle: (() => {
    const object: Record<string, unknown> = {};
    object.self = object;
    return object;
  })(),
})) {
  test(`Non-serialisable ${label} settings cannot reuse or complete a cache`, async ({}, info) => {
    const root = await fixture(info.outputPath("image-cache"));
    try {
      const cold = await prepareImageCache(root);
      await cold.save(join(root, "dist"));
      const disabled = await prepareImageCache(root, input);
      expect(disabled.hit).toBe(false);
      expect(disabled.disabledReason).toContain("plain data");
      await expect(
        readFile(join(disabled.publicDir, variant)),
      ).rejects.toMatchObject({ code: "ENOENT" });
      await disabled.save(join(root, "dist"));
      expect((await prepareImageCache(root, input)).hit).toBe(false);
      expect((await prepareImageCache(root)).hit).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("A warm image cache preserves binary output and can accumulate new sizes", async ({}, info) => {
  const root = await fixture(info.outputPath("image-cache"));
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
  "modules/image-cache/index.ts",
  "modules/image-cache/cache.ts",
  "modules/blog-content/paths.ts",
]) {
  test(`Changing ${file} invalidates and removes stale image output`, async ({}, info) => {
    const root = await fixture(info.outputPath("image-cache"));
    try {
      const cold = await prepareImageCache(root);
      await cold.save(join(root, "dist"));
      await writeFile(join(root, file), "Changed bytes");
      const changed = await prepareImageCache(root);
      expect(changed.hit).toBe(false);
      await expect(
        readFile(join(changed.publicDir, variant)),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("Renaming or removing an image invalidates cached URLs", async ({}, info) => {
  const root = await fixture(info.outputPath("image-cache"));
  try {
    const cold = await prepareImageCache(root);
    await cold.save(join(root, "dist"));
    await rename(join(root, image), join(root, "public/images/renamed.png"));
    const renamed = await prepareImageCache(root);
    expect(renamed.hit).toBe(false);
    await expect(
      readFile(join(renamed.publicDir, variant)),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await renamed.save(join(root, "dist"));
    await rm(join(root, "public/images/renamed.png"));
    const removed = await prepareImageCache(root);
    expect(removed.hit).toBe(false);
    await expect(
      readFile(join(removed.publicDir, variant)),
    ).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Missing fingerprint inputs fail rather than reusing unverified output", async ({}, info) => {
  const root = await fixture(info.outputPath("image-cache"));
  try {
    await rm(join(root, "package-lock.json"));
    await expect(prepareImageCache(root)).rejects.toThrow("ENOENT");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("A failed image-output save cannot mark a cold cache as complete", async ({}, info) => {
  const root = await fixture(info.outputPath("image-cache"));
  try {
    const cold = await prepareImageCache(root);
    await rm(join(root, "dist", "_ipx"), { recursive: true });
    await expect(cold.save(join(root, "dist"))).rejects.toThrow("ENOENT");
    expect((await prepareImageCache(root)).hit).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Nuxt initialization fingerprints resolved IPX options after provider setup", async ({}, info) => {
  const { loadNuxt, useNitro } = await import("nuxt/kit");
  const { default: imageModule } = await import("@nuxt/image");
  const { default: sharp } = await import("sharp");
  const { createIPX, ipxFSStorage } = await import("ipx");
  const root = await fixture(info.outputPath("nuxt"));
  const cachedVariant = join(root, ".cache/nuxt-images/public", variant);
  const initialize = (
    icons: string[],
    animated = true,
    providers: Record<string, { provider: string }> = {},
  ) => {
    const configuration = {
      icon: { clientBundle: { icons } },
      image: {
        ipx: { sharpOptions: { animated } },
        providers,
      },
    };
    return loadNuxt({
      cwd: root,
      dev: false,
      overrides: {
        ...configuration,
        workspaceDir: root,
        modulesDir: [join(process.cwd(), "node_modules")],
        dir: { modules: "unused-modules" },
        modules: [imageModule, cacheModule],
        nitro: {
          static: true,
          output: { publicDir: join(root, "dist") },
        },
        telemetry: false,
      },
    });
  };
  try {
    await sharp({
      create: { width: 20, height: 10, channels: 3, background: "#6b17e8" },
    })
      .png()
      .toFile(join(root, image));
    const cold = await initialize([]);
    let encoded: Buffer;
    try {
      await expect(readFile(cachedVariant)).rejects.toMatchObject({
        code: "ENOENT",
      });
      const ipx = createIPX({
        storage: ipxFSStorage({ dir: join(root, "public") }),
      });
      encoded = Buffer.from(
        (await ipx("images/photo.png", { f: "avif", s: "20x10" }).process())
          .data,
      );
      await writeFile(join(root, "dist", variant), encoded);
      await cold.runWithContext(() => useNitro()).hooks.callHook("compiled");
    } finally {
      await cold.close();
    }

    const warm = await initialize(["fa-solid:minus", "fa-solid:plus"]);
    try {
      expect(await readFile(cachedVariant)).toEqual(encoded);
    } finally {
      await warm.close();
    }

    const changed = await initialize(
      ["fa-solid:minus", "fa-solid:plus"],
      false,
    );
    try {
      await expect(readFile(cachedVariant)).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await changed.close();
    }
    const custom = await initialize([], true, { custom: { provider: "none" } });
    try {
      await custom.runWithContext(() => useNitro()).hooks.callHook("compiled");
      await expect(
        readFile(join(root, ".cache/nuxt-images/fingerprint")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await custom.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("CI persists only the responsive image cache before generation", async () => {
  const { workflowSchema } = await import("./data");
  const workflow = workflowSchema.parse(
    parse(await readFile(".github/workflows/build.yml", "utf8")),
  );
  const steps = workflow.jobs.build!.steps;
  const cacheIndex = steps.findIndex(
    (step) => step.name === "Cache Responsive Images",
  );
  expect(cacheIndex).toBeGreaterThan(-1);
  expect(cacheIndex).toBeLessThan(
    steps.findIndex((step) => step.name === "NPM Build"),
  );
  expect(steps[cacheIndex]!.with!.path).toBe(".cache/nuxt-images");
  expect(steps.find((step) => step.name === "Setup Node")!.id).toBe("node");
  for (const input of [
    "runner.os",
    "runner.arch",
    "steps.node.outputs.node-version",
    "package-lock.json",
    "modules/image-cache/**",
    "github.sha",
  ]) {
    expect(steps[cacheIndex]!.with!.key).toContain(input);
  }
  expect(steps[cacheIndex]!.with!["restore-keys"]!.trim()).toBe(
    steps[cacheIndex]!.with!.key!.replace("${{ github.sha }}", ""),
  );
  expect(steps[cacheIndex]!.with!.key).not.toContain("nuxt.config.ts");
  expect(steps[cacheIndex]!.with!["restore-keys"]).not.toContain(
    "nuxt.config.ts",
  );
});
