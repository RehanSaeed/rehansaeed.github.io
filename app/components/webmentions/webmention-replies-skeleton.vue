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
export default defineComponent({
  name: "u-webmention-replies-skeleton",
  data(): { resizeObserver: ResizeObserver | undefined; width: number } {
    return {
      resizeObserver: undefined,
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
    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) this.width = Math.floor(entries[0].contentRect.width);
    });
    this.$nextTick(() => {
      const skeleton = this.$refs.skeleton as { $el: Element };
      this.resizeObserver?.observe(skeleton.$el);
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
