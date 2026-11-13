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
    const sourceClasses = new Set<string>();
    const targetClasses = new Set<string>();
    const body = new Set<FakeElement>();
    const head = new Set<FakeElement>();
    const classList = (values: Set<string>) => ({
        add: (name: string) => values.add(name),
        remove: (name: string) => values.delete(name),
    });
    class FakeElement {
        dataset: Record<string, string> = {};
        className = "";
        classList = classList(new Set<string>());
        complete = true;
        naturalWidth = 1600;
        src = "";
        currentSrc = "/images/hero.avif";
        alt = "";
        textContent = "";
        setAttribute() {}
        remove() {
            body.delete(this);
            head.delete(this);
        }
        getBoundingClientRect() {
            return {
                left: 40,
                top: 100,
                right: 168,
                bottom: 172,
                width: 128,
                height: 72,
            };
        }
    }
    const sourceImage = new FakeElement();
    sourceImage.classList = classList(sourceClasses);
    const target = new FakeElement();
    target.classList = classList(targetClasses);
    let focusCount = 0;
    const heading = {
        focus: () => {
            focusCount++;
        },
    };
    const card = {
        dataset: { postHero: "/images/hero.jpg", postPermalink: "/article/" },
        querySelector: () => sourceImage,
    };
    let modalOpen = true;
    let isSearchDialog = true;
    const modal = {
        matches: () => isSearchDialog,
        contains: () => true,
    };
    const link = Object.assign(new FakeElement(), {
        href: "https://example.com/article/",
        pathname: "/article/",
        target: "",
        hasAttribute: () => false,
        closest: (selector: string) =>
            selector === "[data-view-transition-source]" ? card : modal,
    });
    const clickTarget = Object.assign(new FakeElement(), {
        closest: () => link,
    });
    const currentRoute = { value: { path: "/", fullPath: "/" } };
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
            classList: classList(classes),
        },
        hidden: false,
        body: { append: (element: FakeElement) => body.add(element) },
        head: { append: (element: FakeElement) => head.add(element) },
        createElement: () => new FakeElement(),
        querySelectorAll: () => (modalOpen ? [modal] : []),
        querySelector: () => ({
            dataset: card.dataset,
            querySelector: (selector: string) =>
                selector === "img[data-view-transition-image]"
                    ? target
                    : heading,
        }),
    });
    const media = [new EventTarget(), new EventTarget()];
    const window = Object.assign(new EventTarget(), {
        innerWidth: 1280,
        innerHeight: 1000,
        scrollTo: () => {},
        matchMedia: (query: string) =>
            media[query.includes("reduced-motion") ? 0 : 1],
    });

    // Evaluate the actual plugin with isolated Nuxt/browser owners.
    runInNewContext(source, {
        AbortController,
        Element: FakeElement,
        HTMLImageElement: FakeElement,
        document,
        window,
        location: {
            origin: "https://example.com",
            pathname: "/",
            search: "",
            hash: "",
        },
        setTimeout: (callback: () => void) => {
            const id = timers.size + 1;
            timers.set(id, callback);
            return id;
        },
        clearTimeout: (id: number) => timers.delete(id),
        useRouter: () => ({
            currentRoute,
            beforeEach: registerGuard,
            afterEach: registerGuard,
            onError: registerGuard,
        }),
        defineNuxtPlugin: ({ setup }: { setup: (app: unknown) => void }) => {
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
        sourceClasses,
        targetClasses,
        body,
        head,
        currentRoute,
        activate: (modified = false) => {
            const event = Object.assign(new Event("click"), {
                button: 0,
                ctrlKey: modified,
            });
            Object.defineProperty(event, "target", { value: clickTarget });
            document.dispatchEvent(event);
        },
        closeModal: () => {
            modalOpen = false;
        },
        otherModal: () => {
            isSearchDialog = false;
        },
        get focusCount() {
            return focusCount;
        },
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
        fullPath: "/",
        hash: "",
        meta: { viewTransition: { enabled: true } },
    };
    beforeEach!(route);
    assert.equal(route.meta.viewTransition.enabled, true);
    app.interrupt();
    assert.equal(route.meta.viewTransition.enabled, false);
    afterEach!(route, route);
    beforeEach!(route);
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
    beforeEach!(route);
    assert.equal(route.meta.viewTransition.enabled, false);
    app.unmount[0]!();
});

await test("Search bridges only its selected image until destination capture, then cleans up", async () => {
    const app = createHarness();
    app.activate();
    assert.equal(app.body.size, 1);
    assert.equal(app.head.size, 1);
    assert.equal(app.sourceClasses.size, 0);
    assert.ok(app.classes.has("post-view-transition"));
    app.closeModal();
    const [beforeEach] = [...app.guards];
    beforeEach!({ fullPath: "/article/", hash: "", meta: {} });
    app.hooks.get("page:view-transition:start")!(app.transition);
    app.currentRoute.value = { path: "/article/", fullPath: "/article/" };
    app.hooks.get("page:finish")!();
    assert.equal(app.body.size, 0);
    assert.equal(app.head.size, 0);
    assert.ok(app.targetClasses.has("post-view-transition__hero"));
    assert.equal(app.focusCount, 1);
    app.finish();
    await app.transition.finished;
    assert.equal(app.targetClasses.size, 0);
    assert.equal(app.classes.size, 0);
    app.unmount[0]!();
});

for (const interruption of ["failed navigation", "unmount"] as const) {
    await test(`A search image bridge is removed on ${interruption}`, () => {
        const app = createHarness();
        app.activate();
        assert.equal(app.body.size, 1);
        if (interruption === "failed navigation") {
            const [, afterEach] = [...app.guards];
            afterEach!({}, {}, new Error("Navigation cancelled"));
        } else {
            app.unmount[0]!();
        }
        assert.equal(app.body.size, 0);
        assert.equal(app.head.size, 0);
        assert.equal(app.classes.size, 0);
        assert.equal(app.focusCount, 0);
        app.unmount[0]!();
    });
}

for (const blocked of ["modified click", "another modal"] as const) {
    await test(`Search does not bridge an image for ${blocked}`, () => {
        const app = createHarness();
        if (blocked === "another modal") {
            app.otherModal();
        }
        app.activate(blocked === "modified click");
        assert.equal(app.body.size, 0);
        assert.equal(app.head.size, 0);
        assert.equal(app.classes.size, 0);
        app.unmount[0]!();
    });
}
