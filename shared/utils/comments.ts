import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const githubUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com";
  });
const avatarUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "avatars.githubusercontent.com"
    );
  });

export const issueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  html_url: githubUrl,
});
export const commentSchema = z.object({
  id: z.number().int().positive(),
  html_url: githubUrl,
  body_html: z.string(),
  created_at: z.string().datetime(),
  user: z
    .object({
      login: z.string(),
      avatar_url: avatarUrl,
      html_url: githubUrl,
    })
    .nullable(),
  reactions: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});
export const commentSnapshotSchema = z.object({
  issue: issueSchema.nullable(),
  comments: z.array(commentSchema),
});
export type CommentSnapshot = z.infer<typeof commentSnapshotSchema>;
export type GitHubComment = z.infer<typeof commentSchema>;

export function safeComment(comment: GitHubComment): GitHubComment {
  return {
    ...comment,
    body_html: sanitizeHtml(comment.body_html, {
      allowedTags: [
        ...sanitizeHtml.defaults.allowedTags,
        "img",
        "details",
        "summary",
      ],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "width", "height"],
        a: ["href", "title", "target", "rel"],
      },
      allowedSchemes: ["https", "http", "mailto"],
      allowProtocolRelative: false,
      transformTags: {
        a: (tagName, { href, ...attributes }) => ({
          tagName,
          attribs: {
            ...attributes,
            ...(href && URL.canParse(href, comment.html_url)
              ? { href: new URL(href, comment.html_url).href }
              : {}),
            target: "_blank",
            rel: "nofollow noopener noreferrer",
          },
        }),
        img: (tagName, { src, ...attributes }) => ({
          tagName,
          attribs: {
            ...attributes,
            ...(src && URL.canParse(src, comment.html_url)
              ? { src: new URL(src, comment.html_url).href }
              : {}),
          },
        }),
      },
    }),
  };
}

export async function githubRequest(
  path: string,
  signal?: AbortSignal,
  token?: string,
) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github.html+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`GitHub comments request failed (${response.status}).`);
  }
  return response.json() as Promise<unknown>;
}

export async function issueComments(
  repo: string,
  number: number,
  signal?: AbortSignal,
  token?: string,
) {
  const comments: GitHubComment[] = [];
  for (let page = 1; ; page++) {
    const batch = z
      .array(commentSchema)
      .parse(
        await githubRequest(
          `/repos/${repo}/issues/${number}/comments?per_page=100&page=${page}`,
          signal,
          token,
        ),
      );
    comments.push(...batch.map(safeComment));
    if (batch.length < 100) return comments;
  }
}
