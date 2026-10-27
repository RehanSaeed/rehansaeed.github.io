import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { compileScript, parse } from "vue/compiler-sfc";
import ts from "typescript";
import type { CounterGrowth } from "../../shared/utils/ticker";

const now = Date.UTC(2026, 9, 27, 12);
const growth: CounterGrowth = {
  observedAt: now,
  since: now - 86400_000,
  perSecond: 2,
};

// Mount the actual reusable component with deterministic observations, not production fake counts.
async function mountTicker(page: Page, trend = growth, value = 1000) {
  const [component, utilities, vue] = await Promise.all([
    readFile(
      join(process.cwd(), "app", "components", "count-ticker.vue"),
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
    id: "count-ticker-test",
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
  await page.setContent('<main id="ticker-test"></main>');
  await page.evaluate(
    async ({ componentSource, utilitiesSource, vue, trend, value, now }) => {
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
      const { createApp } = await import(vueUrl);
      const { default: Ticker } = await import(componentUrl);
      Math.random = () => 0.5;
      const app = createApp(Ticker, {
        label: "Downloads",
        value,
        growth: trend,
        generatedAt: new Date(now).toISOString(),
      });
      app.component("NuxtIcon", { render: () => null });
      app.mount("#ticker-test");
    },
    {
      componentSource,
      utilitiesSource: transpile(utilities),
      vue,
      trend,
      value,
      now,
    },
  );
}

test("Ticker starts on the verified count for reduced motion and can be animated and paused explicitly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mountTicker(page);
  const ticker = page.locator(".count-ticker");
  const digits = ticker.locator(".count-ticker__digits");
  await expect(ticker).toHaveAttribute("data-state", "snapshot");
  await page.clock.runFor(5000);
  await expect(digits).toHaveText("1,000");
  await page.getByRole("button", { name: "Start downloads estimate" }).click();
  await expect(ticker).toHaveAttribute("data-value", "1010");
  await page.clock.runFor(2000);
  await expect(ticker).toHaveAttribute("data-value", "1014");
  await page.getByRole("button", { name: "Pause downloads estimate" }).click();
  await expect(ticker).toHaveAttribute("data-state", "paused");
  await page.clock.runFor(5000);
  await expect(ticker).toHaveAttribute("data-value", "1014");
  await expect(ticker.locator(".count-ticker__verified strong")).toHaveText(
    "1,000",
  );
  await expect(ticker.locator(".count-ticker__value")).toHaveAttribute(
    "aria-live",
    "off",
  );
});

test("Ticker animates each second, pauses on a motion preference change and resumes from elapsed time", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page);
  const ticker = page.locator(".count-ticker");
  await expect(ticker).toHaveAttribute("data-state", "running");
  await page.clock.runFor(1000);
  await expect(ticker).toHaveAttribute("data-value", "1002");
  await page.clock.runFor(1000);
  await expect(ticker).toHaveAttribute("data-value", "1004");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(ticker).toHaveAttribute("data-state", "paused");
  await page.clock.runFor(4000);
  await expect(ticker).toHaveAttribute("data-value", "1004");
  await page.getByRole("button", { name: "Start downloads estimate" }).click();
  await expect(ticker).toHaveAttribute("data-value", "1012");
});

test("Falling star estimates never go below zero and expired observations stop projecting", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page, { ...growth, perSecond: -0.5 }, 2);
  const ticker = page.locator(".count-ticker");
  await page.clock.runFor(2000);
  await expect(ticker).toHaveAttribute("data-value", "1");
  await page.clock.runFor(4000);
  await expect(ticker).toHaveAttribute("data-value", "0");
  await page.clock.fastForward(15 * 86400_000);
  await expect(page.locator(".count-ticker")).toHaveAttribute(
    "data-state",
    "snapshot",
  );
  await expect(ticker).toHaveAttribute("data-value", "2");
  await expect(page.getByRole("button")).toHaveCount(0);
});

test("Missing history displays the real count and never invents ticking activity", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page, { observedAt: now, since: null, perSecond: null });
  await expect(page.locator(".count-ticker__status")).toHaveText(
    "Collecting history",
  );
  await expect(page.getByRole("button")).toHaveCount(0);
  await page.clock.fastForward(86400_000);
  await expect(page.locator(".count-ticker__digits")).toHaveText("1,000");
});

test("Hidden tabs suspend the timer and returning visitors rebase to elapsed time", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mountTicker(page);
  const ticker = page.locator(".count-ticker");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(60_000);
  await expect(ticker).toHaveAttribute("data-value", "1000");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(ticker).toHaveAttribute("data-value", "1120");
  await page.clock.runFor(1000);
  await expect(ticker).toHaveAttribute("data-value", "1122");
});
