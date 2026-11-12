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
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await player.scrollIntoViewIfNeeded();
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
  const progress = await player.locator(".prose-video__progress").boundingBox();
  await page.mouse.click(
    progress!.x + progress!.width / 2,
    progress!.y + progress!.height / 2,
  );
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement
          ? Math.abs(element.currentTime - element.duration / 2)
          : Infinity,
      ),
    )
    .toBeLessThanOrEqual(1);

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
  await expect(player.getByRole("button", { name: /^Captions:/ })).toHaveCount(
    0,
  );
  await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    const track = element.addTextTrack("captions", "English", "en");
    track.addCue(new VTTCue(0, 10, "Test caption"));
    track.mode = "disabled";
  });
  const captions = player.getByRole("button", { name: /^Captions:/ });
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
  await player.getByRole("button", { name: /^Playback speed:/ }).click();
  const options = player.getByRole("group", { name: "Playback speed options" });
  const rate = options.getByLabel("Current playback speed");
  const increase = options.getByRole("button", {
    name: "Increase playback speed",
  });
  const decrease = options.getByRole("button", {
    name: "Decrease playback speed",
  });
  const title = options.locator(".prose-video__menu-title");
  await expect(title).toBeVisible();
  await expect(title).toHaveText("Playback speed");
  const titleBounds = await title.boundingBox();
  const rateBounds = await rate.boundingBox();
  expect(titleBounds!.y + titleBounds!.height).toBeLessThan(rateBounds!.y);
  await expect(options).toHaveCSS("border-top-width", "0px");
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
  await expect(increase).toBeDisabled();
  await expect(increase).toBeVisible();
  await expect(increase).toHaveCSS("color", "rgba(255, 255, 255, 0.65)");
  await expect(increase).toHaveCSS(
    "background-color",
    "rgba(255, 255, 255, 0.15)",
  );
  await expect(increase).toHaveCSS("opacity", "1");
  await page.keyboard.press("Home");
  await expect(rate).toHaveText("0.50×");
  await expect(decrease).toBeDisabled();
  await expect(decrease).toBeVisible();
  await expect(decrease).toHaveCSS("color", "rgba(255, 255, 255, 0.65)");
  await expect(decrease).toHaveCSS(
    "background-color",
    "rgba(255, 255, 255, 0.15)",
  );
  await expect(decrease).toHaveCSS("opacity", "1");
  await page.keyboard.press("ArrowRight");
  await expect(rate).toHaveText("0.75×");
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.playbackRate : 0,
      ),
    )
    .toBe(0.75);
  await expect(options).not.toContainText("0.75× speed");
  await options.getByRole("button", { name: "2.5×", exact: true }).click();
  await expect(options).toBeHidden();
  await expect(
    player.getByRole("button", { name: /^Playback speed:/ }),
  ).toBeFocused();
  await player.getByRole("button", { name: /^Playback speed:/ }).click();
  await expect(
    options.getByRole("button", { name: "2.5×", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(rate).toHaveText("2.50×");
  await expect
    .poll(() =>
      video.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.playbackRate : 0,
      ),
    )
    .toBe(2.5);
  await options.getByRole("button", { name: "1.5×", exact: true }).click();
  await player.getByRole("button", { name: /^Playback speed:/ }).click();
  const selectedPreset = options.getByRole("button", {
    name: "1.5×",
    exact: true,
  });
  const normalPreset = options.getByRole("button", {
    name: "Normal",
    exact: true,
  });
  await expect(selectedPreset).toHaveAttribute("aria-pressed", "true");
  await expect(rate).toHaveText("1.50×");
  await expect(selectedPreset).toHaveCSS("box-shadow", "none");
  await expect(selectedPreset).toHaveCSS(
    "font-weight",
    await normalPreset.evaluate(
      (element) => getComputedStyle(element).fontWeight,
    ),
  );
  await page.emulateMedia({ forcedColors: "active" });
  await expect(selectedPreset).toHaveCSS(
    "border-bottom-width",
    await normalPreset.evaluate(
      (element) => getComputedStyle(element).borderBottomWidth,
    ),
  );
  await selectedPreset.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(selectedPreset).toBeFocused();
  await expect(selectedPreset).toHaveCSS("outline-style", "solid");
});

test("Toolbar actions use shared tooltips instead of native titles", async ({
  page,
  baseURL,
}) => {
  const { player } = await openVideo(page, baseURL);
  await expect(player.locator("[title]")).toHaveCount(0);
  const play = player.getByRole("button", { name: "Play video", exact: true });
  await play.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Play");
  await expect(play).toHaveAccessibleDescription("Play");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  const speed = player.getByRole("button", { name: /^Playback speed:/ });
  await speed.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Playback speed");
  await speed.click();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(
    player.getByRole("group", { name: "Playback speed options" }),
  ).toBeVisible();
});

test("Volume tooltip follows the range value on hover, keyboard focus and fullscreen", async ({
  page,
  baseURL,
}) => {
  const { player } = await openVideo(page, baseURL);
  const volume = player.getByRole("slider", { name: "Volume", exact: true });
  const tooltip = page.getByRole("tooltip", { name: /^Volume:/ });
  await volume.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(volume).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tooltip).toHaveText("Volume: 0%");
  await page.keyboard.press("ArrowRight");
  await expect(tooltip).toHaveText("Volume: 1%");
  await expect(volume).toHaveAttribute("aria-valuetext", "1 percent");
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await expect(volume).toBeFocused();
  await page.keyboard.press("Tab");
  await volume.hover();
  await expect(tooltip).toHaveText("Volume: 1%");
  await page.keyboard.press("Escape");
  const fullscreen = player.getByRole("button", {
    name: "Enter fullscreen",
    exact: true,
  });
  await fullscreen.click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.className))
    .toContain("prose-video");
  await volume.hover();
  await expect(tooltip).toHaveText("Volume: 1%");
  await expect(tooltip).toBeVisible();
  await player
    .getByRole("button", { name: "Exit fullscreen", exact: true })
    .click();
});

test("Seek hover thickens the track and previews pointer time without seeking", async ({
  page,
  baseURL,
}) => {
  const { video, player } = await openVideo(page, baseURL);
  const seek = player.getByRole("slider", {
    name: "Video position",
    exact: true,
  });
  const progress = player.locator(".prose-video__progress");
  const tooltip = page.getByRole("tooltip", { name: /^\d+:\d{2}$/ });
  const media = await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    return { time: element.currentTime, duration: element.duration };
  });
  const bounds = await progress.boundingBox();
  for (const fraction of [0.25, 0.75]) {
    const x = bounds!.x + bounds!.width * fraction;
    await page.mouse.move(x, bounds!.y + bounds!.height / 2);
    await expect(progress).toHaveCSS("height", "6px");
    const time = Math.min(
      media.duration,
      Math.round(media.duration * fraction),
    );
    const expected = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`;
    await expect(tooltip).toHaveText(expected);
    await expect
      .poll(async () => {
        const preview = await tooltip.boundingBox();
        return preview
          ? Math.abs(preview.x + preview.width / 2 - x)
          : Number.POSITIVE_INFINITY;
      })
      .toBeLessThan(1);
    await expect
      .poll(() =>
        video.evaluate((element) =>
          element instanceof HTMLVideoElement
            ? element.currentTime
            : Number.NaN,
        ),
      )
      .toBe(media.time);
  }
  await page.mouse.move(0, 0);
  await expect(tooltip).toHaveCount(0);
  await expect(progress).toHaveCSS("height", "4px");
  await seek.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(seek).toBeFocused();
  await expect(progress).toHaveCSS("height", "6px");
  await page.keyboard.press("Home");
  await expect(tooltip).toHaveText("0:00");
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await expect(seek).toBeFocused();
  await seek.blur();
  await video.evaluate(async (element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new TypeError("Expected video.");
    }
    element.muted = true;
    await element.play();
  });
  await seek.hover();
  await expect(tooltip).toBeVisible();
  await expect(player).toHaveCSS("opacity", "0", { timeout: 6000 });
  await expect(tooltip).toHaveCount(0);
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
  await expect(
    player.getByRole("button", { name: /^Captions:/ }),
  ).toBeVisible();
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
        const mediaBounds = element
          .closest(".prose-video")!
          .getBoundingClientRect();
        const playbackBounds = element
          .querySelector(".prose-video__playback button")!
          .getBoundingClientRect();
        const utilityBounds = element
          .querySelector(".prose-video__utilities")!
          .getBoundingClientRect();
        const progressBounds = element
          .querySelector(".prose-video__progress")!
          .getBoundingClientRect();
        const volumeInput = element.querySelector(".prose-video__volume input");
        const volumeBounds = volumeInput?.getBoundingClientRect();
        const muteBounds = volumeInput
          ?.closest("label")
          ?.previousElementSibling?.getBoundingClientRect();
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
          trackTop: progressBounds.top,
          volumeGap:
            volumeBounds?.width && muteBounds
              ? volumeBounds.left - muteBounds.right
              : null,
          controlSpacing: [
            playbackBounds.left - mediaBounds.left,
            mediaBounds.right - utilityBounds.right,
            mediaBounds.bottom - playbackBounds.bottom,
            mediaBounds.bottom - utilityBounds.bottom,
            playbackBounds.top - progressBounds.bottom,
            utilityBounds.top - progressBounds.bottom,
          ],
          seekGap:
            element.querySelector(".prose-video__row")!.getBoundingClientRect()
              .top -
            element
              .querySelector(".prose-video__progress")!
              .getBoundingClientRect().bottom,
          seekHitAreaBottom: element
            .querySelector(".prose-video__seek input")!
            .getBoundingClientRect().bottom,
          rowTop: element
            .querySelector(".prose-video__row")!
            .getBoundingClientRect().top,
          timeSpacing: Number.parseFloat(
            getComputedStyle(element.querySelector(".prose-video__time")!)
              .paddingInlineStart,
          ),
          timeEndSpacing: Number.parseFloat(
            getComputedStyle(element.querySelector(".prose-video__time")!)
              .paddingInlineEnd,
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
          toolbarFaces: Array.from(
            element.querySelectorAll(".prose-video__button"),
            (button) => {
              const target = button.getBoundingClientRect();
              const icon = button
                .querySelector(".icon")!
                .getBoundingClientRect();
              const style = getComputedStyle(button);
              return {
                target: [target.width, target.height],
                icon: [icon.width, icon.height],
                padding: [
                  style.paddingBlockStart,
                  style.paddingBlockEnd,
                  style.paddingInlineStart,
                  style.paddingInlineEnd,
                ],
                backgroundClip: style.backgroundClip,
              };
            },
          ),
        };
      });
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.accent).toBe(layout.themeAccent);
      expect(layout.right).toBeLessThanOrEqual(width);
      expect(layout.overflow).toBe(false);
      expect(layout.targets).toBe(true);
      for (const face of layout.toolbarFaces) {
        for (const dimension of face.target) {
          expect(dimension).toBeCloseTo(44, 3);
        }
        for (const dimension of face.icon) {
          expect(dimension).toBeCloseTo(24, 3);
        }
        expect(face.padding).toEqual(["4px", "4px", "4px", "4px"]);
        expect(face.backgroundClip).toBe("content-box");
      }
      expect(layout.height).toBeLessThanOrEqual(64);
      for (const spacing of layout.controlSpacing) {
        expect(spacing).toBeCloseTo(8, 3);
      }
      expect(layout.seekGap).toBeCloseTo(8, 3);
      expect(layout.seekHitAreaBottom).toBeLessThanOrEqual(layout.rowTop);
      expect(layout.timeSpacing).toBe(width > 600 ? 12 : width > 340 ? 8 : 4);
      expect(layout.timeEndSpacing).toBe(width > 600 ? 16 : 8);
      for (const selector of [
        ".prose-video__playback",
        ".prose-video__utilities",
        ".prose-video__speed-adjust",
        ".prose-video__speed-presets",
      ]) {
        await expect(player.locator(selector)).toHaveCSS(
          "column-gap",
          width <= 340 ? "0px" : "8px",
        );
      }
      expect(layout.volumeGap).toEqual(
        width > 600 ? expect.closeTo(8, 3) : null,
      );
      expect(layout.rowBackground).toBe("rgba(0, 0, 0, 0)");
      expect(layout.overlayBackground).toBe("rgba(0, 0, 0, 0)");
      expect(layout.overlayImage).toBe("none");
      expect(layout.groupBackgrounds).toEqual([
        "rgba(0, 0, 0, 0.65)",
        "rgba(0, 0, 0, 0.65)",
      ]);
      const captions = player.getByRole("button", { name: /^Captions:/ });
      await captions.click();
      await expect(captions).toHaveCSS("color", "rgb(107, 23, 232)");
      await expect(captions).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
      const languages = player.getByRole("group", { name: "Caption language" });
      await expect(languages).toBeVisible();
      const captionsOff = languages.getByRole("button", {
        name: "Off",
        exact: true,
      });
      await captionsOff.hover();
      await expect(captionsOff).toHaveCSS("color", "rgb(107, 23, 232)");
      await expect(captionsOff).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
      const menu = await languages.boundingBox();
      expect(layout.trackTop - (menu!.y + menu!.height)).toBeCloseTo(8, 3);
      expect(menu!.x).toBeGreaterThanOrEqual(0);
      expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press("Escape");
      await expect(languages).toBeHidden();
      await player.getByRole("button", { name: /^Playback speed:/ }).click();
      const speeds = player.getByRole("group", {
        name: "Playback speed options",
      });
      await expect(speeds).toBeVisible();
      const speedMenu = await speeds.boundingBox();
      expect(layout.trackTop - (speedMenu!.y + speedMenu!.height)).toBeCloseTo(
        8,
        3,
      );
      expect(speedMenu!.x).toBeGreaterThanOrEqual(0);
      expect(speedMenu!.x + speedMenu!.width).toBeLessThanOrEqual(width);
      expect(speedMenu!.width).toBeCloseTo(
        Math.min(360, layout.right - layout.left - 16),
        3,
      );
      const presets = speeds.locator(".prose-video__speed-presets button");
      await expect(presets).toHaveCount(6);
      for (const preset of await presets.all()) {
        const bounds = await preset.boundingBox();
        expect(bounds!.width).toBeCloseTo(48, 3);
        expect(bounds!.height).toBeCloseTo(48, 3);
        await expect(preset).toHaveCSS("border-radius", "50%");
        expect(bounds!.x).toBeGreaterThanOrEqual(speedMenu!.x);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
          speedMenu!.x + speedMenu!.width,
        );
      }
      const stepButtons = speeds.locator(".prose-video__speed-adjust button");
      for (const [index, stepButton] of (await stepButtons.all()).entries()) {
        const bounds = await stepButton.boundingBox();
        const alignedPreset = await presets
          .nth(index === 0 ? 0 : width <= 340 ? 2 : 5)
          .boundingBox();
        expect(bounds!.width).toBeCloseTo(48, 3);
        expect(bounds!.height).toBeCloseTo(48, 3);
        expect(bounds!.x).toBeCloseTo(alignedPreset!.x, 3);
        await expect(stepButton).toHaveCSS("border-radius", "50%");
      }
      const fasterPreset = presets.filter({ hasText: "2.5" });
      await fasterPreset.hover();
      await expect(fasterPreset).toHaveCSS("color", "rgb(107, 23, 232)");
      await expect(fasterPreset).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
      await page.keyboard.press("Escape");
      await expect(speeds).toBeHidden();
      const play = player.getByRole("button", {
        name: "Play video",
        exact: true,
      });
      await page.mouse.move(0, 0);
      await expect(play).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(play).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await play.hover();
      await expect(play).toHaveCSS("border-radius", "50%");
      await expect(play).toHaveCSS("color", "rgb(107, 23, 232)");
      await expect(play).toHaveCSS("background-color", "rgb(255, 255, 255)");
      const hoverContrast = await play.evaluate((element) => {
        const luminance = (colour: string) => {
          const channels = colour
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
          const linear = channels.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
          return (
            linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
          );
        };
        const style = getComputedStyle(element);
        const foreground = luminance(style.color);
        const background = luminance(style.backgroundColor);
        return (
          (Math.max(foreground, background) + 0.05) /
          (Math.min(foreground, background) + 0.05)
        );
      });
      expect(hoverContrast).toBeGreaterThanOrEqual(4.5);
      await page.mouse.move(0, 0);
      await play.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(play).toBeFocused();
      await expect(play).toHaveCSS("color", "rgb(107, 23, 232)");
      await expect(play).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(play).toHaveCSS("outline-color", "rgb(107, 23, 232)");
      await expect(play).toHaveCSS("outline-offset", "-6px");
      await page.keyboard.press("Tab");
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

  test("Mouse movement restores idle fullscreen controls across the window", async ({
    page,
    baseURL,
  }) => {
    const { player } = await openVideo(page, baseURL);
    await expect(
      player.getByRole("button", { name: "Pause video", exact: true }),
    ).toBeAttached();
    await player
      .getByRole("button", { name: "Enter fullscreen", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement !== null))
      .toBe(true);
    await player.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await expect(player).toHaveCSS("opacity", "0");
    await page.evaluate(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove"));
    });
    await expect(player).toHaveCSS("opacity", "1");
    await expect(player).toHaveCSS("opacity", "0");
    const viewport = page.viewportSize()!;
    await page.mouse.move(viewport.width / 2, 8);
    await expect(player).toHaveCSS("opacity", "1");
    await expect(player).toHaveCSS("opacity", "0");
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await expect(player).toHaveCSS("opacity", "1");
    await player
      .getByRole("button", { name: "Exit fullscreen", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement === null))
      .toBe(true);
  });

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
    const speed = player.getByRole("button", { name: /^Playback speed:/ });
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
