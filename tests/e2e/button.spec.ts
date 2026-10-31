import type { E2EFixtures } from "./fixtures";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { test as unitTest } from "@playwright/test";
import { compileString } from "sass-embedded";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { h, type ComponentOptions } from "vue";
import { compileScript, parse } from "vue/compiler-sfc";
import { renderToString } from "vue/server-renderer";
import { delayClientScripts, expect, test } from "./fixtures";

const loadDependency = createRequire(join(process.cwd(), "package.json"));
const { descriptor } = parse(
  readFileSync("app/components/shared/button.vue", "utf8"),
);
const source = transpileModule(
  compileScript(descriptor, { id: "button-test" }).content,
  {
    compilerOptions: {
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ESNext,
    },
  },
).outputText;
const componentExports: { default?: ComponentOptions } = {};
runInNewContext(source, {
  exports: componentExports,
  require: loadDependency,
});
if (!componentExports.default) {
  throw new Error("Missing button component");
}
const button = {
  ...componentExports.default,
  template: descriptor.template!.content,
};
const styles = compileString(descriptor.styles[0]!.content).css;
const propertiesPath = join(process.cwd(), "app/assets/style/_properties.scss");
const properties = compileString(readFileSync(propertiesPath, "utf8"), {
  url: pathToFileURL(propertiesPath),
}).css;
const variants = ["plain", "secondary", "primary"] as const;

for (const variant of variants) {
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

for (const theme of ["light", "dark"]) {
  async function verifyButtonVariants({ page }: Pick<E2EFixtures, "page">) {
    await page.setContent(
      `<html data-theme="${theme}"><body><div id="app"></div></body></html>`,
    );
    await page.addStyleTag({
      content: `${properties}\n${styles}\n.button { transition: none; }`,
    });
    await page.addScriptTag({
      path: loadDependency.resolve("vue/dist/vue.global.js"),
    });
    await page.addScriptTag({
      content: `{
        const exports = {};
        const require = () => Vue;
        ${source}
        const Button = exports.default;
        Button.template = ${JSON.stringify(descriptor.template!.content)};
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
              <u-button variant="primary" submit :disabled="disabled">Submit</u-button>
              <button type="button" @click="disabled=!disabled">Toggle disabled</button>
              <output :data-clicks="clicks" :data-submits="submits" :data-entered="entered"></output>
            </form>\`
        }).mount("#app");
      }`,
    });

    const plain = page.getByRole("button", { name: "plain", exact: true });
    const secondary = page.getByRole("button", {
      name: "secondary",
      exact: true,
    });
    const primary = page.getByRole("button", { name: "primary", exact: true });
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
    await expect(plain.locator("svg")).toBeVisible();
    await expect(plain).toHaveCSS("padding", "0px");
    await expect(plain).toHaveCSS("border-top-width", "0px");
    await expect(plain).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(secondary).toHaveCSS("background-color", tokens.background);
    await expect(primary).toHaveCSS("background-color", tokens.accent);
    await expect(primary).toHaveCSS("border-top-color", tokens.accent);
    await expect(primary).toHaveCSS("color", tokens.content);
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

    for (const control of [plain, secondary, primary]) {
      await expect(control).toHaveAttribute("type", "button");
      await control.hover();
      if (control !== plain) {
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
      } else {
        await expect(control).toHaveCSS("outline-style", "none");
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
        expect(
          await control.evaluate(
            (element) => getComputedStyle(element, "::before").boxShadow,
          ),
        ).not.toBe("none");
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
    for (const control of [plain, secondary, primary, submit]) {
      await expect(control).toBeDisabled();
      // Disabled controls cannot pass actionability checks; exercise their disabled hover styles.
      // eslint-disable-next-line playwright/no-force-option
      await control.hover({ force: true });
      await expect(control).toHaveCSS("color", tokens.disabled);
      await expect(control).toHaveCSS("cursor", "not-allowed");
      // Deliberately dispatch a click to verify disabled controls do not invoke their handlers.
      // eslint-disable-next-line playwright/no-force-option
      await control.click({ force: true });
    }
    await expect(output).toHaveAttribute("data-clicks", clicks!);
    await expect(output).toHaveAttribute("data-submits", "1");
    await expect(primary).toHaveCSS("background-color", tokens.border);
    await expect(primary).toHaveCSS("border-top-color", tokens.border);
    await expect(primary).toHaveCSS("transform", "none");
    await page.getByRole("button", { name: "Toggle disabled" }).click();
    await expect(primary).toBeEnabled();
    await expect(primary).toHaveCSS("background-color", tokens.accent);
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
