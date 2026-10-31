<template>
  <u-skeleton class="webmention-replies-skeleton" ref="skeleton">
    <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="30" />
      <rect x="75" width="160" height="20" rx="5" />
      <rect x="250" y="5" width="100" height="15" rx="5" />
      <rect x="75" y="36" :width="commentWidth" height="20" rx="5" />
      <rect x="75" y="72" :width="commentWidth" height="20" rx="5" />
    </svg>
  </u-skeleton>
</template>

<script lang="ts">
import {
  defineComponent,
  markRaw,
  useTemplateRef,
  type ComponentPublicInstance,
} from "vue";
export default defineComponent({
  name: "u-webmention-replies-skeleton",
  setup() {
    return { skeleton: useTemplateRef<ComponentPublicInstance>("skeleton") };
  },
  data() {
    return {
      resizeObserver: null as ResizeObserver | null,
      width: 0,
    };
  },
  computed: {
    commentWidth() {
      return Math.max(0, this.width - 75);
    },
    viewBox() {
      return `0 0 ${this.width} 92`;
    },
  },
  mounted() {
    this.resizeObserver = markRaw(
      new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          this.width = Math.floor(entry.contentRect.width);
        }
      }),
    );
    void this.$nextTick(() => {
      const element: unknown = this.skeleton?.$el;
      if (element instanceof Element) {
        this.resizeObserver?.observe(element);
      }
    });
  },
  unmounted() {
    this.resizeObserver?.disconnect();
  },
});
</script>

<style lang="scss">
.webmention-replies-skeleton {
  block-size: 4.75rem;
}
</style>
