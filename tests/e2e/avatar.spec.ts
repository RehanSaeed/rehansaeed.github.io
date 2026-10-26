import sharp from "sharp";
import { expect, test } from "./fixtures";

const postPath =
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const photo = "https://avatars.githubusercontent.com/avatar-regression.png";
const avatars = [
  ".navigation__image-container",
  ".webmention-faces__face",
  ".webmention-reply__avatar",
  ".comment__avatar",
];

for (const deviceScaleFactor of [1, 2]) {
  test.describe(`Avatar frames at ${deviceScaleFactor}x density`, () => {
    test.use({ deviceScaleFactor, reducedMotion: "no-preference" });

    for (const colorScheme of ["light", "dark"] as const) {
      for (const width of [375, 1280]) {
        test(`Keep images and borders joined during hover and focus in ${colorScheme} at ${width}px`, async ({
          page,
        }) => {
          test.slow();
          await page.setViewportSize({ width, height: 900 });
          await page.emulateMedia({ colorScheme });
          const image = await sharp({
            create: {
              width: 192,
              height: 192,
              channels: 3,
              background: { r: 240, g: 32, b: 64 },
            },
          })
            .png()
            .toBuffer();
          await page.route(
            /Logo-192x192|avatars\.githubusercontent\.com/,
            (route) => route.fulfill({ contentType: "image/png", body: image }),
          );
          await page.route(
            /^https:\/\/webmention\.io\/api\/mentions\?/,
            (route) =>
              route.fulfill({
                json: {
                  links: ["like", "reply"].map((type, id) => ({
                    id,
                    activity: { type },
                    data: {
                      url: `https://example.com/mention/${id}`,
                      author: { name: "Reader", photo },
                      published: "2026-01-02T00:00:00Z",
                      content: "<p>A webmention reply.</p>",
                    },
                  })),
                },
              }),
          );
          await page.route(
            "**/api.github.com/repos/RehanSaeed/rehansaeed.github.io/issues/607/comments*",
            (route) =>
              route.fulfill({ status: 403, json: { message: "Offline" } }),
          );
          await page.goto(postPath);
          await expect(
            page.getByRole("button", { name: "Open search", exact: true }),
          ).toBeEnabled({ timeout: 60_000 });
          await page.locator(".webmentions").scrollIntoViewIfNeeded();
          await expect(page.locator(".webmention-faces__face")).toBeVisible();
          await page.locator(".comments").scrollIntoViewIfNeeded();
          await expect(page.locator(".comment__avatar").first()).toBeVisible();

          for (const selector of avatars) {
            const avatar = page.locator(selector).first();
            await avatar.scrollIntoViewIfNeeded();
            await expect
              .poll(() =>
                avatar
                  .locator("img")
                  .evaluate(
                    (image: HTMLImageElement) =>
                      image.complete && image.naturalWidth > 0,
                  ),
              )
              .toBe(true);
            await expect(avatar).toHaveCSS("will-change", "auto");
            await expect(avatar.locator("img")).toHaveCSS(
              "border-top-width",
              "0px",
            );
            await expect(avatar.locator("img")).toHaveCSS("transform", "none");

            for (const interaction of ["hover", "focus"] as const) {
              await page.mouse.move(0, 0);
              await avatar.evaluate((element: HTMLElement) => element.blur());
              await avatar.evaluate((element) => {
                for (const animation of element.getAnimations({
                  subtree: true,
                })) {
                  animation.finish();
                }
              });
              if (interaction === "hover") {
                await avatar.hover();
              } else {
                await avatar.focus();
              }

              for (const progress of [0.25, 0.75, 1]) {
                await avatar.evaluate((element, progress) => {
                  for (const animation of element.getAnimations({
                    subtree: true,
                  })) {
                    animation.pause();
                    const duration = animation.effect?.getTiming().duration;
                    if (typeof duration === "number") {
                      animation.currentTime = duration * progress;
                    }
                  }
                }, progress);
                const geometry = await avatar.evaluate((element) => {
                  const frame = element.getBoundingClientRect();
                  const image = element.querySelector("img")!;
                  const bounds = image.getBoundingClientRect();
                  const border = getComputedStyle(element, "::after");
                  return {
                    frame: [frame.x, frame.y, frame.width, frame.height],
                    image: [bounds.x, bounds.y, bounds.width, bounds.height],
                    border: parseFloat(border.borderTopWidth),
                    scale: frame.width / element.clientWidth,
                    opacity: getComputedStyle(element).opacity,
                  };
                });
                for (const [index, value] of geometry.image.entries()) {
                  expect(value, `${selector}: ${interaction}`).toBeCloseTo(
                    geometry.frame[index],
                    3,
                  );
                }
                expect(geometry.opacity).toBe("1");

                const { data, info } = await sharp(
                  await avatar.screenshot({ animations: "allow" }),
                )
                  .removeAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });
                // Fractional screenshot bounds can add one device pixel at an edge.
                const inset =
                  Math.ceil(
                    (geometry.border * geometry.scale + 2) * deviceScaleFactor,
                  ) + 1;
                expect(inset * 2).toBeLessThan(info.width);
                const y = Math.floor(info.height / 2);
                for (let x = inset; x < info.width - inset; x++) {
                  const offset = (y * info.width + x) * info.channels;
                  expect(
                    [...data.subarray(offset, offset + 3)],
                    `${selector}: ${interaction} at ${progress}, pixel ${x}`,
                  ).toEqual([240, 32, 64]);
                }
              }
            }
          }
        });
      }
    }
  });
}
