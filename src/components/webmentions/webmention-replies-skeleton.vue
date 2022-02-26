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

<script>
import skeleton from "~/components/shared/skeleton.vue";

export default {
  name: "u-webmention-replies-skeleton",
  components: {
    "u-skeleton": skeleton,
  },
  data() {
    return {
      resizeObserver: undefined,
      width: 0,
    };
  },
  computed: {
    commentWidth() {
      return Math.min(0, this.width - 75);
    },
    viewBox() {
      return `0 0 ${this.width} 92`;
    },
  },
  mounted() {
    this.resizeObserver = new ResizeObserver((entries) => {
      this.width = Math.floor(entries[0].contentRect.width);
    });
    this.$nextTick(() => {
      this.resizeObserver.observe(this.$refs.skeleton.$el);
    });
  },
  unmounted() {
    this.resizeObserver.disconnect();
  },
};
</script>

<style lang="scss">
.webmention-replies-skeleton {
  height: 4.75rem;
}
</style>
