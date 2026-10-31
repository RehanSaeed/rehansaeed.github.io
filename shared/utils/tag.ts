import slugify from "@sindresorhus/slugify";

// Preserve existing tag URLs, including "C#" -> "c" and ".NET" -> "net".
export const tagSlug = (tag: string): string =>
  slugify(tag, { separator: "-" });

export const tagPath = (tag: string): string => `/tag/${tagSlug(tag)}/`;
