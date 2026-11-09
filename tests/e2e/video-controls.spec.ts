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

test("Custom controls play, pause, seek, mute and change speed through a compact icon menu", async ({
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
  await expect(
    player.getByLabel("Video settings", { exact: true }),
  ).toHaveCount(0);
  const speedButton = player.getByLabel("Playback speed: Normal", {
    exact: true,
  });
  await expect(player.getByRole("combobox")).toHaveCount(0);
  await expect(
    player.getByRole("button", { name: "Use browser controls" }),
  ).toHaveCount(0);
  await speedButton.click();
  const options = player.getByRole("group", { name: "Playback speed options" });
  await expect(
    options.getByRole("button", { name: "Normal", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await options.getByRole("button", { name: "1.5×", exact: true }).click();
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.playbackRate : 0,
      ),
    )
    .toBe(1.5);
  await expect(options).toBeHidden();
  await expect(
    player.getByLabel("Playback speed: 1.5×", { exact: true }),
  ).toBeFocused();
  await expect(video).not.toHaveAttribute("controls");
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
  await expect(player.getByTitle("Captions", { exact: true })).toHaveCount(0);
  await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    const track = element.addTextTrack("captions", "English", "en");
    track.addCue(new VTTCue(0, 10, "Test caption"));
    track.mode = "disabled";
  });
  const captions = player.getByTitle("Captions", { exact: true });
  await expect(captions).toBeVisible();
  await captions.click();
  const languages = player.getByRole("group", { name: "Caption language" });
  await languages.getByRole("button", { name: "English", exact: true }).click();
  await expect(captions).toHaveAttribute("aria-label", "Captions: English");
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement
          ? element.textTracks[0]?.mode
          : undefined,
      ),
    )
    .toBe("showing");
  await expect(languages).toBeHidden();
  await expect(captions).toBeFocused();
  await captions.click();
  await expect(
    languages.getByRole("button", { name: "English", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await languages.getByRole("button", { name: "Off", exact: true }).click();
  await expect(captions).toHaveAttribute("aria-label", "Captions: off");
});

test("Playback speed popup supports slider, step buttons and quick presets", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  await player.getByTitle("Playback speed", { exact: true }).click();
  const options = player.getByRole("group", { name: "Playback speed options" });
  const rate = options.getByLabel("Current playback speed");
  const slider = options.getByRole("slider", {
    name: "Playback speed",
    exact: true,
  });
  await expect(rate).toHaveText("1.00×");
  await options
    .getByRole("button", { name: "Increase playback speed" })
    .click();
  await expect(rate).toHaveText("1.25×");
  await options
    .getByRole("button", { name: "Decrease playback speed" })
    .click();
  await expect(rate).toHaveText("1.00×");
  await slider.focus();
  await page.keyboard.press("End");
  await expect(rate).toHaveText("3.00×");
  await expect(
    options.getByRole("button", { name: "Increase playback speed" }),
  ).toBeDisabled();
  await page.keyboard.press("Home");
  await expect(rate).toHaveText("0.50×");
  await expect(
    options.getByRole("button", { name: "Decrease playback speed" }),
  ).toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await expect(rate).toHaveText("0.75×");
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.playbackRate : 0,
      ),
    )
    .toBe(0.75);
  await options.getByRole("button", { name: "2×", exact: true }).click();
  await expect(options).toBeHidden();
  await expect(
    player.getByTitle("Playback speed", { exact: true }),
  ).toBeFocused();
  await player.getByTitle("Playback speed", { exact: true }).click();
  await expect(
    options.getByRole("button", { name: "2×", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
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
  await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    element.addTextTrack(
      "captions",
      "English captions with a long language label",
      "en",
    ).mode = "disabled";
  });
  await expect(player.getByTitle("Captions", { exact: true })).toBeVisible();
  await expect(player.locator(".prose-video__progress")).toHaveCSS(
    "height",
    "4px",
  );
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
          accent: getComputedStyle(element)
            .getPropertyValue("--video-accent")
            .trim(),
          themeAccent: getComputedStyle(document.documentElement)
            .getPropertyValue("--global-accent-color")
            .trim(),
          left: bounds.left,
          right: bounds.right,
          overflow: element.scrollWidth > element.clientWidth,
          height: bounds.height,
          timeSpacing: Number.parseFloat(
            getComputedStyle(element.querySelector(".prose-video__time")!)
              .paddingInlineStart,
          ),
          rowBackground: getComputedStyle(
            element.querySelector(".prose-video__row")!,
          ).backgroundColor,
          overlayBackground: getComputedStyle(element).backgroundColor,
          overlayImage: getComputedStyle(element).backgroundImage,
          groupBackgrounds: [
            ".prose-video__playback",
            ".prose-video__utilities",
          ].map(
            (selector) =>
              getComputedStyle(element.querySelector(selector)!)
                .backgroundColor,
          ),
          targets: buttons.every((button) => {
            const box = button.getBoundingClientRect();
            return box.width >= 44 && box.height >= 44;
          }),
        };
      });
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.accent).toBe(layout.themeAccent);
      expect(layout.right).toBeLessThanOrEqual(width);
      expect(layout.overflow).toBe(false);
      expect(layout.targets).toBe(true);
      expect(layout.height).toBeLessThanOrEqual(64);
      expect(layout.timeSpacing).toBeGreaterThanOrEqual(width > 600 ? 12 : 8);
      expect(layout.rowBackground).toBe("rgba(0, 0, 0, 0)");
      expect(layout.overlayBackground).toBe("rgba(0, 0, 0, 0)");
      expect(layout.overlayImage).toBe("none");
      expect(layout.groupBackgrounds).toEqual([
        "rgba(0, 0, 0, 0.65)",
        "rgba(0, 0, 0, 0.65)",
      ]);
      await player.getByTitle("Captions", { exact: true }).click();
      const languages = player.getByRole("group", { name: "Caption language" });
      await expect(languages).toBeVisible();
      const menu = await languages.boundingBox();
      expect(menu!.x).toBeGreaterThanOrEqual(0);
      expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press("Escape");
      await expect(languages).toBeHidden();
    }
  }
  await page.emulateMedia({ forcedColors: "active" });
  const play = player.getByRole("button", { name: "Play video", exact: true });
  await play.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(play).toBeFocused();
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

  test("Keyboard focus and open icon menus pin idle controls and dismiss accessibly", async ({
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
    const speed = player.getByTitle("Playback speed", { exact: true });
    await speed.focus();
    await page.keyboard.press("Enter");
    const options = player.getByRole("group", {
      name: "Playback speed options",
    });
    await expect(options).toBeVisible();
    await options.getByRole("button", { name: "1.25×", exact: true }).focus();
    await page.mouse.move(0, 0);
    await expect(player).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(options).toBeHidden();
    await expect(speed).toBeFocused();
    await speed.click();
    await expect(options).toBeVisible();
    await pause.click();
    await expect(options).toBeHidden();
    await expect(player).toHaveCSS("opacity", "1");
  });
});
