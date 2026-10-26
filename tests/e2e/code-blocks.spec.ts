import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { prerenderCodeBlocks } from "../../modules/blog-content/fields";
import { remarkContainers } from "../../modules/blog-content/markdown";

const path = "/cheat-sheet/";

async function stubClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => {} },
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//,
    (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Video placeholder</title>",
      }),
  );
});

test("Icon controls overlay the top right, reveal on hover/focus and have dismissible tooltips", async ({
  page,
}) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const block = page.locator(".code-block").first();
  const toolbar = block.locator(".code-block__toolbar");
  const copy = block.getByRole("button", { name: "Copy code", exact: true });
  const wrap = block.getByRole("button", { name: "Wrap lines", exact: true });
  await expect(copy).toBeAttached();
  await block.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(toolbar).toHaveCSS("opacity", "0");
  const before = await block.boundingBox();
  await block.hover();
  await expect(toolbar).toHaveCSS("opacity", "1");
  const after = await block.boundingBox();
  expect(after!.width).toBe(before!.width);
  expect(after!.height).toBe(before!.height);
  const positions = await toolbar.evaluate((element) => {
    const code = element.parentElement!.getBoundingClientRect();
    const toolbar = element.getBoundingClientRect();
    return { top: toolbar.top - code.top, right: code.right - toolbar.right };
  });
  expect(positions.top).toBeGreaterThanOrEqual(0);
  expect(positions.top).toBeLessThan(16);
  expect(positions.right).toBeGreaterThanOrEqual(0);
  expect(positions.right).toBeLessThan(16);
  await expect(copy).toHaveText("");
  await expect(wrap).toHaveText("");
  await expect(copy.locator("svg")).toHaveCount(2);
  await expect(wrap.locator("svg")).toHaveCount(2);
  await copy.hover();
  const tip = block.getByRole("tooltip", { name: "Copy code", exact: true });
  await expect(tip).toBeVisible();
  await expect(copy).toHaveAttribute(
    "aria-describedby",
    (await tip.getAttribute("id"))!,
  );
  await copy.focus();
  await page.keyboard.press("Escape");
  await expect(tip).toBeHidden();
  await wrap.focus();
  await page.mouse.move(0, 0);
  await expect(toolbar).toHaveCSS("opacity", "1");
  await expect(
    block.getByRole("tooltip", { name: "Wrap lines", exact: true }),
  ).toBeVisible();
});

test("Copy and wrap icons animate in both directions and respect reduced motion", async ({
  page,
}) => {
  await stubClipboard(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const block = page.locator(".code-block").first();
  await block.hover();
  const wrap = block.getByRole("button", { name: "Wrap lines", exact: true });
  const copy = block.locator(".code-block__toolbar button").last();
  const icons = await block.locator(".code-block__icon").elementHandles();

  for (const button of [wrap, wrap, copy]) {
    const sample = await button.evaluate(async (element) => {
      if (!(element instanceof HTMLButtonElement))
        throw new Error("Expected a code control button.");
      element.click();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const animations = element.getAnimations({ subtree: true });
      for (const animation of animations) {
        animation.pause();
        animation.currentTime =
          Number(animation.effect!.getTiming().duration) / 2;
      }
      return {
        properties: animations
          .filter(
            (animation): animation is CSSTransition =>
              animation instanceof CSSTransition,
          )
          .map((animation) => animation.transitionProperty),
        opacities: [...element.querySelectorAll("svg")].map((icon) =>
          Number(getComputedStyle(icon).opacity),
        ),
      };
    });
    expect(sample.properties).toEqual(
      expect.arrayContaining(["opacity", "transform"]),
    );
    for (const opacity of sample.opacities) {
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    }
    await button.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true }))
        animation.finish();
    });
    await expect(button.locator("svg:visible")).toHaveCount(1);
    await expect(button.locator(".code-block__icon--active")).toHaveCSS(
      "opacity",
      "1",
    );
  }
  await expect(
    block.getByRole("button", { name: "Copied!", exact: true }),
  ).toBeVisible();
  await expect(copy).toHaveAttribute("aria-label", "Copy code");
  await expect(copy.locator("svg:visible")).toHaveCount(1);
  for (const icon of icons)
    expect(await icon.evaluate((element) => element.isConnected)).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await wrap.click();
  expect(
    await wrap.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  await copy.click();
  await expect(
    block.getByRole("button", { name: "Copied!", exact: true }),
  ).toBeVisible();
  expect(
    await block
      .getByRole("button", { name: "Copied!", exact: true })
      .evaluate((element) => element.getAnimations({ subtree: true }).length),
  ).toBe(0);
});

test.describe("Touch controls", () => {
  test.skip(
    ({ browserName }) => browserName === "firefox",
    "Firefox does not support touch emulation.",
  );
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("Controls remain discoverable without hover", async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const block = page.locator(".code-block").first();
    await expect(block.locator(".code-block__toolbar")).toHaveCSS(
      "opacity",
      "1",
    );
    const wrap = block.getByRole("button", { name: "Wrap lines", exact: true });
    expect((await wrap.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await wrap.tap();
    await expect(wrap).toHaveAttribute("aria-pressed", "true");
  });
});

test("Copies source exactly, announces success, resets and reports clipboard errors", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("copied-code", text);
        },
      },
      configurable: true,
    });
  });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const block = page
    .locator(".code-block")
    .filter({ has: page.locator("pre.line-numbers") })
    .first();
  await block.hover();
  const source = await block.locator("code").textContent();
  expect(source).toContain("\n");
  await block.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(
    block.getByRole("button", { name: "Copied!", exact: true }),
  ).toBeVisible();
  await expect(block.getByRole("status")).toHaveText(
    "Code copied to clipboard.",
  );
  expect(await page.evaluate(() => sessionStorage.getItem("copied-code"))).toBe(
    source,
  );
  await expect(
    block.getByRole("button", { name: "Copy code", exact: true }),
  ).toBeVisible();
  await expect(block.getByRole("status")).toBeEmpty();

  for (const available of [true, false]) {
    await page.evaluate((available) => {
      Object.defineProperty(navigator, "clipboard", {
        value: available
          ? {
              writeText: async () => {
                throw new DOMException("Denied", "NotAllowedError");
              },
            }
          : undefined,
        configurable: true,
      });
    }, available);
    await block.getByRole("button", { name: "Copy code", exact: true }).click();
    await expect(block.getByRole("status")).toHaveText(
      "Could not copy code. Select the code and copy it manually.",
    );
    await expect(
      block.getByRole("button", { name: "Copied!", exact: true }),
    ).toHaveCount(0);
  }
});

test("Alternatives have independent accessible tabs and copy only the selected code", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("copied-code", text);
        },
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/hydration|\[Vue warn\]/i.test(message.text()))
      errors.push(message.text());
  });
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(await response!.text()).toContain("shiki");
  const group = page
    .locator(".code-block")
    .filter({ has: page.getByRole("tab", { name: "Bash", exact: true }) });
  const bash = group.getByRole("tab", { name: "Bash", exact: true });
  const powershell = group.getByRole("tab", {
    name: "PowerShell",
    exact: true,
  });
  await expect(bash).toHaveAttribute("aria-selected", "true");
  await expect(group.getByRole("tabpanel")).toHaveCount(1);
  await bash.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(powershell).toBeFocused();
  await expect(powershell).toHaveAttribute("aria-selected", "true");
  const panel = group.getByRole("tabpanel");
  await expect(panel).toHaveAttribute(
    "id",
    (await powershell.getAttribute("aria-controls"))!,
  );
  await expect(panel).toHaveAttribute(
    "aria-labelledby",
    (await powershell.getAttribute("id"))!,
  );
  await expect(panel.locator("code")).toHaveText(
    'Write-Output "Hello <world> & friends"',
  );
  await group.getByRole("button", { name: "Copy code", exact: true }).click();
  expect(await page.evaluate(() => sessionStorage.getItem("copied-code"))).toBe(
    await panel.locator("code").textContent(),
  );
  await expect(group.getByRole("button", { name: "Copied!" })).toBeVisible();
  await bash.click();
  await expect(group.getByRole("status")).toBeEmpty();
  await bash.focus();
  await page.keyboard.press("End");
  await expect(powershell).toBeFocused();
  await page.keyboard.press("Home");
  await expect(bash).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(powershell).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(bash).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "npm", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const ids = await page
    .locator(".code-block [id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
  expect(errors).toEqual([]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`Wrapping fits a narrow viewport in ${colorScheme} mode without changing source or highlighting`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ colorScheme });
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const block = page
      .locator(".code-block")
      .filter({ hasText: "Wrapped code" });
    await block.hover();
    const code = block.locator("code");
    const source = await code.textContent();
    const markup = await code.innerHTML();
    const wrap = block.getByRole("button", { name: "Wrap lines" });
    await expect(wrap).toHaveAttribute("aria-pressed", "true");
    await expect(code).toHaveCSS("white-space", "pre-wrap");
    const pre = block.locator("pre");
    expect(
      await pre.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
    await wrap.click();
    await expect(code).toHaveCSS("white-space", "pre");
    expect(
      await pre.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeGreaterThan(100);
    await wrap.click();
    expect(await code.textContent()).toBe(source);
    expect(await code.innerHTML()).toBe(markup);
    expect(await code.locator("span span").count()).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(375);

    const numbered = page
      .locator(".code-block")
      .filter({ has: page.locator(".has-highlighted-lines pre.line-numbers") });
    await numbered.hover();
    await numbered.getByRole("button", { name: "Wrap lines" }).click();
    await expect(numbered.locator("code")).toHaveCSS("white-space", "pre-wrap");
    await expect(numbered.locator(".line.highlight").first()).toBeVisible();
    await expect(numbered.locator(".line.highlight").first()).toHaveCSS(
      "display",
      "inline",
    );
    expect(
      await numbered
        .locator(".line")
        .first()
        .evaluate((node) => getComputedStyle(node, "::before").content),
    ).toBe("counter(linenumber)");
  });
}

test.describe("Without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("All code alternatives remain readable and controls are hidden", async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Copy code", exact: true }),
    ).toHaveCount(0);
    for (const text of [
      "printf",
      'Write-Output "Hello',
      "npm install nuxt",
      "pnpm add nuxt",
    ]) {
      await expect(
        page.locator("pre").filter({ hasText: text }).last(),
      ).toBeVisible();
    }
  });
});

test("Build-time groups preserve highlighted HTML without raw source duplication", () => {
  const nodes: Parameters<typeof prerenderCodeBlocks>[0] = [
    [
      "code-group",
      {},
      [
        "pre",
        { language: "bash", filename: "Bash", code: "echo <ok>" },
        ["code", {}, ["span", { class: "line" }, "echo <ok>"]],
      ],
      [
        "pre",
        {
          language: "powershell",
          filename: "PowerShell",
          code: "Write-Output ok",
        },
        ["code", {}, "Write-Output ok"],
      ],
    ],
  ];
  prerenderCodeBlocks(nodes);
  expect(nodes).toEqual([
    [
      "pre",
      {
        alternatives: [
          {
            language: "bash",
            filename: "Bash",
            html: '<span class="line">echo &lt;ok&gt;</span>',
          },
          {
            language: "powershell",
            filename: "PowerShell",
            html: "Write-Output ok",
          },
        ],
      },
    ],
  ]);
});

test("Invalid code groups fail explicitly", () => {
  const paragraph = (value: string) => ({
    type: "paragraph",
    children: [{ type: "text", value }],
  });
  for (const children of [
    [
      paragraph("::: code-group"),
      { type: "code", lang: "bash", value: "echo ok" },
      paragraph(":::"),
    ],
    [paragraph("::: code-group"), paragraph("Not code"), paragraph(":::")],
    [
      paragraph("::: code-group"),
      { type: "code", lang: "bash", value: "echo ok" },
    ],
  ]) {
    expect(() => remarkContainers()({ type: "root", children })).toThrow(
      /code-group/,
    );
  }
});
