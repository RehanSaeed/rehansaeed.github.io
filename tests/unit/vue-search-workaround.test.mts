import assert from "node:assert/strict";
import test from "node:test";
import { compileTemplate } from "vue/compiler-sfc";

void test("review the search workaround when Vue recognises search natively", () => {
    const result = compileTemplate({
        source: "<search></search>",
        filename: "search-workaround.vue",
        id: "search-workaround",
    });
    assert.deepEqual(result.errors, []);
    const search = result.ast?.children[0];
    assert.ok(search && "tagType" in search);
    // Vue's ElementTypes.COMPONENT is 1; native elements are 0.
    assert.equal(
        search.tagType,
        1,
        "Vue now recognises <search> natively. Remove the isCustomElement search workaround in nuxt.config.ts and this expiry test.",
    );
});

void test("the search workaround compiles search as an element", () => {
    const result = compileTemplate({
        source: "<search></search>",
        filename: "search-workaround.vue",
        id: "search-workaround",
        compilerOptions: { isCustomElement: (tag) => tag === "search" },
    });
    assert.deepEqual(result.errors, []);
    const search = result.ast?.children[0];
    assert.ok(search && "tagType" in search);
    assert.equal(search.tagType, 0);
});
