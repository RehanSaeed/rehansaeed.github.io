<script>
export default {
  name: "u-scroll-custom-property",
  data() {
    return {
      previousScroll: 0,
      scroll: 0,
    };
  },
  mounted() {
    window.addEventListener("scroll", this.onScroll);
  },
  unmounted() {
    window.removeEventListener("scroll", this.onScroll);
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
      const element = this.$el;
      if (!(element instanceof HTMLElement)) {
        return;
      }

      element.style.setProperty("--scroll", this.scroll);

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
};
</script>
