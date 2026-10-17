import { readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import GithubSlugger from "github-slugger";

/**
 * Remark/rehype plugins reproducing the Gridsome markdown pipeline (see the old gridsome.config.js):
 * remark-containers, remark-kbd, gridsome-remark-embed-snippet, @noxify/gridsome-plugin-remark-embed
 * (YouTube), gridsome-plugin-remark-mermaid and remark-autolink-headings.
 *
 * The installed mdast/hast type packages are mixed versions, so these plugins are loosely typed.
 */
interface Node {
  type: string;
  tagName?: string;
  value?: string;
  url?: string;
  lang?: string | null;
  meta?: string | null;
  spread?: boolean | null;
  properties?: Record<string, unknown>;
  children?: Node[];
  data?: Record<string, unknown>;
}

interface VFileLike {
  path?: string;
}

/**
 * Prefix for tags that must survive @nuxtjs/mdc's compiler untouched; it unwraps `<p>` inside `<li>`
 * and rewrites heading ids. The blog-content module strips the prefix after parsing.
 */
export const keepTagPrefix = "keep-";

function walk(
  node: Node,
  fn: (node: Node, index: number, parent: Node) => void,
): void {
  const children = node.children;
  if (!children) {
    return;
  }
  for (let index = 0; index < children.length; index++) {
    fn(children[index]!, index, node);
    walk(children[index]!, fn);
  }
}

// MDC drops newline-only text nodes, including soft breaks between inline elements.
export function remarkSoftBreaks() {
  return (tree: Node) => {
    walk(tree, (node) => {
      if (node.type === "text" && node.value?.includes("\n")) {
        node.value = node.value.replace(/\r?\n/g, " ");
      }
    });
  };
}

const containerTypes: Record<
  string,
  { tagName: string; titleTagName: string; title: string }
> = {
  tip: { tagName: "div", titleTagName: "p", title: "Tip" },
  warning: { tagName: "div", titleTagName: "p", title: "Warning" },
  danger: { tagName: "div", titleTagName: "p", title: "Warning" },
  details: { tagName: "details", titleTagName: "summary", title: "Details" },
};
const containerOpen = /^:::[ \t]*(\w+)[ \t]*([^\n]*?)[ \t]*(?:\n|$)/;
const containerClose = /(?:^|\n)[ \t]*:::[ \t]*$/;

function firstText(node: Node): Node | undefined {
  const child = node.children?.[0];
  return node.type === "paragraph" && child?.type === "text"
    ? child
    : undefined;
}

function lastText(node: Node): Node | undefined {
  const child = node.children?.at(-1);
  return node.type === "paragraph" && child?.type === "text"
    ? child
    : undefined;
}

function isEmptyParagraph(node: Node): boolean {
  return node.type === "paragraph" && !node.children?.length;
}

/** `::: type Title` ... `:::` blocks (remark-containers with the custom transform from gridsome.config.js). */
export function remarkContainers() {
  return (tree: Node) => {
    const transform = (parent: Node) => {
      const children = parent.children ?? [];
      for (let start = 0; start < children.length; start++) {
        const open = firstText(children[start]!);
        const match = open?.value?.match(containerOpen);
        const type = match?.[1];
        if (!open || !match || !type || !containerTypes[type]) {
          transform(children[start]!);
          continue;
        }
        let end = start;
        open.value = open.value!.slice(match[0].length);
        if (!open.value) {
          children[start]!.children!.shift();
        }
        while (end < children.length) {
          const close = lastText(children[end]!);
          if (close && containerClose.test(close.value!)) {
            close.value = close.value!.replace(containerClose, "");
            if (!close.value) {
              children[end]!.children!.pop();
            }
            break;
          }
          end++;
        }
        if (end === children.length) {
          end = children.length - 1;
        }
        const config = containerTypes[type];
        const content = children
          .slice(start, end + 1)
          .filter((node) => !isEmptyParagraph(node));
        content.forEach(transform);
        children.splice(start, end - start + 1, {
          type: "container",
          data: {
            hName: config.tagName,
            hProperties: { className: ["custom-block", type] },
          },
          children: [
            {
              type: "paragraph",
              data: {
                hName: config.titleTagName,
                hProperties: { className: ["custom-block-title"] },
              },
              children: [{ type: "text", value: match[2] || config.title }],
            },
            ...content,
          ],
        });
      }
    };
    transform(tree);
  };
}

const kbdPattern = /\|\|(.+?)\|\|/g;

/** `||CTRL+C||` → `<kbd>CTRL+C</kbd>` (remark-kbd). */
export function remarkKbd() {
  return (tree: Node) => {
    walk(tree, (node) => {
      const children = node.children;
      if (
        !children?.some(
          (child) => child.type === "text" && child.value?.includes("||"),
        )
      ) {
        return;
      }
      node.children = children.flatMap((child) => {
        if (child.type !== "text" || !child.value?.includes("||")) {
          return [child];
        }
        const result: Node[] = [];
        let last = 0;
        for (const match of child.value.matchAll(kbdPattern)) {
          if (match.index > last) {
            result.push({
              type: "text",
              value: child.value.slice(last, match.index),
            });
          }
          result.push({
            type: "kbd",
            data: { hName: "kbd" },
            children: [{ type: "text", value: match[1] }],
          });
          last = match.index + match[0].length;
        }
        if (last < child.value.length) {
          result.push({ type: "text", value: child.value.slice(last) });
        }
        return result;
      });
    });
  };
}

/** A paragraph containing only `` `embed:file.cs` `` becomes a code block of that sibling file. */
export function remarkEmbedSnippet() {
  return (tree: Node, file: VFileLike) => {
    walk(tree, (node, index, parent) => {
      const code =
        node.type === "paragraph" && node.children?.length === 1
          ? node.children[0]
          : undefined;
      if (
        code?.type !== "inlineCode" ||
        !code.value?.startsWith("embed:") ||
        !file.path
      ) {
        return;
      }
      const path = resolve(
        dirname(file.path),
        code.value.slice("embed:".length).trim(),
      );
      parent.children![index] = {
        type: "code",
        lang: extname(path).slice(1) || null,
        meta: null,
        value: readFileSync(path, "utf8")
          .replace(/\r\n/g, "\n")
          .replace(/\n$/, ""),
      };
    });
  };
}

const youTubePatterns: [RegExp, (id: string) => string][] = [
  [/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)$/, (id) => id],
  [/^https?:\/\/youtu\.be\/([\w-]+)$/, (id) => id],
  [
    /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=([\w-]+)$/,
    (id) => `videoseries?list=${id}`,
  ],
];

function youTubeEmbed(src: string): string {
  return `<div class="youtube-embed">
    <div style="width: 100%; margin: 0 auto;">
        <div style="position: relative; padding-bottom: 56.25%; padding-top: 25px; height: 0;">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube-nocookie.com/embed/${src}" allow="autoplay; encrypted-media" allowfullscreen="">
            </iframe>
        </div>
    </div>
</div>`;
}

/** A paragraph containing only a YouTube video or playlist URL becomes an embedded player. */
export function remarkYouTube() {
  return (tree: Node) => {
    walk(tree, (node, index, parent) => {
      const children = node.children?.filter(
        (child) => child.type !== "text" || child.value?.trim(),
      );
      const link =
        node.type === "paragraph" && children?.length === 1
          ? children[0]
          : undefined;
      if (link?.type !== "link" || !link.url) {
        return;
      }
      for (const [pattern, toSrc] of youTubePatterns) {
        const match = link.url.match(pattern);
        if (match) {
          parent.children![index] = {
            type: "html",
            value: youTubeEmbed(toSrc(match[1]!)),
          };
          return;
        }
      }
    });
  };
}

/** Mermaid source is server-rendered, then the diagram component loads the renderer on mount. */
export function remarkMermaid() {
  return (tree: Node) => {
    walk(tree, (node, index, parent) => {
      if (node.type === "code" && node.lang === "mermaid") {
        parent.children![index] = {
          type: "mermaid",
          data: {
            hName: "mermaid-diagram",
            hProperties: { code: node.value ?? "" },
          },
          children: [],
        };
      }
    });
  };
}

/**
 * Gridsome's remark pipeline decided list item looseness per item: an item with more than one child
 * kept its paragraphs in `<p>`. Newer mdast-util-to-hast decides per list, and @nuxtjs/mdc unwraps
 * `<p>` in `<li>` regardless, so loose paragraphs are protected with the keep prefix.
 */
export function remarkLooseListItems() {
  return (tree: Node) => {
    walk(tree, (node) => {
      if (node.type === "list") {
        node.spread = false;
      }
      if (node.type !== "listItem") {
        return;
      }
      const loose = Boolean(node.spread) || (node.children?.length ?? 0) > 1;
      node.spread = false;
      if (loose) {
        for (const child of node.children ?? []) {
          if (child.type === "paragraph") {
            child.data = { ...child.data, hName: `${keepTagPrefix}p` };
          }
        }
      }
    });
  };
}

const anchorIcon: Node = {
  type: "element",
  tagName: "svg",
  properties: {
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    viewBox: "0 0 16 16",
    version: "1.1",
    width: 22,
    height: 22,
    "aria-hidden": "true",
  },
  children: [
    {
      type: "element",
      tagName: "path",
      properties: {
        fill: "currentColor",
        "fill-rule": "evenodd",
        d: "M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z",
      },
      children: [],
    },
  ],
};

/** mdast-util-to-string semantics: raw HTML values (e.g. `<T>`) and image alts are included. */
function mdastText(node: Node & { alt?: string }): string {
  return (
    node.value ?? node.alt ?? (node.children ?? []).map(mdastText).join("")
  );
}

/** remark-slug: GitHub style heading ids, slugged from the mdast so raw HTML text is kept. */
export function remarkHeadingIds() {
  return (tree: Node) => {
    const slugger = new GithubSlugger();
    walk(tree, (node) => {
      if (node.type === "heading") {
        const data = (node.data ??= {});
        data.hProperties = {
          ...(data.hProperties as object),
          id: slugger.slug(mdastText(node)),
        };
      }
    });
  };
}

/** remark-autolink-headings: a prepended anchor icon link to the id set by remarkHeadingIds. */
export function rehypeHeadingAnchors() {
  return (tree: Node) => {
    walk(tree, (node) => {
      if (
        node.type !== "element" ||
        !/^h[1-6]$/.test(node.tagName ?? "") ||
        !node.properties?.id
      ) {
        return;
      }
      const id = String(node.properties.id);
      node.tagName = `${keepTagPrefix}${node.tagName}`;
      node.children = [
        {
          type: "element",
          tagName: "a",
          properties: { href: `#${id}`, "aria-hidden": "true" },
          children: [structuredClone(anchorIcon)],
        },
        ...(node.children ?? []),
      ];
    });
  };
}

/**
 * rehype-external-links settings matching Gridsome's remark-external-links: only links with an
 * explicit http(s) scheme are external, so protocol-relative `//host` links are left alone.
 */
export const externalLinksOptions = {
  target: "_blank",
  rel: ["nofollow", "noopener", "noreferrer"],
  test: (element: Node) =>
    !String(element.properties?.href ?? "").startsWith("//"),
};
