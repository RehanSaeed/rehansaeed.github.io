import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parse as parseYaml } from "yaml";

export interface FrontMatter {
  title: string;
  heroImage: string;
  permalink: string;
  published: boolean;
  tags?: string[];
}

export interface ContentEntry {
  /** Path relative to the content directory, using forward slashes. */
  path: string;
  collection: "posts" | "portfolio";
  data: FrontMatter;
}

const frontMatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

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
        data: parseYaml(match[1]!) as FrontMatter,
      };
    }),
  );
}
