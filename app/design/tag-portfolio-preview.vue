<template>
  <div>
    <aside
      class="tag-portfolio-preview"
      aria-label="Portfolio tag design preview">
      <label for="tag-style">Preview tag style</label>
      <select id="tag-style" v-model="selectedStyle">
        <option
          v-for="option of tagStyleOptions"
          :key="option.id"
          :value="option.id">
          {{ option.number }} / {{ option.name }}
        </option>
      </select>
      <label class="tag-portfolio-preview__icon-toggle">
        <input
          v-model="showIcons"
          type="checkbox"
          :disabled="!supportsTagIcon(selectedStyle)" />
        Add the tag icon to styles 6 and 8
      </label>
      <NuxtLink :to="{ name: 'tag-style-comparison' }"
        >Back to all comparisons</NuxtLink
      >
      <p>Design preview only. The production default is unchanged.</p>
    </aside>
    <div class="tag-portfolio-preview__page">
      <PortfolioPage
        :tag-variant="selectedStyle"
        :tag-icon="showIcons && supportsTagIcon(selectedStyle)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PortfolioPage from "~/pages/portfolio.vue";
import { supportsTagIcon, tagStyleOptions } from "./tag-style-options";
import type { TagButtonVariant } from "~/types/button";

useSeoMeta({ robots: "noindex, nofollow" });
const route = useRoute();
const selectedStyle = computed({
  get: () =>
    tagStyleOptions.find((option) => option.id === route.query.style)?.id ??
    tagStyleOptions[0]!.id,
  set: (style: TagButtonVariant) => {
    void navigateTo(
      { path: route.path, query: { ...route.query, style } },
      { replace: true },
    );
  },
});
const showIcons = computed({
  get: () => route.query.icons === "tag",
  set: (enabled: boolean) => {
    void navigateTo(
      {
        path: route.path,
        query: {
          ...route.query,
          style: selectedStyle.value,
          icons: enabled ? "tag" : undefined,
        },
      },
      { replace: true },
    );
  },
});
</script>

<style lang="scss">
.tag-portfolio-preview {
  display: grid;
  gap: 0.75rem;
  justify-items: start;
  max-inline-size: 80rem;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  margin: 1rem auto 2rem;
  padding: 1rem;

  select {
    max-inline-size: 100%;
    min-block-size: 44px;
    border: 1px solid var(--global-accent-color);
    border-radius: var(--global-border-radius);
    padding: 0.5rem;
    background: var(--global-content-background-color);
    color: var(--global-title-color);
    font: inherit;
  }

  .tag-portfolio-preview__icon-toggle {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.5rem;
    align-items: center;
    min-block-size: 44px;
  }

  p {
    margin: 0;
  }
}
</style>
