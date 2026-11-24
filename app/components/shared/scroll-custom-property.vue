<script lang="ts">
import { defineComponent, getCurrentInstance } from "vue";
export default defineComponent({
  name: "u-scroll-custom-property",
  setup(_props, { slots }) {
    const instance = getCurrentInstance();
    let scroll = 0;
    const render = () => {
      const nodes = slots.default?.() ?? [];
      return nodes.length === 1 ? nodes[0] : nodes;
    };
    if (
      typeof CSS !== "undefined" &&
      CSS.supports("animation-timeline", "scroll(root block)")
    ) {
      return render;
    }

    const { resume } = useRafFn(
      () => {
        const previousScroll = scroll;
        const scrollRange = document.body.offsetHeight - window.innerHeight;
        scroll =
          scrollRange > 0
            ? Math.max(0, Math.min(1, window.scrollY / scrollRange))
            : 0;
        const element: unknown = instance?.proxy?.$el;
        if (!(element instanceof HTMLElement)) {
          return;
        }
        element.style.setProperty("--scroll", String(scroll));
        element.classList.toggle("scroll-down", scroll > previousScroll);
        element.classList.toggle("scroll-up", scroll <= previousScroll);
      },
      { immediate: false, once: true },
    );
    if (typeof window !== "undefined") {
      useEventListener(window, "scroll", resume, { passive: true });
    }
    return render;
  },
});
</script>
