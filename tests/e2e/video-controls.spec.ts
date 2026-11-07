import { expect, test, type Page } from "@playwright/test";

const videoLabel =
  "ThreeUI demonstration of interactive Three.js components and landing pages";

const openVideo = async (page: Page, baseURL: string | undefined) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ status: 204 }),
  );
  await page.goto("/ai-learnings-from-upgrading-my-blog/");
  const video = page.getByLabel(videoLabel, { exact: true });
  await video.scrollIntoViewIfNeeded();
  const player = page.getByRole("group", { name: `${videoLabel} controls` });
  await expect(player).toBeVisible();
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.readyState : 0,
      ),
    )
    .toBeGreaterThanOrEqual(1);
  return { video, player };
};

test("Custom controls play, pause, seek, mute and change speed with native fallback", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  await expect(video).not.toHaveAttribute("controls");
  await player.getByRole("button", { name: "Play video", exact: true }).click();
  await expect(
    player.getByRole("button", { name: "Pause video", exact: true }),
  ).toBeVisible();
  await player
    .getByRole("button", { name: "Pause video", exact: true })
    .click();
  await expect
    .poll(() =>
      video.evaluate(
        (element) => element instanceof HTMLVideoElement && element.paused,
      ),
    )
    .toBe(true);

  const seek = player.getByRole("slider", { name: "Video position" });
  await expect(seek).toBeEnabled();
  await seek.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.currentTime : -1,
      ),
    )
    .toBeCloseTo(1, 0);
  const totalSeconds = await video.evaluate((element) =>
    element instanceof HTMLVideoElement ? Math.floor(element.duration) : 0,
  );
  await expect(seek).toHaveAttribute(
    "aria-valuetext",
    `0:01 of ${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`,
  );

  await player.getByRole("button", { name: "Mute video", exact: true }).click();
  await expect(
    player.getByRole("button", { name: "Unmute video", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const volume = player.getByRole("slider", { name: "Volume", exact: true });
  await volume.focus();
  await page.keyboard.press("End");
  await expect
    .poll(() =>
      video.evaluate(
        (element) =>
          element instanceof HTMLVideoElement &&
          !element.muted &&
          element.volume === 1,
      ),
    )
    .toBe(true);
  await player.getByLabel("Video settings", { exact: true }).click();
  await player.getByLabel("Playback speed").selectOption("1.5");
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.playbackRate : 0,
      ),
    )
    .toBe(1.5);
  await page.keyboard.press("Escape");
  await expect(
    player.getByLabel("Video settings", { exact: true }),
  ).toBeFocused();
  await expect(player.getByLabel("Playback speed")).toBeHidden();
  await player.getByLabel("Video settings", { exact: true }).click();
  await player.getByRole("button", { name: "Use browser controls" }).click();
  await expect(video).toHaveAttribute("controls", "");
  await expect(player).toHaveCount(0);
  await expect(page.locator(".post__content iframe")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/PLMOVlZC4eU",
  );
});

test("Caption controls appear only for real text tracks and toggle their showing state", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  await expect(
    player.getByRole("button", { name: "Captions", exact: true }),
  ).toHaveCount(0);
  await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    const track = element.addTextTrack("captions", "English", "en");
    track.addCue(new VTTCue(0, 10, "Test caption"));
    track.mode = "disabled";
  });
  const captions = player.getByRole("button", {
    name: "Captions",
    exact: true,
  });
  await expect(captions).toBeVisible();
  await captions.click();
  await expect(captions).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement
          ? element.textTracks[0]?.mode
          : undefined,
      ),
    )
    .toBe("showing");
  await player.getByLabel("Video settings", { exact: true }).click();
  await expect(player.getByLabel("Caption language")).toHaveValue("0");
  await player.getByLabel("Caption language").selectOption("-1");
  await expect(captions).toHaveAttribute("aria-pressed", "false");
});

test("Failed playback stays paused and exposes an actionable message", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    element.play = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await player.getByRole("button", { name: "Play video", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Playback could not start" }),
  ).toBeVisible();
  await expect(
    player.getByRole("button", { name: "Play video", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      video.evaluate(
        (element) => element instanceof HTMLVideoElement && element.paused,
      ),
    )
    .toBe(true);
});

test("Media errors retain controls and a direct source escape", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  await page.route("**/broken-video.mp4", (route) =>
    route.fulfill({ status: 404 }),
  );
  await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    element.src = "/broken-video.mp4";
    element.load();
  });
  await expect(
    page.getByRole("status").filter({ hasText: "could not be loaded" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open video file" }),
  ).toHaveAttribute("href", /\/broken-video\.mp4$/);
  await expect(
    player.getByRole("slider", { name: "Video position" }),
  ).toBeDisabled();
  await expect(
    player.getByRole("button", { name: "Play video", exact: true }),
  ).toBeVisible();
});

test("Full-width controls remain contained with large touch targets in both themes and forced colours", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const width of [1280, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await video.scrollIntoViewIfNeeded();
      const layout = await player.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const buttons = Array.from(
          element.querySelectorAll("button, summary"),
        ).filter((button) => button.getBoundingClientRect().height > 0);
        return {
          left: bounds.left,
          right: bounds.right,
          overflow: element.scrollWidth > element.clientWidth,
          targets: buttons.every((button) => {
            const box = button.getBoundingClientRect();
            return box.width >= 44 && box.height >= 44;
          }),
        };
      });
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.right).toBeLessThanOrEqual(width);
      expect(layout.overflow).toBe(false);
      expect(layout.targets).toBe(true);
    }
  }
  await page.emulateMedia({ forcedColors: "active" });
  const play = player.getByRole("button", { name: "Play video", exact: true });
  await play.focus();
  await expect(play).toHaveCSS("border-top-style", "solid");
  await expect(play).toHaveCSS("outline-style", "solid");
});

test.describe("Server-rendered native fallback", () => {
  test.use({ javaScriptEnabled: false });

  test("Native controls and attribution are available before enhancement", async ({
    page,
    baseURL,
  }) => {
    await page.route(
      (url) => url.origin !== new URL(baseURL!).origin,
      (route) => route.fulfill({ status: 204 }),
    );
    await page.goto("/ai-learnings-from-upgrading-my-blog/");
    await expect(page.getByLabel(videoLabel, { exact: true })).toHaveAttribute(
      "controls",
      "",
    );
    await expect(
      page.locator(".post__content figure figcaption"),
    ).toContainText("ThreeUI demonstration");
    await expect(page.locator(".prose-video__controls")).toHaveCount(0);
  });
});

test("Player mode buttons reflect browser capabilities", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  const capabilities = await video.evaluate((element) => ({
    fullscreen: document.fullscreenEnabled,
    pip:
      element instanceof HTMLVideoElement &&
      document.pictureInPictureEnabled &&
      typeof element.requestPictureInPicture === "function" &&
      !element.disablePictureInPicture,
  }));
  const fullscreen = player.getByRole("button", {
    name: "Enter fullscreen",
    exact: true,
  });
  await expect(fullscreen).toHaveCount(capabilities.fullscreen ? 1 : 0);
  const pip = player.getByRole("button", {
    name: "Enter picture-in-picture",
    exact: true,
  });
  await expect(pip).toHaveCount(capabilities.pip ? 1 : 0);
});

test("Fullscreen retains the custom wrapper", async ({ page, baseURL }) => {
  const { player } = await openVideo(page, baseURL);
  await player
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click();
  await expect(
    player.getByRole("button", { name: "Exit fullscreen", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.fullscreenElement?.classList.contains("prose-video"),
      ),
    )
    .toBe(true);
  await player
    .getByRole("button", { name: "Exit fullscreen", exact: true })
    .click();
  await expect(
    player.getByRole("button", { name: "Enter fullscreen", exact: true }),
  ).toBeVisible();
});

test("Denied PiP requests expose feedback rather than fake success", async ({
  page,
  baseURL,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "pictureInPictureEnabled", {
      value: true,
      configurable: true,
    });
    HTMLVideoElement.prototype.requestPictureInPicture = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  const { player } = await openVideo(page, baseURL);
  await player
    .getByRole("button", { name: "Enter picture-in-picture", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Picture-in-picture is unavailable" }),
  ).toBeVisible();
});

test.describe("Playing control visibility", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Keyboard focus and open settings pin idle controls", async ({
    page,
    baseURL,
  }) => {
    const { player } = await openVideo(page, baseURL);
    const pause = player.getByRole("button", {
      name: "Pause video",
      exact: true,
    });
    await expect(pause).toBeAttached();
    await page.mouse.move(0, 0);
    await expect(player).toHaveCSS("opacity", "0");
    await pause.focus();
    await expect(player).toHaveCSS("opacity", "1");
    await player.getByLabel("Video settings", { exact: true }).click();
    await player.getByLabel("Playback speed").selectOption("1.25");
    await page.mouse.move(0, 0);
    await expect(player.getByLabel("Playback speed")).toBeVisible();
    await pause.click();
    await expect(player).toHaveCSS("opacity", "1");
  });
});
