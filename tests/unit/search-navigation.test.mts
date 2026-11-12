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

await test("A thrown navigation error clears search focus intent before a later article navigation", () => {
    const hooks = new Map<string, () => void>();
    const errors = new Set<() => void>();
    const route = { fullPath: "/", query: {} };
    let closes = 0;
    let focuses = 0;
    const heading = {
        focus: () => {
            focuses++;
        },
    };
    const search = runInNewContext(`${source}\n({ onSelected });`, {
        defineOptions: () => {},
        ref: (value: unknown) => ({ value }),
        computed: (value: () => unknown) => ({ value: value() }),
        useRoute: () => route,
        useRouter: () => ({
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
        useTemplateRef: () => ({
            value: {
                closeForNavigation: () => {
                    closes++;
                },
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
    }) as { onSelected: (term: string, permalink: string) => void };

    search.onSelected("article", "/article/");
    assert.equal(closes, 1);
    for (const onError of errors) {
        onError();
    }

    // A later, unrelated router navigation must not inherit the failed search.
    route.fullPath = "/article/";
    hooks.get("page:finish")!();
    assert.equal(focuses, 0);
});
