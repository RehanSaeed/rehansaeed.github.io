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
    if (window) {
      window.addEventListener("scroll", this.onScroll);
    }
  },
  unmounted() {
    if (window) {
      window.removeEventListener("scroll", this.onScroll);
    }
  },
  methods: {
    onScroll() {
      requestAnimationFrame(() => {
        this.previousScroll = this.scroll;
        this.scroll =
          window.pageYOffset /
          (document.body.offsetHeight - window.innerHeight);
      });
    },
  },
  render() {
    const scroll = this.scroll;
    const element = this.$parent.$el;
    if (element) {
      element.style.setProperty("--scroll", scroll);

      if (this.scroll > this.previousScroll) {
        element.classList.add("scroll-down");
        element.classList.remove("scroll-up");
      } else {
        element.classList.remove("scroll-down");
        element.classList.add("scroll-up");
      }
    }

    // TODO: Rename to $slots in Vue 3.
    return this.$scopedSlots.default();
  },
};
</script>
