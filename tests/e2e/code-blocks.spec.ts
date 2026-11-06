import { expect, test } from "./fixtures";
import { prerenderCodeBlocks } from "../../modules/blog-content/fields";
import { remarkContainers } from "../../modules/blog-content/markdown";

const path = "/cheat-sheet/";

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

test("The cheat sheet documents accessible Bash/PowerShell tabs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/hydration|\[Vue warn\]/i.test(message.text())) {
      errors.push(message.text());
    }
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
    page.getByRole("heading", { level: 2, name: "Alternative Code Tabs" }),
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
      Number.parseFloat(getComputedStyle(element).borderTopRightRadius),
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
  await bash.click();
  await expect(bash).toHaveAttribute("aria-selected", "true");
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

test.describe("Without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("All code alternatives remain readable and tabs are hidden", async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab")).toHaveCount(0);
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
    expect(() => {
      remarkContainers()({ type: "root", children });
    }).toThrow(/code-group/);
  }
});
