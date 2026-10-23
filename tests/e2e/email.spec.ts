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
        `${file}: decoded contact address must remain private before JavaScript runs`,
      ).toBe(false);
    }
  },
);

test("Contact mailto is created only after browser JavaScript runs", async ({
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
        links.every((link) => !link.hasAttribute("href")),
      ),
    ).toBe(true);
    scripts.resume();
    await expect
      .poll(() =>
        email.evaluateAll(
          (links) =>
            links.length > 0 &&
            links.every((link) =>
              link.getAttribute("href")?.startsWith("mailto:"),
            ),
        ),
      )
      .toBe(true);
    expect(
      await email.evaluateAll(
        (links, owner) =>
          links.every((link) => {
            const url = new URL(link.getAttribute("href")!);
            return (
              decodeURIComponent(url.pathname) === owner &&
              url.searchParams.get("body")?.includes("raise a GitHub issue")
            );
          }),
        address,
      ),
    ).toBe(true);
  } finally {
    await scripts.dispose();
  }
});
