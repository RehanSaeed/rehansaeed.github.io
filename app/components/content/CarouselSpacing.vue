<template>
  <fieldset class="carousel-spacing">
    <legend class="carousel-spacing__legend">Compare carousel spacing</legend>
    <label class="carousel-spacing__option">
      <input
        v-model="spacing"
        class="carousel-spacing__input"
        type="radio"
        :name="name"
        value="standard" />
      Existing gap (fixed)
    </label>
    <label class="carousel-spacing__option">
      <input
        v-model="spacing"
        class="carousel-spacing__input"
        type="radio"
        :name="name"
        value="none" />
      Zero gap
    </label>
  </fieldset>
</template>

<script setup lang="ts">
import { useId } from "vue";
import { useCarouselSpacing } from "~/composables/useCarouselSpacing";

const name = `carousel-spacing-${useId()}`;
const spacing = useCarouselSpacing();
</script>

<style lang="scss" scoped>
.carousel-spacing {
  display: grid;
  gap: var(--global-space-fixed-2);
}

.carousel-spacing__option {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--global-space-fixed-2);
  min-block-size: 2.75rem;
  cursor: pointer;
}

.carousel-spacing__input {
  min-inline-size: 0;
  padding: 0;
}
</style>
