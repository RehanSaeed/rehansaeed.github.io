import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { useLogger } from "nuxt/kit";
import { z } from "zod";
import { githubRequest } from "../../shared/utils/comments";
import type { ContentEntry } from "./scan";

const popularitySchema = z.object({
  repository: z.string().regex(/^[\w-]+\/[\w.-]+$/),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
});
const cacheSchema = z.object({
  updated: z.number(),
  snapshots: z.record(z.string(), popularitySchema),
});
const responseSchema = z.object({
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
});
const logger = useLogger("blog-content:portfolio");

export async function portfolioSnapshots(
  dataDir: string,
  entries: ContentEntry[],
): Promise<Record<string, z.infer<typeof popularitySchema>>> {
  const projects = entries
    .filter((entry) => entry.collection === "portfolio")
    .map(({ data }) => {
      const url = new URL(data.permalink);
      const repository = url.pathname.replace(/^\/|\/$/g, "");
      if (
        url.origin !== "https://github.com" ||
        !popularitySchema.shape.repository.safeParse(repository).success ||
        url.search ||
        url.hash
      ) {
        throw new Error(`Invalid portfolio GitHub URL: ${data.permalink}`);
      }
      return { permalink: data.permalink, repository };
    });
  const path = join(dataDir, "blog-portfolio.json");
  let cached: z.infer<typeof cacheSchema> | undefined;
  try {
    cached = cacheSchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if (!(
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    )) {
      logger.warn("Ignoring invalid portfolio snapshot cache:", error);
    }
  }
  if (
    cached &&
    Date.now() - cached.updated < 60 * 60 * 1000 &&
    projects.every(
      ({ permalink, repository }) =>
        cached.snapshots[permalink]?.repository === repository,
    )
  ) {
    return Object.fromEntries(
      projects.map(({ permalink }) => [
        permalink,
        cached.snapshots[permalink]!,
      ]),
    );
  }
  const snapshots: Record<string, z.infer<typeof popularitySchema>> = {};
  let complete = true;
  for (const { permalink, repository } of projects) {
    try {
      const response = responseSchema.parse(
        await githubRequest(
          `/repos/${repository}`,
          undefined,
          process.env.GITHUB_TOKEN,
        ),
      );
      snapshots[permalink] = {
        repository,
        stars: response.stargazers_count,
        forks: response.forks_count,
      };
    } catch (error) {
      const saved = cached?.snapshots[permalink];
      if (!saved || saved.repository !== repository) {
        throw new Error(`GitHub popularity unavailable for ${repository}.`, {
          cause: error,
        });
      }
      complete = false;
      logger.warn(
        `GitHub popularity unavailable for ${repository}; keeping saved counts:`,
        error,
      );
      snapshots[permalink] = saved;
    }
  }
  await writeFile(
    path,
    JSON.stringify({ updated: complete ? Date.now() : 0, snapshots }),
  );
  return snapshots;
}
