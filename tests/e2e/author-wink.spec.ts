import sharp from "sharp";
import { expect, test } from "./fixtures";

for (const width of [375, 1280]) {
  test(`The author winks once a minute without moving the portrait at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const portrait = page.getByRole("main").locator(".author__portrait");
    const image = portrait.getByRole("img", { name: "Muhammad Rehan Saeed" });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect(portrait.locator("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(portrait.locator("svg")).toHaveCSS("pointer-events", "none");
    const bounds = await portrait.boundingBox();
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
          0, 59_999, 60_000, 60_120, 60_210, 60_360, 90_000, 120_120,
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
    expect(samples.delay).toBe(60_000);
    expect(samples.duration).toBe(60_000);
    expect(samples.iterations).toBe("infinite");
    for (const { time, scale } of samples.samples) {
      expect(scale, `Eyelid scale at ${time}ms`).toBeCloseTo(
        [60_120, 60_210, 120_120].includes(time) ? 1 : 0,
        6,
      );
    }
    expect(await portrait.boundingBox()).toEqual(bounds);
    await expect(image).toHaveAttribute("src", imageSource!);

    const frames: Buffer[] = [];
    for (const time of [0, 60_150]) {
      await portrait.evaluate((element, currentTime) => {
        element
          .querySelector(".author__eyelid")!
          .getAnimations()[0].currentTime = currentTime;
      }, time);
      frames.push(
        await portrait.screenshot({ animations: "allow", scale: "css" }),
      );
    }
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
    expect(changed, "The wink visibly changes the photograph").toBeGreaterThan(
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
