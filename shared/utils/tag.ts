import slugify from "@sindresorhus/slugify";

// Preserve Gridsome's tag URLs, including "C#" -> "c" and ".NET" -> "net".
export const tagSlug = (tag: string): string =>
  slugify(String(tag), { separator: "-" });

export const tagPath = (tag: string): string => `/tag/${tagSlug(tag)}/`;
