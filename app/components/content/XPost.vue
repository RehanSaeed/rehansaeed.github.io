<template>
  <div class="x-post">
    <div ref="container" />
    <p v-if="failed" role="alert">
      Unable to load the embedded X post. You can still watch it using the link
      below.
    </p>
  </div>
</template>

<script setup lang="ts">
type XWidgets = {
  createTweet: (
    id: string,
    container: HTMLElement,
    options: { dnt: boolean; conversation: "none"; align: "center" },
  ) => Promise<HTMLElement | undefined>;
};

declare global {
  interface Window {
    /** X's official embedded-post widget API. */
    twttr?: { widgets?: XWidgets };
  }
}

const props = defineProps<{
  /** Identifier of the X post containing the video. */ postId: string;
}>();
const container = useTemplateRef<HTMLElement>("container");
const failed = ref(false);
const { load } = useScript<{ widgets?: XWidgets }>(
  "https://platform.twitter.com/widgets.js",
  {
    trigger: "manual",
    use: () => ({ widgets: window.twttr?.widgets }),
  },
);

onMounted(() => {
  watch(
    () => props.postId,
    async (postId, _previous, onCleanup) => {
      const state = { cancelled: false };
      const isCancelled = () => state.cancelled;
      onCleanup(() => {
        state.cancelled = true;
      });
      failed.value = false;
      const target = container.value;
      if (!target) {
        return;
      }
      target.replaceChildren();
      try {
        const { widgets } = await load();
        if (isCancelled()) {
          return;
        }
        if (!widgets) {
          throw new Error("X's embedded-post widget API is unavailable.");
        }
        const embed = await widgets.createTweet(postId, target, {
          dnt: true,
          conversation: "none",
          align: "center",
        });
        if (isCancelled()) {
          embed?.remove();
          return;
        }
        if (!embed) {
          throw new Error(`X could not embed post ${postId}.`);
        }
      } catch (error) {
        if (!isCancelled()) {
          failed.value = true;
          console.error("Unable to load the embedded X post", error);
        }
      }
    },
    { immediate: true },
  );
});
</script>
