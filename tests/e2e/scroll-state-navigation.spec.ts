import { expect, test } from "./fixtures";

const postPath = "/on-the-etiquette-of-pull-request-comments/";

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
