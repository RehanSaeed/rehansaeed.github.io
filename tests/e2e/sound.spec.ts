import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { delayClientScripts, expect, test } from "./fixtures";

declare global {
  interface Window {
    soundProbe: {
      decoded: number;
      starts: number[];
      stops: number;
      context?: AudioContext;
    };
  }
}

const soundToggle = (page: Page) =>
  page.getByRole("button", { name: "Sound effects", exact: true });
const themeToggle = (page: Page) =>
  page.getByRole("button", { name: "Toggle dark/light" });
const playback = (page: Page) => page.evaluate(() => window.soundProbe.starts);

async function ready(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.soundProbe.decoded))
    .toBe(4);
  // Loading the lazy engine is not a gesture. Unlock without producing a UI cue.
  await page.mouse.click(1, 1);
  await expect
    .poll(() => page.evaluate(() => window.soundProbe.context?.state))
    .toBe("running");
}

async function enable(page: Page) {
  await soundToggle(page).click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "true");
  await ready(page);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.soundProbe = { decoded: 0, starts: [], stops: 0 };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (...args) {
      const result = decode.apply(this, args);
      void result.then(
        () => window.soundProbe.decoded++,
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
      source.start = function (...args) {
        if (source.buffer && source.buffer.duration > 0.01) {
          window.soundProbe.starts.push(source.buffer.duration);
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

test("Remains silent and does not request samples until explicitly enabled", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/sounds/")) requests.push(request.url());
  });
  await page.goto("/");
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
  await themeToggle(page).click();
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await page.getByRole("button", { name: "Close Search", exact: true }).click();
  expect(requests).toEqual([]);
  expect(await playback(page)).toEqual([]);

  await enable(page);
  expect(requests).toHaveLength(4);
  expect(await playback(page)).toEqual([]);
});

test("Hydration guards the sound toggle", async ({ page }) => {
  const scripts = await delayClientScripts(page);
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(soundToggle(page)).toBeDisabled();
    await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
    scripts.resume();
    await expect(soundToggle(page)).toBeEnabled();
  } finally {
    await scripts.dispose();
  }
});

test("An early opt-in is not restarted by delayed preference restoration", async ({
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
  await page.route("**/sounds/v1/*.wav", async (route) => {
    requests.push(route.request().url());
    await blocked;
    await route.continue();
  });
  try {
    await page.goto("/");
    await soundToggle(page).click();
    await expect.poll(() => requests.length).toBe(4);
    await page.evaluate(() =>
      window.dispatchEvent(new Event("sound-test:idle")),
    );
    release();
    await ready(page);
    expect(requests).toHaveLength(4);
    await expect(page.locator(".sound-control__error")).toBeHidden();
    await themeToggle(page).click();
    await expect.poll(() => playback(page)).toHaveLength(1);
  } finally {
    release();
  }
});

test("Plays one theme cue for mouse, Enter and Space, and mutes immediately", async ({
  page,
}) => {
  await page.goto("/");
  await enable(page);
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

test("Shares preference across navigation, reloads and tabs without autoplay", async ({
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
  await expect(soundToggle(other)).toHaveAttribute("aria-pressed", "true");
  await soundToggle(other).click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
  await themeToggle(page).click();
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

test("Sounds on explicit dialog dismissal once, but not on deep links or result navigation", async ({
  page,
}) => {
  await page.goto("/");
  await enable(page);
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await expect.poll(() => playback(page)).toHaveLength(1);
  await page.getByRole("button", { name: "Close Search", exact: true }).click();
  await expect.poll(() => playback(page)).toHaveLength(2);
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await expect.poll(() => playback(page)).toHaveLength(3);
  await page.keyboard.press("Escape");
  await expect.poll(() => playback(page)).toHaveLength(4);
  await page.goto("/?search=ASP.NET");
  await ready(page);
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  expect(await playback(page)).toEqual([]);
  await page.locator(".search-result__link").first().click();
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeHidden();
  expect(await playback(page)).toEqual([]);
});

test("Coffee and fallback Share dialogs reuse the open and close palette", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
  });
  await page.goto("/");
  await enable(page);
  await page.locator(".post-card__title").first().click();
  await page
    .getByRole("button", { name: "Buy me a Coffee", exact: true })
    .click();
  await expect.poll(() => playback(page)).toHaveLength(1);
  await page.keyboard.press("Escape");
  await expect.poll(() => playback(page)).toHaveLength(2);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect.poll(() => playback(page)).toHaveLength(3);
  await page.getByRole("button", { name: "Close Share", exact: true }).click();
  await expect.poll(() => playback(page)).toHaveLength(4);
});

test("Native sharing stays synchronous and silent", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      value: () => {
        document.documentElement.dataset.shared = "true";
        return Promise.resolve();
      },
    });
  });
  await page.goto("/");
  await enable(page);
  await page.locator(".post-card__title").first().click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-shared", "true");
  expect(await playback(page)).toEqual([]);
});

test("Late samples do not replay clicks or sound after muting", async ({
  page,
}) => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/sounds/v1/*.wav", async (route) => {
    await blocked;
    await route.continue();
  });
  try {
    await page.goto("/");
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
  await page.route("**/sounds/v1/*.wav", (route) => route.abort());
  await page.goto("/");
  await soundToggle(page).click();
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
  await page.unroute("**/sounds/v1/*.wav");
  await enable(page);
  await expect(page.locator(".sound-control__error")).toHaveCount(0);
  await themeToggle(page).click();
  await expect.poll(() => playback(page)).toHaveLength(1);
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
  await expect.poll(() => playback(page)).toHaveLength(1);
  await soundToggle(page).click();
  await expect(soundToggle(page)).toHaveAttribute("aria-pressed", "false");
});

for (const width of [375, 1280]) {
  test(`Header control fits both themes at ${width}px and precedes sound actions`, async ({
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
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await soundToggle(page).focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeFocused();
  });
}

test("Original samples are small, quiet mono WAVs with click-free endpoints", async () => {
  let bytes = 0;
  for (const name of [
    "toggle-on",
    "toggle-off",
    "dialog-open",
    "dialog-close",
  ]) {
    const buffer = await readFile(
      join("public", "sounds", "v1", `${name}.wav`),
    );
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
    expect(duration).toBeGreaterThanOrEqual(0.07);
    expect(duration).toBeLessThanOrEqual(0.13);
    let peak = 0;
    for (let offset = 44; offset < buffer.length; offset += 2) {
      peak = Math.max(peak, Math.abs(buffer.readInt16LE(offset)) / 32768);
    }
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(0.3);
  }
  expect(bytes).toBeLessThan(20000);
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
    await expect.poll(cachedSounds).toHaveLength(4);
    const originalSounds = await cachedSounds();
    const futureSounds = [
      "/sounds/v1/future-1.wav",
      "/sounds/v1/future-2.wav",
      "/sounds/v1/future-3.wav",
      "/sounds/v2/future-4.wav",
    ];
    const sample = await readFile(
      join("public", "sounds", "v1", "toggle-on.wav"),
    );
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
