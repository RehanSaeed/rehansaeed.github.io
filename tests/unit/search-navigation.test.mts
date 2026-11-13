import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";

const component = await readFile(
    new URL("../../app/components/search/search-button.vue", import.meta.url),
    "utf8",
);
const source = stripTypeScriptTypes(
    component.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)![1]!,
).replace(/^import[\s\S]*?from ["'][^"']+["'];\r?$/gm, "");

const createHarness = () => {
    const hooks = new Map<string, () => void>();
    const errors = new Set<() => void>();
    let beforeResolve = () => {};
    const route = { fullPath: "/", query: {} };
    let focuses = 0;
    const heading = {
        focus: () => {
            focuses++;
        },
    };
    const search = runInNewContext(
        `${source}\n({ onSelected, onOpen, onClose, isOpen, animateClose });`,
        {
            defineOptions: () => {},
            ref: (value: unknown) => ({ value }),
            computed: (value: () => unknown) => ({ value: value() }),
            useRoute: () => route,
            useRouter: () => ({
                beforeResolve: (callback: () => void) => {
                    beforeResolve = callback;
                    return () => {};
                },
                afterEach: () => () => {},
                onError: (callback: () => void) => {
                    errors.add(callback);
                    return () => errors.delete(callback);
                },
            }),
            useNuxtApp: () => ({
                hook: (name: string, callback: () => void) => {
                    hooks.set(name, callback);
                    return () => hooks.delete(name);
                },
            }),
            onMounted: () => {},
            onBeforeUnmount: () => {},
            searchOpened: () => {},
            searchClosed: () => {},
            searchResultSelected: () => {},
            document: {
                querySelector: () => ({
                    dataset: { postPermalink: "/article/" },
                    querySelector: () => heading,
                }),
            },
        },
    ) as {
        onSelected: (term: string, permalink: string) => void;
        onOpen: () => void;
        onClose: () => void;
        isOpen: { value: boolean };
        animateClose: { value: boolean };
    };
    search.onOpen();
    return {
        search,
        hooks,
        errors,
        route,
        resolve: () => {
            beforeResolve();
        },
        get focuses() {
            return focuses;
        },
    };
};

await test("A thrown navigation error clears search focus intent before a later article navigation", () => {
    const app = createHarness();
    app.search.onSelected("article", "/article/");
    assert.equal(app.search.isOpen.value, true);
    for (const onError of app.errors) {
        onError();
    }
    assert.equal(app.search.isOpen.value, false);

    // A later, unrelated router navigation must not inherit the failed search.
    app.route.fullPath = "/article/";
    app.hooks.get("page:finish")!();
    assert.equal(app.focuses, 0);
});

await test("Search stays open during route loading and closes before the native snapshot", () => {
    const app = createHarness();
    app.search.onSelected("article", "/article/");
    assert.equal(app.search.isOpen.value, true);
    app.hooks.get("page:view-transition:start")!();
    assert.equal(app.search.isOpen.value, false);
    assert.equal(app.search.animateClose.value, false);
});

await test("Without a native snapshot search closes when the route resolves", () => {
    const app = createHarness();
    app.search.onSelected("article", "/article/");
    assert.equal(app.search.isOpen.value, true);
    app.resolve();
    assert.equal(app.search.isOpen.value, false);
    assert.equal(app.search.animateClose.value, false);
});

await test("Reopening search restores animated dismissal after navigation", () => {
    const app = createHarness();
    app.search.onSelected("article", "/article/");
    app.resolve();
    app.search.onOpen();
    assert.equal(app.search.isOpen.value, true);
    assert.equal(app.search.animateClose.value, true);
    app.search.onClose();
    assert.equal(app.search.isOpen.value, false);
    assert.equal(app.search.animateClose.value, true);
});
