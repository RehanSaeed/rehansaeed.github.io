import { expect, test } from "./fixtures";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

test("Uses pretty wrapping for prose only when supported", async ({ page }) => {
  await page.goto(postPath);
  const paragraph = page.locator(".prose-paragraph").nth(1);
  const supportsPrettyWrapping = await page.evaluate(() =>
    CSS.supports("text-wrap", "pretty"),
  );
  await expect(paragraph).toHaveCSS(
    "text-wrap-style",
    supportsPrettyWrapping ? "pretty" : "auto",
  );
});
