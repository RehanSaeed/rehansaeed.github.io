import type { E2EFixtures } from "./fixtures";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { NuxtApp } from "nuxt/app";
import { manifestSchema } from "./data";

async function announcePrompt(
  page: Page,
  outcome: "accepted" | "dismissed" | "error" = "dismissed",
) {
  return page.evaluate((outcome) => {
    const event = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        prompt: () => {
          const root = document.documentElement;
          root.dataset.promptCalls = String(
            Number(root.dataset.promptCalls ?? 0) + 1,
          );
          return Promise.resolve();
        },
      },
    );
    Object.defineProperty(event, "userChoice", {
      get() {
        return outcome === "error"
          ? Promise.reject(new Error("Install prompt failed"))
          : Promise.resolve({ outcome });
      },
    });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }, outcome);
}

test.beforeEach(async ({ page, baseURL }) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ contentType: "text/plain", body: "" }),
  );
});

test("Manifest preserves install identity and serves valid desktop and mobile previews", async ({
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = manifestSchema.parse(await response.json());
  expect(manifest).toMatchObject({
    id: "/",
    start_url: "/",
    scope: "/",
    display: "minimal-ui",
  });
  expect(manifest.orientation).toBeUndefined();
  expect(manifest.prefer_related_applications).not.toBe(true);
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(
      (icon) => icon.sizes === `${size}x${size}` && icon.purpose === "any",
    );
    expect(icon).toBeDefined();
    const image = await request.get(icon!.src);
    expect(image.ok()).toBe(true);
    const png = await image.body();
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
  expect(manifest.screenshots).toHaveLength(6);
  for (const formFactor of ["wide", "narrow"]) {
    const screenshots = manifest.screenshots.filter(
      (image: { form_factor: string }) => image.form_factor === formFactor,
    );
    expect(screenshots).toHaveLength(3);
    for (const screenshot of screenshots) {
      expect(screenshot.label).toBeTruthy();
      const response = await request.get(screenshot.src);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain(screenshot.type);
      const png = await response.body();
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      expect(screenshot.sizes).toBe(`${width}x${height}`);
      expect([width, height].every((size) => size >= 320 && size <= 3840)).toBe(
        true,
      );
      expect(
        Math.max(width, height) / Math.min(width, height),
      ).toBeLessThanOrEqual(2.3);
      expect(width > height).toBe(formFactor === "wide");
    }
  }
});

test("Chrome reports no manifest installability errors", async ({
  page,
  context,
  browserName,
}) => {
  // Only Chromium exposes the CDP installability API exercised by this test.
  test.skip(browserName !== "chromium", "Chrome DevTools protocol is required");
  await page.goto("/");
  const session = await context.newCDPSession(page);
  try {
    await session.send("Page.enable");
    await expect
      .poll(async () => {
        const { installabilityErrors } = await session.send(
          "Page.getInstallabilityErrors",
        );
        // Playwright's isolated context is intentionally incognito.
        return installabilityErrors.filter(
          ({ errorId }) => errorId !== "in-incognito",
        );
      })
      .toEqual([]);
  } finally {
    await session.detach();
  }
});

test("Install button waits for browser eligibility and consumes each prompt once", async ({
  page,
}) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Install the app" });
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await expect(button).toBeHidden();
  expect(await announcePrompt(page)).toBe(true);
  await expect(button).toBeVisible();
  await button.focus();
  await expect(
    page.getByRole("tooltip", { name: "Install the app" }),
  ).toBeVisible();
  await expect(button).toHaveAccessibleDescription("Install the app");
  await button.click();
  await expect(button).toBeHidden();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-prompt-calls", "1");
  expect(await announcePrompt(page, "accepted")).toBe(true);
  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-prompt-calls", "2");
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(button).toBeHidden();
});

test("Update dismiss control describes its action and removes its tooltip", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await page.evaluate(() => {
    const root = document.querySelector<
      HTMLElement & {
        __vue_app__: { config: { globalProperties: { $nuxt: NuxtApp } } };
      }
    >("#__nuxt")!;
    root.__vue_app__.config.globalProperties.$nuxt.$pwa!.needRefresh = true;
  });
  const notice = page.getByRole("region", { name: "Site update" });
  const dismiss = notice.getByRole("button", { name: "Dismiss site update" });
  await dismiss.focus();
  await expect(
    page.getByRole("tooltip", { name: "Dismiss update notification" }),
  ).toBeVisible();
  await expect(dismiss).toHaveAccessibleDescription(
    "Dismiss update notification",
  );
  await dismiss.click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("Install prompt captured before component mount survives client navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Preserve the original method and receiver while intercepting registration.
    const addEventListener = window.addEventListener;
    window.addEventListener = function (
      ...args: Parameters<typeof window.addEventListener>
    ) {
      addEventListener.apply(window, args);
      if (args[0] === "beforeinstallprompt") {
        window.addEventListener = addEventListener;
        // Dispatch synchronously at registration, before the plugin finishes setup.
        document.documentElement.dataset.promptBeforeButton = String(
          document.querySelector(".install-button")?.hasAttribute("disabled") ??
            true,
        );
        window.dispatchEvent(
          Object.assign(
            new Event("beforeinstallprompt", { cancelable: true }),
            {
              prompt: () => {
                document.documentElement.dataset.promptCalls = "1";
                return Promise.resolve();
              },
              userChoice: Promise.resolve({ outcome: "dismissed" }),
            },
          ),
        );
      }
    };
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-prompt-before-button",
    "true",
  );
  const button = page.getByRole("button", { name: "Install the app" });
  await expect(button).toBeVisible();
  await page.getByRole("link", { name: "About", exact: true }).first().click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator("html")).toHaveAttribute("data-prompt-calls", "1");
});

test("Prompt failures are reported and a fresh eligibility event can recover", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await announcePrompt(page, "error");
  const button = page.getByRole("button", { name: "Install the app" });
  await button.click();
  await expect(button).toBeHidden();
  await expect
    .poll(() =>
      errors.some((error) => error.includes("PWA installation failed")),
    )
    .toBe(true);
  await announcePrompt(page);
  await expect(button).toBeVisible();
});

test("Installed display modes do not offer another installation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const result = matchMedia(query);
      if (query === "(display-mode: minimal-ui)") {
        Object.defineProperty(result, "matches", { value: true });
      }
      return result;
    };
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await announcePrompt(page);
  await expect(
    page.getByRole("button", { name: "Install the app" }),
  ).toBeHidden();
});

for (const fails of [false, true]) {
  async function verifyPackageUpdateNotice({
    page,
  }: Pick<E2EFixtures, "page">) {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Open search" }),
    ).toBeEnabled();
    await page.evaluate((fails) => {
      const root = document.querySelector<
        HTMLElement & {
          __vue_app__: { config: { globalProperties: { $nuxt: NuxtApp } } };
        }
      >("#__nuxt")!;
      const pwa = root.__vue_app__.config.globalProperties.$nuxt.$pwa!;
      pwa.needRefresh = true;
      pwa.updateServiceWorker = () => {
        document.documentElement.dataset.packageUpdateCalls = "1";
        if (fails) {
          return Promise.reject(new Error("Test package update failure"));
        }
        pwa.needRefresh = false;
        return Promise.resolve();
      };
    }, fails);
    const notice = page.getByRole("region", { name: "Site update" });
    await expect(notice).toBeVisible();
    await notice
      .getByRole("button", { name: "Update now", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-package-update-calls",
      "1",
    );
    if (fails) {
      await expect(notice).toContainText(
        "The update is not ready. Please try again when online.",
      );
      await expect(
        notice.getByRole("button", { name: "Update now", exact: true }),
      ).toBeEnabled();
    } else {
      await expect(notice).toHaveCount(0);
    }
  }

  test(`Update notice delegates to the package${fails ? " and reports failures" : ""}`, async ({
    page,
  }) => {
    await expect(
      verifyPackageUpdateNotice({
        page,
      }),
    ).resolves.toBeUndefined();
  });
}
