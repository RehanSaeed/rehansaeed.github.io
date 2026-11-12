<script lang="ts">
import {
  Comment,
  defineComponent,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  type PropType,
} from "vue";
export default defineComponent({
  name: "u-intersect",
  emits: ["change", "destroyed", "enter", "enterFirstTime", "leave"],
  props: {
    /** Visibility ratio at which intersection events fire. */ threshold: {
      type: Array as PropType<number[]>,
      required: false,
      default: () => [0, 0.2],
    },
    /** Element used as the intersection observer's viewport. */ root: {
      type: Object as PropType<Element | Document | null>,
      required: false,
      default: () => null,
    },
    /** Margin applied around the intersection observer's viewport. */ rootMargin:
      {
        type: String,
        required: false,
        default: () => "0px 0px 0px 0px",
      },
  },
  setup(props, { emit, slots }) {
    const instance = getCurrentInstance();
    let hasIntersected = false;
    let observer: IntersectionObserver | undefined;
    onMounted(() => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              emit("leave", [entry]);
            } else {
              emit("enter", [entry]);
              if (!hasIntersected) {
                hasIntersected = true;
                emit("enterFirstTime", [entry]);
              }
            }

            emit("change", [entry]);
          }
        },
        {
          threshold: props.threshold,
          root: props.root,
          rootMargin: props.rootMargin,
        },
      );

      void nextTick(() => {
        const element: unknown = instance?.proxy?.$el;
        if (!(element instanceof Element)) {
          console.warn(
            "You must have exactly one element inside a <u-intersect> component.",
          );
          return;
        }

        observer?.observe(element);
      });
    });
    onUnmounted(() => {
      emit("destroyed");
      observer?.disconnect();
    });
    return () => {
      const nodes = slots.default?.() ?? [];
      return nodes.find((node) => node.type !== Comment) ?? null;
    };
  },
});
</script>
