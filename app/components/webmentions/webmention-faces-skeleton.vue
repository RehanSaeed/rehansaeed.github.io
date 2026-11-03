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

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
} from "vue";
defineOptions({ name: "u-webmention-faces-skeleton" });
const skeleton = useTemplateRef<ComponentPublicInstance>("skeleton");
let resizeObserver: ResizeObserver | undefined;
const width = ref(0);
const props = defineProps({
  /** Amount by which adjacent avatar placeholders overlap. */ overlap: {
    default: 10,
    type: Number,
  },
  /** Radius of each avatar placeholder. */ radius: {
    default: 25,
    type: Number,
  },
});
const diameter = computed(() => props.radius * 2);
const viewBox = computed(() => `0 0 ${width.value} ${diameter.value}`);
const count = computed(() => {
  if (width.value == 0) {
    return 3;
  }
  return Math.floor(width.value / (diameter.value - props.overlap)) - 1;
});
const getXPosition = (n: number) => {
  const x = n * (props.radius * 2) - props.radius;
  const nOverlap = n * props.overlap;
  const offset = props.overlap;
  return x - nOverlap + offset;
};
onMounted(() => {
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) {
      width.value = Math.floor(entry.contentRect.width);
    }
  });
  void nextTick(() => {
    const element: unknown = skeleton.value?.$el;
    if (element instanceof Element) {
      resizeObserver?.observe(element);
    }
  });
});
onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<style lang="scss">
.webmention-faces-skeleton {
  block-size: 2.5rem;
}
</style>
