<script>
export default {
  name: "u-intersect",
  emits: ["change", "destroyed", "enter", "enterFirstTime", "leave"],
  data() {
    return {
      hasIntersected: false,
    };
  },
  props: {
    threshold: {
      type: Array,
      required: false,
      default: () => [0, 0.2],
    },
    root: {
      type: typeof HTMLElement !== "undefined" ? HTMLElement : Object,
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
        if (!entries[0].isIntersecting) {
          this.$emit("leave", [entries[0]]);
        } else {
          this.$emit("enter", [entries[0]]);
          if (!this.hasIntersected) {
            this.hasIntersected = true;
            this.$emit("enterFirstTime", [entries[0]]);
          }
        }

        this.$emit("change", [entries[0]]);
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

      this.observer.observe(this.$el);
    });
  },
  unmounted() {
    this.$emit("destroyed");
    this.observer.disconnect();
  },
  render() {
    const nodes = this.$slots.default?.() ?? [];
    return nodes[0] ?? null;
  },
};
</script>
