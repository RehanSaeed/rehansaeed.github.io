import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { startPreviewServer } from "../preview-server.mts";
import {
    assertNoPageErrors,
    waitForWorkerActivation,
} from "./browser-checks.mts";

const legacy = process.argv[2];
if (!legacy) {
    throw new Error(
        "Usage: node scripts/parity/sw-cutover.mts <archived-Gridsome-dist>",
    );
}
const port = "8092";
const origin = `http://localhost:${port}`;
let stop: (() => Promise<void>) | undefined;
const start = async (root: string) => {
    stop = await startPreviewServer(root, port);
};
const browser = await chromium.launch({ channel: "chrome" });
try {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    context.setDefaultTimeout(180_000);
    context.setDefaultNavigationTimeout(180_000);
    const errors: Error[] = [];
    context.on("page", (target) => {
        target.on("pageerror", (error) => errors.push(error));
    });
    await context.route(
        (url) => url.origin !== origin,
        (route) => route.fulfill({ contentType: "text/plain", body: "" }),
    );
    let page = await context.newPage();
    await start(legacy);
    await page.goto(origin);
    await page.waitForFunction(
        async () =>
            (await navigator.serviceWorker.getRegistration())?.active?.state ===
            "activated",
    );
    await page.reload();
    await page.waitForFunction(() =>
        Boolean(navigator.serviceWorker.controller),
    );
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
    await stop?.();
    await start("dist");
    const installing = context.waitForEvent("serviceworker", {
        timeout: 180_000,
    });
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            throw new Error("Legacy worker registration is unavailable.");
        }
        await registration.update();
    });
    const worker = await installing;
    await expect
        .poll(
            () =>
                page.evaluate(async () =>
                    Boolean(
                        (await navigator.serviceWorker.getRegistration())
                            ?.waiting,
                    ),
                ),
            { timeout: 180_000 },
        )
        .toBe(true);
    // The legacy UI cannot show the new prompt. Its last tab must close naturally.
    await Promise.all([
        worker.evaluate(waitForWorkerActivation, 180_000),
        page.close(),
    ]);
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
    assertNoPageErrors(errors);
    console.log(
        "Verified non-interrupting Gridsome worker migration after closing the last legacy tab, old-cache cleanup and unvisited-post offline navigation.",
    );
} finally {
    try {
        await browser.close();
    } finally {
        await stop?.();
    }
}
