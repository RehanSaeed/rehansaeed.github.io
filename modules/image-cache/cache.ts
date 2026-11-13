import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";
import { listFiles } from "../blog-content/scan";

export const imageCacheDirectory = ".cache/nuxt-images";

const serializeSettings = (
  value: unknown,
  rootDir: string,
  ancestors = new Set<object>(),
): string => {
  if (typeof value === "string") {
    // Worktrees and CI checkouts can have different absolute roots.
    const path = isAbsolute(value) ? relative(rootDir, value) : undefined;
    return JSON.stringify(
      path !== undefined && !path.startsWith("..") && !isAbsolute(path)
        ? `<rootDir>/${path.replaceAll("\\", "/")}`
        : value,
    );
  }
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value === undefined ? "undefined" : JSON.stringify(value);
  }
  if (
    typeof value !== "object" ||
    ancestors.has(value) ||
    (!Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new TypeError("Image cache settings must be acyclic plain data.");
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item: unknown) => serializeSettings(item, rootDir, ancestors)).join(",")}]`;
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError("Image cache settings cannot contain symbols.");
    }
    const entries = Object.getOwnPropertyNames(value)
      .sort()
      .flatMap((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
        if (descriptor.get || descriptor.set) {
          throw new TypeError("Image cache settings cannot contain accessors.");
        }
        const item: unknown = descriptor.value;
        return item === undefined
          ? []
          : [
              `${JSON.stringify(key)}:${serializeSettings(item, rootDir, ancestors)}`,
            ];
      });
    return `{${entries.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
};

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

export async function prepareImageCache(
  rootDir: string,
  settings: unknown,
  sourceDirs: string[] = [],
  bypassReason?: string,
) {
  let serialized: string;
  let disabledReason = bypassReason;
  try {
    serialized = serializeSettings(settings, rootDir);
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    disabledReason = error.message;
    // Function source cannot capture closures or imported plugin implementations.
    serialized = "";
  }
  const hash = createHash("sha256").update(
    `${process.platform}\0${process.arch}\0${process.versions.node}\0${serialized}\0`,
  );
  const sources = [
    "package-lock.json",
    "modules/image-cache/index.ts",
    "modules/image-cache/cache.ts",
    "modules/blog-content/paths.ts",
  ];
  for (const directory of new Set([
    "public",
    "content",
    ...sourceDirs.map((dir) => relative(rootDir, dir).replaceAll("\\", "/")),
  ])) {
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
  const directory = join(rootDir, imageCacheDirectory);
  const fingerprintFile = join(directory, "fingerprint");
  const hit =
    disabledReason === undefined &&
    (await readFingerprint(fingerprintFile)) === fingerprint;
  if (!hit) {
    await rm(directory, { recursive: true, force: true });
  }
  const publicDir = join(directory, "public");
  await mkdir(publicDir, { recursive: true });
  return {
    publicDir,
    hit,
    disabledReason,
    async save(outputDir: string) {
      if (disabledReason) {
        return;
      }
      await cp(join(outputDir, "_ipx"), join(publicDir, "_ipx"), {
        recursive: true,
      });
      await writeFile(fingerprintFile, fingerprint);
    },
  };
}
