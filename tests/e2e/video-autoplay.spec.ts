import { expect, test, type Locator, type Page } from "@playwright/test";

// The shared config emulates reduced motion, which disables autoplay. The
// reduced-motion test below opts back in explicitly.
test.use({ reducedMotion: "no-preference" });
const videoLabel =
  "ThreeUI demonstration of interactive Three.js components and landing pages";

const openArticle = async (page: Page, baseURL: string | undefined) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) =>
      route.fulfill({
        status: route.request().isNavigationRequest() ? 200 : 204,
        contentType: "text/html",
      }),
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ai-learnings-from-upgrading-my-blog/", {
    waitUntil: "load",
  });
  return page.getByLabel(videoLabel, { exact: true });
};

const isPlaying = (video: Locator) =>
  video.evaluate(
    (element) =>
      element instanceof HTMLVideoElement && !element.paused && !element.ended,
  );

const scrollToTop = (page: Page) =>
  page.evaluate(() => {
    globalThis.scrollTo({ top: 0, behavior: "instant" });
  });

/**
 * Waits until the page has processed the video's current visibility, then
 * reports that visibility and whether the video is playing. The page's own
 * observer was registered first, so its callback has already run when this
 * observer reports.
 */
const visibilityAndPlayback = (video: Locator) =>
  video.evaluate(
    (element) =>
      new Promise<{
        visibility: "full" | "partial" | "none";
        playing: boolean;
      }>((resolve) => {
        const observer = new IntersectionObserver(
          (entries) => {
            const entry = entries.at(-1)!;
            observer.disconnect();
            const visibility = entry.isIntersecting
              ? entry.intersectionRatio >= 0.99
                ? "full"
                : "partial"
              : "none";
            requestAnimationFrame(() => {
              resolve({
                visibility,
                playing:
                  element instanceof HTMLVideoElement &&
                  !element.paused &&
                  !element.ended,
              });
            });
          },
          { threshold: [0, 0.99, 1] },
        );
        observer.observe(element);
      }),
  );

test("The article video autoplays muted only while fully in view", async ({
  page,
  baseURL,
}) => {
  const video = await openArticle(page, baseURL);
  expect(await isPlaying(video)).toBe(false);

  await video.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    globalThis.scrollBy({
      top: bounds.top - globalThis.innerHeight + bounds.height / 2,
      behavior: "instant",
    });
  });
  expect(await visibilityAndPlayback(video)).toEqual({
    visibility: "partial",
    playing: false,
  });

  await video.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await expect.poll(() => isPlaying(video)).toBe(true);
  await expect
    .poll(() =>
      video.evaluate(
        (element) => element instanceof HTMLVideoElement && element.muted,
      ),
    )
    .toBe(true);
  await expect(video).not.toHaveAttribute("controls");
  await expect(
    page.getByRole("button", { name: "Pause video", exact: true }),
  ).toBeAttached();
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.currentTime : 0,
      ),
    )
    .toBeGreaterThan(0);

  await scrollToTop(page);
  await expect.poll(() => isPlaying(video)).toBe(false);

  await video.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await expect.poll(() => isPlaying(video)).toBe(true);
});

test("The article video stays paused after the user pauses it", async ({
  page,
  baseURL,
}) => {
  const video = await openArticle(page, baseURL);
  await video.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await expect.poll(() => isPlaying(video)).toBe(true);

  await video.evaluate((element) => {
    if (element instanceof HTMLVideoElement) {
      element.pause();
    }
  });
  await scrollToTop(page);
  expect(await visibilityAndPlayback(video)).toEqual({
    visibility: "none",
    playing: false,
  });
  await video.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  expect(await visibilityAndPlayback(video)).toEqual({
    visibility: "full",
    playing: false,
  });

  await video.evaluate((element) =>
    element instanceof HTMLVideoElement ? element.play() : undefined,
  );
  await expect.poll(() => isPlaying(video)).toBe(true);
});

test("The article video does not autoplay with reduced motion", async ({
  page,
  baseURL,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const video = await openArticle(page, baseURL);
  await video.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.readyState : 0,
      ),
    )
    .toBeGreaterThanOrEqual(1);
  expect(await visibilityAndPlayback(video)).toEqual({
    visibility: "full",
    playing: false,
  });
});
