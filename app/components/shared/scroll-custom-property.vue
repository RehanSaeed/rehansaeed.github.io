<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "u-scroll-custom-property",
  setup(_props, { slots }) {
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
        const scrollRange =
          document.documentElement.scrollHeight - window.innerHeight;
        const scroll =
          scrollRange > 0
            ? Math.max(0, Math.min(1, window.scrollY / scrollRange))
            : 0;

        document.documentElement.style.setProperty("--scroll", String(scroll));
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
