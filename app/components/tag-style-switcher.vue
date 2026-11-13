<template>
  <fieldset class="tag-style-switcher">
    <legend>Tag style preview</legend>
    <label class="tag-style-switcher__option">
      <input
        v-model="variant"
        class="tag-style-switcher__input"
        type="radio"
        name="tag-style"
        value="code-token" />
      Code token with tag icon
    </label>
    <label class="tag-style-switcher__option">
      <input
        v-model="variant"
        class="tag-style-switcher__input"
        type="radio"
        name="tag-style"
        value="tag-shaped" />
      Pointed tag with purple hole
    </label>
  </fieldset>
</template>

<script setup lang="ts">
import { useTagStylePreview } from "~/composables/use-tag-style-preview";

const variant = useTagStylePreview();
</script>

<style lang="scss">
.tag-style-switcher {
  display: grid;
  gap: 0.5rem;
  min-inline-size: 0;
  margin-block-end: 1.5rem;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  padding: 1rem;
  color: var(--global-title-color);

  &__option {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    align-items: center;
    min-block-size: 36px;
    cursor: pointer;
  }

  &__input {
    inline-size: 1.1em;
    block-size: 1.1em;
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    accent-color: var(--global-accent-color);

    &:focus-visible {
      outline: 2px solid var(--global-accent-color);
      outline-offset: 3px;
      box-shadow: none;
    }
  }
}

@media (forced-colors: active) {
  .tag-style-switcher__input:focus-visible {
    outline-color: Highlight;
  }
}
</style>
