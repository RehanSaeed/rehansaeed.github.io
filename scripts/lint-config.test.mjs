import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();

async function ruleIds(source, filePath) {
  const [result] = await eslint.lintText(source, { filePath });
  assert.ok(result, "ESLint must return a result for the fixture");
  assert.equal(
    result.fatalErrorCount,
    0,
    `Fixtures must parse successfully: ${JSON.stringify(result.messages)}`,
  );
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
  for (const [source, expected] of [
    ["export interface PublicOptions { label: string; }", 1],
    ['export class PublicClass { visible = ""; }', 1],
    [
      'export class PublicClass { private hidden = ""; protected inherited = ""; }',
      0,
    ],
    [
      'function local() { const options: { value: string } = { value: "" }; return options; }',
      0,
    ],
    [
      "export interface PublicOptions { /** Display label. */ label: string; }",
      0,
    ],
    ['export class PublicClass { /** Display label. */ visible = ""; }', 0],
  ]) {
    const rules = await ruleIds(source, "shared/utils/images.ts");
    assert.equal(
      rules.filter((rule) => rule === "jsdoc/require-jsdoc").length,
      expected,
      source,
    );
  }
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

  const autofocusInput = `<input
    autofocus
    aria-label="Search" />`;
  const noAutofocus = "vuejs-accessibility/no-autofocus";
  const unscoped = await ruleIds(
    `<template>${autofocusInput}</template>`,
    "app/components/search/search.vue",
  );
  assert.ok(unscoped.includes(noAutofocus));
  const scopedInput = `<!-- eslint-disable ${noAutofocus} -->
    ${autofocusInput}
    <!-- eslint-enable ${noAutofocus} -->`;
  const scoped = await ruleIds(
    `<template>${scopedInput}</template>`,
    "app/components/search/search.vue",
  );
  assert.ok(!scoped.includes(noAutofocus));
  const elsewhere = await ruleIds(
    `<template>${scopedInput}${autofocusInput}</template>`,
    "app/components/search/search.vue",
  );
  assert.equal(elsewhere.filter((rule) => rule === noAutofocus).length, 1);
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
  for (const module of ["@playwright/test", "./fixtures"]) {
    const source = `import { test, expect } from "${module}"; test("navigation", async ({ page }) => { await page.goto("/"); expect(page).toHaveTitle("Home"); });`;
    const rules = await ruleIds(source, "tests/e2e/about.spec.ts");
    assert.ok(
      rules.includes("playwright/missing-playwright-await"),
      `Unawaited assertions from ${module} must be rejected`,
    );
    const awaited = await ruleIds(
      source.replace("expect(page)", "await expect(page)"),
      "tests/e2e/about.spec.ts",
    );
    assert.ok(!awaited.includes("playwright/missing-playwright-await"));
  }
});

test("Playwright rejects fixed sleeps instead of condition-based waits", async () => {
  const rules = await ruleIds(
    'import { test, expect } from "./fixtures"; test("navigation", async ({ page }) => { await page.goto("/"); await page.waitForTimeout(1000); await expect(page).toHaveTitle("Home"); });',
    "tests/e2e/about.spec.ts",
  );
  assert.ok(rules.includes("playwright/no-wait-for-timeout"));
});

test("selected Unicorn rules prefer explicit array construction", async () => {
  const rules = await ruleIds(
    "const values = new Array(3);",
    "scripts/serve.mjs",
  );
  assert.ok(rules.includes("unicorn/no-new-array"));
});
