// @ts-expect-error v0.8 ships no type declarations.
import slugify from "@sindresorhus/slugify";

// Gridsome 0.7 slugified tag titles with @sindresorhus/slugify@0.8 and `separator: "-"`.
// Pinned to that version so every /tag/:slug/ URL stays identical, e.g. "C#" -> "c", ".NET" -> "net".
export const tagSlug = (tag: string): string =>
  slugify(String(tag), { separator: "-" });

export const tagPath = (tag: string): string => `/tag/${tagSlug(tag)}/`;
