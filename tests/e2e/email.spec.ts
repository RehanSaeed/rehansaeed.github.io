import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { test as unitTest } from "@playwright/test";
import { decode } from "../../app/framework/obfuscate";
import { delayClientScripts, expect, test } from "./fixtures";

async function contactAddress() {
  const site = JSON.parse(
    await readFile(join(process.cwd(), "site.json"), "utf8"),
  );
  const address = decode(site.author.email);
  expect(site.author.email === address).toBe(false);
  expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)).toBe(true);
  return address;
}

unitTest(
  "Generated pages, payloads and scripts never expose the decoded contact address",
  async () => {
    const address = (await contactAddress()).toLowerCase();
    const encoded = encodeURIComponent(address).toLowerCase();
    const root = join(process.cwd(), "dist");
    const files = (await readdir(root, { recursive: true })).filter((file) =>
      /\.(?:html|json|xml|txt|md|js)$/.test(file),
    );
    expect(
      files.filter((file) => file.endsWith(".html")).length,
    ).toBeGreaterThanOrEqual(408);
    for (const file of files) {
      const body = (await readFile(join(root, file), "utf8")).toLowerCase();
      expect(
        body.includes(address) || body.includes(encoded),
        `${file}: decoded contact address must remain private until activation`,
      ).toBe(false);
    }
  },
);

test("Contact address stays hidden before and after hydration", async ({
  page,
}) => {
  const address = await contactAddress();
  const scripts = await delayClientScripts(page);
  try {
    await page.goto("/about/", { waitUntil: "commit" });
    const email = page.locator('.social [aria-label="Email"]');
    await expect(email.first()).toBeAttached();
    expect(
      await email.evaluateAll((links) =>
        links.every((link) => link.getAttribute("href") === "#"),
      ),
    ).toBe(true);
    scripts.resume();
    await expect(
      page.getByRole("button", { name: "Toggle dark/light" }),
    ).toBeEnabled();
    expect(
      await email.evaluateAll((links) =>
        links.every((link) => link.getAttribute("href") === "#"),
      ),
    ).toBe(true);
    await email.first().hover();
    await email.first().focus();
    expect((await page.content()).toLowerCase()).not.toContain(
      address.toLowerCase(),
    );
  } finally {
    await scripts.dispose();
  }
});

for (const activation of ["click", "Enter"] as const) {
  test(`Contact mailto is created only on ${activation}`, async ({ page }) => {
    const address = await contactAddress();
    await page.goto("/about/");
    await expect(
      page.getByRole("button", { name: "Toggle dark/light" }),
    ).toBeEnabled();
    const email = page.locator('.social [aria-label="Email"]');
    await page.evaluate(() => {
      document.addEventListener("click", (event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('.social [aria-label="Email"]')
        ) {
          // Avoid opening an external mail client while checking the real link.
          event.preventDefault();
        }
      });
    });
    const count = await email.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index++) {
      const link = email.nth(index);
      await expect(link).toHaveAttribute("href", "#");
      if (activation === "click") {
        await link.click();
      } else {
        await link.focus();
        await link.press("Enter");
      }
      const href = await link.getAttribute("href");
      const url = new URL(href!);
      expect(url.protocol).toBe("mailto:");
      expect(decodeURIComponent(url.pathname)).toBe(address);
      expect(url.searchParams.get("body")).toContain("raise a GitHub issue");
      await expect(page).toHaveURL(/\/about\/$/);
    }
  });
}
