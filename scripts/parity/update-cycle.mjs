import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";

const previous = process.argv[2];
assert(previous, "Usage: npm run parity:update-cycle -- <previous-Nuxt-dist>");
const port = "8093";
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
    if (!server || server.exitCode !== null) return;
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
    if (!/\.(js|css)$/.test(file)) continue;
    assert.deepEqual(
        await readFile(join("dist", "_nuxt", file)),
        await readFile(join(previous, "_nuxt", file)),
        `Previous build asset must remain byte-identical: ${file}`,
    );
    retained++;
}
assert(retained > 0);

const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
});
const isolate = (context) =>
    context.route(
        (url) => url.origin !== origin,
        (route) => route.fulfill({ contentType: "text/plain", body: "" }),
    );
try {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    context.setDefaultTimeout(180_000);
    await isolate(context);
    const page = await context.newPage();
    page.on("pageerror", (cause) =>
        console.error("Update-test page error:", cause),
    );
    page.on("console", (message) => {
        if (message.type() === "error") console.error(message.text());
    });
    await start(previous);
    console.log("Installing the previous build's real service worker.");
    await page.goto(`${origin}/on-the-etiquette-of-pull-request-comments/`, {
        waitUntil: "domcontentloaded",
    });
    await expect
        .poll(
            () =>
                page.evaluate(
                    async () =>
                        (await navigator.serviceWorker.getRegistration())
                            ?.active?.state,
                ),
            { timeout: 180_000 },
        )
        .toBe("activated");
    console.log(
        "Previous worker activated:",
        await page.evaluate(async () => {
            const registration =
                await navigator.serviceWorker.getRegistration();
            return {
                scope: registration.scope,
                state: registration.active.state,
                controller: navigator.serviceWorker.controller?.scriptURL,
                url: location.href,
            };
        }),
    );
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    const accepted = await context.newPage();
    await accepted.goto(page.url());
    await accepted.waitForFunction(() => navigator.serviceWorker.controller);
    const buildId = (target) =>
        target.evaluate(
            () =>
                document.querySelector("#__nuxt").__vue_app__.config
                    .globalProperties.$nuxt.$config.app.buildId,
        );
    assert.equal(await buildId(page), oldManifest.id);
    assert.equal(await buildId(accepted), oldManifest.id);
    let deferredReloads = 0;
    let acceptedReloads = 0;
    page.on("request", (request) => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame())
            deferredReloads++;
    });
    accepted.on("request", (request) => {
        if (request.isNavigationRequest() && request.frame() === accepted.mainFrame())
            acceptedReloads++;
    });
    await stop();
    await start("dist");
    console.log(
        "Installing the next build while both readers keep their old page.",
    );
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration.update();
    });
    await expect
        .poll(
            () =>
                page.evaluate(async () => {
                    const registration =
                        await navigator.serviceWorker.getRegistration();
                    return Boolean(registration.waiting);
                }),
            { timeout: 180_000 },
        )
        .toBe(true);
    const notice = (target) =>
        target.getByRole("region", { name: "Site update" });
    await expect(notice(page)).toHaveCount(1);
    await expect(notice(accepted)).toHaveCount(1);
    const notifyManifest = (target, manifest = newManifest) =>
        target.evaluate(async (manifest) => {
            const app =
                document.querySelector("#__nuxt").__vue_app__.config
                    .globalProperties.$nuxt;
            await app.hooks.callHook("app:manifest:update", manifest);
        }, manifest);
    await notifyManifest(page);
    await notifyManifest(accepted);
    await expect(notice(page)).toHaveCount(1);
    await page.getByRole("button", { name: "Later", exact: true }).click();
    await expect(notice(page)).toHaveCount(0);
    await notifyManifest(page);
    await expect(notice(page)).toHaveCount(0);
    assert.equal(
        await page.evaluate(async () =>
            Boolean((await navigator.serviceWorker.getRegistration()).waiting),
        ),
        true,
    );
    assert.equal(deferredReloads, 0, "Later must not activate or reload");
    const approvedReload = accepted.waitForEvent("framenavigated", {
        predicate: (frame) => frame === accepted.mainFrame(),
    });
    await accepted
        .getByRole("button", { name: "Update now", exact: true })
        .click();
    await approvedReload;
    await accepted.waitForFunction(
        (id) =>
            document.querySelector("#__nuxt")?.__vue_app__?.config
                .globalProperties.$nuxt.$config.app.buildId === id,
        newManifest.id,
        { timeout: 60_000 },
    );
    assert.equal(await buildId(accepted), newManifest.id);
    await accepted.waitForLoadState("networkidle");
    assert.equal(
        acceptedReloads,
        1,
        "An approved update must reload exactly once",
    );
    assert.equal(
        deferredReloads,
        0,
        "Activation from another tab must not reload a deferred reader",
    );
    assert.equal(await buildId(page), oldManifest.id);
    await expect(notice(page)).toHaveCount(0);
    await context.setOffline(true);
    await accepted.goto(
        `${origin}/optimally-configuring-open-telemetry-tracing-for-asp-net-core/`,
    );
    await accepted.locator(".post__content").waitFor();
    await context.close();

    const noWorker = await browser.newContext({ serviceWorkers: "block" });
    noWorker.setDefaultTimeout(30_000);
    await isolate(noWorker);
    const unsupported = await noWorker.newPage();
    await unsupported.addInitScript(() => {
        Object.defineProperty(navigator, "serviceWorker", {
            value: undefined,
            configurable: true,
        });
        delete Object.getPrototypeOf(navigator).serviceWorker;
        delete navigator.serviceWorker;
    });
    await unsupported.goto(origin);
    await unsupported.waitForFunction(
        () => document.querySelector("#__nuxt").__vue_app__,
    );
    await notifyManifest(unsupported, {
        ...newManifest,
        id: "unsupported-worker-next-build",
    });
    await expect(notice(unsupported)).toHaveCount(1);
    const unsupportedReload = unsupported.waitForEvent("framenavigated");
    await unsupported
        .getByRole("button", { name: "Update now", exact: true })
        .click();
    await unsupportedReload;
    await unsupported.waitForLoadState("networkidle");
    await expect(notice(unsupported)).toHaveCount(0);
    await noWorker.close();
    const failedWorker = await browser.newContext({ serviceWorkers: "allow" });
    failedWorker.setDefaultTimeout(180_000);
    await isolate(failedWorker);
    const failed = await failedWorker.newPage();
    await failed.goto(origin);
    await expect
        .poll(
            () =>
                failed.evaluate(
                    async () =>
                        (await navigator.serviceWorker.getRegistration())
                            ?.active?.state,
                ),
            { timeout: 180_000 },
        )
        .toBe("activated");
    await failed.waitForFunction(() => navigator.serviceWorker.controller);
    await failed.evaluate(() => {
        ServiceWorkerRegistration.prototype.update = () =>
            Promise.reject(new Error("Test update failure"));
    });
    await notifyManifest(failed, {
        ...newManifest,
        id: "failed-worker-next-build",
    });
    await expect(notice(failed)).toContainText(
        "The update is not ready. Please try again when online.",
    );
    await expect(
        failed.getByRole("button", { name: "Update now", exact: true }),
    ).toBeEnabled();
    await failed
        .getByRole("button", { name: "Update now", exact: true })
        .click();
    await expect(notice(failed)).toContainText("The update is not ready.");
    await failedWorker.close();
    console.log(
        `Verified two-build update coordination, one prompt, Later, single approved reload, cross-tab deferral, unsupported-worker fallback, explicit update errors, offline navigation and ${retained} retained assets.`,
    );
} catch (cause) {
    console.error("Update-cycle verification failed:", cause);
    throw cause;
} finally {
    await browser.close();
    await stop();
}
