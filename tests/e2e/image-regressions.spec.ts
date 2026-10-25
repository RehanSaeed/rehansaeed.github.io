import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "cheerio";
import { test as unitTest } from "@playwright/test";
import { expect, test } from "./fixtures";
import { readImageDimensions } from "../../modules/blog-content/images";
import { rewriteRelativeImages } from "../../modules/blog-content/fields";
import { rehypeHeadingAnchors } from "../../modules/blog-content/markdown";

const pricingPath =
  "/pluralsight-vs-linkedin-learning-vs-frontendmasters-vs-egghead-io-vs-youtube/";

test.describe("All-pages audit regressions", () => {
  unitTest(
    "Heading permalinks have accessible names and decorative icons",
    () => {
      const tree: Parameters<ReturnType<typeof rehypeHeadingAnchors>>[0] = {
        type: "root",
        children: [
          {
            type: "element",
            tagName: "h2",
            properties: { id: "being-short" },
            children: [
              { type: "text", value: "Being " },
              {
                type: "element",
                tagName: "em",
                children: [{ type: "text", value: "Short" }],
              },
            ],
          },
        ],
      };
      rehypeHeadingAnchors()(tree);
      const anchor = tree.children![0]!.children![0]!;
      expect(anchor.properties).toEqual({
        href: "#being-short",
        className: ["heading-anchor"],
        "aria-label": "Link to Being Short",
      });
      expect(anchor.children![0]!.properties?.["aria-hidden"]).toBe("true");
    },
  );

  unitTest(
    "Above-fold page images are prioritized and badges reserve space",
    () => {
      const about = load(
        readFileSync(
          join(process.cwd(), "dist", "about", "index.html"),
          "utf8",
        ),
      );
      expect(about(".about__image").attr("loading")).toBe("eager");
      expect(about(".about__image").attr("fetchpriority")).toBe("high");
      expect(about(".about__stack-overflow-image").attr("src")).toBe(
        "https://img.shields.io/stackexchange/stackoverflow/r/1212017?style=social&logo=stackoverflow",
      );
      const portfolio = load(
        readFileSync(
          join(process.cwd(), "dist", "portfolio", "index.html"),
          "utf8",
        ),
      );
      const heroes = portfolio(".portfolio-card__image");
      expect(heroes.length).toBeGreaterThan(2);
      heroes.each((index, element) => {
        expect(portfolio(element).attr("loading")).toBe(
          index < 2 ? "eager" : "lazy",
        );
        expect(portfolio(element).attr("fetchpriority")).toBe(
          index < 2 ? "high" : undefined,
        );
      });
      const badges = portfolio(".portfolio-card__badge");
      expect(badges.length).toBeGreaterThan(0);
      badges.each((_, element) => {
        expect(Number(portfolio(element).attr("width"))).toBeGreaterThan(0);
        expect(Number(portfolio(element).attr("height"))).toBeGreaterThan(0);
      });
    },
  );

  test("Article permalinks remain visible and named on keyboard focus", async ({
    page,
  }) => {
    await page.goto("/on-the-etiquette-of-pull-request-comments/");
    const anchor = page.locator(".heading-anchor").first();
    await expect(anchor).toHaveAccessibleName(/^Link to .+/);
    await expect(anchor).not.toHaveAttribute("aria-hidden");
    await anchor.focus();
    await expect(anchor).toHaveCSS("opacity", "1");
    await expect(anchor).toBeFocused();
  });

  unitTest(
    "Math CSS is included on article pages rather than in the shared entry stylesheet",
    () => {
      const home = load(
        readFileSync(join(process.cwd(), "dist", "index.html"), "utf8"),
      );
      const article = load(
        readFileSync(
          join(process.cwd(), "dist", "cheat-sheet", "index.html"),
          "utf8",
        ),
      );
      const sharedStyles = home('link[rel="stylesheet"]')
        .map((_, element) => home(element).attr("href")!)
        .get()
        .map((path) => readFileSync(join(process.cwd(), "dist", path), "utf8"))
        .join("");
      expect(sharedStyles).not.toContain(".katex");
      expect(home("style").text()).not.toContain(".katex");
      expect(article("style").text()).toContain(".katex");
    },
  );

  unitTest(
    "Reads real dimensions rather than trusting hero filenames",
    async () => {
      for (const [name, expected] of [
        ["Git-1366x768.png", { width: 1200, height: 768 }],
        ["Elysium-1366x768.png", { width: 1024, height: 640 }],
      ] as const) {
        expect(
          await readImageDimensions(
            join(process.cwd(), "public", "images", "hero", name),
          ),
        ).toEqual(expected);
      }
    },
  );

  unitTest(
    "Rewrites nested image nodes with intrinsic dimensions and lazy loading",
    () => {
      const body: Parameters<typeof rewriteRelativeImages>[0] = [
        ["p", {}, ["img", { src: "./images/photo.png", alt: "Photo" }]],
      ];
      rewriteRelativeImages(body, "posts/example", {
        "/content-images/posts/example/images/photo.png": {
          width: 1024,
          height: 640,
        },
      });
      expect(body).toEqual([
        [
          "p",
          {},
          [
            "img",
            {
              src: "/content-images/posts/example/images/photo.png",
              alt: "Photo",
              width: 1024,
              height: 640,
              loading: "lazy",
            },
          ],
        ],
      ]);
      expect(() =>
        rewriteRelativeImages(
          [["img", { src: "./images/missing.png" }]],
          "posts/example",
          {},
        ),
      ).toThrow("Missing intrinsic image dimensions");
    },
  );

  unitTest(
    "Every generated Markdown image reserves its intrinsic ratio and remains lazy",
    () => {
      const metadata: Record<string, { width: number; height: number }> =
        JSON.parse(
          readFileSync(
            join(process.cwd(), ".data", "blog-image-metadata.json"),
            "utf8",
          ),
        );
      const urls = readFileSync(
        join(process.cwd(), "tests", "parity", "urls.txt"),
        "utf8",
      )
        .trim()
        .split(/\r?\n/);
      let images = 0;
      let posts = 0;
      for (const path of urls) {
        const $ = load(
          readFileSync(join(process.cwd(), "dist", path, "index.html"), "utf8"),
        );
        const contentImages = $(".post__content img").filter((_, element) =>
          ($(element).attr("src") ?? "").includes("/content-images/"),
        );
        if (contentImages.length) posts++;
        for (const element of contentImages) {
          const image = $(element);
          const src = decodeURIComponent(image.attr("src")!);
          const url = src.slice(src.indexOf("/content-images/"));
          expect(
            {
              width: Number(image.attr("width")),
              height: Number(image.attr("height")),
            },
            `${path}: ${url}`,
          ).toEqual(metadata[url]);
          expect(image.attr("loading"), `${path}: ${url}`).toBe("lazy");
          expect(image.attr("srcset"), `${path}: ${url}`).toMatch(/\d+w/);
          expect(image.attr("sizes"), `${path}: ${url}`).toBeTruthy();
          images++;
        }
      }
      expect(images).toBe(178);
      expect(posts).toBe(42);
    },
  );

  for (const [path, width, height, alt] of [
    ["/gitattributes-best-practices/", 1200, 768, null],
    ["/wpf-metro-part3-elysium/", 1024, 640, null],
    ["/3/", 1200, 768, "Git"],
    ["/10/", 1024, 640, "Elysium"],
  ] as const) {
    test(`Preserves the ${alt ? "card" : "hero"} aspect ratio and correct image metadata on ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      const image = page.locator(
        alt ? `.post-card__image[alt="${alt}"]` : ".post__photo",
      );
      await expect(image).toHaveAttribute("width", String(width));
      await expect(image).toHaveAttribute("height", String(height));
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const box = await image.boundingBox();
      expect(box!.width / box!.height).toBeCloseTo(width / height, 2);
      if (!alt) {
        await expect(
          page.locator('meta[property="og:image:width"]'),
        ).toHaveAttribute("content", "1200");
        await expect(
          page.locator('meta[property="og:image:height"]'),
        ).toHaveAttribute("content", "630");
        const graph = JSON.parse(
          (await page
            .locator('script[type="application/ld+json"]')
            .textContent())!,
        );
        const article = graph["@graph"].find(
          (node: { "@type": string }) => node["@type"] === "Article",
        );
        expect(Number(article.image[0].width)).toBe(width);
        expect(Number(article.image[0].height)).toBe(height);
      }
    });
  }

  for (const deviceScaleFactor of [1, 1.75, 2]) {
    test.describe(`Responsive images at ${deviceScaleFactor}x density`, () => {
      test.use({ deviceScaleFactor });
      test("Selects sufficient pixels for fluid cards across viewport sizes", async ({
        page,
      }) => {
        for (const width of [375, 412, 1280, 1600, 1920]) {
          await page.setViewportSize({ width, height: 800 });
          await page.goto("/");
          const image = page.locator(".post-card__image").first();
          await expect(image).toHaveAttribute("srcset", /\d+w/);
          await expect(image).toHaveAttribute("sizes", /100vw/);
          await expect
            .poll(() =>
              image.evaluate(async (image: HTMLImageElement) => {
                if (!image.complete || !image.naturalWidth) return false;
                const required = Math.min(
                  Number(image.getAttribute("width")),
                  image.getBoundingClientRect().width * window.devicePixelRatio,
                );
                // naturalWidth is density-corrected when srcset uses width descriptors.
                const bitmap = await createImageBitmap(
                  await (await fetch(image.currentSrc)).blob(),
                );
                const pixels = bitmap.width;
                bitmap.close();
                return (
                  pixels >= required - 1 &&
                  (window.innerWidth > 480 || pixels <= required * 1.5)
                );
              }),
            )
            .toBe(true);
        }
      });
    });
  }

  test("A delayed Markdown image does not grow after decoding", async ({
    page,
  }) => {
    let resume!: () => void;
    const blocked = new Promise<void>((resolve) => {
      resume = resolve;
    });
    await page.route("**/*New-Project.png", async (route) => {
      await blocked;
      await route.continue();
    });
    try {
      await page.goto("/asp-net-mvc-boilerplate/", {
        waitUntil: "domcontentloaded",
      });
      const image = page.locator(".post__content img").first();
      await image.scrollIntoViewIfNeeded();
      const before = await image.boundingBox();
      expect(before!.height).toBeGreaterThan(200);
      expect(
        await image.evaluate((image: HTMLImageElement) => image.naturalWidth),
      ).toBe(0);
      resume();
      await expect
        .poll(() =>
          image.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const after = await image.boundingBox();
      expect(Math.abs(after!.height - before!.height)).toBeLessThan(0.5);
    } finally {
      resume();
    }
  });

  test("Distant Markdown images are fetched only as the reader approaches", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/Border.png")) requests.push(request.url());
    });
    await page.goto("/wpf-metro-part4-elysium-extra/");
    const image = page.locator('.post__content img[alt$="Borders"]');
    await expect(image).toHaveAttribute("loading", "lazy");
    expect((await image.boundingBox())!.y).toBeGreaterThan(5000);
    expect(requests).toEqual([]);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await expect
      .poll(() =>
        image.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  });

  test("Each dialog exposes its own title and accurate close button", async ({
    page,
  }) => {
    await page.goto("/on-the-etiquette-of-pull-request-comments/");
    const labels = await page
      .locator("dialog")
      .evaluateAll((dialogs) =>
        dialogs.map((dialog) => dialog.getAttribute("aria-labelledby")),
      );
    expect(labels).toHaveLength(3);
    expect(new Set(labels).size).toBe(labels.length);
    await page.getByRole("button", { name: "Open search" }).click();
    const search = page.getByRole("dialog", { name: "Search", exact: true });
    await expect(search).toBeVisible();
    await search.getByRole("button", { name: "Close Search" }).click();
    await page
      .getByRole("button", { name: /Buy me a Coffee/ })
      .first()
      .click();
    const support = page.getByRole("dialog", {
      name: "Buy me a Coffee",
      exact: true,
    });
    await expect(support).toBeVisible();
    await support
      .getByRole("button", { name: "Close Buy me a Coffee" })
      .click();
    await expect(support).toBeHidden();
  });

  test("Currency stays readable without disabling genuine KaTeX math", async ({
    page,
  }) => {
    await page.goto(pricingPath);
    const content = page.locator(".post__content");
    await expect(content.locator(".katex")).toHaveCount(0);
    for (const value of ["$35", "$25", "$30", "$39", "$300", "$100"]) {
      await expect(content).toContainText(value);
    }
    await expect(content).toContainText(
      "It costs $25 per year to subscribe, so it's cheaper than the other offerings.",
    );
    await page.goto("/cheat-sheet/");
    expect(await page.locator(".post__content .katex").count()).toBeGreaterThan(
      0,
    );
  });
});
