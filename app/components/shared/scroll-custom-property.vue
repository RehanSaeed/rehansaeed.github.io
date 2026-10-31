<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "u-scroll-custom-property",
  data() {
    return {
      previousScroll: 0,
      scroll: 0,
      scrollListener: null as (() => void) | null,
    };
  },
  mounted() {
    this.scrollListener = () => {
      this.onScroll();
    };
    window.addEventListener("scroll", this.scrollListener);
  },
  unmounted() {
    if (this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
    }
  },
  methods: {
    onScroll() {
      requestAnimationFrame(() => {
        this.previousScroll = this.scroll;
        this.scroll =
          window.pageYOffset /
          (document.body.offsetHeight - window.innerHeight);
        this.update();
      });
    },
    update() {
      const element: unknown = this.$el;
      if (!(element instanceof HTMLElement)) {
        return;
      }

      element.style.setProperty("--scroll", String(this.scroll));

      if (this.scroll > this.previousScroll) {
        element.classList.add("scroll-down");
        element.classList.remove("scroll-up");
      } else {
        element.classList.remove("scroll-down");
        element.classList.add("scroll-up");
      }
    },
  },
  render() {
    // Render the single wrapped element so that this.$el is that element.
    const nodes = this.$slots.default?.() ?? [];
    return nodes.length === 1 ? nodes[0] : nodes;
  },
});
</script>
