import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { useLogger } from "nuxt/kit";
import { z } from "zod";

const countsSchema = z.object({
  followers: z.number().int().nonnegative(),
  watchers: z.number().int().nonnegative(),
  repositories: z.number().int().nonnegative(),
});
const cacheSchema = countsSchema.extend({
  owner: z.string(),
  updated: z.number().nonnegative(),
});
const responseSchema = z.object({
  data: z.object({
    user: z.object({
      followers: z.object({ totalCount: z.number().int().nonnegative() }),
      repositories: z.object({
        nodes: z.array(
          z.object({
            watchers: z.object({ totalCount: z.number().int().nonnegative() }),
          }),
        ),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
      }),
    }),
  }),
  errors: z.array(z.object({ message: z.string() })).optional(),
});
const query = `
  query AccountWatchers($owner: String!, $cursor: String) {
    user(login: $owner) {
      followers { totalCount }
      repositories(first: 100, after: $cursor, ownerAffiliations: [OWNER], privacy: PUBLIC) {
        nodes { watchers { totalCount } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
const logger = useLogger("blog-content:watchers");

export async function accountWatchers(dataDir: string, owner: string) {
  const path = join(dataDir, "blog-github-watchers.json");
  let cached: z.infer<typeof cacheSchema> | undefined;
  try {
    const saved = cacheSchema.parse(JSON.parse(await readFile(path, "utf8")));
    if (saved.owner === owner) cached = saved;
  } catch (error) {
    if (!(
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    )) {
      logger.warn("Ignoring invalid GitHub watchers cache:", error);
    }
  }
  const age = cached ? Date.now() - cached.updated : Infinity;
  if (cached && age >= 0 && age < 60 * 60 * 1000) {
    return countsSchema.parse(cached);
  }
  try {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is required to fetch account watchers.");
    }
    let cursor: string | null = null;
    const cursors = new Set<string>();
    let watchers = 0;
    let followers = 0;
    let repositories = 0;
    while (true) {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({ query, variables: { owner, cursor } }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new Error(`GitHub watchers request failed (${response.status}).`);
      }
      const result = responseSchema.parse(await response.json());
      if (result.errors?.length) {
        throw new Error(
          `GitHub watchers query failed: ${result.errors.map(({ message }) => message).join("; ")}`,
        );
      }
      const batch = result.data.user.repositories;
      if (cursor === null) followers = result.data.user.followers.totalCount;
      repositories += batch.nodes.length;
      watchers += batch.nodes.reduce(
        (sum, repository) => sum + repository.watchers.totalCount,
        0,
      );
      if (!batch.pageInfo.hasNextPage) break;
      cursor = batch.pageInfo.endCursor;
      if (!cursor || cursors.has(cursor) || batch.nodes.length === 0) {
        throw new Error("GitHub watchers pagination did not advance.");
      }
      cursors.add(cursor);
    }
    const counts = { followers, watchers, repositories };
    await writeFile(
      path,
      JSON.stringify({ owner, updated: Date.now(), ...counts }),
    );
    return counts;
  } catch (error) {
    if (!cached) {
      throw new Error(`GitHub watchers unavailable for ${owner}.`, {
        cause: error,
      });
    }
    logger.warn(
      `GitHub watchers unavailable for ${owner}; keeping saved counts:`,
      error,
    );
    await writeFile(path, JSON.stringify({ ...cached, updated: 0 }));
    return countsSchema.parse(cached);
  }
}
