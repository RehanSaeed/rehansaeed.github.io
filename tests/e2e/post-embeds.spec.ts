import { expect, test } from "@playwright/test";

test("The cheat sheet renders its local video example as a native player", async ({
  page,
  baseURL,
}) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) =>
      route.fulfill({
        status: route.request().isNavigationRequest() ? 200 : 204,
        contentType: "text/html",
      }),
  );
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
  const video = page.getByLabel(
    "ThreeUI demonstration of interactive Three.js components and landing pages",
  );
  await expect(page.locator(".post__content video")).toHaveCount(1);
  await expect(video).toHaveAttribute(
    "src",
    "/videos/threeui-demonstration-960x720.mp4",
  );
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("playsinline", "");
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect(video).not.toHaveAttribute("autoplay");
  await expect(
    page.getByRole("link", { name: "Original source on X", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://x.com/MengTo/status/2090817187900780961/video/1",
  );

  for (const width of [1280, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await video.scrollIntoViewIfNeeded();
    await expect(video).toBeVisible();
    const bounds = await video.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThan(0);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.width / bounds!.height).toBeCloseTo(4 / 3, 2);
  }
});

test("The article plays a self-hosted video without loading X's widget", async ({
  page,
  baseURL,
  request,
}) => {
  const externalRequests: string[] = [];
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => {
      externalRequests.push(route.request().url());
      return route.fulfill({
        status: route.request().isNavigationRequest() ? 200 : 204,
        contentType: "text/html",
      });
    },
  );
  await page.goto("/ai-learnings-from-upgrading-my-blog/", {
    waitUntil: "domcontentloaded",
  });
  const video = page.getByLabel(
    "ThreeUI demonstration of interactive Three.js components and landing pages",
  );
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute(
    "src",
    "/videos/threeui-demonstration-960x720.mp4",
  );
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("playsinline", "");
  await expect(video).not.toHaveAttribute("autoplay");
  await expect(page.locator(".post__content iframe")).toHaveCount(1);
  await expect(page.locator(".post__content iframe")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/PLMOVlZC4eU",
  );
  const response = await request.get(
    "/videos/threeui-demonstration-960x720.mp4",
  );
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("video/mp4");

  await video.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.readyState : 0,
      ),
    )
    .toBeGreaterThanOrEqual(1);
  const media = await video.evaluate(async (element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected a native video player.");
    }
    const pausedInitially = element.paused;
    element.muted = true;
    await element.play();
    return {
      pausedInitially,
      width: element.videoWidth,
      height: element.videoHeight,
      duration: element.duration,
    };
  });
  expect(media.pausedInitially).toBe(true);
  expect(media.width).toBe(960);
  expect(media.height).toBe(720);
  expect(media.duration).toBeGreaterThan(49);
  expect(media.duration).toBeLessThan(51);
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.readyState : 0,
      ),
    )
    .toBeGreaterThanOrEqual(2);
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.currentTime : 0,
      ),
    )
    .toBeGreaterThan(0);
  await video.evaluate((element) => {
    if (element instanceof HTMLVideoElement) {
      element.pause();
    }
  });

  for (const width of [1280, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await video.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.width / bounds!.height).toBeCloseTo(4 / 3, 2);
  }
  await expect(video.locator("a")).toHaveAttribute(
    "href",
    "https://x.com/MengTo/status/2090817187900780961/video/1",
  );
  const caption = page.locator(".post__content figure figcaption");
  await expect(caption).toHaveCSS("font-style", "italic");
  const captionSpacing = await caption.evaluate((element) => {
    const following = element.closest("figure")!.nextElementSibling!;
    return {
      actual:
        following.getBoundingClientRect().top -
        element.getBoundingClientRect().bottom,
      expected: Number.parseFloat(getComputedStyle(following).marginBlockEnd),
    };
  });
  expect(captionSpacing.expected).toBeGreaterThan(0);
  expect(captionSpacing.actual).toBeCloseTo(captionSpacing.expected, 0);
  await expect(caption.getByRole("link", { name: "Meng To" })).toHaveAttribute(
    "href",
    "https://mengto.com/",
  );
  await expect(
    caption.getByRole("link", { name: "Source on X" }),
  ).toHaveAttribute(
    "href",
    "https://x.com/MengTo/status/2090817187900780961/video/1",
  );
  await expect(
    page.locator(
      '.post__content > p a[href="https://x.com/MengTo/status/2090817187900780961/video/1"]',
    ),
  ).toHaveCount(0);
  expect(
    externalRequests.filter((url) =>
      /(?:platform\.twitter\.com|video\.twimg\.com)/.test(url),
    ),
  ).toEqual([]);
});
