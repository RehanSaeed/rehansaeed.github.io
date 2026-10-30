import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { compileString } from "sass-embedded";
import { compileScript, parse } from "vue/compiler-sfc";
import ts from "typescript";

const now = Date.UTC(2026, 9, 27, 12);

async function mountTicker(
  page: Page,
  options: {
    number?: number;
    rate?: number;
    locale?: string;
    offscreen?: boolean;
  } = {},
) {
  const [component, utilities, vue, intersect] = await Promise.all([
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
    readFile(
      join(process.cwd(), "app", "components", "shared", "intersect.vue"),
      "utf8",
    ),
  ]);
  const { descriptor } = parse(component);
  const compiled = compileScript(descriptor, {
    id: "number-ticker-test",
    inlineTemplate: true,
  });
  const intersectSource = compileScript(parse(intersect).descriptor, {
    id: "intersect-test",
  }).content;
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
    '<style>#ticker-test.offscreen { transform: translateY(200vh); }</style><main id="ticker-test"></main><input type="number" aria-label="Number" /><input type="number" aria-label="Rate" /><button>Unmount</button>',
  );
  const fixture = await page.evaluateHandle(
    async ({
      componentSource,
      utilitiesSource,
      vue,
      intersectSource,
      options,
    }) => {
      const intervals = new Set<number>();
      const setInterval = window.setInterval.bind(window);
      const clearInterval = window.clearInterval.bind(window);
      window.setInterval = (handler, timeout, ...args) => {
        const timer = setInterval(handler, timeout, ...args);
        intervals.add(timer);
        return timer;
      };
      window.clearInterval = (timer) => {
        if (timer !== undefined) {
          intervals.delete(timer);
        }
        clearInterval(timer);
      };
      const observers = new Set<IntersectionObserver>();
      const NativeIntersectionObserver = window.IntersectionObserver;
      const ready = new Promise<void>((resolve) => {
        window.IntersectionObserver = class extends NativeIntersectionObserver {
          constructor(
            callback: IntersectionObserverCallback,
            options?: IntersectionObserverInit,
          ) {
            super((entries, observer) => {
              callback(entries, observer);
              document.dispatchEvent(new Event("ticker-intersection"));
              resolve();
            }, options);
            observers.add(this);
          }

          disconnect() {
            observers.delete(this);
            super.disconnect();
          }
        };
      });
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
      const { default: Intersect } = await import(moduleUrl(intersectSource));
      Math.random = () => 0.5;
      const number = ref(options.number ?? 1000);
      const rate = ref(options.rate ?? 2);
      const app = createApp({
        setup: () => () =>
          h(Ticker, {
            label: "Downloads",
            number: number.value,
            rate: rate.value,
            locale: options.locale,
          }),
      });
      app.component("u-intersect", Intersect);
      document
        .querySelector("#ticker-test")!
        .classList.toggle("offscreen", options.offscreen ?? false);
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
      return { ready, intervals, observers };
    },
    {
      componentSource,
      utilitiesSource: transpile(utilities),
      vue,
      intersectSource,
      options,
    },
  );
  await page.clock.runFor(50);
  await fixture.evaluate(({ ready }) => ready);
  return fixture;
}

const moveTicker = async (page: Page, offscreen: boolean) => {
  const intersection = await page.evaluateHandle(() => ({
    changed: new Promise<void>((resolve) => {
      document.addEventListener("ticker-intersection", () => resolve(), {
        once: true,
      });
    }),
  }));
  await page.locator("#ticker-test").evaluate((element, offscreen) => {
    element.classList.toggle("offscreen", offscreen);
  }, offscreen);
  await page.clock.runFor(50);
  await intersection.evaluate(({ changed }) => changed);
  await intersection.dispose();
};

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

test("Ticker styles, statistics and badges preserve dimensions and follow shared design tokens", async ({
  page,
}) => {
  const propertiesPath = join(
    process.cwd(),
    "app",
    "assets",
    "style",
    "_properties.scss",
  );
  const [component, properties, statistics, badges] = await Promise.all([
    readFile(
      join(process.cwd(), "app", "components", "shared", "number-ticker.vue"),
      "utf8",
    ),
    readFile(propertiesPath, "utf8"),
    readFile(
      join(process.cwd(), "app", "components", "portfolio-statistics.vue"),
      "utf8",
    ),
    readFile(
      join(process.cwd(), "app", "components", "github-badges.vue"),
      "utf8",
    ),
  ]);
  const styles = [component, statistics, badges]
    .map((source) => {
      const { descriptor } = parse(source);
      return compileString(descriptor.styles[0]!.content, {
        importers: [
          {
            findFileUrl: (url) =>
              url.startsWith("~/")
                ? pathToFileURL(
                    join(process.cwd(), "app", ...url.slice(2).split("/")),
                  )
                : null,
          },
        ],
      }).css;
    })
    .join("\n");
  await page.setContent(`
    <html data-theme="light"><body>
    <div class="portfolio-statistics">
    <div class="portfolio-statistics__totals">
    <dl class="number-ticker">
      <dt class="number-ticker__header number-ticker__header--with-info">
        <span class="number-ticker__label">Downloads</span>
        <button class="number-ticker__info" aria-label="Downloads">i</button>
      </dt>
      <dd class="number-ticker__value">
        <span class="number-ticker__digits">
          <span class="number-ticker__cell">
            <span class="number-ticker__digit">0</span>
          </span>
          <span class="number-ticker__cell number-ticker__cell--separator">
            <span class="number-ticker__digit">,</span>
          </span>
        </span>
      </dd>
    </dl>
    </div>
    <ul class="github-badges">
      <li><a href="#badge"><img alt="GitHub badge" width="135" height="30"></a></li>
    </ul>
    </div>
    </body></html>
  `);
  await page.addStyleTag({
    content: `${compileString(properties, { url: pathToFileURL(propertiesPath) }).css}\n${styles}`,
  });
  const ticker = page.locator(".number-ticker");
  const info = ticker.getByRole("button", { name: "Downloads" });
  const header = ticker.getByRole("term");
  const digits = ticker.locator(".number-ticker__digits");
  const totals = page.locator(".portfolio-statistics__totals");
  const badge = page.getByRole("img", { name: "GitHub badge" });
  const badgeLink = page.getByRole("link", { name: "GitHub badge" });
  await expect(digits).toHaveCSS("display", "grid");
  await expect(digits).toHaveCSS("grid-auto-flow", "column");
  await expect(digits).toHaveCSS("grid-auto-columns", "max-content");
  await expect(digits.locator(".number-ticker__digit").first()).toHaveCSS(
    "display",
    "grid",
  );
  await expect(header).toHaveCSS("grid-template-areas", '". label info"');
  await expect(header.locator(".number-ticker__label")).toHaveCSS(
    "grid-column-start",
    "label",
  );
  for (const rootSize of [16, 20]) {
    const rootStyle = await page.addStyleTag({
      content: `html { font-size: ${rootSize}px; }`,
    });
    for (const width of [320, 375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(ticker).toHaveCSS(
        "padding-inline-start",
        `${Math.max(0.75 * rootSize, Math.min(0.02 * width, 2 * rootSize))}px`,
      );
      await expect(ticker).toHaveCSS(
        "padding-block-start",
        `${Math.max(0.5 * rootSize, Math.min(0.01 * width, rootSize))}px`,
      );
      await expect(info).toHaveCSS("inline-size", `${1.5 * rootSize}px`);
      await expect(info).toHaveCSS("block-size", `${1.5 * rootSize}px`);
      await expect(info).toHaveCSS("font-size", `${rootSize}px`);
      await expect(totals).toHaveCSS(
        "gap",
        `${Math.max(0.5 * rootSize, Math.min(0.02 * width, 2 * rootSize))}px`,
      );
      await expect(totals).toHaveCSS(
        "font-size",
        `${Math.max(16, 0.85 * rootSize)}px`,
      );
      await expect(badge).toHaveCSS("block-size", "30px");
      const geometry = await digits.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontSize: Number.parseFloat(style.fontSize),
          gap: Number.parseFloat(style.columnGap),
          width: element.getBoundingClientRect().width,
          cells: Array.from(element.children, (cell) => {
            const bounds = cell.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(cell.firstElementChild!);
            const glyph = range.getBoundingClientRect();
            return {
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
              glyphCenter: glyph.left + glyph.width / 2,
            };
          }),
        };
      });
      const [digit, separator] = geometry.cells;
      expect(digit!.width).toBeCloseTo(0.65 * geometry.fontSize, 1);
      expect(separator!.width).toBeCloseTo(0.32 * geometry.fontSize, 1);
      expect(separator!.top).toBeCloseTo(digit!.top, 1);
      expect(separator!.left - digit!.left - digit!.width).toBeCloseTo(
        geometry.gap,
        1,
      );
      expect(geometry.width).toBeCloseTo(
        digit!.width + separator!.width + geometry.gap,
        1,
      );
      for (const cell of geometry.cells) {
        expect(cell.glyphCenter).toBeCloseTo(cell.left + cell.width / 2, 1);
      }
    }
    await rootStyle.evaluate((element) => element.remove());
  }
  await info.focus();
  await page.keyboard.press("Tab");
  await expect(badgeLink).toBeFocused();
  await expect(badgeLink).toHaveCSS("outline-width", "2px");
  await expect(badgeLink).toHaveCSS("outline-offset", "3px");
  await page.keyboard.press("Shift+Tab");
  await expect(info).toBeFocused();
  await expect(info).toHaveCSS("outline-width", "2px");
  await expect(info).toHaveCSS("outline-offset", "3px");
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addStyleTag({
    content: `
      :root {
        --global-space-fixed-6: 4rem;
        --global-border-width-1: 3px;
        --global-border-width-2: 4px;
        --global-focus-outline-offset: 5px;
        --global-font-size-1: 1.25em;
      }
      .github-badges { --github-badges-image-height: 36px; }
      .number-ticker {
        --number-ticker-font-size-base: 2rem;
        --number-ticker-label-line-height: 1.5;
        --number-ticker-digit-width: 0.75em;
        --number-ticker-separator-width: 0.5em;
        --number-ticker-digit-gap: 0.1em;
      }
    `,
  });
  await expect(ticker).toHaveCSS("padding-inline-start", "16px");
  await expect(ticker).toHaveCSS("border-top-width", "3px");
  await expect(info).toHaveCSS("inline-size", "32px");
  await expect(info).toHaveCSS("block-size", "32px");
  await expect(info).toHaveCSS("font-size", "32px");
  await expect(info).toHaveCSS("outline-width", "4px");
  await expect(info).toHaveCSS("outline-offset", "5px");
  await expect(totals).toHaveCSS("font-size", "20px");
  expect(
    await totals.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).gap),
    ),
  ).toBeCloseTo(32 / 3, 3);
  await expect(header.locator(".number-ticker__label")).toHaveCSS(
    "min-block-size",
    "72px",
  );
  await expect(ticker.locator(".number-ticker__digits")).toHaveCSS(
    "gap",
    "2.4px",
  );
  await expect(ticker.locator(".number-ticker__cell").first()).toHaveCSS(
    "inline-size",
    "18px",
  );
  await expect(ticker.locator(".number-ticker__cell--separator")).toHaveCSS(
    "inline-size",
    "12px",
  );
  await expect(badge).toHaveCSS("block-size", "36px");
  await page.keyboard.press("Tab");
  await expect(badgeLink).toBeFocused();
  await expect(badgeLink).toHaveCSS("outline-width", "4px");
  await expect(badgeLink).toHaveCSS("outline-offset", "5px");
  await header.evaluate((element) =>
    element.classList.remove("number-ticker__header--with-info"),
  );
  await expect(header).toHaveCSS("grid-template-areas", '"label"');
});

test("Shared ticker needs label, number and rate and follows the supplied average", async ({
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

test("Offscreen tickers wait for entry, catch up once and disconnect on unmount", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const fixture = await mountTicker(page, { offscreen: true });
  const digits = page.locator(".number-ticker__digits");
  expect(await fixture.evaluate(({ observers }) => observers.size)).toBe(1);
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(0);
  await page.clock.runFor(60_000);
  await expect(digits).toHaveText("1,000");
  await moveTicker(page, false);
  await page.clock.runFor(500);
  await expect(digits).toHaveText("1,120");
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(1);
  await page.getByRole("button", { name: "Unmount" }).click();
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(0);
  expect(await fixture.evaluate(({ observers }) => observers.size)).toBe(0);
});

test("Leaving the viewport clears the timer and tab events cannot restart it offscreen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const fixture = await mountTicker(page);
  const digits = page.locator(".number-ticker__digits");
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(1);
  await moveTicker(page, true);
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(0);
  await page.clock.runFor(60_000);
  await expect(digits).toHaveText("1,000");
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(0);
  await moveTicker(page, false);
  await page.clock.runFor(500);
  await expect(digits).toHaveText("1,120");
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(1);
});

test("Entering the viewport cannot bypass a hidden tab or reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const fixture = await mountTicker(page, { offscreen: true });
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await moveTicker(page, false);
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(0);
  await changeReducedMotion(page, "reduce");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await moveTicker(page, true);
  await moveTicker(page, false);
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(0);
  await page.clock.runFor(5000);
  await expect(page.locator(".number-ticker__digits")).toHaveText("1,000");
  await changeReducedMotion(page, "no-preference");
  expect(await fixture.evaluate(({ intervals }) => intervals.size)).toBe(1);
  await page.clock.runFor(1500);
  await expect(page.locator(".number-ticker__digits")).toHaveText("1,002");
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
