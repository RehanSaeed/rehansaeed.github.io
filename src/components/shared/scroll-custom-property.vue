<script>
import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
} from "@vue/composition-api";

export default defineComponent({
  name: "u-scroll-custom-property",
  render() {
    const scroll = this.scroll;
    if (this.$parent.$el) {
      this.$parent.$el.style = "--scroll: " + scroll;
    }
    // TODO: Rename to $slots in Vue 3.
    return this.$scopedSlots.default();
  },
  setup() {
    const scroll = ref(0);

    function onScroll() {
      requestAnimationFrame(() => {
        scroll.value =
          window.pageYOffset /
          (document.body.offsetHeight - window.innerHeight);
      });
    }

    onMounted(() => {
      if (window) {
        window.addEventListener("scroll", onScroll);
      }
    });
    onUnmounted(() => {
      if (window) {
        window.removeEventListener("scroll", onScroll);
      }
    });

    return {
      scroll,
    };
  },
});
</script>
