import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve, extname } from "node:path";
import { chromium, firefox, expect } from "@playwright/test";
import { generateSW, getManifest } from "workbox-build";
import { offlineEntrySchema } from "../shared/utils/offline.ts";
import { z } from "zod";

// Use actual server unavailability, not Firefox's incomplete offline emulation.
const browserName = process.argv[2] ?? "firefox";
const scope = process.argv[3] ?? "all";
assert.ok(["all", "fixtures", "full"].includes(scope));
const browser = browserName === "firefox" ? firefox : chromium;
const channel =
  browserName === "chrome"
    ? "chrome"
    : browserName === "edge"
      ? "msedge"
      : undefined;
const output = resolve(process.env.OFFLINE_SITE_DIR ?? "dist");
const source = await readFile(join(output, "service-worker.js"), "utf8");
const injected = source.match(/\[\{"integrity":"sha256-[\s\S]*?\}\]/)?.[0];
assert.ok(injected, "The generated worker must contain the integrity manifest");
const full = z.array(offlineEntrySchema).parse(JSON.parse(injected));
const coreUrls = [
  "offline.html",
  "favicon.svg",
  "images/icons/favicon-192x192.png",
  "images/icons/favicon-512x512.png",
  "manifest.webmanifest",
];
const core = full.filter((entry) => coreUrls.includes(entry.url));
assert.equal(core.length, 5);
const originalFiles = new Set(
  z
    .array(z.string())
    .parse(
      JSON.parse(
        await readFile(
          resolve(output, "../.data/offline-source-files.json"),
          "utf8",
        ),
      ),
    ),
);
const deployment = JSON.parse(
  await readFile(join(output, "deployment.json"), "utf8"),
);
const workerMarker = z
  .object({
    files: z.array(
      z.object({ path: z.string(), sha256: z.string().optional() }),
    ),
  })
  .parse(deployment)
  .files.find(({ path }) => path === "/service-worker.js");
assert.equal(
  workerMarker?.sha256,
  createHash("sha256").update(source).digest("hex"),
  "Deployment verification must describe the final worker bytes",
);
const baseline = await getManifest({
  globDirectory: output,
  globPatterns: [
    "**/*.{js,json,css,html,svg,gif,woff2,avif}",
    "**/*.wasm",
    "__nuxt_content/**/sql_dump.txt",
    "_ipx/*f_avif*/**/*.{png,jpg,jpeg,webp}",
    "favicon.png",
    "images/icons/**/*.{png,jpg,jpeg,webp}",
    "images/screenshots/**/*.{png,jpg,jpeg,webp}",
  ],
  globIgnores: [
    "images/items/**/*",
    "images/reactions/**/*",
    "images/thumbnails/**/*",
    "content-images/**/*",
    "images/hero/**/*.{png,jpg,jpeg}",
    "_og/**/*",
    "_og-static-fonts/**/*",
    "404.html",
    "200.html",
    "service-worker.js",
    "offline.html",
    // Written by pages.mjs after PWA generation; not part of the existing offline set.
    "deployment.json",
  ],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
});
console.log(`${browserName}: generated-asset coverage checked.`);
const urls = new Set(full.map(({ url }) => url));
const expectedUrls = new Set(coreUrls);
for (const asset of baseline.manifestEntries) {
  // Skew protection restores historical JS and CSS after the original precache scan.
  if (!originalFiles.has(decodeURIComponent(asset.url))) {
    continue;
  }
  const url = decodeURIComponent(asset.url);
  const required = url.startsWith("_ipx/")
    ? !/\.(png|jpe?g|webp|avif)$/i.test(url) ||
      /^_ipx\/[^/]*\bf_avif(?:[,/&]|$)/.test(url)
    : !/\.(png|jpe?g|webp)$/i.test(url) ||
      url === "favicon.png" ||
      url.startsWith("images/icons/") ||
      url.startsWith("images/screenshots/");
  if (required) {
    const normalised =
      asset.url === "index.html"
        ? "/"
        : asset.url.replace(/\/index\.html$/, "/");
    expectedUrls.add(normalised);
    assert.ok(
      urls.has(normalised),
      `Existing offline asset is missing: ${normalised}`,
    );
  }
}
assert.deepEqual(
  urls,
  expectedUrls,
  "The original offline set and Nuxt Content bootstrap assets are retained",
);
const directory = await mkdtemp(
  join(tmpdir(), "blog-offline-staging-3724788a-"),
);
const requests = new Map();
let version = "A";
let fault = "";
let slow = "";
let corrupt = "";
let real = false;
let legacySource;
let context;
const bodies = new Map();
const quotaHarness = `(() => {
  self.addEventListener("message", (event) => {
    if (event.data?.test !== "quota") return;
    const put = Cache.prototype.put;
    Cache.prototype.put = function () {
      Cache.prototype.put = put;
      return Promise.reject(new DOMException("Test quota failure", "QuotaExceededError"));
    };
    event.ports[0].postMessage("armed");
  });
})();`;
function entry(url, body) {
  return {
    url,
    revision: createHash("md5").update(body).digest("hex"),
    integrity: `sha256-${createHash("sha256").update(body).digest("base64")}`,
  };
}
function fixture() {
  const entries = [...core];
  const metadata = JSON.stringify({ id: `fixture-${version}` });
  bodies.set("_nuxt/builds/latest.json", metadata);
  entries.push(entry("_nuxt/builds/latest.json", metadata));
  for (let index = 0; index < 15; index++) {
    const url = index === 0 ? "/" : `article-${index}/`;
    const body = `<!doctype html><html lang="en"><title>Offline fixture</title><main><h1>Generation ${version}, article ${index}</h1></main></html>`;
    bodies.set(url, body);
    entries.push(entry(url, body));
  }
  const chunk = `_nuxt/offline-fixture-${version}.js`;
  const body = `export const generation = "${version}";`;
  bodies.set(chunk, body);
  entries.push({ ...entry(chunk, body), revision: null });
  return entries;
}
let manifest = fixture();
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const path = decodeURIComponent(url.pathname).slice(1);
    requests.set(url.pathname, (requests.get(url.pathname) ?? 0) + 1);
    if (
      process.env.OFFLINE_DEBUG &&
      (url.pathname === "/" || url.pathname === "/service-worker.js")
    ) {
      console.log(`${browserName}: ${request.method} ${url.pathname}`);
    }
    if (url.pathname === slow) {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    if (url.pathname === fault) {
      response.writeHead(404).end("Missing asset");
      return;
    }
    if (path === "service-worker.js") {
      response
        .writeHead(200, {
          "Content-Type": "text/javascript",
          "Cache-Control": "no-store",
        })
        .end(
          legacySource ??
            (real
              ? source
              : `${quotaHarness}\n${source.replace(injected, JSON.stringify(manifest))}`),
        );
      return;
    }
    if (!real && bodies.has(url.pathname === "/" ? "/" : path)) {
      response
        .writeHead(200, {
          "Content-Type": path.endsWith(".js")
            ? "text/javascript"
            : path.endsWith(".json")
              ? "application/json"
              : "text/html",
          "Cache-Control": "no-store",
        })
        .end(
          url.pathname === corrupt
            ? "Wrong deployment"
            : bodies.get(url.pathname === "/" ? "/" : path),
        );
      return;
    }
    const file = join(
      output,
      path.endsWith("/") || !path ? `${path}index.html` : path,
    );
    const body = await readFile(file);
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".json": "application/json",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".webmanifest": "application/manifest+json",
      ".avif": "image/avif",
      ".png": "image/png",
      ".woff2": "font/woff2",
      ".wasm": "application/wasm",
      ".txt": "text/plain; charset=utf-8",
    };
    response
      .writeHead(200, {
        "Content-Type": types[extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      })
      .end(body);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(error);
    }
    response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;
const origin = `http://127.0.0.1:${port}`;
async function stopServer() {
  const stopped = new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  server.closeAllConnections();
  await stopped;
}
async function startServer() {
  server.listen(port, "127.0.0.1");
  await once(server, "listening");
}
async function launch(profile) {
  context = await browser.launchPersistentContext(join(directory, profile), {
    channel,
    serviceWorkers: "allow",
    reducedMotion: "reduce",
    deviceScaleFactor: 2,
  });
  context.on("console", (message) => {
    if (real && message.type() === "error") {
      console.error("Browser error:", message.text());
    }
  });
  const page = context.pages()[0];
  page.on("pageerror", (error) => {
    console.error("Browser page error:", error);
  });
  page.on("requestfailed", (request) => {
    console.error(
      "Browser request failed:",
      request.url(),
      request.failure()?.errorText,
    );
  });
  return page;
}
async function command(page, command, override) {
  const integrity =
    override ??
    (real ? full : manifest).find(({ url }) =>
      url.endsWith("/builds/latest.json"),
    ).integrity;
  if (process.env.OFFLINE_DEBUG) {
    console.log(
      "Command",
      command,
      await page.evaluate(async () => ({
        controller: navigator.serviceWorker.controller?.state,
        active: (await navigator.serviceWorker.getRegistration("/"))?.active
          ?.state,
      })),
    );
  }
  return page.evaluate(
    async ({ command, integrity }) => {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const worker = navigator.serviceWorker.controller ?? registration?.active;
      if (!worker) {
        throw new Error("No active offline worker");
      }
      const channel = new MessageChannel();
      const reply = await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Worker command timed out")),
          12_000,
        );
        channel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          channel.port1.close();
          resolve(event.data);
        };
        worker.postMessage({ command, buildIntegrity: integrity }, [
          channel.port2,
        ]);
      });
      if (reply.error) {
        throw new Error(reply.error);
      }
      return reply.status;
    },
    { command, integrity },
  );
}
async function install(page) {
  const started = Date.now();
  await page.goto(origin);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      { scope: "/" },
    );
    const installing = registration.installing;
    if (installing) {
      await new Promise((resolve, reject) => {
        installing.addEventListener("statechange", () => {
          if (installing.state === "redundant") {
            reject(new Error("Worker became redundant during installation"));
          } else if (installing.state === "activated") {
            resolve();
          }
        });
      });
    }
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const milliseconds = Date.now() - started;
  assert.ok(
    milliseconds < 60_000,
    `Cold worker install took ${milliseconds} ms`,
  );
  return milliseconds;
}
async function finish(page) {
  let status = await command(page, "status");
  const limit = status.total * 3;
  for (let index = 0; index < limit && !status.ready; index++) {
    assert.equal(status.error, "", `Staging failed: ${status.error}`);
    if (status.busy) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      status = await command(page, "status");
    } else {
      status = await command(page, "batch");
    }
    if (index % 25 === 0) {
      console.log(
        `${browserName}: saved ${status.saved}/${status.total}; verified ${status.verified}; busy ${status.busy}.`,
      );
    }
  }
  assert.equal(status.ready, true, JSON.stringify(status));
  assert.equal(status.saved, status.total);
  return status;
}
async function update(page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    await registration.update();
  });
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration("/"))?.waiting,
      ),
    )
    .toBe(true);
  await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration("/")).waiting.postMessage({
      type: "SKIP_WAITING",
    }),
  );
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !(await navigator.serviceWorker.getRegistration("/")).waiting,
      ),
    )
    .toBe(true);
}

try {
  let page;
  if (scope !== "full") {
    page = await launch("fixture");
    const fixtureInstall = await install(page);
    console.log(
      `${browserName}: cold essential installation activated in ${fixtureInstall} ms; full content is not ready.`,
    );
    let status = await command(page, "status");
    assert.equal(status.ready, false);
    assert.equal(status.paused, true);
    assert.equal(status.saved, 0, "Installation must not stage the full site");
    await assert.rejects(
      command(page, "start", "sha256-wrong-version"),
      /different site version/,
    );
    assert.equal((await command(page, "status")).paused, true);
    assert.equal(
      await page.evaluate(
        async () =>
          (await caches.keys()).filter((name) =>
            name.startsWith("blog-offline-core-"),
          ).length,
      ),
      1,
    );
    await stopServer();
    await page.goto(`${origin}/article-14/`);
    await expect(
      page.getByRole("heading", { name: "You are offline" }),
    ).toBeVisible();
    await startServer();
    await page.goto(origin);
    await command(page, "start");
    status = await command(page, "batch");
    assert.equal(status.saved, 6, "A message downloads at most six assets");
    assert.equal(status.ready, false);
    fault = "/article-2/";
    status = await command(page, "batch");
    assert.match(status.error, /verify|404/i);
    assert.equal(status.paused, true);
    assert.equal(status.ready, false);
    fault = "";
    await command(page, "start");
    await command(page, "pause");
    const pausedCount = (await command(page, "status")).saved;
    await page.reload();
    assert.equal((await command(page, "status")).paused, true);
    assert.equal((await command(page, "batch")).saved, pausedCount);
    await command(page, "start");
    await command(page, "batch");
    slow = "/article-3/";
    const interrupted = command(page, "batch").catch(() => undefined);
    // Worker requests do not appear as page requests in Firefox; observe the server.
    await expect.poll(() => requests.get(slow) ?? 0).toBeGreaterThan(0);
    const pausedBatch = await command(page, "pause");
    assert.equal(pausedBatch.paused, true);
    assert.equal(pausedBatch.busy, true);
    assert.equal(
      (await command(page, "start")).paused,
      false,
      "Resuming during a bounded batch must persist the user's intent",
    );
    console.log(`${browserName}: closing browser during a bounded batch.`);
    await context.close();
    console.log(
      `${browserName}: browser closed; reopening the persisted profile.`,
    );
    await interrupted;
    slow = "";
    page = await launch("fixture");
    await page.goto(origin);
    status = await command(page, "status");
    assert.ok(
      status.saved >= pausedCount,
      "Completed assets survive actual browser/worker termination",
    );
    assert.equal(
      status.paused,
      false,
      "User consent survives interrupted downloads",
    );
    assert.equal(status.ready, false);
    // A persistent, bounded lease must expire after termination, without heartbeats.
    for (
      let second = 0;
      second < 16 && (await command(page, "status")).busy;
      second++
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    assert.equal((await command(page, "status")).busy, false);
    const tab = await context.newPage();
    await tab.goto(origin);
    const concurrent = await Promise.all([
      command(page, "batch"),
      command(tab, "batch"),
    ]);
    assert.ok(
      concurrent.some((status) => status.busy),
      "Concurrent tabs share the persistent lease",
    );
    await tab.close();
    await page.evaluate(async () => {
      const channel = new MessageChannel();
      const armed = new Promise((resolve) => {
        channel.port1.onmessage = resolve;
      });
      navigator.serviceWorker.controller.postMessage({ test: "quota" }, [
        channel.port2,
      ]);
      await armed;
      channel.port1.close();
    });
    status = await command(page, "batch");
    assert.match(status.error, /storage is full/i);
    assert.equal(status.ready, false);
    status = await command(page, "start");
    corrupt = "/article-14/";
    for (let index = 0; index < manifest.length && !status.error; index++) {
      status = await command(page, "batch");
    }
    assert.notEqual(
      status.error,
      "",
      "A 200 response from another deployment must fail integrity",
    );
    assert.equal(status.ready, false);
    corrupt = "";
    await command(page, "start");
    await finish(page);
    const chunkRequests = requests.get("/_nuxt/offline-fixture-A.js");
    assert.equal(
      await page.evaluate(async () => {
        const chunk = await import("/_nuxt/offline-fixture-A.js");
        return chunk.generation;
      }),
      "A",
    );
    assert.equal(
      requests.get("/_nuxt/offline-fixture-A.js"),
      chunkRequests,
      "Saved immutable modules must not wait for a failing network connection",
    );
    const navigationRequests = requests.get("/article-14/") ?? 0;
    await page.goto(`${origin}/article-14/`);
    await expect(
      page.getByRole("heading", { name: "Generation A, article 14" }),
    ).toBeVisible();
    assert.equal(
      requests.get("/article-14/") ?? 0,
      navigationRequests,
      "A complete current generation must serve navigation without networking",
    );
    const metadataRequests = requests.get("/_nuxt/builds/latest.json");
    await page.evaluate(() =>
      fetch("/_nuxt/builds/latest.json", { cache: "no-store" }).then(
        (response) => response.json(),
      ),
    );
    assert.equal(
      requests.get("/_nuxt/builds/latest.json"),
      metadataRequests + 1,
      "Mutable deployment metadata must still reach the network",
    );
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await stopServer();
    await page.goto(`${origin}/article-14/?utm_source=test&_b=1&v=2`);
    await expect(
      page.getByRole("heading", { name: "Generation A, article 14" }),
    ).toBeVisible();
    await page.goto(`${origin}/?category=CSS`);
    await expect(
      page.getByRole("heading", { name: "Generation A, article 0" }),
    ).toBeVisible();
    await startServer();
    await page.goto(origin);
    version = "B";
    manifest = fixture();
    await update(page);
    status = await command(page, "status");
    assert.equal(status.previousReady, true);
    assert.equal(status.ready, false);
    assert.equal(
      status.paused,
      true,
      "New deployments need a new user-initiated save",
    );
    await command(page, "start");
    fault = "/article-2/";
    await command(page, "batch");
    status = await command(page, "batch");
    assert.notEqual(status.error, "");
    assert.equal(status.previousReady, true);
    await stopServer();
    await page.goto(`${origin}/article-14/`);
    await expect(
      page.getByRole("heading", { name: "Generation A, article 14" }),
    ).toBeVisible();
    await startServer();
    fault = "";
    await page.goto(origin);
    await command(page, "start");
    await finish(page);
    await stopServer();
    await page.goto(`${origin}/article-14/`);
    await expect(
      page.getByRole("heading", { name: "Generation B, article 14" }),
    ).toBeVisible();
    await startServer();
    await page.goto(origin);
    await page.evaluate(async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("blog-offline-full-")) {
          const cache = await caches.open(name);
          for (const key of await cache.keys()) {
            if (new URL(key.url).pathname === "/article-14/") {
              await cache.delete(key);
            }
          }
        }
      }
    });
    assert.equal(
      (await command(page, "status")).ready,
      false,
      "Eviction must revoke readiness",
    );
    await command(page, "start");
    await finish(page);
    await context.close();
    console.log(
      `${browserName}: bounded batches, pause/revisit, browser termination/resume, multi-tab lease, quota, 404/retry, atomic update, revision URLs and eviction passed (cold install ${fixtureInstall} ms).`,
    );

    await generateSW({
      globDirectory: output,
      globPatterns: [],
      additionalManifestEntries: manifest.map(({ url, revision }) => ({
        url,
        revision,
      })),
      swDest: join(directory, "legacy-service-worker.js"),
      inlineWorkboxRuntime: true,
      clientsClaim: true,
      skipWaiting: false,
      navigateFallback: null,
      ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^_b$/, /^v$/],
    });
    legacySource = await readFile(
      join(directory, "legacy-service-worker.js"),
      "utf8",
    );
    page = await launch("migration");
    await install(page);
    assert.ok(
      await page.evaluate(async () =>
        (await caches.keys()).some((name) =>
          name.startsWith("workbox-precache-"),
        ),
      ),
    );
    legacySource = undefined;
    await update(page);
    status = await command(page, "status");
    assert.equal(
      status.ready,
      false,
      "Unverified legacy assets must not imply current readiness",
    );
    await stopServer();
    await page.goto(`${origin}/article-14/`);
    await expect(
      page.getByRole("heading", { name: "Generation B, article 14" }),
    ).toBeVisible();
    await startServer();
    await page.goto(origin);
    await command(page, "start");
    await finish(page);
    await context.close();
    console.log(
      `${browserName}: migration from an actual generateSW worker at the unchanged URL/scope passed.`,
    );
  }

  if (scope !== "fixtures") {
    real = true;
    page = await launch("full-site");
    const fullInstall = await install(page);
    await expect(
      page.getByRole("region", { name: "Read offline" }),
    ).toContainText("not fully saved offline");
    assert.equal((await command(page, "status")).saved, 0);
    await page
      .getByRole("button", { name: "Save the whole blog offline" })
      .click();
    await expect
      .poll(async () =>
        Number(
          await page.locator("#offline-blog-progress").getAttribute("value"),
        ),
      )
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Pause download" }).click();
    await expect(
      page.getByRole("region", { name: "Read offline" }),
    ).toContainText("not fully saved offline");
    const region = page.getByRole("region", { name: "Read offline" });
    for (const mode of [
      { colorScheme: "light", forcedColors: "none" },
      { colorScheme: "dark", forcedColors: "none" },
      { colorScheme: "light", forcedColors: "active" },
    ]) {
      await page.emulateMedia(mode);
      await page.setViewportSize({ width: 390, height: 844 });
      await region.scrollIntoViewIfNeeded();
      const box = await region.boundingBox();
      assert.ok(
        box && box.x >= 0 && box.x + box.width <= 391,
        "Offline controls fit a narrow viewport",
      );
      const button = region.getByRole("button", {
        name: /Resume offline download|Save the whole blog offline/,
      });
      await page.keyboard.press("Tab");
      await button.focus();
      await expect(button).toBeFocused();
      const focus = await button.evaluate(
        (button) => getComputedStyle(button).outlineStyle,
      );
      assert.notEqual(focus, "none");
      await expect(region.locator("progress")).toHaveAccessibleName(
        /assets saved/,
      );
      if (process.env.OFFLINE_ARTIFACT_DIR) {
        await region.screenshot({
          path: join(
            process.env.OFFLINE_ARTIFACT_DIR,
            `${browserName}-${mode.colorScheme}-${mode.forcedColors}.png`,
          ),
        });
      }
    }
    await page.emulateMedia({ colorScheme: "light", forcedColors: "none" });
    // CSS zoom is a supplementary automated reflow check, not a claim of manual browser zoom/Narrator testing.
    await page.addStyleTag({ content: "html { zoom: 2; }" });
    await region.scrollIntoViewIfNeeded();
    const zoomed = await region.boundingBox();
    assert.ok(zoomed && zoomed.x >= 0 && zoomed.x + zoomed.width <= 391);
    // Keep the full-manifest protocol proof separate from the page's own scheduler.
    await page.goto(`${origin}/offline.html`);
    await command(page, "start");
    const started = Date.now();
    await finish(page);
    const fullStagingMs = Date.now() - started;
    await page.goto(origin);
    await expect(
      page.getByRole("region", { name: "Read offline" }),
    ).toContainText("verified and ready offline");
    await stopServer();
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("content_")) {
          localStorage.removeItem(key);
        }
      }
    });
    await context.close();
    page = await launch("full-site");
    const bootstrapResponses = [];
    page.on("response", (response) => {
      const path = new URL(response.url()).pathname;
      if (path.endsWith(".wasm") || path.endsWith("/sql_dump.txt")) {
        bootstrapResponses.push({
          path,
          fromWorker: response.fromServiceWorker(),
        });
      }
    });
    await page.goto(`${origin}/on-the-etiquette-of-pull-request-comments/`);
    await expect(page.locator(".post__content")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".post__photo")
          .evaluate((image) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", { name: "Open search" }),
    ).toBeEnabled();
    // Prerendered payloads and FlexSearch need not initialise SQLite. Refresh a
    // real article query to verify the cold content database independently.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.querySelector("#__nuxt")?.__vue_app__?.config
              .globalProperties.$nuxt?.isHydrating,
        ),
      )
      .toBe(false);
    await page.evaluate(async () => {
      const app =
        document.querySelector("#__nuxt")?.__vue_app__?.config.globalProperties
          .$nuxt;
      if (!app || app.isHydrating) {
        throw new Error("The article has not finished hydrating");
      }
      const key = `post-${location.pathname}`;
      let timeout;
      try {
        await Promise.race([
          app.hooks.callHookParallel("app:data:refresh", [key]),
          new Promise((resolve, reject) => {
            timeout = setTimeout(
              () => reject(new Error("Cold offline content query timed out")),
              5_000,
            );
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
      if (
        app.payload._errors[key] ||
        app.payload.data[key]?.permalink !== location.pathname
      ) {
        throw new Error("The cold offline article query failed");
      }
    });
    await expect(page.locator(".post__content")).toBeVisible();
    await page.getByRole("button", { name: "Open search" }).click();
    await page.getByRole("searchbox").fill("pull request");
    await expect(page.locator(".search-result__link").first()).toBeVisible();
    await page.goto(`${origin}/?search=Schema.NET`);
    await expect(page.getByRole("searchbox")).toBeFocused();
    await expect(page.getByRole("searchbox")).toHaveValue("Schema.NET");
    await expect(page.locator(".search-result__link").first()).toHaveAttribute(
      "href",
      "https://github.com/RehanSaeed/Schema.NET",
    );
    assert.ok(
      bootstrapResponses.some(
        ({ path, fromWorker }) => path.endsWith(".wasm") && fromWorker,
      ),
      "A cold offline start must load WebAssembly through the worker",
    );
    assert.ok(
      bootstrapResponses.some(
        ({ path, fromWorker }) =>
          path === "/__nuxt_content/posts/sql_dump.txt" && fromWorker,
      ),
      "Offline search must rebuild its database without a warmed local cache",
    );
    const bytes = await Promise.all(
      full.map(async ({ url }) => {
        const path =
          url === "/"
            ? "index.html"
            : url.endsWith("/")
              ? `${url}index.html`
              : url;
        return (await readFile(join(output, path))).length;
      }),
    );
    const coreBytes = core.reduce(
      (total, entry) => total + bytes[full.indexOf(entry)],
      0,
    );
    console.log(
      JSON.stringify({
        browser: browserName,
        coreAssets: core.length,
        coreBytes,
        workerBytes: Buffer.byteLength(source),
        fullAssets: full.length,
        fullBytes: bytes.reduce((total, size) => total + size, 0),
        coldNavigationActivationMs: fullInstall,
        fullStagingMs,
        offlineProof:
          "Server stopped; unvisited article, cold WebAssembly/SQL startup, app hydration, search and search deep link; no HTTP/content database cache or Firefox offline emulation",
      }),
    );
  }
} catch (error) {
  console.error("Offline regression failed:", error);
  console.error("Recent requests:", [...requests.entries()].slice(-10));
  const page = context?.pages()[0];
  if (page && !page.isClosed()) {
    console.error(
      "Worker at failure:",
      await page.evaluate(async () => ({
        controller: navigator.serviceWorker.controller?.scriptURL,
        active: (await navigator.serviceWorker.getRegistration("/"))?.active
          ?.scriptURL,
        document: document.readyState,
        resources: performance
          .getEntriesByType("resource")
          .map(({ name, duration }) => ({ name, duration })),
      })),
    );
  }
  throw error;
} finally {
  await context?.close();
  if (server.listening) {
    await stopServer();
  }
  await rm(directory, { recursive: true, force: true });
}
