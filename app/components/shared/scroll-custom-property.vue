<script lang="ts">
import { defineComponent, getCurrentInstance } from "vue";
export default defineComponent({
  name: "u-scroll-custom-property",
  setup(_props, { slots }) {
    const instance = getCurrentInstance();
    let scroll = 0;
    const { resume } = useRafFn(
      () => {
        const previousScroll = scroll;
        scroll =
          window.pageYOffset /
          (document.body.offsetHeight - window.innerHeight);
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
    useEventListener("scroll", resume, { passive: true });
    return () => {
      const nodes = slots.default?.() ?? [];
      return nodes.length === 1 ? nodes[0] : nodes;
    };
  },
});
</script>
