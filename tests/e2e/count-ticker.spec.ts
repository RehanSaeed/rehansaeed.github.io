import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { compileScript, parse } from "vue/compiler-sfc";
import ts from "typescript";

const now = Date.UTC(2026, 9, 27, 12);

async function mountTicker(
  page: Page,
  options: {
    number?: number;
    rate?: number;
    locale?: string;
  } = {},
) {
  const [component, utilities, vue] = await Promise.all([
    readFile(
      join(process.cwd(), "app", "components", "shared", "number-ticker.vue"),
      "utf8",
    ),
    readFile(join(process.cwd(), "shared", "utils", "ticker.ts"), "utf8"),
    readFile(
      join(
        process.cwd(),
        "node_modules",
        "vue",
        "dist",
        "vue.esm-browser.prod.js",
      ),
      "utf8",
    ),
  ]);
  const { descriptor } = parse(component);
  const compiled = compileScript(descriptor, {
    id: "number-ticker-test",
    inlineTemplate: true,
  });
  const transpile = (source: string) =>
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    }).outputText;
  const componentSource = transpile(
    'import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";\n' +
      compiled.content,
  );
  await page.clock.install({ time: new Date(now - 10_000) });
  await page.clock.pauseAt(new Date(now));
  await page.setContent(
    '<main id="ticker-test"></main><input type="number" aria-label="Number" /><input type="number" aria-label="Rate" /><button>Unmount</button>',
  );
  await page.evaluate(
    async ({ componentSource, utilitiesSource, vue, options }) => {
      const moduleUrl = (source: string) =>
        URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
      const vueUrl = moduleUrl(vue);
      const utilitiesUrl = moduleUrl(utilitiesSource);
      const componentUrl = moduleUrl(
        componentSource
          .replace(/(["'])vue\1/g, JSON.stringify(vueUrl))
          .replace(
            /(["'])#shared\/utils\/ticker\1/g,
            JSON.stringify(utilitiesUrl),
          ),
      );
      const { createApp, h, ref } = await import(vueUrl);
      const { default: Ticker } = await import(componentUrl);
      Math.random = () => 0.5;
      const number = ref(options.number ?? 1000);
      const rate = ref(options.rate ?? 2);
      const app = createApp({
        setup: () => () =>
          h(Ticker, {
            title: "Downloads",
            number: number.value,
            rate: rate.value,
            locale: options.locale,
          }),
      });
      app.mount("#ticker-test");
      for (const [label, model] of [
        ["Number", number],
        ["Rate", rate],
      ] as const) {
        document
          .querySelector(`[aria-label="${label}"]`)!
          .addEventListener("input", (event) => {
            const input = event.target as HTMLInputElement;
            model.value = Number(input.value);
          });
      }
      document
        .querySelector("button")!
        .addEventListener("click", () => app.unmount());
    },
    { componentSource, utilitiesSource: transpile(utilities), vue, options },
  );
}

const changeReducedMotion = async (
  page: Page,
  reducedMotion: "reduce" | "no-preference",
) => {
  const change = await page.evaluateHandle(() => ({
    changed: new Promise<void>((resolve) => {
      window
        .matchMedia("(prefers-reduced-motion: reduce)")
        .addEventListener("change", () => resolve(), { once: true });
    }),
  }));
  await page.emulateMedia({ reducedMotion });
  await page.clock.runFor(50);
  await change.evaluate(({ changed }) => changed);
  await change.dispose();
};

test("Shared ticker needs title, number and rate and follows the supplied average", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page);
  const ticker = page.locator("dl.number-ticker");
  await expect(ticker.getByRole("term")).toHaveText("Downloads");
  await expect(ticker.getByRole("definition")).toHaveCount(1);
  await expect(ticker.locator(".number-ticker__value")).toHaveAttribute(
    "aria-live",
    "off",
  );
  const digits = ticker.locator(".number-ticker__digits");
  await page.clock.runFor(1500);
  await expect(digits).toHaveText("1,002");
  await page.clock.runFor(1000);
  await expect(digits).toHaveText("1,004");
  await expect(ticker.locator(".number-ticker__accessible")).toHaveText(
    "1,000",
  );
  await expect(ticker).toMatchAriaSnapshot(`
    - term: Downloads
    - definition: 1,000
  `);
  await expect(ticker.getByRole("heading")).toHaveCount(0);
  await expect(ticker.locator(".number-ticker__digits")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(ticker.getByRole("button")).toHaveCount(0);
  await expect(ticker.locator(".number-ticker__header")).not.toHaveClass(
    /number-ticker__header--with-info/,
  );
});

test("Random ticks pause and jump by different amounts instead of counting one by one", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page, { rate: 1 });
  await page.evaluate(() => {
    const samples = [0.1, 0.875, 0.2, 0.625, 0.75];
    Math.random = () => samples.shift() ?? 0.5;
  });
  const digits = page.locator(".number-ticker__digits");
  await page.clock.runFor(500);
  for (const value of [1000, 1002, 1002, 1004, 1006]) {
    await page.clock.runFor(1000);
    await expect(digits).toHaveText(value.toLocaleString("en-GB"));
  }
});

test("Reduced motion prevents ticking and changing the preference stops animation", async ({
  page,
}) => {
  await mountTicker(page);
  const digits = page.locator(".number-ticker__digits");
  await page.clock.runFor(5000);
  await expect(digits).toHaveText("1,000");
  await changeReducedMotion(page, "no-preference");
  await page.clock.runFor(1500);
  await expect(digits).toHaveText("1,002");
  await changeReducedMotion(page, "reduce");
  await page.clock.runFor(5000);
  await expect(digits).toHaveText("1,002");
  await changeReducedMotion(page, "no-preference");
  await page.clock.runFor(1500);
  await expect(digits).toHaveText("1,004");
});

test("Slow rates retain fractional increments instead of inventing one count every second", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page, { rate: 0.25 });
  const digits = page.locator(".number-ticker__digits");
  await page.clock.runFor(3000);
  await expect(digits).toHaveText("1,000");
  await page.clock.runFor(1500);
  await expect(digits).toHaveText("1,001");
});

test("Hidden tabs suspend the timer and returning visitors catch up at the average rate", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page);
  const digits = page.locator(".number-ticker__digits");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(60_000);
  await expect(digits).toHaveText("1,000");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(500);
  await expect(digits).toHaveText("1,120");
});

test("Prop changes reset the number, cross digit boundaries, honour locale and stop a zero rate", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page, { number: 999, rate: 1, locale: "de-DE" });
  const ticker = page.locator(".number-ticker");
  await page.clock.runFor(1600);
  await expect(ticker.locator(".number-ticker__digits")).toHaveText("1.000");
  await page.getByLabel("Number", { exact: true }).fill("-1234.5");
  await expect(ticker.locator(".number-ticker__accessible")).toHaveText(
    "-1.234,5",
  );
  await page.getByLabel("Rate").fill("0");
  await page.clock.runFor(5000);
  await expect(ticker.locator(".number-ticker__digits")).toHaveText("-1.234,5");
  await page.getByRole("button", { name: "Unmount" }).click();
  await page.clock.runFor(5000);
  await expect(ticker).toHaveCount(0);
});
