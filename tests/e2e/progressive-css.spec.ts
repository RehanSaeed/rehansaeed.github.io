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
      page.evaluate(() =>
        Number.parseFloat(
          document.documentElement.style.getPropertyValue("--scroll"),
        ),
      ),
    )
    .toBeGreaterThan(0.45);
});

test("Hides wide sticky navigation on downward scroll when supported", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(postPath);
  const navigation = page.locator(".navigation");
  await page.locator("body").evaluate((body) => {
    const probe = document.createElement("div");
    probe.className = "scroll-state-probe";
    body.append(probe);
  });
  await page.addStyleTag({
    content: `
      .scroll-state-probe {
        --scroll-state-probe: false;
      }

      @container page-scroll scroll-state(scrolled: bottom) {
        .scroll-state-probe {
          --scroll-state-probe: true;
        }
      }
    `,
  });

  await page.mouse.move(1500, 800);
  await page.mouse.wheel(0, 500);
  const navBottomRelativeToScrollState = async () => {
    const bounds = await navigation.boundingBox();
    const scrollStateProbe = await page
      .locator(".scroll-state-probe")
      .evaluate((element) =>
        getComputedStyle(element)
          .getPropertyValue("--scroll-state-probe")
          .trim(),
      );
    const expectedScrollDirection = 1 - 2 * Number(scrollStateProbe === "true");
    return ((bounds?.y ?? 0) + (bounds?.height ?? 0)) * expectedScrollDirection;
  };
  await expect.poll(navBottomRelativeToScrollState).toBeGreaterThanOrEqual(0);

  await page.mouse.wheel(0, -1000);
  await expect
    .poll(async () => (await navigation.boundingBox())?.y)
    .toBeGreaterThanOrEqual(0);
});

test("Keeps wide sticky navigation visible with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(postPath);
  const navigation = page.locator(".navigation");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top: 500, behavior: "instant" });
  });
  await expect.poll(async () => (await navigation.boundingBox())?.y).toBe(0);
});
