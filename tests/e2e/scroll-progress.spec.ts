import { expect, test } from "./fixtures";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

test("Tracks reading progress with the native timeline or fallback", async ({
  page,
}) => {
  await page.goto(postPath);
  const indicator = page.locator(".scroll-indicator");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect
    .poll(() =>
      indicator.evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeLessThan(1);

  await page.evaluate(() => {
    const scrollRange =
      document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: scrollRange * 0.5, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() =>
      indicator.evaluate(
        (element) => element.getBoundingClientRect().width / window.innerWidth,
      ),
    )
    .toBeGreaterThan(0.45);
  const progress = await indicator.evaluate(
    (element) => element.getBoundingClientRect().width / window.innerWidth,
  );
  expect(progress).toBeLessThan(0.55);
});

test("Keeps the JavaScript progress fallback when timelines are unsupported", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const nativeSupports = CSS.supports.bind(CSS);
    Object.defineProperty(CSS, "supports", {
      configurable: true,
      value: (property: string, value: string) =>
        (property !== "animation-timeline" || value !== "scroll(root block)") &&
        nativeSupports(property, value),
    });
  });
  await page.goto(postPath);
  expect(
    await page.evaluate(() =>
      CSS.supports("animation-timeline", "scroll(root block)"),
    ),
  ).toBe(false);
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await page.evaluate(() => {
    const scrollRange =
      document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: scrollRange * 0.5, behavior: "instant" });
  });
  await expect
    .poll(() =>
      page.locator("#app").evaluate((element) => {
        if (!(element instanceof HTMLElement)) {
          throw new Error("The app root is not an HTML element.");
        }
        return Number.parseFloat(element.style.getPropertyValue("--scroll"));
      }),
    )
    .toBeGreaterThan(0.45);
});
