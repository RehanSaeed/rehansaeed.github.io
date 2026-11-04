<script lang="ts">
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
  onUnmounted,
} from "vue";
export default defineComponent({
  name: "u-scroll-custom-property",
  setup(_props, { slots }) {
    const instance = getCurrentInstance();
    let previousScroll = 0;
    let scroll = 0;
    onMounted(() => {
      window.addEventListener("scroll", onScroll);
    });
    onUnmounted(() => {
      window.removeEventListener("scroll", onScroll);
    });
    const onScroll = () => {
      requestAnimationFrame(() => {
        previousScroll = scroll;
        scroll =
          window.pageYOffset /
          (document.body.offsetHeight - window.innerHeight);
        update();
      });
    };
    const update = () => {
      const element: unknown = instance?.proxy?.$el;
      if (!(element instanceof HTMLElement)) {
        return;
      }

      element.style.setProperty("--scroll", String(scroll));

      if (scroll > previousScroll) {
        element.classList.add("scroll-down");
        element.classList.remove("scroll-up");
      } else {
        element.classList.remove("scroll-down");
        element.classList.add("scroll-up");
      }
    };
    return () => {
      const nodes = slots.default?.() ?? [];
      return nodes.length === 1 ? nodes[0] : nodes;
    };
  },
});
</script>
