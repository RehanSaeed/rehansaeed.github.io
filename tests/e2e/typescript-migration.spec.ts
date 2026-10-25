import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { encode, decode } from "../../app/framework/obfuscate";
import { nextUrl, previousUrl } from "../../app/framework/paging";
import { queryString } from "../../app/utils/query";

test("Email obfuscation retains its existing hexadecimal format", () => {
  expect(encode("a@b.co", 170)).toBe("aacbeac884c9c5");
  expect(decode("aacbeac884c9c5")).toBe("a@b.co");
  expect(decode(encode("reader@example.com", 170))).toBe("reader@example.com");
});

test("Pagination keeps the homepage URL and omits unavailable neighbours", () => {
  const first = {
    currentPage: 1,
    totalPages: 3,
    hasPreviousPage: false,
    hasNextPage: true,
  };
  expect(previousUrl(first)).toBeUndefined();
  expect(nextUrl(first)).toBe("/2/");
  const second = { ...first, currentPage: 2, hasPreviousPage: true };
  expect(previousUrl(second)).toBe("/");
  expect(previousUrl(second, "https://rehansaeed.com")).toBe(
    "https://rehansaeed.com/",
  );
  expect(nextUrl(second, "https://rehansaeed.com")).toBe(
    "https://rehansaeed.com/3/",
  );
  expect(
    nextUrl({ ...second, currentPage: 3, hasNextPage: false }),
  ).toBeUndefined();
});

test("Streaming query values preserve empty, missing and repeated parameters", () => {
  expect(queryString(undefined)).toBeUndefined();
  expect(queryString(null)).toBeUndefined();
  expect(queryString("")).toBe("");
  expect(queryString("3.5")).toBe("3.5");
  expect(queryString(["10", "20"])).toBe("10,20");
});

test("Node can parse every TypeScript utility without a transpiler", () => {
  const scripts = readdirSync("scripts", { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".mts"));
  expect(scripts.length).toBeGreaterThan(0);
  for (const file of scripts) {
    expect(() =>
      execFileSync(process.execPath, ["--check", join("scripts", file)], {
        stdio: "pipe",
      }),
    ).not.toThrow();
  }
});

test("Streaming tools retain the empty layout, query settings and input events", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/streaming/border/?hue1=120&hue2=240&border-width=12&width=640&height=360",
  );
  await expect(page.locator("main#empty .border")).toBeVisible();
  await expect(page.locator(".border")).toHaveCSS("--hue1", "120");
  await expect(page.locator(".border")).toHaveCSS("--hue2", "240");
  await expect(page.locator(".border")).toHaveCSS("--border-width", "12px");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, follow",
  );

  await page.goto(
    "/streaming/thumbnail/?title=TypeScript&subtitle=Migration&title-font-size=2&background=dark",
  );
  await expect(page.locator("main#empty .thumbnail")).toBeVisible();
  await expect(page.locator(".thumbnail-title__title")).toHaveText(
    "TypeScript",
  );
  await expect(page.locator(".thumbnail-title__subtitle")).toHaveText(
    "Migration",
  );
  await expect(page.locator(".thumbnail")).toHaveClass(
    /thumbnail--background-dark/,
  );
  await page.locator(".thumbnail-options__input").fill("light");
  await expect(page.locator(".thumbnail")).toHaveClass(
    /thumbnail--background-light/,
  );
  expect(errors).toEqual([]);
});
