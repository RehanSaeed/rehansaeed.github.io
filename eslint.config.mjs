import withNuxt from "./.nuxt/eslint.config.mjs";

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
        files: ["tests/e2e/**/*.{ts,mts}"],
        rules: {
            "no-empty-pattern": [
                "error",
                { allowObjectPatternsAsParameters: true },
            ],
            // Playwright's automatic fixtures use void values.
            "@typescript-eslint/no-invalid-void-type": "off",
        },
    },
);
