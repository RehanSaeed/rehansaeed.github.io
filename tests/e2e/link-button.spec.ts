import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { test as unitTest } from "@playwright/test";
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
const propertiesPath = join(process.cwd(), "app/assets/style/_properties.scss");
const properties = compileString(readFileSync(propertiesPath, "utf8"), {
  url: pathToFileURL(propertiesPath),
}).css;

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
      content: `${properties}\n${styles}
        .link-button { transition: none; }
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
    await expect(surface).toHaveCSS("filter", "none");
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
      probe.style.filter =
        "drop-shadow(var(--global-shadow-2-near)) drop-shadow(var(--global-shadow-2-middle)) drop-shadow(var(--global-shadow-2-far))";
      const raised = getComputedStyle(probe).filter;
      probe.remove();
      return { accent, pressed, raised };
    });
    const hole = await link.evaluate((element) => {
      const style = getComputedStyle(element, "::after");
      return { colour: style.backgroundColor, round: style.borderRadius };
    });
    expect(hole).toEqual({ colour: tokens.accent, round: "50%" });
    await link.hover();
    await expect(output).toHaveAttribute("data-entered", "true");
    await expect(link).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    await expect(surface).toHaveCSS("filter", tokens.raised);
    await page.mouse.down();
    await expect(link).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await expect(surface).toHaveCSS("filter", tokens.pressed);
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
    await expect(link).toHaveCSS("outline-width", "3px");
    await expect(link).toHaveCSS("outline-color", tokens.accent);
    await page.setViewportSize({ width: 320, height: 900 });
    expect(
      await link.evaluate((element) => ({
        overflows: element.scrollWidth > element.clientWidth,
        fits: element.getBoundingClientRect().right <= innerWidth,
      })),
    ).toEqual({ overflows: false, fits: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await link.hover();
    await expect(link).toHaveCSS("transform", "none");
    await expect(surface).toHaveCSS("filter", tokens.raised);
    await expect(surface).toHaveCSS("transition-duration", "0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });

    // Enlarge the point so a rectangular backing cannot hide in the shadow blur.
    const sample = page.getByRole("link", {
      name: "Shape sample",
      exact: true,
    });
    await sample.hover();
    await expect(sample).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
    const bounds = await sample.boundingBox();
    expect(bounds).not.toBeNull();
    const screenshot = await page.screenshot({
      path: test.info().outputPath(`pointed-hover-${theme}.png`),
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
      colourAt(14, 16 + Math.floor(bounds!.height / 2) + offset),
    );
    expect(
      tipShadow.some((colour) => colour.some((channel) => channel !== 128)),
      "The triangle itself casts a raised shadow",
    ).toBe(true);
    await page.emulateMedia({ forcedColors: "active" });
    await link.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-width", "3px");
    const surfaceColours = await surface.evaluate((element) => ({
      edge: getComputedStyle(element, "::before").backgroundColor,
      fill: getComputedStyle(element, "::after").backgroundColor,
    }));
    await expect(surface).toHaveCSS("filter", "none");
    expect(surfaceColours.edge).not.toBe(surfaceColours.fill);
  });
}
