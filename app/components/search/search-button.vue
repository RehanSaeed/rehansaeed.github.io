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
      ref="dialogue"
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
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import {
  searchOpened,
  searchClosed,
  searchResultSelected,
} from "~/framework/analytics";

defineOptions({ name: "u-search-button" });
const route = useRoute();
const router = useRouter();
const nuxtApp = useNuxtApp();
const dialogue = useTemplateRef<{
  /** Remove the native modal immediately before navigation. */
  closeForNavigation: () => void;
}>("dialogue");
const isOpen = ref(false);
let focusDestination: string | undefined;
const initialSearch = computed(() => {
  const value = route.query.search;
  return (Array.isArray(value) ? value[0] : value) ?? undefined;
});

const onOpen = () => {
  focusDestination = undefined;
  isOpen.value = true;
  searchOpened();
};
const onClose = () => {
  isOpen.value = false;
  searchClosed();
};
const closeForNavigation = () => {
  dialogue.value?.closeForNavigation();
  isOpen.value = false;
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
  // startViewTransition schedules its old snapshot for the next render. Close
  // synchronously in Nuxt's start hook, before that render, not at activation.
  nuxtApp.hook("page:view-transition:start", () => {
    if (focusDestination) {
      closeForNavigation();
    }
  }),
  // Keep the result visible while lazy routes load, then remove the top layer
  // here as well when native transitions are disabled or unsupported.
  router.beforeResolve(() => {
    if (focusDestination) {
      closeForNavigation();
    }
  }),
  nuxtApp.hook("page:finish", focusArticle),
  nuxtApp.hook("app:error", () => {
    if (focusDestination) {
      closeForNavigation();
    }
    focusDestination = undefined;
  }),
  router.afterEach((to, _from, failure) => {
    if (failure || to.fullPath !== focusDestination) {
      if (focusDestination) {
        closeForNavigation();
      }
      focusDestination = undefined;
    }
  }),
  router.onError(() => {
    if (focusDestination) {
      closeForNavigation();
    }
    focusDestination = undefined;
  }),
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

<style lang="scss">
.search-button {
  display: block;
  font-size: var(--global-font-size-4);
}
</style>
