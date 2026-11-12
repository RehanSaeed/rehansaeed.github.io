import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = stripTypeScriptTypes(
    await readFile(
        new URL(
            "../../app/plugins/post-view-transition.client.ts",
            import.meta.url,
        ),
        "utf8",
    ),
)
    .replace("export default defineNuxtPlugin", "defineNuxtPlugin")
    .replaceAll("import.meta.hot", "hot");

const createHarness = (supported = true) => {
    const hooks = new Map<string, (...args: unknown[]) => void>();
    const guards = new Set<(...args: unknown[]) => void>();
    const unmount: Array<() => void> = [];
    const hotDispose: Array<() => void> = [];
    const timers = new Map<number, () => void>();
    const classes = new Set<string>();
    let unregisters = 0;
    let skips = 0;
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
        finish = resolve;
    });
    const transition = {
        finished,
        skipTransition: () => {
            skips++;
        },
    };
    const registerGuard = (callback: (...args: unknown[]) => void) => {
        guards.add(callback);
        return () => {
            unregisters++;
            guards.delete(callback);
        };
    };
    const document = Object.assign(new EventTarget(), {
        startViewTransition: supported ? () => {} : undefined,
        documentElement: {
            classList: {
                add: (name: string) => classes.add(name),
                remove: (name: string) => classes.delete(name),
            },
        },
        hidden: false,
    });
    const media = [
        Object.assign(new EventTarget(), { matches: false }),
        Object.assign(new EventTarget(), { matches: false }),
    ];
    const window = Object.assign(new EventTarget(), {
        matchMedia: (query: string) =>
            media[query.includes("reduced-motion") ? 0 : 1],
    });

    // Evaluate the actual plugin with isolated Nuxt/browser owners.
    runInNewContext(source, {
        AbortController,
        document,
        window,
        location: { pathname: "/", search: "", hash: "" },
        setTimeout: (callback: () => void) => {
            const id = timers.size + 1;
            timers.set(id, callback);
            return id;
        },
        clearTimeout: (id: number) => timers.delete(id),
        useRouter: () => ({
            beforeEach: registerGuard,
            afterEach: registerGuard,
            onError: registerGuard,
        }),
        defineNuxtPlugin: (setup: (app: unknown) => void) => {
            setup({
                hook: (
                    name: string,
                    callback: (...args: unknown[]) => void,
                ) => {
                    hooks.set(name, callback);
                    return () => {
                        unregisters++;
                        hooks.delete(name);
                    };
                },
                vueApp: {
                    onUnmount: (callback: () => void) => unmount.push(callback),
                },
            });
        },
        hot: { dispose: (callback: () => void) => hotDispose.push(callback) },
    });

    const interrupt = () => {
        window.dispatchEvent(new Event("wheel"));
        window.dispatchEvent(new Event("touchstart"));
        window.dispatchEvent(new Event("popstate"));
        document.hidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
        const keydown = Object.assign(new Event("keydown"), { key: "Escape" });
        document.dispatchEvent(keydown);
        for (const target of media) {
            target.dispatchEvent(new Event("change"));
        }
    };
    return {
        hooks,
        guards,
        unmount,
        hotDispose,
        timers,
        classes,
        media,
        transition,
        finish,
        interrupt,
        get skips() {
            return skips;
        },
        get unregisters() {
            return unregisters;
        },
        get listenerCount() {
            return (
                ["click", "visibilitychange", "keydown"].reduce(
                    (count, event) =>
                        count + getEventListeners(document, event).length,
                    0,
                ) +
                ["popstate", "wheel", "touchstart"].reduce(
                    (count, event) =>
                        count + getEventListeners(window, event).length,
                    0,
                ) +
                media.reduce(
                    (count, target) =>
                        count + getEventListeners(target, "change").length,
                    0,
                )
            );
        },
    };
};

for (const owner of ["unmount", "hotDispose"] as const) {
    await test(`${owner} removes observers and cancels an active transition once`, async () => {
        const app = createHarness();
        app.hooks.get("page:view-transition:start")!(app.transition);
        app.classes.add("post-view-transition");
        assert.equal(app.timers.size, 1);
        assert.equal(app.guards.size, 3);
        assert.equal(app.hooks.size, 3);
        assert.ok(app.listenerCount > 0);

        app[owner][0]!();
        assert.equal(app.skips, 1);
        assert.equal(app.timers.size, 0);
        assert.equal(app.guards.size, 0);
        assert.equal(app.hooks.size, 0);
        assert.equal(app.classes.size, 0);
        assert.equal(app.unregisters, 6);
        assert.equal(app.listenerCount, 0);

        app.interrupt();
        app.unmount[0]!();
        app.hotDispose[0]!();
        app.finish();
        await app.transition.finished;
        assert.equal(app.skips, 1);
        assert.equal(app.unregisters, 6);
        assert.equal(app.timers.size, 0);
    });
}

await test("An idle plugin can unmount without a transition", () => {
    const app = createHarness();
    app.unmount[0]!();
    assert.equal(app.skips, 0);
    assert.equal(app.unregisters, 6);
    assert.equal(app.timers.size, 0);
});

await test("Unsupported browsers install no plugin observers", () => {
    const app = createHarness(false);
    assert.equal(app.hooks.size, 0);
    assert.equal(app.guards.size, 0);
    assert.equal(app.unmount.length, 0);
    assert.equal(app.hotDispose.length, 0);
    assert.equal(app.listenerCount, 0);
});

await test("History policy observes popstate even when beforeEach ran first", () => {
    const app = createHarness();
    const [beforeEach, afterEach] = [...app.guards];
    const route = {
        name: "index",
        path: "/",
        fullPath: "/",
        hash: "",
        meta: { viewTransition: { enabled: true } },
    };
    beforeEach!(route, route);
    assert.equal(route.meta.viewTransition.enabled, true);
    app.interrupt();
    assert.equal(route.meta.viewTransition.enabled, false);
    afterEach!(route, route);
    beforeEach!(route, route);
    assert.equal(route.meta.viewTransition.enabled, true);
    app.unmount[0]!();
});

await test("Fragment destinations disable the native transition policy", () => {
    const app = createHarness();
    const [beforeEach] = [...app.guards];
    const route = {
        fullPath: "/example/#main",
        hash: "#main",
        meta: { viewTransition: { enabled: true } },
    };
    beforeEach!(route, route);
    assert.equal(route.meta.viewTransition.enabled, false);
    app.unmount[0]!();
});

await test("Pagination names only the list until the native transition finishes", async () => {
    const app = createHarness();
    const [beforeEach] = [...app.guards];
    const from = {
        name: "index",
        path: "/",
        fullPath: "/",
        hash: "",
        meta: {},
    };
    const to = {
        name: "page",
        path: "/2/",
        fullPath: "/2/",
        hash: "",
        meta: {},
    };
    beforeEach!(to, from);
    assert.ok(app.classes.has("pagination-view-transition"));
    app.hooks.get("page:view-transition:start")!(app.transition);
    app.finish();
    await app.transition.finished;
    assert.equal(app.classes.size, 0);
    app.unmount[0]!();
});

for (const [label, fromName, toName, fromPath, toPath] of [
    ["next", "page", "page", "/2/", "/3/"],
    ["previous", "page", "index", "/2/", "/"],
    ["article", "index", "slug", "/", "/article/"],
    ["return from article", "slug", "index", "/article/", "/"],
    ["same page", "page", "page", "/2/", "/2/"],
] as const) {
    await test(`${label} navigation selects only the appropriate pagination mode`, () => {
        const app = createHarness();
        const [beforeEach] = [...app.guards];
        beforeEach!(
            {
                name: toName,
                path: toPath,
                fullPath: toPath,
                hash: "",
                meta: {},
            },
            { name: fromName, path: fromPath },
        );
        assert.equal(
            app.classes.has("pagination-view-transition"),
            label === "next" || label === "previous",
        );
        app.unmount[0]!();
    });
}

for (const preference of [0, 1]) {
    await test(`Pagination respects media fallback ${preference}`, () => {
        const app = createHarness();
        app.media[preference]!.matches = true;
        const [beforeEach] = [...app.guards];
        const to = {
            name: "page",
            path: "/2/",
            fullPath: "/2/",
            hash: "",
            meta: { viewTransition: { enabled: true } },
        };
        beforeEach!(to, { name: "index", path: "/" });
        assert.equal(to.meta.viewTransition.enabled, false);
        assert.equal(app.classes.size, 0);
        app.unmount[0]!();
    });
}

for (const interruption of ["history", "failure", "another route"] as const) {
    await test(`Pagination capture is released after ${interruption}`, () => {
        const app = createHarness();
        const [beforeEach, afterEach] = [...app.guards];
        const from = { name: "index", path: "/" };
        const to = {
            name: "page",
            path: "/2/",
            fullPath: "/2/",
            hash: "",
            meta: {},
        };
        beforeEach!(to, from);
        assert.ok(app.classes.has("pagination-view-transition"));
        if (interruption === "history") {
            app.interrupt();
        } else if (interruption === "failure") {
            afterEach!(to, from, new Error("Navigation aborted"));
        } else {
            beforeEach!(
                {
                    name: "about",
                    path: "/about/",
                    fullPath: "/about/",
                    hash: "",
                    meta: {},
                },
                from,
            );
        }
        assert.equal(app.classes.size, 0);
        app.unmount[0]!();
    });
}
