import { test as unitTest } from "@playwright/test";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { NuxtApp } from "nuxt/app";
import { remarkYouTube } from "../../modules/blog-content/markdown";
import { expect, test } from "./fixtures";

const image = "/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png";
type NuxtRoot = HTMLElement & {
  __vue_app__?: { config: { globalProperties: { $nuxt: NuxtApp } } };
};
// Firefox stores computed font sizes on a 1/64px grid (16px * 0.85 reports 13.5938px).
const fontSizeTolerance = 1 / 64;
const caption =
  "An explicitly authored caption explains the media without repeating its alternative text.";
const credit =
  '<small>Credit: <a href="https://example.com/">Source</a></small>';
const imageFigure = `<figure>

![Alternative text for the image](${image})

<figcaption>${caption}${credit}</figcaption>
</figure>`;
const videoTree = fromMarkdown("[Watch](https://youtu.be/dQw4w9WgXc)");
remarkYouTube()(videoTree);
const videoEmbed = videoTree.children[0];
if (videoEmbed?.type !== "html") {
  throw new Error(
    "Expected the existing YouTube transform to produce an embed",
  );
}

unitTest(
  "Native media figures retain explicit captions and separate image alternatives",
  async () => {
    const { parseMarkdown } = await import("@nuxtjs/mdc/runtime");
    const parsed = await parseMarkdown(
      `${imageFigure}

<figure>
<video controls aria-label="Example video"></video>
<figcaption>${caption}</figcaption>
</figure>

<figure>

https://youtu.be/dQw4w9WgXc

<figcaption>${caption}</figcaption>
</figure>

![An alternative is not a caption](${image})`,
      {
        remark: {
          plugins: {
            "remark-mdc": false,
            "blog-youtube": { instance: remarkYouTube },
          },
        },
      },
    );
    expect(parsed.body.children).toMatchObject([
      {
        tag: "figure",
        children: [
          {
            tag: "p",
            children: [
              {
                tag: "img",
                props: { alt: "Alternative text for the image", src: image },
              },
            ],
          },
          {
            tag: "figcaption",
            children: [
              { type: "text", value: caption },
              { tag: "small", children: [{ value: "Credit: " }, { tag: "a" }] },
            ],
          },
        ],
      },
      {
        tag: "figure",
        children: [
          { tag: "video", props: { controls: true } },
          { tag: "figcaption", children: [{ value: caption }] },
        ],
      },
      {
        tag: "figure",
        children: [
          { tag: "div", props: { className: ["youtube-embed"] } },
          { tag: "figcaption", children: [{ value: caption }] },
        ],
      },
      {
        tag: "p",
        children: [
          { tag: "img", props: { alt: "An alternative is not a caption" } },
        ],
      },
    ]);
  },
);

for (const width of [320, 1280]) {
  for (const appearance of ["light", "dark", "high-contrast"] as const) {
    test(`Media captions remain readable and inset at ${width}px in ${appearance}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: appearance === "dark" ? "dark" : "light",
        forcedColors: appearance === "high-contrast" ? "active" : "none",
      });
      await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => {
        const app =
          document.querySelector<NuxtRoot>("#__nuxt")?.__vue_app__?.config
            .globalProperties.$nuxt;
        return app && !app.isHydrating;
      });
      await expect(
        page.locator(".post__content figure figcaption").first(),
      ).toHaveText("A code-themed illustration.");
      await expect(
        page.locator(".post__content figure figcaption").first(),
      ).toHaveCSS("font-style", "italic");
      // Reuse ProseImg's rendered markup so the injected figure keeps its scoped styles.
      const proseImage = await page
        .locator(".post__content figure .prose-image")
        .first()
        .evaluate((element) => element.outerHTML);
      await page.locator(".post__content").evaluate(
        (element, { proseImage, caption, credit, video }) => {
          element.innerHTML = `<p>Article text remains aligned with its captions.</p>
            <figure><p>${proseImage}</p>
              <figcaption>${caption}${credit}</figcaption></figure>
            <figure><video controls aria-label="Example video" width="1600" height="900"></video>
              <figcaption>${caption}</figcaption></figure>
            <figure>${video}<figcaption>${caption} ${"LongCaption".repeat(20)}</figcaption></figure>
            <p>Text following the figures.</p>`;
        },
        { proseImage, caption, credit, video: videoEmbed.value },
      );
      await expect(
        page.getByRole("img", { name: "Code", exact: true }),
      ).toBeVisible();
      const figures = page.locator(".post__content figure");
      await expect(figures).toHaveCount(3);
      for (const figure of await figures.all()) {
        const figcaption = figure.locator("figcaption");
        await expect(figcaption).toHaveCSS("font-style", "italic");
        await expect(figcaption).toHaveCSS("font-weight", "400");
        await expect(figcaption).toHaveCSS("text-align", "start");
        await expect(figcaption).toHaveCSS(
          "background-color",
          /^rgba\(\d+, \d+, \d+, 0\)$/,
        );
        const layout = await figure.evaluate((element) => {
          const caption = element.querySelector("figcaption")!;
          const media = element.querySelector("img, video, iframe")!;
          const content = element.closest(".post__content")!;
          const card = element.closest(".post")!;
          const bounds = (element: Element) => {
            const { x, y, width, right, bottom } =
              element.getBoundingClientRect();
            return { x, y, width, right, bottom };
          };
          return {
            caption: bounds(caption),
            media: bounds(media),
            content: bounds(content),
            card: bounds(card),
            fontSize: Number.parseFloat(getComputedStyle(caption).fontSize),
            parentFontSize: Number.parseFloat(
              getComputedStyle(element).fontSize,
            ),
            fontScale: Number.parseFloat(
              getComputedStyle(caption).getPropertyValue(
                "--global-font-size-1",
              ),
            ),
            color: getComputedStyle(caption).color,
            bodyColor: getComputedStyle(document.body).color,
            scrollWidth: caption.scrollWidth,
            clientWidth: caption.clientWidth,
          };
        });
        expect(
          Math.abs(layout.fontSize - layout.parentFontSize * layout.fontScale),
        ).toBeLessThanOrEqual(fontSizeTolerance);
        expect(layout.color).toBe(layout.bodyColor);
        expect(layout.caption.x).toBeCloseTo(layout.content.x, 0);
        expect(layout.caption.right).toBeLessThanOrEqual(
          layout.content.right + 1,
        );
        expect(layout.media.x).toBeCloseTo(layout.card.x, 0);
        expect(layout.media.width).toBeCloseTo(layout.card.width, 0);
        expect(layout.caption.y - layout.media.bottom).toBeGreaterThan(0);
        expect(layout.caption.y - layout.media.bottom).toBeLessThan(12);
        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
      }
      const source = page.getByRole("link", { name: "Source", exact: true });
      await expect(source).toHaveCSS("font-style", "normal");
      await expect(source).toHaveCSS("text-decoration-line", "underline");
      await source.focus();
      await expect(source).toBeFocused();
      await expect(page.getByRole("figure")).toHaveCount(3);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      await page.addStyleTag({
        content: ".post__content { font-size: 2em; }",
      });
      for (const figcaption of await figures.locator("figcaption").all()) {
        const enlarged = await figcaption.evaluate((element) => ({
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
          bodyFontSize: Number.parseFloat(
            getComputedStyle(document.body).fontSize,
          ),
          fontScale: Number.parseFloat(
            getComputedStyle(element).getPropertyValue("--global-font-size-1"),
          ),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }));
        expect(
          Math.abs(
            enlarged.fontSize - enlarged.bodyFontSize * 2 * enlarged.fontScale,
          ),
        ).toBeLessThanOrEqual(fontSizeTolerance);
        expect(enlarged.scrollWidth).toBeLessThanOrEqual(enlarged.clientWidth);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    });
  }
}
