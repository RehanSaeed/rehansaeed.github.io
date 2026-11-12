import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

const postPath =
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const mentionsApi = /^https:\/\/webmention\.io\/api\/mentions\?/;

const readMask = (skeleton: Locator) =>
  skeleton.evaluate((element: HTMLElement) => {
    const mask = element.style.maskImage;
    const encoded = /base64,([^'")]+)/.exec(mask)?.[1];
    if (!encoded) {
      throw new Error("The skeleton has no SVG mask");
    }
    const svg = new DOMParser().parseFromString(atob(encoded), "image/svg+xml");
    if (svg.querySelector("parsererror")) {
      throw new Error("The skeleton mask is not valid SVG");
    }
    const viewBox = svg.documentElement.getAttribute("viewBox")!.split(" ");
    return {
      mask,
      width: Number(viewBox[2]),
      height: Number(viewBox[3]),
      circles: svg.querySelectorAll("circle").length,
      rectangles: Array.from(svg.querySelectorAll("rect"), (rect) =>
        Number(rect.getAttribute("width")),
      ),
    };
  });

test("Intersection observes the slotted root, loads once and disconnects on navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      readonly targets = new Set<Element>();
      readonly configuredThresholds: IntersectionObserverInit["threshold"];

      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        super(callback, options);
        this.configuredThresholds = options?.threshold;
      }

      override observe(target: Element) {
        this.targets.add(target);
        if (target.matches(".webmentions")) {
          target.setAttribute("data-observed-root", target.tagName);
          target.setAttribute(
            "data-observer-thresholds",
            String(this.configuredThresholds),
          );
          target.setAttribute("data-observer-margin", this.rootMargin);
        }
        super.observe(target);
      }

      override disconnect() {
        if (
          Array.from(this.targets).some((target) =>
            target.matches(".webmentions"),
          )
        ) {
          const root = document.documentElement;
          root.dataset.mentionDisconnects = String(
            Number(root.dataset.mentionDisconnects ?? 0) + 1,
          );
        }
        super.disconnect();
      }
    };
  });
  let requests = 0;
  await page.route(mentionsApi, (route) => {
    requests++;
    return route.fulfill({ json: { links: [] } });
  });
  await page.goto(postPath);
  const mentions = page.locator(".webmentions");
  await expect(mentions).toHaveAttribute("data-observed-root", "SECTION");
  await expect(mentions).toHaveAttribute("data-observer-thresholds", "0,0.2");
  await expect(mentions).toHaveAttribute(
    "data-observer-margin",
    "0px 0px 0px 0px",
  );
  expect(requests).toBe(0);
  await mentions.scrollIntoViewIfNeeded();
  await expect(mentions).toHaveAttribute("aria-busy", "false");
  expect(requests).toBe(1);

  await page.locator(".post__header").scrollIntoViewIfNeeded();
  await mentions.scrollIntoViewIfNeeded();
  await expect(mentions).toHaveAttribute("aria-busy", "false");
  expect(requests).toBe(1);
  await page.locator('.navigation__item[href="/about/"]').click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator("html")).toHaveAttribute(
    "data-mention-disconnects",
    "1",
  );
});

test("Skeleton SVG masks follow slotted geometry as the viewport resizes", async ({
  page,
}) => {
  let resume!: () => void;
  const pending = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route(mentionsApi, async (route) => {
    await pending;
    await route.fulfill({ json: { links: [] } });
  });
  await page.goto(postPath);
  const mentions = page.locator(".webmentions");
  const faces = mentions.locator(".webmention-faces-skeleton").first();
  const replies = mentions.locator(".webmention-replies-skeleton");
  try {
    await mentions.scrollIntoViewIfNeeded();
    await expect(mentions).toHaveAttribute("aria-busy", "true");
    await expect(faces).toHaveAttribute("aria-busy", "true");
    await expect(faces).toHaveCSS("mask-image", /data:image\/svg\+xml;base64/);
    await expect
      .poll(async () => (await readMask(faces)).width)
      .toBeGreaterThan(0);
    await expect
      .poll(async () => (await readMask(replies)).width)
      .toBeGreaterThan(0);
    const initialFaces = await readMask(faces);
    const initialReplies = await readMask(replies);
    expect(initialFaces.circles).toBe(Math.floor(initialFaces.width / 40) - 1);
    expect(initialReplies.rectangles.slice(-2)).toEqual([
      Math.max(0, initialReplies.width - 75),
      Math.max(0, initialReplies.width - 75),
    ]);
    await expect(faces.locator("svg")).toHaveCount(0);

    await page.setViewportSize({ width: 640, height: 720 });
    await expect
      .poll(async () => (await readMask(faces)).width)
      .toBeLessThan(initialFaces.width);
    await expect
      .poll(async () => (await readMask(replies)).width)
      .toBeLessThan(initialReplies.width);
    const resizedFaces = await readMask(faces);
    const resizedReplies = await readMask(replies);
    expect(resizedFaces.mask).not.toBe(initialFaces.mask);
    expect(resizedFaces.circles).toBe(Math.floor(resizedFaces.width / 40) - 1);
    expect(resizedReplies.width).toBeLessThan(initialReplies.width);
    expect(resizedReplies.rectangles.slice(-2)).toEqual([
      Math.max(0, resizedReplies.width - 75),
      Math.max(0, resizedReplies.width - 75),
    ]);
    await expect(faces).toHaveCSS("mask-repeat", "no-repeat space");
  } finally {
    resume();
  }
  await expect(mentions).toHaveAttribute("aria-busy", "false");
  await expect(faces).toHaveCount(0);
});

test("Scroll updates the unwrapped layout root and reverses direction", async ({
  page,
}) => {
  await page.goto(postPath);
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled();
  const root = page.locator("#app");
  await expect(page.locator("#__nuxt > #app")).toHaveCount(1);
  await page.evaluate(() => {
    window.scrollTo({ top: 800, behavior: "instant" });
  });
  await expect(root).toHaveClass(/scroll-down/);
  const down = await root.evaluate((element: HTMLElement) => ({
    progress: Number(element.style.getPropertyValue("--scroll")),
    expected:
      window.scrollY / (document.body.offsetHeight - window.innerHeight),
  }));
  expect(down.progress).toBeGreaterThan(0);
  expect(down.progress).toBeCloseTo(down.expected, 5);
  await expect(root).not.toHaveClass(/scroll-up/);

  await page.evaluate(() => {
    window.scrollTo({ top: 200, behavior: "instant" });
  });
  await expect(root).toHaveClass(/scroll-up/);
  await expect(root).not.toHaveClass(/scroll-down/);
  const up = await root.evaluate((element: HTMLElement) =>
    Number(element.style.getPropertyValue("--scroll")),
  );
  expect(up).toBeLessThan(down.progress);
});

test("Batched scroll events keep the latest direction rather than reversing on a duplicate frame", async ({
  page,
}) => {
  await page.goto(postPath);
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled();
  const root = page.locator("#app");
  await page.evaluate(() => {
    window.scrollTo({ top: 800, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
  });
  await expect(root).toHaveClass(/scroll-down/);
  await expect(root).not.toHaveClass(/scroll-up/);
  const down = await root.evaluate((element: HTMLElement) =>
    Number(element.style.getPropertyValue("--scroll")),
  );
  await page.evaluate(() => {
    window.scrollTo({ top: 200, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
  });
  await expect(root).toHaveClass(/scroll-up/);
  await expect(root).not.toHaveClass(/scroll-down/);
  expect(
    await root.evaluate((element: HTMLElement) =>
      Number(element.style.getPropertyValue("--scroll")),
    ),
  ).toBeLessThan(down);
});
