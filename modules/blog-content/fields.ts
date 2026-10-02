import { posix } from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { stripFrontMatter } from "./scan";

type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]];

// Gridsome's word counter (@gridsome/transformer-remark/lib/timeToRead.js), CJK aware.
const wordPattern =
  /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;

const nonTextTags = new Set(["script", "style", "textarea", "option", "noscript"]);

function collectText(nodes: MinimarkNode[], out: string[]): void {
  for (const node of nodes) {
    if (typeof node === "string") {
      out.push(node);
    } else if (!nonTextTags.has(node[0])) {
      collectText(node.slice(2) as MinimarkNode[], out);
    }
  }
}

/** Gridsome: words in the rendered HTML text / 230 words per minute, rounded, minimum 1. */
export function timeToRead(body: { value?: MinimarkNode[] }, speed = 230): number {
  const text: string[] = [];
  collectText(body.value ?? [], text);
  // Gridsome counted sanitize-html output, which re-escapes text, so "<" counted as the word "lt".
  const escaped = text.join(" ").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const words = escaped.match(wordPattern);
  if (!words) {
    return 0;
  }
  let count = 0;
  for (const word of words) {
    count += word.charCodeAt(0) >= 0x4e00 ? word.length : 1;
  }
  return Math.round(count / speed) || 1;
}

/**
 * Gridsome's findHeadings (@gridsome/transformer-remark/lib/utils.js): every mdast heading, with a
 * value made from the direct children that carry a `value` (text, inline code, HTML), tags stripped.
 */
export function headings(markdown: string): { depth: number; value: string }[] {
  const result: { depth: number; value: string }[] = [];
  visit(fromMarkdown(stripFrontMatter(markdown)), "heading", (node) => {
    const value = node.children
      .map((child) => ("value" in child ? child.value : ""))
      .join("")
      .replace(/(<([^>]+)>)/gi, "");
    result.push({ depth: node.depth, value });
  });
  return result;
}

export const contentImagesBaseURL = "/content-images";
export const contentImagePattern = /\.(png|jpe?g|gif|svg|webp|avif)$/i;
const absoluteUrlPattern = /^(?:[a-z][a-z\d+.-]*:|\/|#)/i;

/** Rewrites relative image `src`/`href` values (e.g. `./images/foo.png`) to the copied public URL. */
export function rewriteRelativeImages(
  nodes: MinimarkNode[] | undefined,
  contentDir: string,
): void {
  for (const node of nodes ?? []) {
    if (typeof node === "string") {
      continue;
    }
    const props = node[1];
    for (const key of ["src", "href"]) {
      const value = props?.[key];
      if (
        typeof value === "string" &&
        !absoluteUrlPattern.test(value) &&
        contentImagePattern.test(value)
      ) {
        props[key] = posix.join(contentImagesBaseURL, contentDir, value);
      }
    }
    rewriteRelativeImages(node.slice(2) as MinimarkNode[], contentDir);
  }
}
