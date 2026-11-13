<template>
  <div>
    <slot :open="onOpen" />
    <u-dialogue
      fullscreen
      title="Search"
      :is-open="isOpen"
      :animate-close="animateClose"
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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  searchOpened,
  searchClosed,
  searchResultSelected,
} from "~/framework/analytics";

defineOptions({ name: "u-search-dialogue" });
const route = useRoute();
const router = useRouter();
const nuxtApp = useNuxtApp();
const isOpen = ref(false);
const animateClose = ref(true);
let focusDestination: string | undefined;
const initialSearch = computed(() => {
  const value = route.query.search;
  return (Array.isArray(value) ? value[0] : value) ?? undefined;
});

const onOpen = () => {
  focusDestination = undefined;
  animateClose.value = true;
  isOpen.value = true;
  searchOpened();
};
const onClose = () => {
  isOpen.value = false;
  searchClosed();
};
const closeForNavigation = () => {
  animateClose.value = false;
  isOpen.value = false;
};
const closeSelection = () => {
  if (focusDestination) {
    closeForNavigation();
  }
};
const cancelSelection = () => {
  closeSelection();
  focusDestination = undefined;
};
const focusArticle = () => {
  if (!focusDestination || route.fullPath !== focusDestination) {
    return;
  }
  const page = document.querySelector<HTMLElement>(
    "[data-view-transition-destination]",
  );
  if (page?.dataset.postPermalink === focusDestination) {
    page
      .querySelector<HTMLElement>("[data-view-transition-heading]")
      ?.focus({ preventScroll: true });
  }
  focusDestination = undefined;
};
const onSelected = (searchTerm: string, permalink: string) => {
  focusDestination = permalink.startsWith("/") ? permalink : undefined;
  searchResultSelected(searchTerm);
  if (!focusDestination || route.fullPath === focusDestination) {
    closeForNavigation();
    focusArticle();
  }
};
const disposers = [
  // Native capture happens on the next render, after this unanimated closure.
  nuxtApp.hook("page:view-transition:start", closeSelection),
  // Also close at route resolution when native transitions are unavailable.
  router.beforeResolve(closeSelection),
  nuxtApp.hook("page:finish", focusArticle),
  nuxtApp.hook("app:error", cancelSelection),
  router.afterEach((to, _from, failure) => {
    if (failure || to.fullPath !== focusDestination) {
      cancelSelection();
    }
  }),
  router.onError(cancelSelection),
];
onBeforeUnmount(() => {
  for (const dispose of disposers) {
    dispose();
  }
});
onMounted(() => {
  if (route.query.search) {
    onOpen();
  }
});
</script>
