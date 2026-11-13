import type { E2EFixtures } from "./fixtures";
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
import { delayClientScripts, expect, test } from "./fixtures";

const loadDependency = createRequire(join(process.cwd(), "package.json"));
const { descriptor } = parse(
  readFileSync("app/components/shared/button.vue", "utf8"),
);
const source = transpileModule(
  'import { useMounted } from "@vueuse/core";\n' +
    compileScript(descriptor, { id: "button-test", inlineTemplate: true })
      .content,
  {
    compilerOptions: {
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ESNext,
    },
  },
).outputText;
const componentExports: { default?: ComponentOptions } = {};
const link = defineComponent({
  props: {
    /** Navigation destination for the rendered anchor. */
    to: String,
  },
  setup:
    (props, { slots }) =>
    () =>
      h("a", { href: props.to }, slots.default?.()),
});
runInNewContext(source, {
  exports: componentExports,
  require: (id: string): unknown =>
    id === "#components" ? { NuxtLink: link } : loadDependency(id),
});
if (!componentExports.default) {
  throw new Error("Missing button component");
}
const button = componentExports.default;
const styles = compileString(descriptor.styles[0]!.content).css;
const propertiesPath = join(process.cwd(), "app/assets/style/_properties.scss");
const properties = compileString(readFileSync(propertiesPath, "utf8"), {
  url: pathToFileURL(propertiesPath),
}).css;
const variants = ["plain", "secondary", "primary", "icon"] as const;
const tagVariants = ["code-token", "tag"] as const;

for (const variant of [...variants, ...tagVariants]) {
  unitTest(
    `${variant} preserves server-rendered disabled and submit behaviour`,
    async () => {
      for (const disabled of [false, true]) {
        for (const submit of [false, true]) {
          const html = await renderToString(
            h(button, { variant, disabled, submit }, () => "Action"),
          );
          expect(html.includes(" disabled")).toBe(disabled || !submit);
          expect(html.includes("button--hydrating")).toBe(!disabled && !submit);
          expect(html).toContain(`type="${submit ? "submit" : "button"}"`);
          for (const candidate of variants) {
            expect(html.includes(`button--${candidate}`)).toBe(
              variant === candidate,
            );
          }
        }
      }
    },
  );
}

unitTest(
  "button variants preserve navigation semantics before hydration",
  async () => {
    for (const variant of tagVariants) {
      const html = await renderToString(
        h(button, { variant, tagIcon: true, to: "/tag/c/" }, () => "C#"),
      );
      expect(html).toContain("<a");
      expect(html).toContain('href="/tag/c/"');
      expect(html).not.toContain("disabled");
      expect(html).not.toContain("type=");
      expect(html).toContain(`button--${variant}`);
      expect(html.includes("button--tag-icon")).toBe(variant === "code-token");
      expect(
        html.includes('class="button__tag-surface" aria-hidden="true"'),
      ).toBe(variant === "tag");
      const disabled = await renderToString(
        h(button, { variant, to: "/tag/c/", disabled: true }, () => "C#"),
      );
      expect(disabled).toContain('aria-disabled="true"');
      expect(disabled).toContain('role="link"');
      expect(disabled).not.toContain("href=");
    }
  },
);

test("navigation variants forward clicks and become inert when disabled", async ({
  page,
}) => {
  await page.setContent('<div id="app"></div>');
  await page.addScriptTag({
    path: loadDependency.resolve("vue/dist/vue.global.js"),
  });
  await page.addScriptTag({
    path: loadDependency.resolve("@vueuse/shared/index.iife.js"),
  });
  await page.addScriptTag({
    path: loadDependency.resolve("@vueuse/core/index.iife.js"),
  });
  await page.addScriptTag({
    content: `{
      const exports = {};
      const NuxtLink = {
        props: ["to"],
        setup: (props, { slots }) => () => Vue.h("a", { href: props.to }, slots.default?.())
      };
      const require = (name) => {
        if (name === "vue") return Vue;
        if (name === "@vueuse/core") return VueUse;
        if (name === "#components") return { NuxtLink };
        throw new Error("Unexpected button dependency: " + name);
      };
      ${source}
      Vue.createApp({
        components: { UButton: exports.default },
        data: () => ({ variants: ${JSON.stringify(tagVariants)}, disabled: false, clicks: 0 }),
        template: \`
          <u-button v-for="variant of variants" :key="variant" :variant="variant"
            to="/destination/" :disabled="disabled" @click.prevent="clicks++">{{ variant }}</u-button>
          <button @click="disabled=!disabled">Toggle disabled links</button>
          <output :data-clicks="clicks"></output>\`
      }).mount("#app");
    }`,
  });
  const links = page.getByRole("link");
  await expect(links).toHaveCount(tagVariants.length);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("href", "/destination/");
    await link.click();
  }
  await expect(page.locator("output")).toHaveAttribute(
    "data-clicks",
    String(tagVariants.length),
  );
  await page.getByRole("button", { name: "Toggle disabled links" }).click();
  for (const link of await links.all()) {
    await expect(link).toBeDisabled();
    await expect(link).toHaveAttribute("tabindex", "-1");
    await expect(link).not.toHaveAttribute("href");
    await link.dispatchEvent("click");
  }
  await expect(page.locator("output")).toHaveAttribute(
    "data-clicks",
    String(tagVariants.length),
  );
});

for (const theme of ["light", "dark"]) {
  async function verifyButtonVariants({ page }: Pick<E2EFixtures, "page">) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setContent(
      `<html data-theme="${theme}"><body><div id="app"></div></body></html>`,
    );
    await page.addStyleTag({
      content: `${properties}\n${styles}
        .button:not(.button--icon) { transition: none; }
        .silhouette-sample { padding: 32px; background: #808080; }
        .silhouette-sample .button {
          --button-tag-point: 96px;
          min-block-size: 128px;
        }
        .overlay {
          color: white;
          background: #222;
          --button-icon-color: white;
          --button-icon-hover-color: #410c83;
          --button-icon-hover-background: white;
          --button-icon-disabled-color: rgb(255 255 255 / 65%);
          --button-icon-disabled-background: rgb(255 255 255 / 15%);
        }`,
    });
    await page.addScriptTag({
      path: loadDependency.resolve("vue/dist/vue.global.js"),
    });
    await page.addScriptTag({
      path: loadDependency.resolve("@vueuse/shared/index.iife.js"),
    });
    await page.addScriptTag({
      path: loadDependency.resolve("@vueuse/core/index.iife.js"),
    });
    await page.addScriptTag({
      content: `{
        const exports = {};
        const NuxtLink = {
          props: ["to"],
          setup: (props, { slots }) => () => Vue.h("a", { href: props.to }, slots.default?.())
        };
        const require = (name) => {
          if (name === "vue") return Vue;
          if (name === "@vueuse/core") return VueUse;
          if (name === "#components") return { NuxtLink };
          throw new Error("Unexpected button dependency: " + name);
        };
        ${source}
        const Button = exports.default;
        Vue.createApp({
          components: { UButton: Button },
          data: () => ({ disabled: false, clicks: 0, submits: 0, entered: false }),
          template: \`
            <form @submit.prevent="submits++">
              <u-button aria-label="plain" class="forwarded" data-forwarded="yes"
                :disabled="disabled" @click="clicks++" @pointerenter="entered=true">
                <svg aria-hidden="true" width="20" height="20"><path d="M0 0h20v20H0z" /></svg>
              </u-button>
              <u-button variant="secondary" :disabled="disabled" @click="clicks++">secondary</u-button>
              <u-button variant="primary" :disabled="disabled" @click="clicks++">primary</u-button>
              <u-button variant="tag" tag-icon :disabled="disabled" @click="clicks++">
                Windows Presentation Foundation (WPF)
              </u-button>
              <u-button variant="icon" aria-label="icon" :disabled="disabled" @click="clicks++">
                <svg aria-hidden="true" width="20" height="20"><path d="M0 0h20v20H0z" /></svg>
              </u-button>
              <div class="overlay">
                <u-button variant="icon" aria-label="overlay action" :disabled="disabled" @click="clicks++">
                  <svg aria-hidden="true" width="20" height="20"><path d="M0 0h20v20H0z" /></svg>
                </u-button>
              </div>
              <u-button variant="primary" submit :disabled="disabled">Submit</u-button>
              <button type="button" @click="disabled=!disabled">Toggle disabled</button>
              <output :data-clicks="clicks" :data-submits="submits" :data-entered="entered"></output>
            </form>
            <div class="silhouette-sample">
              <u-button variant="tag">Shape sample</u-button>
            </div>\`
        }).mount("#app");
      }`,
    });

    const plain = page.getByRole("button", { name: "plain", exact: true });
    const secondary = page.getByRole("button", {
      name: "secondary",
      exact: true,
    });
    const primary = page.getByRole("button", { name: "primary", exact: true });
    const shaped = page.getByRole("button", {
      name: "Windows Presentation Foundation (WPF)",
      exact: true,
    });
    const icon = page.getByRole("button", { name: "icon", exact: true });
    const overlay = page.getByRole("button", { name: "overlay action" });
    const submit = page.getByRole("button", { name: "Submit", exact: true });
    const output = page.locator("output");
    const tokens = await primary.evaluate((element) => {
      const probe = document.createElement("span");
      element.append(probe);
      const colour = (name: string) => {
        probe.style.color = `var(--global-${name}-color)`;
        return getComputedStyle(probe).color;
      };
      const values = {
        accent: colour("accent"),
        content: colour("content-background"),
        background: colour("background"),
        border: colour("border"),
        disabled: colour("disabled"),
      };
      probe.remove();
      return values;
    });
    await expect(plain).toHaveAttribute("data-forwarded", "yes");
    await expect(plain).toHaveClass("button button--plain forwarded");
    await expect(secondary).toHaveClass("button button--secondary");
    await expect(primary).toHaveClass("button button--primary");
    for (const control of [icon, overlay]) {
      await expect(control).toHaveClass("button button--icon");
      await expect(control).toHaveCSS("width", "44px");
      await expect(control).toHaveCSS("height", "44px");
      await expect(control).toHaveCSS("border-radius", "50%");
      await expect(control.locator("svg")).toBeVisible();
    }
    await expect(icon).toHaveCSS(
      "color",
      await icon.evaluate(
        (element) => getComputedStyle(element.parentElement!).color,
      ),
    );
    await expect(overlay).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(plain.locator("svg")).toBeVisible();
    await expect(plain).toHaveCSS("padding", "0px");
    await expect(plain).toHaveCSS("border-top-width", "0px");
    await expect(plain).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(secondary).toHaveCSS("background-color", tokens.background);
    await expect(primary).toHaveCSS("background-color", tokens.accent);
    await expect(primary).toHaveCSS("border-top-color", tokens.accent);
    await expect(primary).toHaveCSS("color", tokens.content);
    await expect(shaped).toHaveClass("button button--tag button--tag-base");
    const surface = shaped.locator(".button__tag-surface");
    await expect(surface).toHaveAttribute("aria-hidden", "true");
    await expect(surface).toHaveCSS("clip-path", "none");
    expect(
      await surface.evaluate(
        (element) => getComputedStyle(element, "::before").clipPath,
      ),
    ).not.toBe("none");
    await expect(shaped).toHaveCSS("clip-path", "none");
    await expect
      .poll(() =>
        shaped.evaluate((element) => {
          const hole = getComputedStyle(element, "::after");
          return {
            colour: hole.backgroundColor,
            round: hole.borderRadius,
            mask: hole.maskImage,
          };
        }),
      )
      .toEqual({ colour: tokens.accent, round: "50%", mask: "none" });
    for (const property of [
      "padding",
      "border-top-width",
      "border-radius",
      "box-shadow",
      "font-size",
    ]) {
      expect(
        await primary.evaluate(
          (el, name) => getComputedStyle(el).getPropertyValue(name),
          property,
        ),
      ).toBe(
        await secondary.evaluate(
          (el, name) => getComputedStyle(el).getPropertyValue(name),
          property,
        ),
      );
    }

    await plain.hover();
    await expect(output).toHaveAttribute("data-entered", "true");
    await plain.click();
    await expect(output).toHaveAttribute("data-clicks", "1");
    await expect(output).toHaveAttribute("data-submits", "0");

    for (const control of [plain, secondary, primary, icon, overlay, shaped]) {
      await expect(control).toHaveAttribute("type", "button");
      await control.hover();
      if (control === icon || control === overlay) {
        await expect(control).toHaveCSS(
          "background-color",
          control === icon ? tokens.border : "rgb(255, 255, 255)",
        );
        await expect(control).toHaveCSS(
          "color",
          control === icon
            ? await control.evaluate(
                (element) => getComputedStyle(element.parentElement!).color,
              )
            : "rgb(65, 12, 131)",
        );
        await expect(control).toHaveCSS("transform", "none");
      } else if (control !== plain) {
        await expect(control).toHaveCSS(
          "transform",
          "matrix(1, 0, 0, 1, 0, -2)",
        );
        await page.mouse.down();
        await expect(control).toHaveCSS(
          "transform",
          "matrix(1, 0, 0, 1, 0, 0)",
        );
        await page.mouse.up();
      }
      if (control === primary) {
        await expect(control).toHaveCSS("color", tokens.content);
      }
      await page.mouse.move(0, 0);
      await control.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(control).toBeFocused();
      if (control === plain) {
        await expect(control).toHaveCSS(
          "transform",
          "matrix(1.07, 0, 0, 1.07, 0, 0)",
        );
        await expect(control).toHaveCSS("color", tokens.accent);
      } else if (control === icon || control === overlay) {
        await expect(control).toHaveCSS("outline-style", "solid");
        await expect(control).toHaveCSS("outline-width", "2px");
        await expect(control).toHaveCSS("transform", "none");
        await expect(control).toHaveCSS(
          "background-color",
          control === icon ? tokens.border : "rgb(255, 255, 255)",
        );
      } else {
        await expect(control).toHaveCSS(
          "outline-style",
          control === shaped ? "solid" : "none",
        );
        if (control === shaped) {
          await expect(control).toHaveCSS("outline-width", "3px");
        }
        await expect(control).toHaveCSS(
          "transform",
          "matrix(1, 0, 0, 1, 0, -2)",
        );
        await expect
          .poll(() =>
            control.evaluate((element) =>
              getComputedStyle(element, "::before").getPropertyValue("opacity"),
            ),
          )
          .toBe("1");
        if (control === shaped) {
          expect(
            await control.evaluate(
              (element) => getComputedStyle(element, "::before").content,
            ),
          ).toBe("none");
          await expect(surface).not.toHaveCSS("filter", "none");
        } else {
          expect(
            await control.evaluate(
              (element) => getComputedStyle(element, "::before").boxShadow,
            ),
          ).not.toBe("none");
        }
      }
      if (control === primary) {
        await expect(control).toHaveCSS("color", tokens.content);
      }
    }
    await expect(submit).toHaveAttribute("type", "submit");
    await submit.click();
    await expect(output).toHaveAttribute("data-submits", "1");

    await page.getByRole("button", { name: "Toggle disabled" }).click();
    const clicks = await output.getAttribute("data-clicks");
    for (const control of [
      plain,
      secondary,
      primary,
      icon,
      overlay,
      shaped,
      submit,
    ]) {
      await expect(control).toBeDisabled();
      // Disabled controls cannot pass actionability checks; exercise their disabled hover styles.
      // eslint-disable-next-line playwright/no-force-option
      await control.hover({ force: true });
      await expect(control).toHaveCSS(
        "color",
        control === overlay ? "rgba(255, 255, 255, 0.65)" : tokens.disabled,
      );
      await expect(control).toHaveCSS("cursor", "not-allowed");
      // Deliberately dispatch a click to verify disabled controls do not invoke their handlers.
      // eslint-disable-next-line playwright/no-force-option
      await control.click({ force: true });
    }
    await expect(output).toHaveAttribute("data-clicks", clicks!);
    await expect(output).toHaveAttribute("data-submits", "1");
    await expect(surface).toHaveCSS("filter", "none");
    await expect(icon).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(overlay).toHaveCSS(
      "background-color",
      "rgba(255, 255, 255, 0.15)",
    );
    await expect(primary).toHaveCSS("background-color", tokens.border);
    await expect(primary).toHaveCSS("border-top-color", tokens.border);
    await expect(primary).toHaveCSS("transform", "none");
    await page.getByRole("button", { name: "Toggle disabled" }).click();
    await expect(primary).toBeEnabled();
    await expect(primary).toHaveCSS("background-color", tokens.accent);
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(shaped).toHaveCSS("max-inline-size", "100%");
    expect(
      await shaped.evaluate((element) => ({
        overflows: element.scrollWidth > element.clientWidth,
        fits: element.getBoundingClientRect().right <= innerWidth,
      })),
    ).toEqual({ overflows: false, fits: true });
    await page.addStyleTag({
      content: ".button { color: var(--global-title-color); }",
    });
    await expect(icon).toHaveCSS(
      "color",
      await icon.evaluate(
        (element) => getComputedStyle(element.parentElement!).color,
      ),
    );
    await expect(overlay).toHaveCSS("color", "rgb(255, 255, 255)");
    for (const motion of ["reduce", "no-preference"] as const) {
      await page.emulateMedia({ reducedMotion: motion });
      await shaped.hover();
      await expect(shaped).toHaveCSS(
        "transform",
        motion === "reduce" ? "none" : "matrix(1, 0, 0, 1, 0, -2)",
      );
      if (motion === "reduce") {
        await expect(surface).toHaveCSS("transition-duration", "0s");
      }
      await icon.focus();
      const beforeKeyboardClick = Number(
        await output.getAttribute("data-clicks"),
      );
      await page.keyboard.press("Space");
      await expect(output).toHaveAttribute(
        "data-clicks",
        String(beforeKeyboardClick + 1),
      );
      await expect(output).toHaveAttribute("data-submits", "1");
      await expect(icon).toHaveCSS("transform", "none");
      await expect(icon).toHaveCSS("transition-duration", "0s");
    }
    // Enlarge the point so a rectangular backing cannot hide in the shadow blur.
    const sample = page.getByRole("button", {
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
    await shaped.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(shaped).toBeFocused();
    await expect(shaped).toHaveCSS("outline-width", "3px");
    expect(
      await shaped.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toMatch(/,\s*0\)$/);
    const surfaceColours = await surface.evaluate((element) => ({
      edge: getComputedStyle(element, "::before").backgroundColor,
      fill: getComputedStyle(element, "::after").backgroundColor,
    }));
    await expect(surface).toHaveCSS("filter", "none");
    expect(surfaceColours.edge).not.toBe(surfaceColours.fill);
    for (const control of [icon, overlay]) {
      await control.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(control).toBeFocused();
      await expect(control).toHaveCSS("border-top-style", "solid");
      await expect(control).toHaveCSS("outline-style", "solid");
      await expect(control).toHaveCSS("outline-width", "2px");
    }
    await page.getByRole("button", { name: "Toggle disabled" }).click();
    const systemColors = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "GrayText";
      probe.style.backgroundColor = "ButtonFace";
      document.body.append(probe);
      const computed = getComputedStyle(probe);
      const colors = {
        disabled: computed.color,
        background: computed.backgroundColor,
      };
      probe.remove();
      return colors;
    });
    for (const control of [icon, overlay]) {
      await expect(control).toBeDisabled();
      await expect(control).toHaveCSS("color", systemColors.disabled);
      await expect(control).toHaveCSS(
        "background-color",
        systemColors.background,
      );
    }
  }

  test(`Variants preserve geometry, interactions and forwarding in ${theme}`, async ({
    page,
  }) => {
    await expect(
      verifyButtonVariants({
        page,
      }),
    ).resolves.toBeUndefined();
  });
}

test("Real callers retain plain icons, secondary actions and pre-hydration submission", async ({
  page,
}) => {
  const scripts = await delayClientScripts(page);
  try {
    await page.goto("/on-the-etiquette-of-pull-request-comments/", {
      waitUntil: "commit",
    });
    const search = page.getByRole("button", { name: "Open search" });
    const subscribe = page.getByRole("button", { name: "Subscribe" });
    const share = page.getByRole("button", { name: "Share", exact: true });
    await expect(search).toBeDisabled();
    await expect(search).toHaveClass(/button--hydrating/);
    await expect(search).toHaveClass(/button--plain/);
    await expect(share).toBeDisabled();
    await expect(share).toHaveClass(/button--secondary/);
    await expect(subscribe).toBeEnabled();
    await expect(subscribe).toHaveAttribute("type", "submit");
    await expect(subscribe).toHaveClass(/button--secondary/);
    scripts.resume();
    await expect(search).toBeEnabled();
    await expect(share).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Buy me a Coffee", exact: true }),
    ).toHaveClass(/button--secondary/);
    await search.focus();
    await expect(search).toHaveAccessibleDescription("Search");
    await search.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Search", exact: true });
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole("button", { name: "Close Search" });
    await expect(close).toHaveAttribute("type", "submit");
    await expect(close).toHaveClass(/button--plain/);
    await close.click();
    await expect(dialog).toBeHidden();
  } finally {
    await scripts.dispose();
  }
});
