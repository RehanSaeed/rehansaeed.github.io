import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, relative } from "node:path";
import { once } from "node:events";
import { generateSW } from "workbox-build";
import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Router } from "vue-router";

const article = "/on-the-etiquette-of-pull-request-comments/";
const unvisited = "/gitattributes-best-practices/";
const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

const test = base.extend<{
  site: {
    origin: string;
    stop: () => Promise<void>;
    start: () => Promise<void>;
    useLegacy: (source: string | undefined) => void;
  };
}>({
  site: async ({}, use) => {
    let legacy: string | undefined;
    const root = resolve("dist");
    const server = createServer((request, response) => {
      void (async () => {
        const url = new URL(request.url!, "http://localhost");
        let file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (relative(root, file).startsWith("..")) {
          response.writeHead(403).end();
          return;
        }
        let status = 200;
        let body: Buffer | string;
        if (
          url.pathname === "/private/_payload.json" ||
          url.pathname === "/authorised/_payload.json"
        ) {
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": url.pathname.startsWith("/private/")
              ? "private, no-store"
              : "no-cache, must-revalidate",
          });
          response.end("{}");
          return;
        }
        if (url.pathname === "/service-worker.js" && legacy) {
          body = legacy;
        } else {
          try {
            if ((await stat(file)).isDirectory()) {
              file = join(file, "index.html");
            }
            body = await readFile(file);
          } catch (error) {
            if (
              !(error instanceof Error) ||
              !("code" in error) ||
              !["ENOENT", "ENOTDIR"].includes(String(error.code))
            ) {
              throw error;
            }
            status = 404;
            file = join(root, "404.html");
            body = await readFile(file);
          }
        }
        response.writeHead(status, {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
          "Cache-Control": "no-cache, must-revalidate",
        });
        response.end(body);
      })().catch((error: unknown) => {
        console.error("Offline test server failed:", error);
        response.writeHead(500).end();
      });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Offline test server has no TCP address.");
    }
    const port = address.port;
    const stop = async () => {
      const closed = once(server, "close");
      server.close();
      server.closeAllConnections();
      await closed;
    };
    try {
      await use({
        origin: `http://127.0.0.1:${port}`,
        stop,
        start: async () => {
          server.listen(port, "127.0.0.1");
          await once(server, "listening");
        },
        useLegacy: (source) => {
          legacy = source;
        },
      });
    } finally {
      if (server.listening) {
        await stop();
      }
    }
  },
});

test.use({ serviceWorkers: "allow" });

test.beforeEach(async ({ context, site }) => {
  // Playwright routing disables the browser HTTP cache, including in Firefox.
  // Worker requests still go to the real server; no route fakes offline replies.
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === site.origin
      ? route.continue()
      : route.fulfill({ contentType: "text/plain", body: "" }),
  );
});

async function controlled(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            resolve();
          },
          { once: true },
        );
      });
    }
  });
}

async function saved(page: Page, path: string) {
  await expect
    .poll(() =>
      page.evaluate(async (path) => {
        const pages = await caches.open("blog-pages-v1");
        const data = await caches.open("blog-data-v1");
        const required = performance
          .getEntriesByType("resource")
          .map((entry) => new URL(entry.name))
          .filter(
            (url) =>
              url.origin === location.origin &&
              /^\/(?:_nuxt|_fonts)\/.*\.(?:js|css|woff2?)$/.test(url.pathname),
          );
        const assetsReady = (
          await Promise.all(
            required.map((url) => caches.match(url, { ignoreSearch: true })),
          )
        ).every(Boolean);
        return Boolean(
          assetsReady &&
          (await pages.match(new URL(path, location.origin))) &&
          (await data.match(new URL(`${path}_payload.json`, location.origin), {
            ignoreSearch: true,
          })),
        );
      }, path),
    )
    .toBe(true);
}

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
      bytes += (await (await cache.match(key))!.arrayBuffer()).byteLength;
    }
    const runtime = [];
    for (const name of names.filter(
      (name) => name.startsWith("blog-") && !name.includes("essential"),
    )) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      let bytes = 0;
      for (const request of requests) {
        bytes += (await (await cache.match(request))!.arrayBuffer()).byteLength;
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

test("An installed full-precache worker updates without removing its usable content", async ({
  page,
  site,
}, testInfo) => {
  const legacyPath = testInfo.outputPath("legacy-service-worker.js");
  // Representative prior generateSW worker: real Workbox revision keys and
  // cache naming, bounded content subset so this is not the failing full install.
  await generateSW({
    swDest: legacyPath,
    globDirectory: "dist",
    globPatterns: [
      "_nuxt/*.{js,css}",
      "_fonts/*",
      `${article.slice(1)}index.html`,
      `${article.slice(1)}_payload.json`,
    ],
    inlineWorkboxRuntime: true,
    clientsClaim: true,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  });
  site.useLegacy(await readFile(legacyPath, "utf8"));
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
