import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
import { once } from "node:events";

const legacy = process.argv[2];
if (!legacy)
    throw new Error(
        "Usage: node scripts/parity/sw-cutover.mjs <archived-Gridsome-dist>",
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
const browser = await chromium.launch({ channel: "chrome" });
try {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    await context.route(
        (url) => url.origin !== origin,
        (route) => route.fulfill({ contentType: "text/plain", body: "" }),
    );
    let page = await context.newPage();
    await start(legacy);
    await page.goto(origin);
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        await navigator.serviceWorker.ready.then((registration) => {
            if (registration.active)
                registration.active.postMessage({ type: "SKIP_WAITING" });
        });
    });
    await page.reload();
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
    await stop();
    await start("dist");
    const installing = context.waitForEvent("serviceworker", {
        timeout: 180_000,
    });
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration.update();
    });
    const worker = await installing;
    await worker.evaluate(() => {
        self.__activationComplete = new Promise((resolve) => {
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
    // The legacy UI cannot show the new prompt. Its last tab must close naturally.
    await page.close();
    await worker.evaluate(() => self.__activationComplete);
    page = await context.newPage();
    await page.goto(origin);
    await page.waitForFunction(() =>
        Boolean(document.querySelector("#__nuxt")),
    );
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
    await page.goto(`${origin}/on-the-etiquette-of-pull-request-comments/`);
    await page.waitForSelector(".post__content");
    console.log(
        "Verified non-interrupting Gridsome worker migration after closing the last legacy tab, old-cache cleanup and unvisited-post offline navigation.",
    );
} finally {
    await browser.close();
    await stop();
}
