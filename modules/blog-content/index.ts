import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative } from "node:path";
import { defineNuxtModule } from "nuxt/kit";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import { tagPath } from "../../shared/utils/tag";
import {
  contentImagePattern,
  contentImagesBaseURL,
  findEmailsOutsideCode,
  headings,
  prerenderCodeBlocks,
  restoreKeptTags,
  rewriteRelativeImages,
  timeToRead,
} from "./fields";
import {
  externalLinksOptions,
  rehypeHeadingAnchors,
  remarkContainers,
  remarkEmbedSnippet,
  remarkHeadingIds,
  remarkKbd,
  remarkLooseListItems,
  remarkMermaid,
  remarkYouTube,
} from "./markdown";
import { listFiles, scanContent, toPosix } from "./scan";

const postsPerPage = 10;

/**
 * Build-time content support that Gridsome provided out of the box:
 * - Computed `timeToRead` and `headings` fields, matching @gridsome/transformer-remark.
 * - Co-located post images, copied to `/content-images/` and referenced from the rendered markdown.
 * - Prerender routes for pages the crawler cannot reach (drafts and their tags, portfolio-only tags).
 */
export default defineNuxtModule({
  meta: { name: "blog-content" },
  async setup(_options, nuxt) {
    const contentDir = join(nuxt.options.rootDir, "content");
    const dataDir = join(nuxt.options.rootDir, ".data");
    const imagesDir = join(dataDir, "content-images");

    // @nuxt/content caches parsed files by content checksum, ignoring the afterParse hook below.
    // Drop that cache whenever this module's source changes so computed fields are never stale.
    const sources = await Promise.all(
      ["index.ts", "fields.ts", "markdown.ts", "scan.ts"].map((name) =>
        readFile(
          join(nuxt.options.rootDir, "modules", "blog-content", name),
          "utf8",
        ).catch(() => name),
      ),
    );
    const moduleHash = createHash("sha256")
      .update(sources.join("\0"))
      .digest("hex");
    const hashFile = join(dataDir, "blog-content.hash");
    if ((await readFile(hashFile, "utf8").catch(() => "")) !== moduleHash) {
      await rm(join(dataDir, "content"), { recursive: true, force: true });
      await mkdir(dataDir, { recursive: true });
      await writeFile(hashFile, moduleHash);
    }

    // The Gridsome remark pipeline. @nuxt/content reads these options lazily when it creates its
    // parser, after module setup. Order matters: the object key order is the plugin order.
    const content = (nuxt.options.content ||= {} as never) as Exclude<
      typeof nuxt.options.content,
      false
    >;
    const markdown = ((content.build ??= {}).markdown ??= {});
    markdown.remarkPlugins = {
      ...markdown.remarkPlugins,
      // CommonMark + GFM only, as in Gridsome; no MDC component syntax.
      "remark-mdc": false,
      "blog-embed-snippet": { instance: remarkEmbedSnippet },
      "blog-containers": { instance: remarkContainers },
      "blog-kbd": { instance: remarkKbd },
      "remark-toc": { instance: remarkToc },
      "blog-mermaid": { instance: remarkMermaid },
      "remark-math": { instance: remarkMath },
      "blog-youtube": { instance: remarkYouTube },
      "blog-loose-list-items": { instance: remarkLooseListItems },
      "blog-heading-ids": { instance: remarkHeadingIds },
    };
    markdown.rehypePlugins = {
      ...markdown.rehypePlugins,
      "rehype-external-links": { options: externalLinksOptions },
      "rehype-katex": { instance: rehypeKatex },
      "blog-heading-anchors": { instance: rehypeHeadingAnchors },
    };

    // Copy co-located images, e.g. content/posts/2014/foo/images/bar.png -> /content-images/posts/2014/foo/images/bar.png.
    await rm(imagesDir, { recursive: true, force: true });
    const images = (await listFiles(contentDir)).filter((file) =>
      contentImagePattern.test(file),
    );
    await Promise.all(
      images.map(async (file) => {
        await mkdir(dirname(join(imagesDir, file)), { recursive: true });
        await cp(join(contentDir, file), join(imagesDir, file));
      }),
    );
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.publicAssets ||= [];
      nitroConfig.publicAssets.push({
        dir: imagesDir,
        baseURL: contentImagesBaseURL,
        maxAge: 60 * 60 * 24 * 365,
      });
    });

    nuxt.hook("content:file:afterParse", ({ file, content, collection }) => {
      if (collection.name !== "posts" && collection.name !== "portfolio") {
        return;
      }
      const body = content.body as Parameters<typeof timeToRead>[0];
      restoreKeptTags(body.value);
      const fileDir = posix.dirname(toPosix(relative(contentDir, file.path)));
      rewriteRelativeImages(body.value, fileDir);
      content.timeToRead = timeToRead(body);
      const emails = findEmailsOutsideCode(body.value);
      if (emails.length) {
        throw new Error(
          `${file.path}: email addresses outside code blocks (${emails.join(", ")}) would be rewritten by Cloudflare email obfuscation and break hydration.`,
        );
      }
      prerenderCodeBlocks(body.value);
      content.headings = headings(file.body);
      // An empty YAML key (e.g. "tags:") parses as null; Gridsome treated it as an empty list.
      for (const key of ["categories", "tags"] as const) {
        content[key] ??= [];
      }
      // Normalise "2020-04-30" and "2020-04-30T10:00:00Z" so SQL ordering is chronological.
      for (const key of ["date", "dateModified"] as const) {
        const value = content[key];
        if (typeof value === "string" && value) {
          content[key] = new Date(value).toISOString();
        }
      }
    });

    // The crawler starts at "/" and follows links; add everything that isn't linked from a published page.
    const entries = await scanContent(contentDir);
    const posts = entries.filter((entry) => entry.collection === "posts");
    const publishedPosts = posts.filter((entry) => entry.data.published);
    const pageCount = Math.ceil(publishedPosts.length / postsPerPage);
    const routes = new Set<string>([
      ...posts.map((entry) => entry.data.permalink),
      ...entries.flatMap((entry) => (entry.data.tags ?? []).map(tagPath)),
      ...Array.from({ length: pageCount - 1 }, (_, i) => `/${i + 2}/`),
    ]);
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.prerender ||= {};
      nitroConfig.prerender.routes = [
        ...(nitroConfig.prerender.routes ?? []),
        ...routes,
      ];
    });
  },
});
