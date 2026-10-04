import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import site from "../../site.json";
import {
  commentSnapshotSchema,
  githubRequest,
  issueComments,
  issueSchema,
  safeComment,
  type CommentSnapshot,
} from "../../shared/utils/comments";

const cacheSchema = z.object({
  updated: z.number(),
  snapshots: z.record(z.string(), commentSnapshotSchema),
});

export async function commentSnapshots(
  dataDir: string,
): Promise<Record<string, CommentSnapshot>> {
  const path = join(dataDir, "blog-comments.json");
  let cached: z.infer<typeof cacheSchema> | undefined;
  try {
    const parsed = cacheSchema.parse(JSON.parse(await readFile(path, "utf8")));
    for (const snapshot of Object.values(parsed.snapshots)) {
      snapshot.comments = snapshot.comments.map(safeComment);
    }
    cached = parsed;
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "ENOENT")
    ) {
      console.warn("[comments] Ignoring invalid snapshot cache:", error);
    }
  }
  if (cached && Date.now() - cached.updated < 60 * 60 * 1000)
    return cached.snapshots;

  const snapshots = { ...cached?.snapshots };
  const repo = `${site.repository.owner}/${site.repository.name}`;
  const token = process.env.GITHUB_TOKEN;
  try {
    const issues: z.infer<typeof issueSchema>[] = [];
    for (let page = 1; ; page++) {
      const batch = z
        .array(issueSchema)
        .parse(
          await githubRequest(
            `/repos/${repo}/issues?labels=comment&state=all&per_page=100&page=${page}`,
            undefined,
            token,
          ),
        );
      issues.push(...batch);
      if (batch.length < 100) break;
    }
    // Sequential requests avoid GitHub's secondary concurrency/rate limits.
    let complete = true;
    for (const issue of issues.sort((a, b) => a.number - b.number)) {
      if (!issue.title.startsWith("[Comment] ")) continue;
      const title = issue.title.slice("[Comment] ".length);
      try {
        snapshots[title] = {
          issue,
          comments: await issueComments(repo, issue.number, undefined, token),
        };
      } catch (error) {
        complete = false;
        console.warn(
          `[comments] Keeping saved comments for issue ${issue.number}:`,
          error,
        );
        snapshots[title] ??= { issue, comments: [] };
      }
    }
    await writeFile(
      path,
      JSON.stringify({ updated: complete ? Date.now() : 0, snapshots }),
    );
  } catch (error) {
    console.warn(
      "[comments] GitHub snapshot unavailable; keeping saved comments and GitHub links:",
      error,
    );
  }
  return snapshots;
}
