import { createHash } from "node:crypto";
import { globSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import type { Router } from "vue-router";
import { controlled, saved, test } from "./offline-fixtures";

const article = "/on-the-etiquette-of-pull-request-comments/";
const unvisited = "/gitattributes-best-practices/";

test("Cold installation is small; visited direct and client navigation work with the server stopped", async ({
  page,
  context,
  site,
}) => {
  const start = Date.now();
  await page.goto(`${site.origin}${article}`);
  await controlled(page);
  const activationMs = Date.now() - start;
  expect(activationMs).toBeLessThan(30_000);
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
  ).toBe(`${site.origin}/service-worker.js`);
  // Activation alone is not content readiness: wait for both representations.
  await saved(page, article);
  await page.getByRole("link", { name: "About", exact: true }).first().click();
  await expect(page).toHaveURL(`${site.origin}/about/`);
  await saved(page, "/about/");
  // Use the fixture's exact byte lengths: reading cached AVIF bodies through
  // Firefox automation can hang. Verify image delivery by rendering below.
  const metrics = await page.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find((name) => name.startsWith("blog-essential-v1-"));
    if (!name) {
      throw new Error("Missing essential precache.");
    }
    const cache = await caches.open(name);
    const keys = await cache.keys();
    let bytes = 0;
    for (const key of keys) {
      const length = Number(
        (await cache.match(key))!.headers.get("Content-Length"),
      );
      if (!Number.isInteger(length) || length <= 0) {
        throw new Error(`Missing byte length for ${key.url}`);
      }
      bytes += length;
    }
    const runtime = [];
    for (const name of names.filter(
      (name) => name.startsWith("blog-") && !name.includes("essential"),
    )) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      let bytes = 0;
      for (const request of requests) {
        const length = Number(
          (await cache.match(request))!.headers.get("Content-Length"),
        );
        if (!Number.isInteger(length) || length <= 0) {
          throw new Error(`Missing byte length for ${request.url}`);
        }
        bytes += length;
      }
      runtime.push({ name, entries: requests.length, bytes });
    }
    return { entries: keys.length, bytes, names, runtime };
  });
  expect(metrics.entries).toBeLessThanOrEqual(5);
  expect(metrics.bytes).toBeLessThan(256 * 1024);
  console.log("Cold worker installation and precache metrics:", {
    activationMs,
    visitedContentReadyMs: Date.now() - start,
    ...metrics,
  });
  await site.stop();
  // Firefox setOffline bypasses worker handling. Stop the actual origin instead;
  // Routing also prevents the HTTP cache answering these loads.
  expect(
    (await page.goto(`${site.origin}${article}`))!.fromServiceWorker(),
  ).toBe(true);
  await expect(page.locator(".post-page__content")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".post__photo")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await page.getByRole("link", { name: "About", exact: true }).first().click();
  await expect(page).toHaveURL(`${site.origin}/about/`);
  await expect(page).toHaveTitle(/^About/);
  expect(
    (await page.goto(`${site.origin}${unvisited}`))!.fromServiceWorker(),
  ).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Offline reading" }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText(
    "Installing the app does not download the entire blog.",
  );
  await expect(page.locator("main")).toContainText(
    "Unvisited articles are not guaranteed offline.",
  );
  // A fresh tab has no in-memory Nuxt data from the online visits.
  const fresh = await context.newPage();
  await fresh.goto(`${site.origin}${article}`);
  await expect(fresh.locator(".post-page__content")).toBeVisible();
});

test("Payload probes reuse saved data while normal requests refresh it", async ({
  page,
  site,
}) => {
  await page.goto(`${site.origin}/`);
  await controlled(page);
  expect(
    await page.evaluate(async () =>
      (await fetch("/probe/_payload.json")).text(),
    ),
  ).toBe('{"version":1}');
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (
          await caches.match(new URL("/probe/_payload.json", location.origin))
        )?.text(),
      ),
    )
    .toBe('{"version":1}');
  site.updateProbe();
  expect(
    await page.evaluate(async () =>
      (
        await fetch("/probe/_payload.json", {
          headers: { "X-Blog-Cache-Probe": "1" },
        })
      ).text(),
    ),
  ).toBe('{"version":1}');
  expect(
    await page.evaluate(async () =>
      (await fetch("/probe/_payload.json")).text(),
    ),
  ).toBe('{"version":2}');
});

test("A missing client payload becomes an accessible document fallback", async ({
  page,
  site,
}) => {
  await page.goto(`${site.origin}/`);
  await controlled(page);
  await saved(page, "/");
  await site.stop();
  await page.evaluate((path) => {
    const root = document.querySelector<
      HTMLElement & {
        __vue_app__: {
          config: { globalProperties: { $nuxt: { $router: Router } } };
        };
      }
    >("#__nuxt")!;
    void root.__vue_app__.config.globalProperties.$nuxt.$router.push(path);
  }, unvisited);
  await expect(page).toHaveURL(`${site.origin}${unvisited}`);
  await expect(
    page.getByRole("heading", { name: "Offline reading" }),
  ).toBeVisible();
});

async function legacyWorker() {
  // Representative prior generateSW worker: real Workbox revision keys and
  // cache naming, bounded content subset so this is not the failing full install.
  const generated = await readFile(join("dist", "service-worker.js"), "utf8");
  const workboxModule = generated.match(/define\(\["(\.\/workbox-[^"]+)"/)?.[1];
  if (!workboxModule) {
    throw new Error("Cannot locate the generated Workbox module.");
  }
  const manifest = await Promise.all(
    [
      // Cold hydration also needs the build metadata present in the old full cache.
      ...globSync("_nuxt/**/*.{js,css,woff2,json}", { cwd: "dist" }),
      `${article.slice(1)}index.html`,
      `${article.slice(1)}_payload.json`,
    ].map(async (path) => ({
      url: path.replaceAll("\\", "/"),
      revision: createHash("md5")
        .update(await readFile(join("dist", path)))
        .digest("hex"),
    })),
  );
  // Reuse the generated AMD loader and the same bundled Workbox release rather
  // than running a second JS bundler inside a timed browser test.
  return `${generated.slice(0, generated.indexOf("define(["))}define(
      [${JSON.stringify(workboxModule)}], function(workbox) {
        workbox.clientsClaim();
        workbox.precacheAndRoute(${JSON.stringify(manifest)}, {});
      });`;
}

test("An installed full-precache worker updates without removing its usable content", async ({
  page,
  site,
}) => {
  site.useLegacy(await legacyWorker());
  await page.goto(`${site.origin}${article}`);
  await controlled(page);
  const oldNames = await page.evaluate(() =>
    caches
      .keys()
      .then((names) =>
        names.filter((name) => name.startsWith("workbox-precache-v2-")),
      ),
  );
  expect(oldNames).toHaveLength(1);
  await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    for (const key of await cache.keys()) {
      const response = (await cache.match(key))!;
      const headers = new Headers(response.headers);
      headers.set("Date", "Wed, 01 Jan 2020 00:00:00 GMT");
      await cache.put(
        key,
        new Response(await response.arrayBuffer(), {
          status: response.status,
          headers,
        }),
      );
    }
  }, oldNames[0]!);
  site.useLegacy(undefined);
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  await expect
    .poll(() =>
      page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())!.waiting),
      ),
    )
    .toBe(true);
  await page.evaluate(async () => {
    const registration = (await navigator.serviceWorker.getRegistration())!;
    const changed = new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          resolve();
        },
        { once: true },
      );
    });
    registration.waiting!.postMessage({ type: "SKIP_WAITING" });
    await changed;
  });
  expect(await page.evaluate(() => caches.keys())).toEqual(
    expect.arrayContaining(oldNames),
  );
  await saved(page, article);
  await site.stop();
  await page.evaluate(async () => {
    await caches.delete("blog-pages-v1");
    await caches.delete("blog-data-v1");
    await caches.delete("blog-assets-v1");
  });
  await page.goto(`${site.origin}${article}`);
  await expect(page.locator(".post-page__content")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
});

test("Runtime caching excludes errors, authorised requests and third-party content", async ({
  page,
  site,
}) => {
  await page.goto(`${site.origin}/`);
  await controlled(page);
  await page.evaluate(async () => {
    await fetch("/_nuxt/missing.js");
    await fetch("/private/_payload.json");
    await fetch("/authorised/_payload.json", {
      headers: { Authorization: "test-not-a-credential" },
    });
  });
  const urls = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      if (name.startsWith("blog-") && !name.includes("essential")) {
        urls.push(
          ...(await (await caches.open(name)).keys()).map((key) => key.url),
        );
      }
    }
    return urls;
  });
  expect(urls).not.toContain(`${site.origin}/_nuxt/missing.js`);
  expect(urls).not.toContain(`${site.origin}/private/_payload.json`);
  expect(urls).not.toContain(`${site.origin}/authorised/_payload.json`);
  expect(urls.every((url) => new URL(url).origin === site.origin)).toBe(true);
});

test("Offline fallback supports colour modes, forced colours and a narrow high-scale viewport", async ({
  page,
  site,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto(`${site.origin}/offline.html`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Offline reading",
    );
  }
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 320, height: 450 });
  const retry = page.getByRole("link", { name: "try this page again" });
  await retry.focus();
  await expect(retry).toBeFocused();
  expect(
    await retry.evaluate((link) => getComputedStyle(link).outlineStyle),
  ).toBe("solid");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
