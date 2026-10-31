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

<script lang="ts">
import {
  defineComponent,
  markRaw,
  useTemplateRef,
  type ComponentPublicInstance,
} from "vue";
export default defineComponent({
  name: "u-webmention-faces-skeleton",
  setup() {
    return { skeleton: useTemplateRef<ComponentPublicInstance>("skeleton") };
  },
  data() {
    return {
      resizeObserver: null as ResizeObserver | null,
      width: 0,
    };
  },
  props: {
    /** Amount by which adjacent avatar placeholders overlap. */ overlap: {
      default: 10,
      type: Number,
    },
    /** Radius of each avatar placeholder. */ radius: {
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
    getXPosition(n: number) {
      const x = n * (this.radius * 2) - this.radius;
      const nOverlap = n * this.overlap;
      const offset = this.overlap;
      return x - nOverlap + offset;
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
.webmention-faces-skeleton {
  block-size: 2.5rem;
}
</style>
