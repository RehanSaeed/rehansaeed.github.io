import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import type { NuxtApp } from "nuxt/app";
import {
  hoverSoundNames,
  soundNames,
  soundPath,
} from "../../shared/utils/sounds";
import { delayClientScripts, expect, test } from "./fixtures";

declare global {
  interface Window {
    soundProbe: {
      decoded: number;
      starts: number[];
      played: string[];
      active: number;
      stops: number;
      context?: AudioContext;
      gain?: GainNode;
    };
  }
}

const soundToggle = (page: Page) =>
  page.getByRole("button", { name: "Sound effects", exact: true });
const themeToggle = (page: Page) =>
  page.getByRole("button", { name: "Toggle dark/light" });
const playback = (page: Page) => page.evaluate(() => window.soundProbe.starts);
const playedSounds = (page: Page) =>
  page.evaluate(() => window.soundProbe.played);
const soundDirectory = join("public", ...soundPath.split("/").filter(Boolean));

async function clearPlayback(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.soundProbe.active))
    .toBe(0);
  await page.evaluate(() => {
    window.soundProbe.starts = [];
    window.soundProbe.played = [];
    window.soundProbe.stops = 0;
  });
}

async function ready(page: Page) {
  await page.mouse.move(1, 1);
  await expect
    .poll(() => page.evaluate(() => window.soundProbe.decoded))
    .toBe(soundNames.length);
  // Restoring a saved preference is not a gesture. Unlock without a UI cue.
  await page.mouse.click(1, 1);
  await expect
    .poll(() => page.evaluate(() => window.soundProbe.context?.state))
    .toBe("running");
}

async function enable(page: Page) {
  await expect(soundToggle(page)).toBeEnabled();
  if ((await soundToggle(page).getAttribute("aria-pressed")) === "false") {
    await soundToggle(page).click();
  }
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "true");
  await ready(page);
}

async function expectSoundState(page: Page, enabled: boolean) {
  const button = soundToggle(page);
  await expect(button).toHaveAttribute("aria-pressed", String(enabled));
  await expect(button).not.toHaveAttribute("title");
  await expect(
    button.locator(`.sound-control__${enabled ? "on" : "off"}`),
  ).toHaveCSS("opacity", "1");
  await expect(
    button.locator(`.sound-control__${enabled ? "off" : "on"}`),
  ).toBeHidden();
  await expect(button.locator("svg:visible")).toHaveCount(1);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.soundProbe = {
      decoded: 0,
      starts: [],
      played: [],
      active: 0,
      stops: 0,
    };
    const dataNames = new WeakMap<ArrayBuffer, string>();
    const bufferNames = new WeakMap<AudioBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function () {
      const data = await arrayBuffer.call(this);
      if (this.url.includes("/sounds/")) {
        dataNames.set(
          data,
          new URL(this.url).pathname.split("/").pop()!.replace(".wav", ""),
        );
      }
      return data;
    };
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.soundProbe.context = this;
      }
    };
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const gain = createGain.call(this);
      window.soundProbe.gain = gain;
      return gain;
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (...args) {
      const result = decode.apply(this, args);
      void result.then(
        (buffer) => {
          window.soundProbe.decoded++;
          const name = dataNames.get(args[0]);
          if (name) bufferNames.set(buffer, name);
        },
        () => {},
      );
      return result;
    };
    const createSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      window.soundProbe.context = this;
      const source = createSource.call(this);
      const start = source.start;
      const stop = source.stop;
      source.addEventListener("ended", () => window.soundProbe.active--, {
        once: true,
      });
      source.start = function (...args) {
        if (source.buffer && source.buffer.duration > 0.01) {
          window.soundProbe.starts.push(source.buffer.duration);
          window.soundProbe.played.push(
            bufferNames.get(source.buffer) ?? "unknown",
          );
          window.soundProbe.active++;
        }
        return start.apply(this, args);
      };
      source.stop = function (...args) {
        if (source.buffer && source.buffer.duration > 0.01) {
          window.soundProbe.stops++;
        }
        return stop.apply(this, args);
      };
      return source;
    };
  });
});

test("Defaults to on without autoplay, and interaction plays a cue", async ({
  page,
}) => {
  await page.goto("/");
  await expectSoundState(page, true);
  await expect
    .poll(() => page.evaluate(() => window.soundProbe.decoded))
    .toBe(soundNames.length);
  expect(await playback(page)).toEqual([]);
  expect(
    await page.evaluate(() => localStorage.getItem("sound-effect-enabled")),
  ).toBeNull();
  await ready(page);
  await themeToggle(page).click();
  await expect.poll(() => playback(page)).toHaveLength(1);
});

test("Silent search and sound controls work when event timestamps are identical", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"));
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Search", exact: true }).click();
  expect(await playedSounds(page)).toEqual([]);
  await soundToggle(page).click();
  await expectSoundState(page, false);
  await soundToggle(page).click();
  await expectSoundState(page, true);
  await expect.poll(() => playedSounds(page)).toEqual(["enable-sound"]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`Sound tooltips describe the action without playing cues in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await ready(page);
    const button = soundToggle(page);
    const tooltip = page.getByRole("tooltip", {
      name: /^Turn sound effects (on|off)$/,
    });
    await button.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("Turn sound effects off");
    await expect(tooltip).toHaveAttribute("data-placement", "left");
    await expect(button).toHaveAccessibleDescription("Turn sound effects off");
    await expect(button).not.toHaveAttribute("title");
    expect(await playback(page)).toEqual([]);

    await button.click();
    await expectSoundState(page, false);
    await expect(tooltip).toHaveCount(0);
    await expect(button).not.toHaveAttribute("aria-describedby");
    expect(await playback(page)).toEqual([]);

    await page.mouse.move(0, 0);
    await themeToggle(page).focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(tooltip).toHaveText("Turn sound effects on");
    await expect(button).toHaveAccessibleDescription("Turn sound effects on");
    expect(await playback(page)).toEqual([]);

    await page.keyboard.press("Enter");
    await expectSoundState(page, true);
    await expect(tooltip).toHaveCount(0);
    await expect.poll(() => playback(page)).toHaveLength(1);
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(tooltip).toHaveText("Turn sound effects off");
    await expect(button).toHaveAccessibleDescription("Turn sound effects off");
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(button).not.toHaveAttribute("aria-describedby");
    await expect(button).toBeFocused();
    await expectSoundState(page, true);
    expect(await playback(page)).toHaveLength(1);
  });
}

test("A saved mute stays silent and requests no samples until enabled", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("sound-effect-enabled", "false"),
  );
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/sounds/")) requests.push(request.url());
  });
  await page.goto("/");
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expectSoundState(page, false);
  await themeToggle(page).click();
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await page.getByRole("button", { name: "Close Search", exact: true }).click();
  expect(requests).toEqual([]);
  expect(await playback(page)).toEqual([]);
  expect(await page.evaluate(() => !!window.soundProbe.context)).toBe(false);

  await enable(page);
  expect(requests).toHaveLength(soundNames.length);
  await expect.poll(() => playback(page)).toHaveLength(1);
});

test("Hydration guards the sound toggle", async ({ page }) => {
  const scripts = await delayClientScripts(page);
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(soundToggle(page)).toBeDisabled();
    await expectSoundState(page, true);
    scripts.resume();
    await expect(soundToggle(page)).toBeEnabled();
  } finally {
    await scripts.dispose();
  }
});

test("Unavailable Web Audio is reported without breaking controls", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("sound-effect-enabled", "false"),
  );
  await page.goto("/");
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => {
    Object.defineProperty(window, "AudioContext", { value: undefined });
  });
  await soundToggle(page).click();
  await expect(page.locator(".sound-control__error")).toContainText(
    "could not be initialized",
  );
  await themeToggle(page).click();
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  expect(await playback(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await soundToggle(page).click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("Early preference changes are not restarted by delayed restoration", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const callbacks: IdleRequestCallback[] = [];
    window.requestIdleCallback = (callback) => callbacks.push(callback);
    window.addEventListener("sound-test:idle", () => {
      for (const callback of callbacks.splice(0)) {
        callback({ didTimeout: false, timeRemaining: () => 50 });
      }
    });
  });
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: string[] = [];
  await page.route(`**${soundPath}/*.wav`, async (route) => {
    requests.push(route.request().url());
    await blocked;
    await route.continue();
  });
  try {
    await page.goto("/");
    await soundToggle(page).click();
    await soundToggle(page).click();
    await expect.poll(() => requests.length).toBe(soundNames.length);
    await page.evaluate(() =>
      window.dispatchEvent(new Event("sound-test:idle")),
    );
    release();
    await ready(page);
    expect(requests).toHaveLength(soundNames.length);
    await expect.poll(() => playback(page)).toHaveLength(1);
    await expect(page.locator(".sound-control__error")).toBeHidden();
    await themeToggle(page).click();
    await expect.poll(() => playback(page)).toHaveLength(2);
  } finally {
    release();
  }
});

test("An early mute survives delayed preference restoration without loading audio", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const callbacks: IdleRequestCallback[] = [];
    window.requestIdleCallback = (callback) => callbacks.push(callback);
    window.addEventListener("sound-test:idle", () => {
      for (const callback of callbacks.splice(0)) {
        callback({ didTimeout: false, timeRemaining: () => 50 });
      }
    });
  });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/sounds/")) requests.push(request.url());
  });
  await page.goto("/");
  await soundToggle(page).click();
  await expectSoundState(page, false);
  await page.evaluate(() => window.dispatchEvent(new Event("sound-test:idle")));
  await themeToggle(page).click();
  await expectSoundState(page, false);
  expect(requests).toEqual([]);
  expect(await playback(page)).toEqual([]);
  expect(await page.evaluate(() => !!window.soundProbe.context)).toBe(false);
});

test("Sound icons animate in both directions without replacing SVGs", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const button = soundToggle(page);
  await expect(button).toBeEnabled();
  await expectSoundState(page, true);
  const icons = await button.locator("svg").elementHandles();
  expect(icons).toHaveLength(2);
  for (const icon of await button.locator("svg").all()) {
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon.locator("path, line, polyline")).not.toHaveCount(0);
    expect(
      await icon.evaluate((element) => ({
        duration: getComputedStyle(element).transitionDuration,
        easing: getComputedStyle(element).transitionTimingFunction,
      })),
    ).toEqual(
      await page.locator(".theme-button__moon").evaluate((element) => ({
        duration: getComputedStyle(element).transitionDuration,
        easing: getComputedStyle(element).transitionTimingFunction,
      })),
    );
  }
  for (const enabled of [false, true]) {
    const frame = await button.evaluate(async (element) => {
      if (!(element instanceof HTMLButtonElement))
        throw new Error("Expected a native sound button");
      element.click();
      await new Promise(requestAnimationFrame);
      const animations = element.getAnimations({ subtree: true });
      for (const animation of animations) {
        animation.pause();
        animation.currentTime =
          Number(animation.effect!.getTiming().duration) / 2;
      }
      return {
        properties: animations
          .filter(
            (animation): animation is CSSTransition =>
              animation instanceof CSSTransition,
          )
          .map((animation) => animation.transitionProperty),
        icons: Array.from(element.querySelectorAll("svg"), (icon) => ({
          opacity: Number(getComputedStyle(icon).opacity),
          transform: getComputedStyle(icon).transform,
        })),
      };
    });
    expect(frame.properties).toEqual(
      expect.arrayContaining(["opacity", "transform"]),
    );
    for (const icon of frame.icons) {
      expect(icon.opacity).toBeGreaterThan(0);
      expect(icon.opacity).toBeLessThan(1);
      expect(icon.transform).not.toBe("none");
      expect(icon.transform).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
    }
    await button.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true }))
        animation.finish();
    });
    await expectSoundState(page, enabled);
    for (const icon of icons) {
      expect(await icon.evaluate((element) => element.isConnected)).toBe(true);
    }
  }
});

test("Rapid keyboard toggles keep focus and persist the final mute", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const button = soundToggle(page);
  await expect(button).toBeEnabled();
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expectSoundState(page, false);
  await expect(button).toBeFocused();
  await page.reload();
  await expectSoundState(page, false);
});

test("Reduced motion changes the sound icon instantly without animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const button = soundToggle(page);
  await expect(button).toBeEnabled();
  for (const enabled of [false, true]) {
    await button.click();
    await expectSoundState(page, enabled);
    expect(
      await button.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
    await expect(button).toHaveCSS("transform", "none");
  }
});

test("Enabling confirms once and muting never plays an extra cue", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await soundToggle(page).click();
  await expectSoundState(page, false);
  expect(await playback(page)).toEqual([]);
  await soundToggle(page).click();
  await expect.poll(() => playback(page)).toHaveLength(1);
  expect(await playedSounds(page)).toEqual(["enable-sound"]);
  expect((await playback(page))[0]).toBeCloseTo(0.18, 2);
  await soundToggle(page).click();
  await expectSoundState(page, false);
  expect(await playback(page)).toHaveLength(1);
});

test("A cold enable confirms after loading without replaying other actions", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("sound-effect-enabled", "false"),
  );
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: string[] = [];
  await page.route(`**${soundPath}/*.wav`, async (route) => {
    requests.push(route.request().url());
    await blocked;
    await route.continue();
  });
  try {
    await page.goto("/");
    await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
    await soundToggle(page).click();
    await expect.poll(() => requests.length).toBe(soundNames.length);
    await themeToggle(page).click();
    expect(await playback(page)).toEqual([]);
    release();
    await ready(page);
    await expect.poll(() => playback(page)).toHaveLength(1);
    expect(await playedSounds(page)).toEqual(["enable-sound"]);
    expect((await playback(page))[0]).toBeCloseTo(0.18, 2);
  } finally {
    release();
  }
});

test("Plays one theme cue for mouse, Enter and Space, and mutes immediately", async ({
  page,
}) => {
  await page.goto("/");
  await enable(page);
  expect(await page.evaluate(() => window.soundProbe.gain?.gain.value)).toBe(
    0.25,
  );
  await themeToggle(page).click();
  await expect.poll(() => playback(page)).toHaveLength(1);
  await themeToggle(page).press("Enter");
  await expect.poll(() => playback(page)).toHaveLength(2);
  await themeToggle(page).press("Space");
  await expect.poll(() => playback(page)).toHaveLength(3);
  await soundToggle(page).click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
  await themeToggle(page).click();
  expect(await playback(page)).toHaveLength(3);
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("sound-effect-enabled")),
    )
    .toBe("false");
});

test("Shares preference across navigation, reloads and tabs without automatic cues", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await enable(page);
  await page
    .locator("nav")
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "true");
  expect(await playback(page)).toEqual([]);
  await page.reload();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "true");
  await ready(page);
  expect(await playback(page)).toEqual([]);
  const other = await context.newPage();
  await other.goto("/");
  await other.bringToFront();
  await expect(soundToggle(other)).toHaveAttribute("aria-pressed", "true");
  await soundToggle(other).click();
  await expect(soundToggle(other)).toHaveAttribute("aria-pressed", "false");
  await page.bringToFront();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
  await themeToggle(page).click();
  expect(await playback(page)).toEqual([]);
  await other.evaluate(() => localStorage.removeItem("sound-effect-enabled"));
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "true");
  expect(await playback(page)).toEqual([]);
  await other.evaluate(() => {
    localStorage.setItem("sound-effect-enabled", "false");
  });
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
  await other.evaluate(() => localStorage.clear());
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "true");
  expect(await playback(page)).toEqual([]);
  await other.close();
});

test("Rapid actions interrupt previous effects and muting stops active playback", async ({
  page,
}) => {
  await page.goto("/");
  await enable(page);
  await page.evaluate(() => {
    const theme = document.querySelector<HTMLButtonElement>(".theme-button")!;
    for (let i = 0; i < 4; i++) theme.click();
    document
      .querySelector<HTMLButtonElement>(".sound-control__button")!
      .click();
  });
  expect(await playback(page)).toHaveLength(4);
  expect(
    await page.evaluate(() => window.soundProbe.stops),
  ).toBeGreaterThanOrEqual(4);
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("Blocked context resumption is reported without replaying the click", async ({
  page,
}) => {
  await page.goto("/");
  await enable(page);
  await page.evaluate(async () => {
    const context = window.soundProbe.context!;
    await context.suspend();
    context.resume = () =>
      Promise.reject(new DOMException("Blocked", "NotAllowedError"));
  });
  await themeToggle(page).click();
  await expect(page.locator(".sound-control__error")).toContainText(
    "playback was blocked",
  );
  expect(await playback(page)).toEqual([]);
});

test("Playback failures are reported without blocking the action", async ({
  page,
}) => {
  await page.goto("/");
  await enable(page);
  await page.evaluate(() => {
    const context = window.soundProbe.context!;
    const createSource = context.createBufferSource;
    context.createBufferSource = () => {
      const source = createSource.call(context);
      source.start = () => {
        throw new DOMException("Playback unavailable", "InvalidStateError");
      };
      return source;
    };
  });
  const previous = await page.locator("html").getAttribute("data-theme");
  await themeToggle(page).click();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme",
    previous!,
  );
  await expect(page.locator(".sound-control__error")).toContainText(
    "playback failed",
  );
  expect(await playback(page)).toEqual([]);
  await soundToggle(page).click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
});

for (const { name, path, selector } of [
  { name: "header navigation", path: "/", selector: ".navigation__item" },
  { name: "post cards", path: "/", selector: ".post-card__title a" },
  { name: "next page", path: "/", selector: ".pager__next-button" },
  { name: "previous page", path: "/2/", selector: ".pager__previous-button" },
  {
    name: "portfolio cards",
    path: "/portfolio/",
    selector: ".portfolio-card__title a",
  },
  {
    name: "adjacent posts",
    path: "/on-the-etiquette-of-pull-request-comments/",
    selector: ".post-navigation__link",
  },
  {
    name: "footer links",
    path: "/",
    selector: '.footer__text a[href="https://nuxt.com"]',
  },
  {
    name: "article links",
    path: "/on-the-etiquette-of-pull-request-comments/",
    selector: ".post__content p a",
  },
  {
    name: "heading anchors",
    path: "/on-the-etiquette-of-pull-request-comments/",
    selector: ".anchor-link",
  },
  {
    name: "edit source",
    path: "/on-the-etiquette-of-pull-request-comments/",
    selector: ".post__edit",
  },
]) {
  test(`Ordinary ${name} stay silent on hover and activation`, async ({
    page,
  }) => {
    await page.goto(path);
    await ready(page);
    const link = page.locator(selector).first();
    await link.hover();
    await page.waitForTimeout(150);
    await link.evaluate((element: HTMLAnchorElement) => {
      element.addEventListener("click", (event) => event.preventDefault(), {
        capture: true,
        once: true,
      });
      element.click();
    });
    expect(await playedSounds(page)).toEqual([]);
  });
}

for (const [label, sound] of [
  ["Youtube", "youtube-play"],
  ["Twitch", "twitch-pop"],
  ["GitHub", "github-paw"],
  ["LinkedIn", "linkedin-connect"],
  ["Stack Overflow", "stack-overflow"],
  ["Bluesky", "bluesky-flutter"],
  ["Mastodon", "mastodon-puff"],
  ["Email", "email-paper"],
  ["RSS", "rss-ping"],
] as const) {
  test(`${label} has its own hover accent, with no extra click cue`, async ({
    page,
  }) => {
    await page.goto("/");
    await ready(page);
    const link = page.getByRole("link", { name: label, exact: true }).first();
    await expect(link).toHaveAttribute("data-sound-hover", sound);
    await link.hover();
    await expect.poll(() => playedSounds(page)).toEqual([sound]);
    await link.dispatchEvent("pointerenter", { pointerType: "mouse" });
    await page.waitForTimeout(150);
    await link.evaluate((element) => {
      element.addEventListener("click", (event) => event.preventDefault(), {
        capture: true,
        once: true,
      });
    });
    await link.click();
    expect(await playedSounds(page)).toEqual([sound]);
  });
}

test("Tag pills preview once on hover and navigate without an activation cue", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const tag = page.locator(".post-card .tags__link").first();
  const href = await tag.getAttribute("href");
  await tag.hover();
  await expect.poll(() => playedSounds(page)).toEqual(["tag-hover"]);
  await tag.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  expect(await playedSounds(page)).toEqual(["tag-hover"]);
});

test("Keyboard focus and activation stay silent, including social icons and tags", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const social = page
    .getByRole("link", { name: "Bluesky", exact: true })
    .first();
  await social.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
  });
  await social.focus();
  await page.waitForTimeout(150);
  await social.press("Enter");
  const tag = page.locator(".post-card .tags__link").first();
  const href = await tag.getAttribute("href");
  await tag.focus();
  await page.waitForTimeout(150);
  await tag.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  expect(await playedSounds(page)).toEqual([]);
  const about = page
    .locator("nav")
    .getByRole("link", { name: "About", exact: true });
  await about.focus();
  await about.press("Enter");
  await expect(page).toHaveURL(/\/about\/$/);
  expect(await playedSounds(page)).toEqual([]);
});

test("Quick passes, touch, downloads, disabled links and pointer-down cancel previews", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page
    .getByRole("link", { name: "Bluesky", exact: true })
    .first()
    .evaluate((element) => {
      const enter = (pointerType = "mouse") =>
        element.dispatchEvent(
          new PointerEvent("pointerenter", { pointerType }),
        );
      const leave = () =>
        element.dispatchEvent(new PointerEvent("pointerleave"));
      enter();
      leave();
      enter("touch");
      leave();
      element.setAttribute("download", "");
      enter();
      leave();
      element.removeAttribute("download");
      element.setAttribute("aria-disabled", "true");
      enter();
      leave();
      element.removeAttribute("aria-disabled");
      enter();
      element.dispatchEvent(
        new PointerEvent("pointerdown", { pointerType: "mouse" }),
      );
    });
  await page.waitForTimeout(150);
  expect(await playedSounds(page)).toEqual([]);
});

for (const event of ["pointerleave", "pointerdown"] as const) {
  test(`${event} stops a playing hover accent, not just its pending timer`, async ({
    page,
  }) => {
    await page.goto("/");
    await ready(page);
    await page.evaluate(() => {
      const context = window.soundProbe.context!;
      const createSource = context.createBufferSource;
      context.createBufferSource = () => {
        const source = createSource.call(context);
        source.loop = true;
        return source;
      };
    });
    const link = page
      .getByRole("link", { name: "Bluesky", exact: true })
      .first();
    await link.hover();
    await expect.poll(() => playedSounds(page)).toEqual(["bluesky-flutter"]);
    await link.dispatchEvent(event, { pointerType: "mouse" });
    await expect
      .poll(() => page.evaluate(() => window.soundProbe.active))
      .toBe(0);
    expect(await page.evaluate(() => window.soundProbe.stops)).toBe(1);
  });
}

for (const control of ["theme", "enable"] as const) {
  test(`Hover entry and exit never interrupt the ${control} confirmation`, async ({
    page,
  }) => {
    await page.goto("/");
    await ready(page);
    await page.evaluate(() => {
      const context = window.soundProbe.context!;
      const createSource = context.createBufferSource;
      context.createBufferSource = () => {
        const source = createSource.call(context);
        source.loop = true;
        return source;
      };
    });
    if (control === "theme") {
      await themeToggle(page).click();
    } else {
      await soundToggle(page).click();
      await soundToggle(page).click();
    }
    await expect.poll(() => playback(page)).toHaveLength(1);
    const confirmation = await playedSounds(page);
    if (control === "enable") expect(confirmation).toEqual(["enable-sound"]);
    await page.locator(".tags__link").first().hover();
    await page.waitForTimeout(150);
    await page.mouse.move(1, 1);
    expect(await playedSounds(page)).toEqual(confirmation);
    expect(await page.evaluate(() => window.soundProbe.stops)).toBe(0);
    await soundToggle(page).click();
    await expect
      .poll(() => page.evaluate(() => window.soundProbe.active))
      .toBe(0);
  });
}

test("A stale stop callback cannot stop a newer instance of the same sample", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const result = await page.evaluate(() => {
    const root = document.querySelector<
      HTMLElement & {
        __vue_app__: { config: { globalProperties: { $nuxt: NuxtApp } } };
      }
    >("#__nuxt")!;
    const audio = root.__vue_app__.config.globalProperties.$nuxt.$soundEffect;
    const first = audio.play("github-paw")!;
    first();
    const second = audio.play("github-paw")!;
    const stops = window.soundProbe.stops;
    first();
    const staleStoppedNewer = window.soundProbe.stops !== stops;
    second();
    return { staleStoppedNewer, stops: window.soundProbe.stops };
  });
  expect(result).toEqual({ staleStoppedNewer: false, stops: 2 });
  expect(await playedSounds(page)).toEqual(["github-paw", "github-paw"]);
});

test("Route unmount stops an active tag preview", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.evaluate(() => {
    const context = window.soundProbe.context!;
    const createSource = context.createBufferSource;
    context.createBufferSource = () => {
      const source = createSource.call(context);
      source.loop = true;
      return source;
    };
  });
  await page.locator(".post-card .tags__link").first().hover();
  await expect.poll(() => playedSounds(page)).toEqual(["tag-hover"]);
  await page
    .locator("nav")
    .getByRole("link", { name: "About", exact: true })
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/\/about\/$/);
  await expect
    .poll(() => page.evaluate(() => window.soundProbe.active))
    .toBe(0);
  expect(await page.evaluate(() => window.soundProbe.stops)).toBe(1);
});

test("Muting and route unmount cancel pending tag previews", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page
    .locator(".post-card .tags__link")
    .first()
    .evaluate((element) => {
      element.dispatchEvent(
        new PointerEvent("pointerenter", { pointerType: "mouse" }),
      );
      document
        .querySelector<HTMLButtonElement>(".sound-control__button")!
        .click();
    });
  await page.waitForTimeout(150);
  expect(await playedSounds(page)).toEqual([]);
  await soundToggle(page).click();
  await expect.poll(() => playedSounds(page)).toEqual(["enable-sound"]);
  await clearPlayback(page);
  await page
    .locator(".post-card .tags__link")
    .first()
    .evaluate((element) => {
      element.dispatchEvent(
        new PointerEvent("pointerenter", { pointerType: "mouse" }),
      );
      document
        .querySelector<HTMLAnchorElement>('.navigation__item[href="/about/"]')!
        .click();
    });
  await expect(page).toHaveURL(/\/about\/$/);
  await page.waitForTimeout(150);
  expect(await playedSounds(page)).toEqual([]);
});

test("Search opening, typing, result hover and selection, and dismissal stay silent", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill("ASP.NET");
  const result = page.locator(".search-result__link").first();
  await result.hover();
  await page.waitForTimeout(150);
  await result.click();
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeHidden();
  expect(await playedSounds(page)).toEqual([]);
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await page.getByRole("button", { name: "Close Search", exact: true }).click();
  expect(await playedSounds(page)).toEqual([]);
  await page.goto("/?search=ASP.NET");
  await ready(page);
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  expect(await playedSounds(page)).toEqual([]);
  await page.getByRole("searchbox", { name: "Search", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeHidden();
  expect(await playedSounds(page)).toEqual([]);
});

test("Coffee, support links and fallback sharing remain silent and functional", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
  });
  await page.goto("/on-the-etiquette-of-pull-request-comments/");
  await ready(page);
  await page
    .getByRole("button", { name: "Buy me a Coffee", exact: true })
    .click();
  const support = page.locator(".support-links .link-button").first();
  await support.hover();
  await page.waitForTimeout(150);
  await support.evaluate((element: HTMLAnchorElement) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    element.click();
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Share", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Share", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Share", exact: true }),
  ).toBeHidden();
  expect(await playedSounds(page)).toEqual([]);
});

test("Native sharing stays synchronous without an audio cue", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      value: () => {
        document.documentElement.dataset.shared = "true";
        return Promise.resolve();
      },
    });
  });
  await page.goto("/on-the-etiquette-of-pull-request-comments/");
  await ready(page);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-shared", "true");
  expect(await playedSounds(page)).toEqual([]);
});

test("Newsletter validation, typing and submission are silent, with no false success cue", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const form = page.locator(".newsletter__form");
  await form.evaluate((element) => {
    element.addEventListener("submit", (event) => {
      event.preventDefault();
      element.setAttribute("data-submitted", "true");
    });
  });
  await form.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(form).not.toHaveAttribute("data-submitted");
  await form.getByRole("textbox").fill("reader@example.com");
  await form.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(form).toHaveAttribute("data-submitted", "true");
  expect(await playedSounds(page)).toEqual([]);
});

test("A saved mute fetches nothing and silences social hover, tags and navigation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("sound-effect-enabled", "false"),
  );
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/sounds/")) requests.push(request.url());
  });
  await page.goto("/");
  await expectSoundState(page, false);
  await page
    .getByRole("link", { name: "Bluesky", exact: true })
    .first()
    .hover();
  await page.waitForTimeout(150);
  await page.locator(".tags__link").first().hover();
  await page.waitForTimeout(150);
  await page
    .locator("nav")
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about\/$/);
  await page.reload();
  await expectSoundState(page, false);
  expect(await playedSounds(page)).toEqual([]);
  expect(requests).toEqual([]);
});

for (const outcome of ["accepted", "dismissed", "error"] as const) {
  test(`App installation ${outcome} remains silent`, async ({ page }) => {
    await page.goto("/");
    await ready(page);
    await page.evaluate((outcome) => {
      const event = Object.assign(
        new Event("beforeinstallprompt", { cancelable: true }),
        {
          prompt: async () => {},
        },
      );
      Object.defineProperty(event, "userChoice", {
        get: () =>
          outcome === "error"
            ? Promise.reject(new Error("Install failed"))
            : Promise.resolve({ outcome }),
      });
      window.dispatchEvent(event);
    }, outcome);
    const install = page.getByRole("button", { name: "Install the app" });
    await expect(install).toBeVisible();
    await install.click();
    await expect(install).toBeHidden();
    expect(await playedSounds(page)).toEqual([]);
  });
}

test("Update notifications, dismissal and applying updates remain silent", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page.evaluate(() => {
    const root = document.querySelector<
      HTMLElement & {
        __vue_app__: { config: { globalProperties: { $nuxt: NuxtApp } } };
      }
    >("#__nuxt")!;
    const pwa = root.__vue_app__.config.globalProperties.$nuxt.$pwa!;
    pwa.needRefresh = true;
    pwa.updateServiceWorker = async () => {};
    window.addEventListener(
      "sound-test:update",
      () => (pwa.needRefresh = true),
    );
  });
  const notice = page.getByRole("region", { name: "Site update" });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Later", exact: true }).click();
  await expect(notice).toHaveCount(0);
  await page.evaluate(() =>
    window.dispatchEvent(new Event("sound-test:update")),
  );
  await notice.getByRole("button", { name: "Update now", exact: true }).click();
  expect(await playedSounds(page)).toEqual([]);
});

test("Late samples do not replay clicks or sound after muting", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("sound-effect-enabled", "false"),
  );
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**${soundPath}/*.wav`, async (route) => {
    await blocked;
    await route.continue();
  });
  try {
    await page.goto("/");
    await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
    await soundToggle(page).click();
    await themeToggle(page).click();
    await soundToggle(page).click();
    release();
    await ready(page);
    await themeToggle(page).click();
    expect(await playback(page)).toEqual([]);
  } finally {
    release();
  }
});

test("Failed samples are reported without breaking controls and can be retried", async ({
  page,
}) => {
  await page.route(`**${soundPath}/*.wav`, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".sound-control__error")).toContainText(
    "could not be loaded",
  );
  await themeToggle(page).click();
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(await playback(page)).toEqual([]);
  await soundToggle(page).click();
  await page.unroute(`**${soundPath}/*.wav`);
  await enable(page);
  await expect(page.locator(".sound-control__error")).toHaveCount(0);
  await expect.poll(() => playback(page)).toHaveLength(1);
  await themeToggle(page).click();
  await expect.poll(() => playback(page)).toHaveLength(2);
});

test("Storage failures are reported and the tab can still enable and mute", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage unavailable");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await page.goto("/");
  await expect(page.locator(".sound-control__error")).toContainText(
    "could not be read",
  );
  await enable(page);
  await expect(page.locator(".sound-control__error")).toContainText(
    "could not be saved",
  );
  await themeToggle(page).click();
  await expect.poll(() => playback(page)).toHaveLength(2);
  await soundToggle(page).click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
});

for (const width of [375, 1280]) {
  test(`Header control fits both themes at ${width}px below the theme toggle`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await expect(soundToggle(page)).toBeVisible();
      const box = await soundToggle(page).boundingBox();
      const themeBox = await themeToggle(page).boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.y).toBeGreaterThanOrEqual(themeBox!.y + themeBox!.height);
      expect(box!.x + box!.width / 2).toBeCloseTo(
        themeBox!.x + themeBox!.width / 2,
        1,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await themeToggle(page).focus();
    await page.keyboard.press("Tab");
    await expect(soundToggle(page)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(themeToggle(page)).toBeFocused();
  });
}

test("Original samples are small, quiet mono WAVs with click-free endpoints", async () => {
  expect(
    (await readdir(soundDirectory))
      .filter((name) => name.endsWith(".wav"))
      .map((name) => name.replace(".wav", ""))
      .sort(),
  ).toEqual([...soundNames].sort());
  let bytes = 0;
  for (const name of soundNames) {
    const buffer = await readFile(join(soundDirectory, `${name}.wav`));
    bytes += buffer.length;
    expect(buffer.toString("ascii", 0, 4)).toBe("RIFF");
    expect(buffer.toString("ascii", 8, 16)).toBe("WAVEfmt ");
    expect(buffer.readUInt16LE(20)).toBe(1);
    expect(buffer.readUInt16LE(22)).toBe(1);
    expect(buffer.readUInt32LE(24)).toBe(22050);
    expect(buffer.readUInt16LE(34)).toBe(16);
    expect(buffer.readInt16LE(44)).toBe(0);
    expect(buffer.readInt16LE(buffer.length - 2)).toBe(0);
    const duration = (buffer.length - 44) / 2 / 22050;
    expect(duration).toBeGreaterThanOrEqual(0.05);
    expect(duration).toBeLessThanOrEqual(0.3);
    let peak = 0;
    for (let offset = 44; offset < buffer.length; offset += 2) {
      peak = Math.max(peak, Math.abs(buffer.readInt16LE(offset)) / 32768);
    }
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(0.3);
    if ((hoverSoundNames as readonly string[]).includes(name)) {
      expect(peak).toBeLessThanOrEqual(0.081);
    }
  }
  expect(bytes).toBeLessThan(150000);
});

test("The original palette has different timbres, not pitch-shifted copies of one chirp", async () => {
  const samples = new Map<string, number[]>();
  const fingerprints = new Set<string>();
  for (const name of soundNames) {
    const buffer = await readFile(join(soundDirectory, `${name}.wav`));
    const values: number[] = [];
    for (let offset = 44; offset < buffer.length; offset += 2) {
      values.push(buffer.readInt16LE(offset) / 32768);
    }
    samples.set(name, values);
    fingerprints.add(buffer.subarray(44).toString("base64"));
  }
  expect(fingerprints.size).toBe(soundNames.length);

  function flatness(values: number[]) {
    const size = 256;
    let total = 0;
    let weight = 0;
    for (let start = 0; start + size <= values.length; start += size) {
      const frame = values
        .slice(start, start + size)
        .map(
          (value, index) =>
            value * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1))),
        );
      const energy = frame.reduce((sum, value) => sum + value * value, 0);
      if (energy < 1e-8) continue;
      const powers: number[] = [];
      for (let bin = 1; bin < size / 2; bin++) {
        let real = 0;
        let imaginary = 0;
        for (let index = 0; index < size; index++) {
          const phase = (2 * Math.PI * bin * index) / size;
          real += frame[index]! * Math.cos(phase);
          imaginary += frame[index]! * Math.sin(phase);
        }
        powers.push(real * real + imaginary * imaginary + 1e-16);
      }
      const arithmetic =
        powers.reduce((sum, value) => sum + value, 0) / powers.length;
      const geometric = Math.exp(
        powers.reduce((sum, value) => sum + Math.log(value), 0) / powers.length,
      );
      total += (geometric / arithmetic) * energy;
      weight += energy;
    }
    return total / weight;
  }

  // Paper/noise and pitched plucks must have measurably different spectra.
  const paper = flatness(samples.get("email-paper")!);
  const pluck = flatness(samples.get("linkedin-connect")!);
  expect(paper).toBeGreaterThan(0.1);
  expect(pluck).toBeLessThan(0.02);
  expect(paper).toBeGreaterThan(pluck * 10);
  expect(flatness(samples.get("bluesky-flutter")!)).toBeGreaterThan(0.1);
  expect(flatness(samples.get("rss-ping")!)).toBeLessThan(0.02);
  const flutter = samples.get("bluesky-flutter")!;
  for (const start of [0, 0.05, 0.1, 0.15]) {
    expect(
      flutter
        .slice(
          Math.round((start + 0.004) * 22050),
          Math.round((start + 0.025) * 22050),
        )
        .some((value) => Math.abs(value) > 0.001),
    ).toBe(true);
    expect(
      flutter
        .slice(
          Math.round((start + 0.04) * 22050),
          Math.round((start + 0.05) * 22050),
        )
        .every((value) => value === 0),
    ).toBe(true);
  }
});

test.describe("Sound runtime cache", () => {
  test.use({ serviceWorkers: "allow" });

  test("Fetches no samples for muted users and caches an expanding palette offline", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName === "firefox",
      "Firefox offline emulation bypasses service workers.",
    );
    test.slow();
    await page.addInitScript(() => {
      if (localStorage.getItem("sound-effect-enabled") === null) {
        localStorage.setItem("sound-effect-enabled", "false");
      }
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            resolve,
            { once: true },
          ),
        );
      }
    });
    const cachedSounds = () =>
      page.evaluate(async () => {
        const cache = await caches.open("ui-sounds-v1");
        return (await cache.keys())
          .map((request) => new URL(request.url).pathname)
          .sort();
      });
    expect(await cachedSounds()).toEqual([]);
    await enable(page);
    await expect.poll(cachedSounds).toHaveLength(soundNames.length);
    const originalSounds = await cachedSounds();
    expect(
      originalSounds.every((path) => path.startsWith(`${soundPath}/`)),
    ).toBe(true);
    const futureSounds = [
      "/sounds/v3/future-1.wav",
      "/sounds/v3/future-2.wav",
      "/sounds/v3/future-3.wav",
      "/sounds/v4/future-4.wav",
    ];
    const sample = await readFile(join(soundDirectory, "toggle-on.wav"));
    const futurePattern = "**/sounds/v*/future-*.wav";
    await context.route(futurePattern, (route) =>
      route.fulfill({ contentType: "audio/wav", body: sample }),
    );
    const fetchFutureSounds = () =>
      page.evaluate(
        (paths) =>
          Promise.all(
            paths.map(async (path) => {
              const response = await fetch(path);
              return {
                status: response.status,
                bytes: (await response.arrayBuffer()).byteLength,
              };
            }),
          ),
        futureSounds,
      );
    const expectedResponses = futureSounds.map(() => ({
      status: 200,
      bytes: sample.length,
    }));
    expect(await fetchFutureSounds()).toEqual(expectedResponses);
    await expect
      .poll(cachedSounds)
      .toEqual([...originalSounds, ...futureSounds].sort());
    await context.unroute(futurePattern);
    await context.setOffline(true);
    await page.reload();
    await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "true");
    await ready(page);
    await themeToggle(page).click();
    await expect.poll(() => playback(page)).toHaveLength(1);
    expect(await fetchFutureSounds()).toEqual(expectedResponses);
  });
});
