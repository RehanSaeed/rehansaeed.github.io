<template>
  <u-skeleton class="webmention-faces-skeleton" ref="skeleton">
    <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
      <circle
        v-for="n in count"
        :key="n"
        :cx="getXPosition(n)"
        :cy="radius"
        :r="radius" />
    </svg>
  </u-skeleton>
</template>

<script>
import skeleton from "~/components/shared/skeleton.vue";

export default {
  name: "u-webmention-faces-skeleton",
  components: {
    "u-skeleton": skeleton,
  },
  data() {
    return {
      resizeObserver: undefined,
      width: 0,
    };
  },
  props: {
    overlap: {
      default: 10,
      type: Number,
    },
    radius: {
      default: 25,
      type: Number,
    },
  },
  computed: {
    count() {
      if (this.width == 0) {
        return 3;
      }
      return Math.floor(this.width / (this.diameter - this.overlap)) - 1;
    },
    diameter() {
      return this.radius * 2;
    },
    viewBox() {
      return `0 0 ${this.width} ${this.diameter}`;
    },
  },
  methods: {
    getXPosition(n) {
      const x = n * (this.radius * 2) - this.radius;
      const nOverlap = n * this.overlap;
      const offset = this.overlap;
      return x - nOverlap + offset;
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
.webmention-faces-skeleton {
  block-size: 2.5rem;
}
</style>
