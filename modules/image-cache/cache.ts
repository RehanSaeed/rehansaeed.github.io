import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listFiles } from "../blog-content/scan";

async function readFingerprint(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

export async function prepareImageCache(rootDir: string) {
  const hash = createHash("sha256").update(
    `${process.platform}\0${process.arch}\0${process.versions.node}\0`,
  );
  const sources = [
    "package-lock.json",
    "nuxt.config.ts",
    "modules/image-cache/index.ts",
    "modules/image-cache/cache.ts",
    "modules/blog-content/paths.ts",
  ];
  for (const directory of ["public", "content"]) {
    const files = await listFiles(join(rootDir, directory));
    sources.push(
      ...files
        .filter((file) => /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(file))
        .map((file) => `${directory}/${file}`),
    );
  }
  // Hash bytes, not mtimes: checkout timestamps change on every CI runner.
  for (const file of sources.sort()) {
    hash.update(file).update("\0");
    hash.update(await readFile(join(rootDir, file))).update("\0");
  }
  const fingerprint = hash.digest("hex");
  const directory = join(rootDir, ".cache", "nuxt-images");
  const fingerprintFile = join(directory, "fingerprint");
  const hit = (await readFingerprint(fingerprintFile)) === fingerprint;
  if (!hit) {
    await rm(directory, { recursive: true, force: true });
  }
  const publicDir = join(directory, "public");
  await mkdir(publicDir, { recursive: true });
  return {
    publicDir,
    hit,
    async save(outputDir: string) {
      await cp(join(outputDir, "_ipx"), join(publicDir, "_ipx"), {
        recursive: true,
      });
      await writeFile(fingerprintFile, fingerprint);
    },
  };
}
