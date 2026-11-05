import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const frontMatterSchema = z.looseObject({
  /** Title displayed for this content. */
  title: z.string(),
  /** Path to the content's hero image. */
  heroImage: z.string(),
  /** Stable public URL of the content. */
  permalink: z.string(),
  /** Whether the content is approved for publication. */
  published: z.boolean(),
  /** Tags associated with the content, including empty YAML lists. */
  tags: z
    .array(z.string())
    .nullish()
    .transform((tags) => tags ?? []),
  /** Portfolio category identifying open-source or Microsoft work. */
  kind: z.enum(["open-source", "microsoft"]).optional(),
  /** NuGet packages whose download counts contribute to this entry. */
  nugetPackages: z
    .array(
      z.looseObject({
        /** NuGet package identifier. */
        id: z.string(),
      }),
    )
    .nullish()
    .transform((packages) => packages ?? []),
});

export type FrontMatter = z.infer<typeof frontMatterSchema>;

export interface ContentEntry {
  /** Path relative to the content directory, using forward slashes. */
  path: string;
  /** Content collection containing this entry. */ collection:
    "posts" | "portfolio";
  /** Front matter parsed from the content file. */ data: FrontMatter;
}

const frontMatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const parseFrontMatter = (source: string, path: string): FrontMatter => {
  let parsed: unknown;
  try {
    parsed = parseYaml(source);
  } catch (error) {
    throw new Error(`Invalid YAML front matter in content/${path}`, {
      cause: error,
    });
  }
  const result = frontMatterSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid front matter in content/${path}: ${result.error.message}`,
      { cause: result.error },
    );
  }
  return result.data;
};

export const stripFrontMatter = (source: string): string =>
  source.replace(frontMatterPattern, "");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : Promise.resolve([path]);
    }),
  );
  return files.flat();
}

export const toPosix = (path: string): string => path.split(sep).join("/");

export async function listFiles(contentDir: string): Promise<string[]> {
  return (await walk(contentDir)).map((file) =>
    toPosix(relative(contentDir, file)),
  );
}

export async function scanContent(contentDir: string): Promise<ContentEntry[]> {
  const files = (await listFiles(contentDir)).filter((file) =>
    /^(posts|portfolio)\/.+\/index\.md$/.test(file),
  );
  return Promise.all(
    files.map(async (path) => {
      const source = await readFile(join(contentDir, path), "utf8");
      const match = source.match(frontMatterPattern);
      if (!match) {
        throw new Error(`Missing front matter in content/${path}`);
      }
      return {
        path,
        collection: path.startsWith("posts/") ? "posts" : "portfolio",
        data: parseFrontMatter(match[1]!, path),
      };
    }),
  );
}
