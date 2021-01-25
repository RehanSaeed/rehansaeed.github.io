<script>
export default {
  name: "u-scroll-custom-property",
  data() {
    return {
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
        this.scroll =
          window.pageYOffset /
          (document.body.offsetHeight - window.innerHeight);
        console.log(this.scroll);
      });
    },
  },
  render() {
    const scroll = this.scroll;
    if (this.$parent.$el) {
      this.$parent.$el.style.cssText = "--scroll: " + scroll;
    }

    // TODO: Rename to $slots in Vue 3.
    return this.$scopedSlots.default();
  },
};
</script>
