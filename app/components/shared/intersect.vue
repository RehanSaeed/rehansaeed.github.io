<script lang="ts">
import type { PropType } from "vue";

export default defineComponent({
  name: "u-intersect",
  emits: ["change", "destroyed", "enter", "enterFirstTime", "leave"],
  data(): {
    hasIntersected: boolean;
    observer: IntersectionObserver | undefined;
  } {
    return {
      hasIntersected: false,
      observer: undefined,
    };
  },
  props: {
    threshold: {
      type: Array as PropType<number[]>,
      required: false,
      default: () => [0, 0.2],
    },
    root: {
      type: Object as PropType<Element | Document | null>,
      required: false,
      default: () => null,
    },
    rootMargin: {
      type: String,
      required: false,
      default: () => "0px 0px 0px 0px",
    },
  },
  mounted() {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            this.$emit("leave", [entry]);
          } else {
            this.$emit("enter", [entry]);
            if (!this.hasIntersected) {
              this.hasIntersected = true;
              this.$emit("enterFirstTime", [entry]);
            }
          }

          this.$emit("change", [entry]);
        }
      },
      {
        threshold: this.threshold,
        root: this.root,
        rootMargin: this.rootMargin,
      },
    );

    this.$nextTick(() => {
      if (!(this.$el instanceof Element)) {
        console.warn(
          "You must have exactly one element inside a <u-intersect> component.",
        );
        return;
      }

      this.observer?.observe(this.$el);
    });
  },
  unmounted() {
    this.$emit("destroyed");
    this.observer?.disconnect();
  },
  render() {
    const nodes = this.$slots.default?.() ?? [];
    return nodes[0] ?? null;
  },
});
</script>
