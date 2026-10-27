import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative } from "node:path";
import { addTemplate, defineNuxtModule } from "nuxt/kit";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import { tagPath } from "../../shared/utils/tag";
import {
  contentImagePattern,
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
  remarkSoftBreaks,
  remarkYouTube,
} from "./markdown";
import { contentImagesBaseURL, contentPublicDir } from "./paths";
import { listFiles, scanContent, toPosix } from "./scan";
import { commentSnapshots } from "./comments";
import { portfolioSnapshots } from "./portfolio";
import { portfolioDownloads } from "./nuget";
import { portfolioStatistics } from "./statistics";
import { readImageDimensions } from "./images";
import { filterMarkdownSitemap } from "./seo";

const postsPerPage = 10;

/**
 * Build-time content support:
 * - Computed `timeToRead` and `headings` fields.
 * - Co-located post images, copied to `/content-images/` and referenced from the rendered markdown.
 * - Prerender routes for pages the crawler cannot reach (drafts and their tags, portfolio-only tags).
 */
export default defineNuxtModule({
  meta: { name: "blog-content" },
  async setup(_options, nuxt) {
    const contentDir = join(nuxt.options.rootDir, "content");
    const dataDir = join(nuxt.options.rootDir, ".data");
    const imagesDir = join(
      nuxt.options.rootDir,
      contentPublicDir,
      contentImagesBaseURL,
    );
    await mkdir(dataDir, { recursive: true });
    const comments = await commentSnapshots(dataDir);
    const entries = await scanContent(contentDir);
    const portfolio = await portfolioSnapshots(dataDir, entries);
    const downloads = await portfolioDownloads(dataDir, entries);
    const statistics = {
      ...portfolioStatistics(entries, portfolio, downloads),
      generatedAt: new Date().toISOString(),
    };
    const statisticsTemplate = addTemplate({
      filename: "blog-portfolio-statistics.json",
      write: true,
      getContents: () => JSON.stringify(statistics),
    });
    nuxt.options.alias["#blog-portfolio-statistics"] = statisticsTemplate.dst;
    const images = (await listFiles(contentDir))
      .filter((file) => contentImagePattern.test(file))
      .sort();
    const imageFiles = [
      ...images.map((file) => ({
        url: posix.join(contentImagesBaseURL, file),
        file: join(contentDir, file),
      })),
      ...[...new Set(entries.map((entry) => entry.data.heroImage))]
        .sort()
        .map((url) => ({
          url,
          file: join(nuxt.options.rootDir, "public", url),
        })),
    ];
    const imageMetadata = Object.fromEntries(
      await Promise.all(
        imageFiles.map(
          async ({ url, file }) =>
            [url, await readImageDimensions(file)] as const,
        ),
      ),
    );
    await writeFile(
      join(dataDir, "blog-image-metadata.json"),
      JSON.stringify(imageMetadata),
    );
    const heroMetadata = Object.fromEntries(
      entries.map((entry) => [
        entry.data.heroImage,
        imageMetadata[entry.data.heroImage],
      ]),
    );
    const imageTemplate = addTemplate({
      filename: "blog-image-metadata.json",
      write: true,
      getContents: () => JSON.stringify(heroMetadata),
    });
    nuxt.options.alias["#blog-image-metadata"] = imageTemplate.dst;

    // @nuxt/content caches parsed files by content checksum, ignoring the afterParse hook below.
    // Drop that cache whenever this module's source changes so computed fields are never stale.
    const sources = await Promise.all(
      [
        "index.ts",
        "fields.ts",
        "markdown.ts",
        "scan.ts",
        "comments.ts",
        "portfolio.ts",
        "nuget.ts",
        "images.ts",
      ].map((name) =>
        readFile(
          join(nuxt.options.rootDir, "modules", "blog-content", name),
          "utf8",
        ).catch(() => name),
      ),
    );
    const moduleHash = createHash("sha256")
      .update(
        sources.join("\0") +
          (await readFile(
            join(nuxt.options.rootDir, "shared", "utils", "comments.ts"),
            "utf8",
          )) +
          JSON.stringify(comments) +
          JSON.stringify(portfolio) +
          JSON.stringify(downloads) +
          JSON.stringify(imageMetadata),
      )
      .digest("hex");
    const hashFile = join(dataDir, "blog-content.hash");
    if ((await readFile(hashFile, "utf8").catch(() => "")) !== moduleHash) {
      await rm(join(dataDir, "content"), { recursive: true, force: true });
      await mkdir(dataDir, { recursive: true });
      await writeFile(hashFile, moduleHash);
    }

    // @nuxt/content reads these options lazily when it creates its
    // parser, after module setup. Order matters: the object key order is the plugin order.
    const content = (nuxt.options.content ||= {} as never) as Exclude<
      typeof nuxt.options.content,
      false
    >;
    const markdown = ((content.build ??= {}).markdown ??= {});
    markdown.remarkPlugins = {
      ...markdown.remarkPlugins,
      // CommonMark + GFM only; no MDC component syntax.
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
      "blog-soft-breaks": { instance: remarkSoftBreaks },
    };
    markdown.rehypePlugins = {
      ...markdown.rehypePlugins,
      "rehype-external-links": { options: externalLinksOptions },
      "rehype-katex": { instance: rehypeKatex },
      "blog-heading-anchors": { instance: rehypeHeadingAnchors },
    };

    // Copy co-located images, e.g. content/posts/2014/foo/images/bar.png -> /content-images/posts/2014/foo/images/bar.png.
    // contentPublicDir is served (and readable by IPX) via @nuxt/image's `dirs` in nuxt.config.ts.
    await rm(imagesDir, { recursive: true, force: true });
    await Promise.all(
      images.map(async (file) => {
        await mkdir(dirname(join(imagesDir, file)), { recursive: true });
        await cp(join(contentDir, file), join(imagesDir, file));
      }),
    );

    nuxt.hook("content:file:afterParse", ({ file, content, collection }) => {
      if (collection.name !== "posts" && collection.name !== "portfolio") {
        return;
      }
      const body = content.body as Parameters<typeof timeToRead>[0];
      if (collection.name === "posts") {
        content.path = content.permalink;
        if (!content.published) {
          content.robots = "noindex, follow";
        }
      } else if (content.kind !== "microsoft") {
        const snapshot = portfolio[String(content.permalink)];
        const packages = downloads[String(content.permalink)];
        if (!snapshot || !packages) {
          throw new Error(`Missing portfolio popularity: ${content.permalink}`);
        }
        Object.assign(content, snapshot, packages);
      }
      content.comments = comments[String(content.title)] ?? {
        issue: null,
        comments: [],
      };
      restoreKeptTags(body.value);
      const fileDir = posix.dirname(toPosix(relative(contentDir, file.path)));
      rewriteRelativeImages(body.value, fileDir, imageMetadata);
      content.timeToRead = timeToRead(body);
      const emails = findEmailsOutsideCode(body.value);
      if (emails.length) {
        throw new Error(
          `${file.path}: email addresses outside code blocks (${emails.join(", ")}) would be rewritten by Cloudflare email obfuscation and break hydration.`,
        );
      }
      prerenderCodeBlocks(body.value);
      content.headings = headings(file.body);
      // An empty YAML key (e.g. "tags:") parses as null; normalise it to an empty list.
      for (const key of ["categories", "tags"] as const) {
        content[key] ??= [];
      }
      // Normalise "2020-04-30" and "2020-04-30T10:00:00Z" to the "YYYY-MM-DDTHH:mm:ssZ"
      // format ("2020-04-30T00:00:00+00:00"). It is also what SQL ordering compares.
      for (const key of ["date", "dateModified"] as const) {
        const value = content[key];
        if (typeof value === "string" && value) {
          content[key] = new Date(value)
            .toISOString()
            .replace(/\.\d{3}Z$/, "+00:00");
        }
      }
    });

    // The crawler starts at "/" and follows links; add everything that isn't linked from a published page.
    const posts = entries.filter((entry) => entry.collection === "posts");
    const publishedPosts = posts.filter((entry) => entry.data.published);
    const unlistedRoutes = new Set([
      ...posts
        .filter((entry) => !entry.data.published)
        .map((entry) => entry.data.permalink.replace(/\/$/, "")),
      "/streaming/border",
      "/streaming/thumbnail",
      "/404-not-found",
    ]);
    nuxt.hook("ai-ready:page:markdown", (page) => {
      if (unlistedRoutes.has(page.route.replace(/\/$/, ""))) {
        page.markdown = "";
      }
    });
    nuxt.hook("nitro:init", (nitro) => {
      nitro.hooks.hook("prerender:generate", (route) => {
        if (route.route !== "/sitemap.md") {
          return;
        }
        if (typeof route.contents !== "string") {
          throw new Error("AI discovery did not generate a Markdown sitemap.");
        }
        // AI Ready's metadata store also contains routable noindex pages.
        route.contents = filterMarkdownSitemap(route.contents, unlistedRoutes);
      });
    });
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
      nitroConfig.prerender.ignore = [
        ...(nitroConfig.prerender.ignore ?? []),
        ...[...unlistedRoutes].map((route) => `${route}.md`),
      ];
    });
  },
});
