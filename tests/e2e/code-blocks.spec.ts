import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { prerenderCodeBlocks } from "../../modules/blog-content/fields";
import { remarkContainers } from "../../modules/blog-content/markdown";

const path = "/cheat-sheet/";

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

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
  await expect(toolbar.locator(".button--bordered")).toHaveCount(2);
  await block.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(toolbar).toHaveCSS("opacity", "0");
  const before = await block.boundingBox();
  await block.hover();
  await expect(toolbar).toHaveCSS("opacity", "1");
  const after = await block.boundingBox();
  expect(after!.width).toBe(before!.width);
  expect(after!.height).toBe(before!.height);
  await page.mouse.move(0, 0);
  await expect(toolbar).toHaveCSS("opacity", "0");
  await block.hover();
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
  const tip = page.getByRole("tooltip", { name: "Copy code", exact: true });
  await expect(tip).toBeVisible();
  await expect(tip).toHaveClass("tooltip");
  await expect(tip.locator(".tooltip__arrow")).toBeVisible();
  expect(
    await tip.evaluate((element) => element.matches(":popover-open")),
  ).toBe(true);
  await expect(copy).toHaveAttribute(
    "aria-describedby",
    (await tip.getAttribute("id"))!,
  );
  await copy.focus();
  await page.keyboard.press("Escape");
  await expect(tip).toBeHidden();
  await expect(copy).not.toHaveAttribute("aria-describedby");
  await wrap.focus();
  await page.mouse.move(0, 0);
  await expect(toolbar).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("tooltip", { name: "Wrap lines", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await wrap.hover();
  await expect(
    page.getByRole("tooltip", { name: "Unwrap lines", exact: true }),
  ).toBeVisible();
});

test("Single-line controls are vertically centred without moving multi-line controls", async ({
  page,
}) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const single = page
    .locator(".code-block")
    .filter({ hasText: "// No Language" });
  const multi = page.locator(".code-block").filter({ hasText: "Wrapped code" });
  for (const width of [1000, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await single.hover();
    await expect(
      single.getByRole("button", { name: "Copy code", exact: true }),
    ).toBeVisible();
    const position = await single.evaluate((element) => {
      const pre = element.querySelector("pre")!.getBoundingClientRect();
      const toolbar = element
        .querySelector(".code-block__toolbar")!
        .getBoundingClientRect();
      return {
        offset: toolbar.top + toolbar.height / 2 - pre.top - pre.height / 2,
        right: pre.right - toolbar.right,
      };
    });
    expect(Math.abs(position.offset)).toBeLessThanOrEqual(1);
    expect(position.right).toBeGreaterThanOrEqual(0);
    expect(position.right).toBeLessThan(8);
    await multi.hover();
    const top = await multi.evaluate((element) => {
      const pre = element.querySelector("pre")!.getBoundingClientRect();
      return (
        element.querySelector(".code-block__toolbar")!.getBoundingClientRect()
          .top - pre.top
      );
    });
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(16);
  }
});

test("Single-line controls stay aligned with the code above a horizontal scrollbar", async ({
  page,
  browserName,
}) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({
    content: `
      pre::-webkit-scrollbar { height: 24px; }
      pre::-webkit-scrollbar-thumb { background: grey; }
    `,
  });
  const block = page.locator(".code-block").filter({
    hasText: "docker image build --tag foo:1.0.0",
  });
  for (const width of [1000, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await block.hover();
    await expect(
      block.getByRole("button", { name: "Copy code", exact: true }),
    ).toBeVisible();
    const position = await block.evaluate((element) => {
      const pre = element.querySelector("pre")!;
      const bounds = pre.getBoundingClientRect();
      const style = getComputedStyle(pre);
      const toolbar = element
        .querySelector(".code-block__toolbar")!
        .getBoundingClientRect();
      const border =
        parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      return {
        overflow: pre.scrollWidth - pre.clientWidth,
        scrollbar: pre.offsetHeight - pre.clientHeight - border,
        offset:
          toolbar.top +
          toolbar.height / 2 -
          (bounds.top +
            parseFloat(style.borderTopWidth) +
            parseFloat(style.paddingTop) +
            parseFloat(style.lineHeight) / 2),
        bottom: bounds.top + pre.clientTop + pre.clientHeight - toolbar.bottom,
      };
    });
    expect(position.overflow).toBeGreaterThan(0);
    if (browserName === "chromium")
      expect(position.scrollbar).toBeGreaterThan(0);
    expect(Math.abs(position.offset)).toBeLessThanOrEqual(1);
    expect(position.bottom).toBeGreaterThanOrEqual(0);
  }
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

test("The cheat sheet documents accessible Bash/PowerShell tabs and copies only the selected code", async ({
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
  await expect(group.getByRole("tab")).toHaveCount(2);
  await expect(group).toHaveClass(/\bcode-block--tabs-editor-wide\b/);
  await expect(
    page.getByRole("heading", { name: "Alternative Code Tabs", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Code alternatives" }),
  ).toHaveCount(1);
  await expect(page.getByRole("tab", { name: "npm", exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("tab", { name: "pnpm", exact: true }),
  ).toHaveCount(0);
  await expect(bash).toHaveAttribute("aria-selected", "true");
  await expect(bash).toHaveJSProperty("tagName", "BUTTON");
  await expect(group.getByRole("tablist")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );
  await expect(bash).toHaveAttribute("tabindex", "0");
  await expect(powershell).toHaveAttribute("tabindex", "-1");
  const tabEdge = await group.evaluate((element) => {
    const tabs = element
      .querySelector('[role="tablist"]')!
      .getBoundingClientRect();
    const code = element
      .querySelector('[role="tabpanel"]:not([hidden]) pre')!
      .getBoundingClientRect();
    return {
      gap: code.top - tabs.bottom,
      left: code.left - tabs.left,
      right: code.right - tabs.right,
    };
  });
  expect(Math.abs(tabEdge.gap)).toBeLessThanOrEqual(1);
  expect(Math.abs(tabEdge.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(tabEdge.right)).toBeLessThanOrEqual(1);
  const widths = await group.getByRole("tablist").evaluate((element) => {
    const tabs = [...element.querySelectorAll('[role="tab"]')].map((tab) =>
      tab.getBoundingClientRect(),
    );
    return {
      available: element.clientWidth,
      filled: tabs[1]!.right - tabs[0]!.left,
      first: tabs[0]!.width,
      last: tabs[1]!.width,
    };
  });
  expect(Math.abs(widths.filled - widths.available)).toBeLessThanOrEqual(1);
  expect(Math.abs(widths.first - widths.last)).toBeLessThanOrEqual(1);
  const corner = await group
    .getByRole("tablist")
    .evaluate((element) =>
      parseFloat(getComputedStyle(element).borderTopRightRadius),
    );
  expect(corner).toBeGreaterThan(0);
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
  await expect(panel.locator("pre")).toHaveClass(/\bshiki\b/);
  const command = panel.locator("code .line > span").first();
  const string = panel.locator("code .line > span").last();
  await expect(command).toHaveCSS("color", "rgb(102, 217, 239)");
  await expect(string).toHaveCSS("color", "rgb(230, 219, 116)");
  await expect(panel.locator("pre")).toHaveCSS(
    "background-color",
    "rgb(1, 36, 86)",
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
    for (const text of ["printf", 'Write-Output "Hello']) {
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
        {
          language: "bash",
          filename: "Bash",
          className: ["language-bash", "shiki"],
          code: "echo <ok>",
        },
        ["code", {}, ["span", { class: "line" }, "echo <ok>"]],
      ],
      [
        "pre",
        {
          language: "powershell",
          filename: "PowerShell",
          class: "language-powershell shiki",
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
            class: "language-bash shiki",
            html: '<span class="line">echo &lt;ok&gt;</span>',
          },
          {
            language: "powershell",
            filename: "PowerShell",
            class: "language-powershell shiki",
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
