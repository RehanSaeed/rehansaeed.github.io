<template>
  <div>
    <u-tooltip v-slot="{ trigger }" text="Search" placement="left">
      <u-button
        v-bind="trigger"
        class="search-button"
        aria-label="Open search"
        @click.prevent="onOpen">
        <u-icon name="feather:search" />
      </u-button>
    </u-tooltip>

    <u-dialogue
      fullscreen
      title="Search"
      :is-open="isOpen"
      @close="onClose"
      class="search-dialogue">
      <u-search
        :is-open="isOpen"
        :search="initialSearch"
        @selected="onSelected" />
    </u-dialogue>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  searchOpened,
  searchClosed,
  searchResultSelected,
} from "~/framework/analytics";

defineOptions({ name: "u-search-button" });
const route = useRoute();
const isOpen = ref(false);
const initialSearch = computed(() => {
  const value = route.query.search;
  return (Array.isArray(value) ? value[0] : value) ?? undefined;
});

const onOpen = () => {
  isOpen.value = true;
  searchOpened();
};
const onClose = () => {
  isOpen.value = false;
  searchClosed();
};
const onSelected = (searchTerm: string) => {
  isOpen.value = false;
  searchResultSelected(searchTerm);
};
onMounted(() => {
  if (route.query.search) {
    onOpen();
  }
});
</script>

<style lang="scss">
.search-button {
  display: block;
  font-size: var(--global-font-size-4);
}
</style>
