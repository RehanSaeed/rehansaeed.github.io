import withNuxt from "./.nuxt/eslint.config.mjs";
import vueAccessibility from "eslint-plugin-vuejs-accessibility";
import playwright from "eslint-plugin-playwright";
import jsdoc from "eslint-plugin-jsdoc";
import unicorn from "eslint-plugin-unicorn";

const publicPropertyContexts = [
  "ExportNamedDeclaration > TSInterfaceDeclaration > TSInterfaceBody > TSPropertySignature",
  "ExportNamedDeclaration > TSTypeAliasDeclaration TSTypeLiteral > TSPropertySignature",
  'ExportNamedDeclaration > ClassDeclaration > ClassBody > PropertyDefinition:not([accessibility="private"]):not([accessibility="protected"]):not([key.type="PrivateIdentifier"])',
  'CallExpression[callee.name="defineComponent"] > ObjectExpression > Property[key.name="props"] > ObjectExpression > Property',
  'ExportDefaultDeclaration > ObjectExpression > Property[key.name="props"] > ObjectExpression > Property',
  'CallExpression[callee.name="defineProps"] > ObjectExpression > Property',
  'CallExpression[callee.name="defineProps"] TSTypeLiteral > TSPropertySignature',
];

export default withNuxt(
  {
    ignores: [
      ".parity/**",
      ".data/**",
      ".output/**",
      "dist/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    rules: {
      curly: ["error", "all"],
      // Retain established Vue naming/formatting; Prettier owns formatting.
      "vue/component-definition-name-casing": "off",
      "vue/html-self-closing": "off",
      "vue/attributes-order": "off",
      "vue/order-in-components": "off",
      "vue/attribute-hyphenation": "off",
      "vue/v-on-event-hyphenation": "off",
      // Optional props intentionally retain Vue's undefined default.
      "vue/require-default-prop": "off",
      // Vue 3 permits fragments.
      "vue/no-multiple-template-root": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts,vue}"],
    rules: {
      // Numeric IDs and CSS dimensions have intentional string representations.
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
    },
  },
  ...vueAccessibility.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    rules: {
      "vuejs-accessibility/alt-text": [
        "error",
        { img: ["NuxtPicture", "NuxtImg"] },
      ],
      "vuejs-accessibility/anchor-has-content": [
        "error",
        { accessibleChildren: ["NuxtPicture", "NuxtImg"] },
      ],
      // Explicit for/id association and nested labels are both valid HTML.
      "vuejs-accessibility/label-has-for": [
        "error",
        { required: { some: ["id", "nesting"] } },
      ],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    plugins: { jsdoc, unicorn },
    settings: { jsdoc: { mode: "typescript" } },
    rules: {
      "jsdoc/check-alignment": "error",
      "jsdoc/check-tag-names": "error",
      "jsdoc/valid-types": "error",
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: { FunctionDeclaration: false },
          contexts: publicPropertyContexts,
          enableFixer: false,
        },
      ],
      "jsdoc/require-description": [
        "error",
        { contexts: publicPropertyContexts },
      ],
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/no-new-array": "error",
      "unicorn/no-instanceof-array": "error",
    },
  },
  {
    files: ["tests/**/*.{ts,mts}", "playwright.config.ts", "content.config.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: "./tsconfig.eslint.json",
      },
    },
  },
  {
    ...playwright.configs["flat/recommended"],
    files: ["tests/e2e/**/*.{ts,mts}"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "no-empty-pattern": ["error", { allowObjectPatternsAsParameters: true }],
      // Playwright's automatic fixtures use void values.
      "@typescript-eslint/no-invalid-void-type": "off",
    },
  },
);
