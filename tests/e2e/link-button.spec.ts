import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { test as unitTest, type Locator } from "@playwright/test";
import { compileString } from "sass-embedded";
import sharp from "sharp";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { defineComponent, h, type ComponentOptions } from "vue";
import { compileScript, parse } from "vue/compiler-sfc";
import { renderToString } from "vue/server-renderer";
import { expect, test } from "./fixtures";

const loadDependency = createRequire(join(process.cwd(), "package.json"));
const { descriptor } = parse(
  readFileSync("app/components/shared/link-button.vue", "utf8"),
);
const source = transpileModule(
  compileScript(descriptor, { id: "link-button-test", inlineTemplate: true })
    .content,
  {
    compilerOptions: {
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ESNext,
    },
  },
).outputText;
const componentExports: { default?: ComponentOptions } = {};
const nuxtLink = defineComponent({
  props: {
    /** Navigation destination for the rendered anchor. */
    to: String,
    /** URL accepted by NuxtLink alongside its internal destination. */
    href: String,
  },
  setup:
    (props, { slots }) =>
    () =>
      h("a", { href: props.to ?? props.href }, slots.default?.()),
});
runInNewContext(source, {
  exports: componentExports,
  require: (id: string): unknown =>
    id === "#components" ? { NuxtLink: nuxtLink } : loadDependency(id),
});
if (!componentExports.default) {
  throw new Error("Missing link button component");
}
const linkButton = componentExports.default;
const styles = compileString(descriptor.styles[0]!.content).css;
const { descriptor: buttonDescriptor } = parse(
  readFileSync("app/components/shared/button.vue", "utf8"),
);
const buttonStyles = compileString(buttonDescriptor.styles[0]!.content).css;
const propertiesPath = join(process.cwd(), "app/assets/style/_properties.scss");
const properties = compileString(readFileSync(propertiesPath, "utf8"), {
  url: pathToFileURL(propertiesPath),
}).css;

const shadowMetrics = (rows: number[][], background: number[]) => {
  const weights = rows.map((row) =>
    row.reduce(
      (sum, value, channel) => sum + Math.abs(value - background[channel]!),
      0,
    ),
  );
  const strength = weights.reduce((sum, weight) => sum + weight, 0);
  const centroid =
    weights.reduce((sum, weight, row) => sum + weight * row, 0) / strength;
  const softness = Math.sqrt(
    weights.reduce(
      (sum, weight, row) => sum + weight * (row - centroid) ** 2,
      0,
    ) / strength,
  );
  return { strength, centroid, softness };
};

const matchesNormalShadow = (
  reference: number[][],
  above: number[][],
  below: number[][],
  background: number[],
) => {
  const expected = shadowMetrics(reference, background);
  const actual = shadowMetrics(below, background);
  return (
    expected.strength > 0 &&
    actual.strength > shadowMetrics(above, background).strength + 3 &&
    Math.abs(actual.strength / expected.strength - 1) <= 0.1 &&
    Math.abs(actual.centroid - expected.centroid) <= 0.25 &&
    Math.abs(actual.softness - expected.softness) <= 0.25
  );
};

unitTest(
  "Link buttons preserve native destinations before hydration",
  async () => {
    for (const variant of [
      "plain",
      "secondary",
      "contrast",
      "primary",
      "tag",
    ]) {
      for (const destination of [
        { to: "/tag/c/" },
        { href: "https://example.com/" },
      ]) {
        const html = await renderToString(
          h(linkButton, { ...destination, variant }, () => "C#"),
        );
        expect(html).toContain("<a");
        expect(html).toContain(`href="${destination.to ?? destination.href}"`);
        expect(html).not.toContain("disabled");
        expect(html).not.toContain("type=");
        expect(html.includes("link-button--bordered")).toBe(
          variant === "secondary" || variant === "contrast",
        );
        expect(html.includes("link-button--contrast")).toBe(
          variant === "contrast",
        );
        expect(html.includes("link-button--primary")).toBe(
          variant === "primary",
        );
        expect(html.includes("link-button--tag")).toBe(variant === "tag");
        expect(html.includes('aria-hidden="true"')).toBe(variant === "tag");
      }
    }
  },
);

for (const theme of ["light", "dark"]) {
  test(`Pointed links preserve native interaction and raised silhouettes in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setContent(
      `<html data-theme="${theme}"><body><div id="app"></div></body></html>`,
    );
    await page.addStyleTag({
      content: `${properties}\n${styles}\n${buttonStyles}
        .link-button { transition: none; }
        .resting-sample {
          display: grid;
          gap: 48px;
          padding: 32px;
          background: var(--global-content-background-color);
        }
        .resting-sample > * {
          box-sizing: border-box;
          inline-size: 280px;
          block-size: 64px;
        }
        .filter-reference {
          position: relative;
          isolation: isolate;
          border: none;
          background: none;
        }
        .filter-reference:hover { transform: translateY(-2px); }
        .filter-reference span {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: var(--global-background-color);
        }
        .filter-reference .filter-reference__shadow {
          inset: var(--global-border-width-1);
          opacity: 0;
        }
        .filter-reference:hover .filter-reference__shadow {
          opacity: var(--reference-shadow-opacity);
        }
        .silhouette-sample { padding: 32px; background: #808080; }
        .silhouette-sample .link-button {
          --link-button-tag-point: 96px;
          min-block-size: 128px;
        }`,
    });
    await page.addScriptTag({
      path: loadDependency.resolve("vue/dist/vue.global.js"),
    });
    await page.addScriptTag({
      content: `{
        const exports = {};
        const NuxtLink = {
          props: ["to", "href"],
          setup: (props, { slots }) => () => Vue.h("a", { href: props.to ?? props.href }, slots.default?.())
        };
        const require = (name) => {
          if (name === "vue") return Vue;
          if (name === "#components") return { NuxtLink };
          throw new Error("Unexpected link button dependency: " + name);
        };
        ${source}
        Vue.createApp({
          components: { ULinkButton: exports.default },
          data: () => ({ clicks: 0, entered: false }),
          template: \`
            <u-link-button variant="tag" to="/tag/windows-presentation-foundation-wpf/"
              data-forwarded="yes" @click.prevent="clicks++" @pointerenter="entered=true">
              Windows Presentation Foundation (WPF)
            </u-link-button>
            <output :data-clicks="clicks" :data-entered="entered"></output>
            <div class="resting-sample">
              <button class="button button--secondary">Reference button</button>
              <button class="filter-reference">
                <span class="filter-reference__shadow filter-reference__shadow--far" aria-hidden="true"></span>
                <span class="filter-reference__shadow filter-reference__shadow--middle" aria-hidden="true"></span>
                <span class="filter-reference__shadow filter-reference__shadow--near" aria-hidden="true"></span>
                <span class="filter-reference__surface" aria-hidden="true"></span>
                Filtered rectangular reference
              </button>
              <u-link-button variant="tag" href="#resting">Resting tag</u-link-button>
            </div>
            <div class="silhouette-sample">
              <u-link-button variant="tag" href="#shape">Shape sample</u-link-button>
            </div>\`
        }).mount("#app");
      }`,
    });
    const link = page.getByRole("link", {
      name: "Windows Presentation Foundation (WPF)",
      exact: true,
    });
    const surface = link.locator(".link-button__tag-surface");
    const output = page.locator("output");
    await expect(link).toHaveClass("link-button link-button--tag");
    await expect(link).toHaveAttribute("data-forwarded", "yes");
    await expect(link).toHaveAttribute(
      "href",
      "/tag/windows-presentation-foundation-wpf/",
    );
    await expect(link).not.toHaveAttribute("type");
    await expect(link).toHaveCSS("clip-path", "none");
    await expect(surface).toHaveAttribute("aria-hidden", "true");
    await expect(surface).toHaveCSS("clip-path", "none");
    expect(
      await surface.evaluate(
        (element) => getComputedStyle(element, "::before").clipPath,
      ),
    ).not.toBe("none");
    const tokens = await link.evaluate((element) => {
      const probe = document.createElement("span");
      element.append(probe);
      probe.style.color = "var(--global-accent-color)";
      const accent = getComputedStyle(probe).color;
      probe.style.filter = "drop-shadow(var(--global-shadow-1))";
      const pressed = getComputedStyle(probe).filter;
      probe.style.filter = "drop-shadow(var(--global-drop-shadow-1))";
      const resting = getComputedStyle(probe).filter;
      const raised = ["far", "middle", "near"].map((layer) => {
        probe.style.filter = `drop-shadow(var(--global-drop-shadow-2-${layer}))`;
        return getComputedStyle(probe).filter;
      });
      probe.style.opacity = "var(--global-shadow-opacity)";
      const raisedOpacity = getComputedStyle(probe).opacity;
      probe.remove();
      return { accent, pressed, resting, raised, raisedOpacity };
    });
    await expect(surface).toHaveCSS("filter", tokens.resting);
    const shadows = link.locator(".link-button__tag-shadow");
    await expect(shadows).toHaveCount(3);
    for (let index = 0; index < tokens.raised.length; index++) {
      await expect(shadows.nth(index)).toHaveCSS(
        "filter",
        tokens.raised[index]!,
      );
      await expect(shadows.nth(index)).toHaveCSS("opacity", "0");
    }
    const referencePaint = await page
      .getByRole("button", { name: "Reference button", exact: true })
      .evaluate((element) => {
        const parseShadows = (value: string) =>
          Array.from(
            value.matchAll(
              /(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/g,
            ),
            ([, colour, x, y, blur]) => {
              const channels = colour!
                .slice(colour!.indexOf("(") + 1, -1)
                .split(",")
                .map(Number);
              return {
                filter: `drop-shadow(${x}px ${y}px ${Number(blur) / 2}px ${colour})`,
                opaqueFilter: `drop-shadow(${x}px ${y}px ${Number(blur) / 2}px rgb(${channels.slice(0, 3).join(",")}))`,
                opacity: channels[3] ?? 1,
              };
            },
          );
        return {
          resting: parseShadows(getComputedStyle(element).boxShadow),
          raised: parseShadows(getComputedStyle(element, "::before").boxShadow),
        };
      });
    expect(referencePaint.resting).toHaveLength(1);
    expect(referencePaint.raised).toHaveLength(3);
    await page.addStyleTag({
      content: `
        .filter-reference__surface { filter: ${referencePaint.resting[0]!.filter}; }
        ${referencePaint.raised
          .map(
            (paint, index) => `
              .filter-reference__shadow--${["near", "middle", "far"][index]} {
                --reference-shadow-opacity: ${paint.opacity};
                filter: ${paint.opaqueFilter};
              }`,
          )
          .join("\n")}`,
    });
    const compareShadows = async (
      state: string,
      prepare: (control: Locator) => Promise<void>,
    ) => {
      const shadowProfiles = [];
      for (const control of [
        page.getByRole("button", { name: "Reference button", exact: true }),
        page.getByRole("button", {
          name: "Filtered rectangular reference",
          exact: true,
        }),
        page.getByRole("link", { name: "Resting tag", exact: true }),
      ]) {
        await prepare(control);
        const bounds = await control.boundingBox();
        expect(bounds).not.toBeNull();
        const screenshot = await page.screenshot({
          path: test
            .info()
            .outputPath(
              `${state}-${await control.getAttribute("class")}-${theme}.png`,
            ),
          scale: "css",
          animations: "disabled",
          clip: {
            x: Math.floor(bounds!.x) + 100,
            y: Math.floor(bounds!.y) - 20,
            width: 40,
            height: Math.ceil(bounds!.height) + 40,
          },
        });
        const { data, info } = await sharp(screenshot)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const row = (y: number) =>
          Array.from({ length: 3 }, (_, channel) => {
            let sum = 0;
            for (let x = 0; x < info.width; x++) {
              sum += data[(y * info.width + x) * info.channels + channel]!;
            }
            return sum / info.width;
          });
        const background = row(0);
        const above = Array.from({ length: 16 }, (_, offset) =>
          row(19 - offset),
        );
        const below = Array.from({ length: 16 }, (_, offset) =>
          row(20 + Math.ceil(bounds!.height) + offset),
        );
        const strength = (rows: number[][]) =>
          rows.reduce(
            (sum, channels) =>
              sum +
              channels.reduce(
                (total, value, channel) =>
                  total + Math.abs(value - background[channel]!),
                0,
              ),
            0,
          );
        expect(
          strength(below),
          `${state} elevation is visible and falls below, not above, the control`,
        ).toBeGreaterThan(strength(above) + 3);
        shadowProfiles.push({ above, below, background });
      }
      await test.info().attach(`${state}-${theme}-shadow-profiles`, {
        body: JSON.stringify({
          normalButton: shadowProfiles[0]!.below,
          filteredRectangle: shadowProfiles[1]!.below,
          pointedTag: shadowProfiles[2]!.below,
        }),
        contentType: "application/json",
      });
      const normal = shadowProfiles[0]!;
      const pointed = shadowProfiles[2]!;
      expect(
        matchesNormalShadow(
          normal.below,
          pointed.above,
          pointed.below,
          pointed.background,
        ),
        "Tag elevation matches normal-button direction, strength, centroid and blur spread",
      ).toBe(true);

      const empty = normal.below.map(() => normal.background);
      for (const [above, below] of [
        [empty, empty],
        [normal.below, normal.above],
        [
          normal.above,
          normal.below.map((row) =>
            row.map(
              (value, channel) =>
                normal.background[channel]! +
                2 * (value - normal.background[channel]!),
            ),
          ),
        ],
        [
          normal.above,
          normal.below.map((_, row) => normal.below[Math.floor(row / 2)]!),
        ],
      ]) {
        expect(
          matchesNormalShadow(normal.below, above!, below!, normal.background),
          "Comparison rejects missing, upward, overstrong and excessively blurred shadows",
        ).toBe(false);
      }

      for (let row = 0; row < 16; row++) {
        for (let channel = 0; channel < 3; channel++) {
          expect(
            Math.abs(
              shadowProfiles[1]!.below[row]![channel]! -
                pointed.below[row]![channel]!,
            ),
            `Tag ${state} shadow matches an independently filtered rectangle`,
          ).toBeLessThanOrEqual(2);
          // Linux Chromium differs by four levels even for the plain rectangle.
          // Bound that intrinsic rasterization error; never normalize it away.
          for (const profile of shadowProfiles.slice(1)) {
            expect(
              Math.abs(
                normal.below[row]![channel]! - profile.below[row]![channel]!,
              ),
              `${state} box/filter rasterization stays inside its measured envelope`,
            ).toBeLessThanOrEqual(state === "hover" ? 4 : 2);
          }
        }
      }
    };
    await compareShadows("rest", async () => {
      await page.mouse.move(0, 0);
    });
    await compareShadows("hover", async (control) => {
      await control.hover();
      await expect(control).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    });
    const hole = await link.evaluate((element) => {
      const style = getComputedStyle(element, "::after");
      return { colour: style.backgroundColor, round: style.borderRadius };
    });
    expect(hole).toEqual({ colour: tokens.accent, round: "50%" });
    await link.hover();
    await expect(output).toHaveAttribute("data-entered", "true");
    await expect(link).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    await expect(surface).toHaveCSS("filter", tokens.resting);
    for (const shadow of await shadows.all()) {
      await expect(shadow).toHaveCSS("opacity", tokens.raisedOpacity);
    }
    await page.mouse.down();
    await expect(link).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await expect(surface).toHaveCSS("filter", tokens.pressed);
    for (const shadow of await shadows.all()) {
      await expect(shadow).toHaveCSS("opacity", "0");
    }
    await page.mouse.up();
    await expect(output).toHaveAttribute("data-clicks", "1");
    await link.focus();
    await page.keyboard.press("Space");
    await expect(output).toHaveAttribute("data-clicks", "1");
    await page.keyboard.press("Enter");
    await expect(output).toHaveAttribute("data-clicks", "2");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-width", "2px");
    await expect(link).toHaveCSS("outline-offset", "3px");
    await expect(link).toHaveCSS("outline-color", tokens.accent);
    await page.setViewportSize({ width: 320, height: 900 });
    expect(
      await link.evaluate((element) => ({
        overflows: element.scrollWidth > element.clientWidth,
        fits: element.getBoundingClientRect().right <= innerWidth,
      })),
    ).toEqual({ overflows: false, fits: true });
    const enlargedText = await page.addStyleTag({
      content: "html { font-size: 32px; }",
    });
    await expect(link).toHaveCSS("min-inline-size", "48px");
    await expect(link).toHaveCSS("min-block-size", "72px");
    expect(
      await link.evaluate((element) => ({
        overflows: element.scrollWidth > element.clientWidth,
        fits: element.getBoundingClientRect().right <= innerWidth,
      })),
    ).toEqual({ overflows: false, fits: true });
    await enlargedText.evaluate((element) => {
      element.parentNode?.removeChild(element);
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await link.hover();
    await expect(link).toHaveCSS("transform", "none");
    await expect(surface).toHaveCSS("filter", tokens.resting);
    await expect(surface).toHaveCSS("transition-duration", "0s");
    for (const shadow of await shadows.all()) {
      await expect(shadow).toHaveCSS("opacity", tokens.raisedOpacity);
      await expect(shadow).toHaveCSS("transition-duration", "0s");
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });

    // Enlarge the point so a rectangular backing cannot hide in the shadow blur.
    const sample = page.getByRole("link", {
      name: "Shape sample",
      exact: true,
    });
    const expectPointedShadow = async (state: string, shadowColumn: number) => {
      const bounds = await sample.boundingBox();
      expect(bounds).not.toBeNull();
      const screenshot = await page.screenshot({
        path: test.info().outputPath(`pointed-${state}-${theme}.png`),
        scale: "css",
        animations: "disabled",
        clip: {
          x: Math.floor(bounds!.x) - 16,
          y: Math.floor(bounds!.y) - 16,
          width: Math.ceil(bounds!.width) + 32,
          height: Math.ceil(bounds!.height) + 32,
        },
      });
      const { data, info } = await sharp(screenshot)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const colourAt = (x: number, y: number) => {
        const offset = (y * info.width + x) * info.channels;
        return [...data.subarray(offset, offset + 3)];
      };
      expect(
        colourAt(14, 24),
        "No rectangular shadow above the pointed edge",
      ).toEqual([128, 128, 128]);
      // Sample several rows because faint shadow pixels can be dithered.
      const tipShadow = Array.from({ length: 8 }, (_, offset) =>
        colourAt(shadowColumn, 16 + Math.floor(bounds!.height / 2) + offset),
      );
      expect(
        tipShadow.some((colour) => colour.some((channel) => channel !== 128)),
        "The triangle itself casts a shadow",
      ).toBe(true);
    };
    // The tighter resting blur must be sampled immediately outside the point.
    await expectPointedShadow("rest", 15);
    await sample.hover();
    await expect(sample).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    await expectPointedShadow("hover", 14);
    await page.emulateMedia({ forcedColors: "active" });
    await link.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-width", "2px");
    await expect(link).toHaveCSS("outline-offset", "3px");
    const surfaceColours = await surface.evaluate((element) => {
      const probe = document.createElement("span");
      probe.style.color = "LinkText";
      element.append(probe);
      const linkText = getComputedStyle(probe).color;
      probe.remove();
      return {
        edge: getComputedStyle(element, "::before").backgroundImage,
        fill: getComputedStyle(element, "::after").backgroundColor,
        linkText,
      };
    });
    await expect(surface).toHaveCSS("filter", "none");
    for (const shadow of await shadows.all()) {
      await expect(shadow).toHaveCSS("opacity", "0");
    }
    expect(surfaceColours.edge).toBe(
      `linear-gradient(${surfaceColours.linkText}, ${surfaceColours.linkText}), none`,
    );
    expect(surfaceColours.linkText).not.toBe(surfaceColours.fill);
  });
}
