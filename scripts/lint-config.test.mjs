import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();

async function ruleIds(source, filePath) {
  const [result] = await eslint.lintText(source, { filePath });
  assert.ok(result, "ESLint must return a result for the fixture");
  assert.equal(result.fatalErrorCount, 0, "Fixtures must parse successfully");
  return result.messages.map((message) => message.ruleId);
}

test("strict typed rules catch unsafe access and unhandled promises", async () => {
  const rules = await ruleIds(
    'const value = JSON.parse("{}"); value.name; Promise.resolve();',
    "shared/utils/images.ts",
  );
  assert.ok(rules.includes("@typescript-eslint/no-unsafe-member-access"));
  assert.ok(rules.includes("@typescript-eslint/no-floating-promises"));
});

test("JSDoc is required for public properties, not local or private properties", async () => {
  const rules = await ruleIds(
    `export interface PublicOptions { label: string; }
     export class PublicClass { visible = ""; private hidden = ""; protected inherited = ""; }
     function local() { const options: { value: string } = { value: "" }; return options; }`,
    "shared/utils/images.ts",
  );
  assert.equal(
    rules.filter((rule) => rule === "jsdoc/require-jsdoc").length,
    2,
  );
});

test("JSDoc covers Options API and script setup component props", async () => {
  for (const source of [
    '<script lang="ts">import { defineComponent } from "vue"; export default defineComponent({ props: { label: String } });</script>',
    '<script lang="ts">export default { props: { label: String } };</script>',
    '<script setup lang="ts">defineProps<{ label: string }>();</script>',
    '<script setup lang="ts">defineProps({ label: String });</script>',
  ]) {
    const rules = await ruleIds(source, "app/components/shared/button.vue");
    assert.ok(rules.includes("jsdoc/require-jsdoc"));
  }
});

test("Vue accessibility checks images and accepts explicit label associations", async () => {
  const rules = await ruleIds(
    '<template><label for="name">Name</label><input id="name" /><img src="/image.png" /></template>',
    "app/components/shared/button.vue",
  );
  assert.ok(rules.includes("vuejs-accessibility/alt-text"));
  assert.ok(!rules.includes("vuejs-accessibility/label-has-for"));
});

test("Vue accessibility checks Nuxt image components inside links", async () => {
  const missingAlt = await ruleIds(
    '<template><a href="/"><NuxtPicture src="/image.png" /></a></template>',
    "app/components/shared/button.vue",
  );
  assert.ok(missingAlt.includes("vuejs-accessibility/alt-text"));
  const labelledImage = await ruleIds(
    '<template><a href="/"><NuxtPicture src="/image.png" alt="Home" /></a></template>',
    "app/components/shared/button.vue",
  );
  assert.ok(!labelledImage.includes("vuejs-accessibility/alt-text"));
  assert.ok(!labelledImage.includes("vuejs-accessibility/anchor-has-content"));
});

test("Playwright checks unawaited assertions in test files", async () => {
  const rules = await ruleIds(
    'import { test, expect } from "@playwright/test"; test("navigation", async ({ page }) => { await page.goto("/"); expect(page).toHaveTitle("Home"); });',
    "tests/e2e/about.spec.ts",
  );
  assert.ok(rules.includes("playwright/missing-playwright-await"));
});

test("selected Unicorn rules prefer explicit array construction", async () => {
  const rules = await ruleIds(
    "const values = new Array(3);",
    "scripts/serve.mjs",
  );
  assert.ok(rules.includes("unicorn/no-new-array"));
});
