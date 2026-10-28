import sharp from "sharp";
import { expect, test } from "./fixtures";

for (const width of [375, 1280]) {
  test(`The author winks every 15 seconds without moving the portrait at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const portrait = page.getByRole("main").locator(".author__portrait");
    const image = portrait.getByRole("img", { name: "Muhammad Rehan Saeed" });
    await expect(image).toBeVisible();
    await image.evaluate((element: HTMLImageElement) => element.decode());
    await expect(portrait.locator("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(portrait.locator("svg")).toHaveCSS("pointer-events", "none");
    const bounds = await portrait.boundingBox();
    const imageBounds = await image.boundingBox();
    const imageSource = await image.getAttribute("src");
    const samples = await portrait.evaluate((element) => {
      const eyelid = element.querySelector(".author__eyelid");
      if (!eyelid) throw new Error("Missing eyelid");
      const animations = eyelid.getAnimations();
      if (animations.length !== 1)
        throw new Error("Expected one wink animation");
      const animation = animations[0];
      animation.pause();
      const timing = animation.effect!.getTiming();
      return {
        delay: timing.delay,
        duration: timing.duration,
        iterations:
          timing.iterations === Infinity ? "infinite" : timing.iterations,
        samples: [
          0, 14_999, 15_000, 15_120, 15_210, 15_360, 22_500, 30_120,
        ].map((time) => {
          animation.currentTime = time;
          return {
            time,
            scale: new DOMMatrixReadOnly(getComputedStyle(eyelid).transform)
              .m22,
          };
        }),
      };
    });
    expect(samples.delay).toBe(15_000);
    expect(samples.duration).toBe(15_000);
    expect(samples.iterations).toBe("infinite");
    for (const { time, scale } of samples.samples) {
      expect(scale, `Eyelid scale at ${time}ms`).toBeCloseTo(
        [15_120, 15_210, 30_120].includes(time) ? 1 : 0,
        6,
      );
    }
    // Isolate the animated overlay from platform-dependent photo resampling.
    const frames: Buffer[] = [];
    for (const time of [0, 15_150]) {
      await portrait.evaluate((element, currentTime) => {
        element
          .querySelector(".author__eyelid")!
          .getAnimations()[0].currentTime = currentTime;
      }, time);
      frames.push(
        await portrait.screenshot({
          animations: "allow",
          scale: "css",
          style: ".author__image { visibility: hidden; }",
        }),
      );
    }
    expect(await portrait.boundingBox()).toEqual(bounds);
    expect(await image.boundingBox()).toEqual(imageBounds);
    await expect(image).toHaveAttribute("src", imageSource!);
    await Promise.all(
      frames.map((body, index) =>
        testInfo.attach(index === 0 ? "wink-open" : "wink-closed", {
          body,
          contentType: "image/png",
        }),
      ),
    );
    const [open, closed] = await Promise.all(
      frames.map((frame) =>
        sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
      ),
    );
    expect(closed.info).toEqual(open.info);
    let changed = 0;
    for (let offset = 0; offset < open.data.length; offset += 4) {
      if (
        open.data
          .subarray(offset, offset + 4)
          .equals(closed.data.subarray(offset, offset + 4))
      ) {
        continue;
      }
      const x = ((offset / 4) % open.info.width) / open.info.width;
      const y = Math.floor(offset / 4 / open.info.width) / open.info.height;
      expect(x, "Only the viewer-right eye changes").toBeGreaterThan(0.49);
      expect(x).toBeLessThan(0.62);
      expect(y).toBeGreaterThan(0.42);
      expect(y).toBeLessThan(0.51);
      changed++;
    }
    expect(changed, "The wink visibly changes the eye overlay").toBeGreaterThan(
      5,
    );
  });
}

test("Reduced motion keeps the eye open, including after a preference change", async ({
  page,
}) => {
  await page.goto("/");
  const eyelid = page.getByRole("main").locator(".author__eyelid");
  await expect(eyelid).toHaveCSS("transform", "matrix(1, 0, 0, 0, 0, 0)");
  expect(
    await eyelid.evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(eyelid).toHaveCSS("animation-name", "author-wink");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(eyelid).toHaveCSS("animation-name", "none");
  await expect(eyelid).toHaveCSS("transform", "matrix(1, 0, 0, 0, 0, 0)");
  expect(
    await eyelid.evaluate((element) => element.getAnimations().length),
  ).toBe(0);
});
