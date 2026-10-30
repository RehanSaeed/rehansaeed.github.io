import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";

const previous = process.argv[2];
assert(previous, "Usage: npm run parity:update-cycle -- <previous-Nuxt-dist>");
const port = process.env.PORT ?? "8093";
const origin = `http://localhost:${port}`;
let server;
async function start(root) {
    server = spawn(process.execPath, ["scripts/serve.mjs", root], {
        env: { ...process.env, PORT: port },
        stdio: ["ignore", "pipe", "inherit"],
    });
    await Promise.race([
        once(server.stdout, "data"),
        once(server, "exit").then(([code]) => {
            throw new Error(`Update-test static server exited: ${code}`);
        }),
    ]);
    assert.equal((await fetch(origin)).status, 200);
}
async function stop() {
    if (!server || server.exitCode !== null) {
        return;
    }
    const stopped = once(server, "exit");
    server.kill();
    await stopped;
}
const oldManifest = JSON.parse(
    await readFile(join(previous, "_nuxt/builds/latest.json"), "utf8"),
);
const newManifest = JSON.parse(
    await readFile("dist/_nuxt/builds/latest.json", "utf8"),
);
assert.notEqual(
    oldManifest.id,
    newManifest.id,
    "Two distinct real Nuxt builds are required",
);
let retained = 0;
for (const file of await readdir(join(previous, "_nuxt"), {
    recursive: true,
})) {
    if (!/\.(js|css)$/.test(file)) {
        continue;
    }
    assert.deepEqual(
        await readFile(join("dist", "_nuxt", file)),
        await readFile(join(previous, "_nuxt", file)),
        `Previous build asset must remain byte-identical: ${file}`,
    );
    retained++;
}
assert(retained > 0);

const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHANNEL
        ? { channel: process.env.PLAYWRIGHT_CHANNEL }
        : {}),
});
try {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    context.setDefaultTimeout(180_000);
    await context.route(
        (url) => url.origin !== origin,
        (route) => route.fulfill({ contentType: "text/plain", body: "" }),
    );
    const page = await context.newPage();
    page.on("pageerror", (cause) => console.error("Update-test error:", cause));
    await start(previous);
    console.log("Installing the previous build's real service worker.");
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    assert.equal(
        await page.evaluate(
            async () =>
                (await navigator.serviceWorker.getRegistrations()).length,
        ),
        1,
        "The package must own a single service-worker registration",
    );
    const buildId = (target) =>
        target.evaluate(
            () =>
                document.querySelector("#__nuxt")?.__vue_app__?.config
                    .globalProperties.$nuxt.$config.app.buildId,
        );
    assert.equal(await buildId(page), oldManifest.id);
    await stop();
    await start("dist");
    console.log("Checking for the next build's worker.");
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration.update();
    });
    const notice = (target) =>
        target.getByRole("region", { name: "Site update" });
    await expect(notice(page)).toBeVisible({ timeout: 180_000 });
    console.log("Package update prompt is visible.");
    await page.getByRole("button", { name: "Later", exact: true }).click();
    await expect(notice(page)).toHaveCount(0);
    assert.equal(await buildId(page), oldManifest.id);
    assert.equal(
        await page.evaluate(async () =>
            Boolean((await navigator.serviceWorker.getRegistration()).waiting),
        ),
        true,
        "Later must leave the update waiting",
    );

    const accepted = await context.newPage();
    await accepted.goto(origin);
    await accepted.waitForFunction(() => navigator.serviceWorker.controller);
    await expect(notice(accepted)).toBeVisible({ timeout: 180_000 });
    console.log("Accepting the waiting update from a second tab.");
    let reloads = 0;
    accepted.on("request", (request) => {
        if (
            request.isNavigationRequest() &&
            request.frame() === accepted.mainFrame()
        ) {
            reloads++;
        }
    });
    await accepted
        .getByRole("button", { name: "Update now", exact: true })
        .click();
    try {
        await accepted.waitForFunction(
            (id) =>
                document.querySelector("#__nuxt")?.__vue_app__?.config
                    .globalProperties.$nuxt.$config.app.buildId === id,
            newManifest.id,
            { timeout: 60_000 },
        );
    } catch (cause) {
        console.error(
            "Update state:",
            await accepted.evaluate(async () => {
                const registration =
                    await navigator.serviceWorker.getRegistration();
                const app =
                    document.querySelector("#__nuxt")?.__vue_app__?.config
                        .globalProperties.$nuxt;
                return {
                    buildId: app?.$config.app.buildId,
                    needRefresh: app?.$pwa?.needRefresh,
                    active: registration?.active?.state,
                    waiting: registration?.waiting?.state,
                    controller: navigator.serviceWorker.controller?.state,
                };
            }),
            { reloads, expected: newManifest.id },
        );
        throw cause;
    }
    assert.equal(
        reloads,
        1,
        "The package update must reload the accepting tab once",
    );
    await expect(notice(accepted)).toHaveCount(0);
    await context.setOffline(true);
    await accepted.goto(
        `${origin}/optimally-configuring-open-telemetry-tracing-for-asp-net-core/`,
    );
    await accepted.locator(".post__content").waitFor();
    await context.close();
    console.log(
        `Verified package-owned registration, waiting update, Later, activation, reload, offline navigation and ${retained} retained assets.`,
    );
} finally {
    await browser.close();
    await stop();
}
