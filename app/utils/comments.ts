import { z } from "zod";
import {
  commentSnapshotSchema,
  githubRequest,
  issueComments,
  issueSchema,
  safeComment,
  type CommentSnapshot,
} from "#shared/utils/comments";

const cacheSchema = z.object({
  expires: z.number(),
  snapshot: commentSnapshotSchema,
});

export async function refreshComments(
  repo: string,
  title: string,
  saved: CommentSnapshot,
  signal: AbortSignal,
): Promise<CommentSnapshot> {
  const key = `github-comments:${repo}:${title}`;
  try {
    const value = sessionStorage.getItem(key);
    if (value) {
      const cached = cacheSchema.parse(JSON.parse(value));
      if (cached.expires > Date.now()) {
        return {
          ...cached.snapshot,
          comments: cached.snapshot.comments.map(safeComment),
        };
      }
    }
  } catch (error) {
    console.warn("[comments] Session cache unavailable:", error);
  }
  let issue = saved.issue;
  if (!issue) {
    const query = new URLSearchParams({
      q: `repo:${repo} is:issue label:comment "[Comment] ${title.replaceAll('"', "")}" in:title`,
    });
    const result = z
      .object({ items: z.array(issueSchema) })
      .parse(await githubRequest(`/search/issues?${query}`, signal));
    issue =
      result.items.find((item) => item.title === `[Comment] ${title}`) ?? null;
  }
  const snapshot = {
    issue,
    comments: issue ? await issueComments(repo, issue.number, signal) : [],
  };
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ expires: Date.now() + 5 * 60 * 1000, snapshot }),
    );
  } catch (error) {
    console.warn("[comments] Could not cache live comments:", error);
  }
  return snapshot;
}
