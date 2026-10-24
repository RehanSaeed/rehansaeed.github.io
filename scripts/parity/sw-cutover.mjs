import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";

const legacy = process.argv[2];
const current = process.argv[3] ?? "dist";
if (!legacy)
    throw new Error(
        "Usage: node scripts/parity/sw-cutover.mjs <archived-Gridsome-dist> [current-Nuxt-dist]",
    );
const port = "8092";
const origin = `http://localhost:${port}`;
let server;
const start = async (root) => {
    server = spawn(process.execPath, ["scripts/serve.mjs", root], {
        env: { ...process.env, PORT: port },
        stdio: ["ignore", "pipe", "inherit"],
    });
    await Promise.race([
        once(server.stdout, "data"),
        once(server, "exit").then(([code]) => {
            throw new Error(`Static server exited: ${code}`);
        }),
    ]);
    assert.equal((await fetch(origin)).status, 200);
};
const stop = async () => {
    if (!server || server.exitCode !== null) return;
    const stopped = once(server, "exit");
    server.kill();
    await stopped;
};
const articles = [];
for (const file of await readdir(current, { recursive: true })) {
    if (!file.endsWith("index.html")) continue;
    const html = load(await readFile(join(current, file), "utf8"));
    if (!html(".post__content").length) continue;
    if (html('meta[name="robots"]').attr("content")?.includes("noindex"))
        continue;
    articles.push(`/${file.replaceAll("\\", "/").replace(/index\.html$/, "")}`);
}
assert(
    articles.length > 0,
    "The current artifact must contain published articles",
);
const feed = JSON.parse(await readFile(join(current, "feed.json"), "utf8"));
assert.equal(
    articles.length,
    feed.items.length,
    "Every published feed article must be checked",
);
const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
});
try {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    context.setDefaultTimeout(180_000);
    context.setDefaultNavigationTimeout(60_000);
    await context.route(
        (url) => url.origin !== origin,
        (route) => route.fulfill({ contentType: "text/plain", body: "" }),
    );
    let page = await context.newPage();
    await start(legacy);
    console.log("Installing the archived Gridsome worker.");
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        await navigator.serviceWorker.ready.then((registration) => {
            if (registration.active)
                registration.active.postMessage({ type: "SKIP_WAITING" });
        });
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    const old = await page.evaluate(async () => ({
        script: navigator.serviceWorker.controller?.scriptURL,
        keys: await Promise.all(
            (await caches.keys()).map(async (name) => ({
                name,
                urls: (await (await caches.open(name)).keys()).map(
                    (request) => request.url,
                ),
            })),
        ),
    }));
    assert.equal(old.script, `${origin}/service-worker.js`);
    assert.ok(
        old.keys.some((cache) =>
            cache.urls.some((url) => url.includes("/assets/data/")),
        ),
    );
    console.log(
        "The legacy worker controls the reader and has cached its data.",
    );
    await stop();
    await start(current);
    const installing = context.waitForEvent("serviceworker", {
        timeout: 180_000,
    });
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration.update();
    });
    const worker = await installing;
    await worker.evaluate(() => {
        self.__activationStarted = new Promise((resolve) => {
            self.addEventListener("activate", () => resolve(true), {
                once: true,
            });
        });
    });
    await expect
        .poll(
            () =>
                page.evaluate(async () =>
                    Boolean(
                        (await navigator.serviceWorker.getRegistration())
                            .waiting,
                    ),
                ),
            { timeout: 180_000 },
        )
        .toBe(true);
    await page.evaluate(async () => {
        (await navigator.serviceWorker.getRegistration()).waiting.postMessage({
            type: "SKIP_WAITING",
        });
    });
    await page.waitForTimeout(1000);
    assert(
        await page.evaluate(async () =>
            Boolean((await navigator.serviceWorker.getRegistration()).waiting),
        ),
        "An unapproved legacy update must not interrupt an open reader",
    );
    console.log(
        "The new worker is waiting and rejected unapproved activation.",
    );
    // The legacy UI cannot show the new prompt. Its last tab must close naturally.
    await page.close();
    let activationTimer;
    try {
        await Promise.race([
            worker.evaluate(() => self.__activationStarted),
            new Promise((_, reject) => {
                activationTimer = setTimeout(
                    () =>
                        reject(
                            new Error(
                                "Natural service worker activation timed out.",
                            ),
                        ),
                    180_000,
                );
            }),
        ]);
    } finally {
        clearTimeout(activationTimer);
    }
    console.log(
        "Natural activation has started after the last legacy tab closed.",
    );
    page = await context.newPage();
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() =>
        Boolean(document.querySelector("#__nuxt")?.__vue_app__),
    );
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    console.log("The new Nuxt document is controlled and hydrated.");
    const newKeys = await page.evaluate(async () => {
        const keys = [];
        for (const name of await caches.keys()) {
            keys.push(
                ...(await (await caches.open(name)).keys()).map(
                    (request) => request.url,
                ),
            );
        }
        return keys;
    });
    assert.ok(newKeys.some((url) => url.includes("/_nuxt/")));
    assert.ok(
        !newKeys.some((url) => url.includes("/assets/data/")),
        "Old Gridsome precache is cleaned",
    );
    await context.setOffline(true);
    await page.goto(`${origin}/on-the-etiquette-of-pull-request-comments/`, {
        waitUntil: "domcontentloaded",
    });
    await page.waitForSelector(".post__content");
    await page.waitForFunction(() =>
        Boolean(document.querySelector("#__nuxt")?.__vue_app__),
    );
    const offline = await page.evaluate(async (paths) => {
        const failures = [];
        for (const path of paths) {
            try {
                const response = await fetch(path);
                const html = new DOMParser().parseFromString(
                    await response.text(),
                    "text/html",
                );
                const canonical = html
                    .querySelector('link[rel="canonical"]')
                    ?.getAttribute("href");
                if (
                    !response.ok ||
                    !html.querySelector(".post__content")?.textContent.trim() ||
                    !canonical ||
                    new URL(canonical).pathname !== path
                ) {
                    failures.push({ path, status: response.status });
                }
            } catch (cause) {
                failures.push({ path, error: String(cause) });
            }
        }
        return failures;
    }, articles);
    assert.deepEqual(
        offline,
        [],
        "Every published article must be readable offline",
    );
    console.log(
        `Verified non-interrupting Gridsome worker migration, rejected unapproved activation, last-tab takeover, old-cache cleanup and all ${articles.length} published articles offline.`,
    );
} finally {
    await browser.close();
    await stop();
}
