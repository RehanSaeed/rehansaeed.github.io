import { posix } from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { keepTagPrefix } from "./markdown";
import { stripFrontMatter } from "./scan";

type MinimarkNode =
  | string
  | [string, Record<string, unknown>, ...MinimarkNode[]];

/** Renames `keep-p`/`keep-h2` etc. (see markdown.ts) back to their real tags once MDC has compiled. */
export function restoreKeptTags(nodes: MinimarkNode[] | undefined): void {
  for (const node of nodes ?? []) {
    if (typeof node === "string") {
      continue;
    }
    if (node[0].startsWith(keepTagPrefix)) {
      node[0] = node[0].slice(keepTagPrefix.length);
    }
    restoreKeptTags(node.slice(2) as MinimarkNode[]);
  }
}

// Gridsome's word counter (@gridsome/transformer-remark/lib/timeToRead.js), CJK aware.
const wordPattern =
  /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;

const nonTextTags = new Set([
  "script",
  "style",
  "textarea",
  "option",
  "noscript",
]);

function isKatex(node: Exclude<MinimarkNode, string>): boolean {
  const className = node[1].className;
  return (
    Array.isArray(className) &&
    (className.includes("katex") || className.includes("katex-display"))
  );
}

function collectText(nodes: MinimarkNode[], out: string[]): void {
  for (const node of nodes) {
    if (typeof node === "string") {
      out.push(node);
    } else if (node[0] === "pre" && typeof node[1].code === "string") {
      // Count the source, not Shiki's token spans, which can split words.
      out.push(node[1].code);
    } else if (isKatex(node)) {
      // KaTeX splits identifiers into per-letter spans; Gridsome stripped tags without separators.
      const inner: string[] = [];
      collectText(node.slice(2) as MinimarkNode[], inner);
      out.push(inner.join(""));
    } else if (!nonTextTags.has(node[0])) {
      collectText(node.slice(2) as MinimarkNode[], out);
    }
  }
}

/** Gridsome: words in the rendered HTML text / 230 words per minute, rounded, minimum 1. */
export function timeToRead(
  body: { value?: MinimarkNode[] },
  speed = 230,
): number {
  const text: string[] = [];
  collectText(body.value ?? [], text);
  // Gridsome counted sanitize-html output, which re-escapes text, so "<" counted as the word "lt".
  const escaped = text
    .join(" ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

const escapeText = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function classOf(props: Record<string, unknown>): string | undefined {
  const value = props.class ?? props.className;
  return Array.isArray(value)
    ? value.join(" ")
    : typeof value === "string"
      ? value
      : undefined;
}

/** Shiki output only needs `class` (styles are compressed into classes) and `style`. */
function toHtml(nodes: MinimarkNode[]): string {
  return nodes
    .map((node) => {
      if (typeof node === "string") {
        return escapeText(node);
      }
      const [tag, props, ...children] = node;
      const className = classOf(props);
      const style =
        typeof props.style === "string" && props.style
          ? props.style
          : undefined;
      const attributes =
        (className ? ` class="${escapeAttribute(className)}"` : "") +
        (style ? ` style="${escapeAttribute(style)}"` : "");
      return `<${tag}${attributes}>${toHtml(children)}</${tag}>`;
    })
    .join("");
}

/**
 * Replaces the children of each `<pre><code>` with an HTML string, rendered by ProsePre with
 * v-html. Vue does not hydrate v-html, so Cloudflare's email obfuscation rewriting addresses
 * inside code cannot cause hydration mismatches. It also keeps thousands of token spans out of
 * the virtual DOM. The raw `code` prop is dropped, as nothing uses it.
 */
export function prerenderCodeBlocks(nodes: MinimarkNode[] | undefined): void {
  for (const node of nodes ?? []) {
    if (typeof node === "string") {
      continue;
    }
    const code = node[2];
    if (node[0] === "pre" && Array.isArray(code) && code[0] === "code") {
      node[1].html = toHtml(code.slice(2) as MinimarkNode[]);
      delete node[1].code;
      node.length = 2;
      continue;
    }
    prerenderCodeBlocks(node.slice(2) as MinimarkNode[]);
  }
}

const emailPattern = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;

/**
 * Returns email addresses outside code blocks. Cloudflare rewrites those in the served HTML, which
 * would not match what Vue hydrates; code blocks are safe (see prerenderCodeBlocks).
 */
export function findEmailsOutsideCode(
  nodes: MinimarkNode[] | undefined,
  out: string[] = [],
): string[] {
  for (const node of nodes ?? []) {
    if (typeof node === "string") {
      const match = node.match(emailPattern);
      if (match) {
        out.push(match[0]);
      }
      continue;
    }
    if (node[0] === "pre") {
      continue;
    }
    for (const value of Object.values(node[1] ?? {})) {
      if (typeof value === "string" && value.startsWith("mailto:")) {
        out.push(value);
      }
    }
    findEmailsOutsideCode(node.slice(2) as MinimarkNode[], out);
  }
  return out;
}
