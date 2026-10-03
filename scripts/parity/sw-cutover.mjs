import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
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
    const page = await context.newPage();
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
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        const previous = navigator.serviceWorker.controller;
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                navigator.serviceWorker.removeEventListener(
                    "controllerchange",
                    changed,
                );
                reject(
                    new Error(
                        "Nuxt worker did not take control within three minutes",
                    ),
                );
            }, 180_000);
            function changed() {
                if (navigator.serviceWorker.controller === previous) return;
                clearTimeout(timeout);
                navigator.serviceWorker.removeEventListener(
                    "controllerchange",
                    changed,
                );
                resolve();
            }
            navigator.serviceWorker.addEventListener(
                "controllerchange",
                changed,
            );
            registration.update().catch((error) => {
                clearTimeout(timeout);
                navigator.serviceWorker.removeEventListener(
                    "controllerchange",
                    changed,
                );
                reject(error);
            });
        });
    });
    await page.reload();
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
        "Verified original Gridsome worker takeover, old-cache cleanup and unvisited-post offline navigation.",
    );
} finally {
    await browser.close();
    await stop();
}
