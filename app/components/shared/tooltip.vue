<template>
  <slot :trigger="trigger" />
  <Teleport :to="teleportTarget">
    <div
      v-if="open"
      :id="id"
      ref="bubble"
      class="tooltip"
      role="tooltip"
      popover="manual"
      :data-placement="side"
      :data-positioned="isPositioned"
      @pointerenter="onBubbleEnter"
      @pointerleave="onBubbleLeave">
      {{ text }}
      <span ref="arrowElement" class="tooltip__arrow" aria-hidden="true" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  arrow,
  autoUpdate,
  flip,
  getOverflowAncestors,
  hide,
  limitShift,
  offset,
  shift,
  useFloating,
} from "@floating-ui/vue";

type Placement = "top" | "right" | "bottom" | "left";

const props = withDefaults(
  defineProps<{ text: string; placement?: Placement }>(),
  { placement: "top" },
);
const id = useId();
const bubble = useTemplateRef("bubble");
const arrowElement = useTemplateRef("arrowElement");
const open = ref(false);
const teleportTarget = shallowRef<HTMLElement | string>("body");
const anchor = shallowRef<HTMLElement | null>(null);
const {
  floatingStyles,
  placement: side,
  middlewareData,
  isPositioned,
} = useFloating(anchor, bubble, {
  open,
  placement: computed(() => props.placement),
  strategy: "fixed",
  middleware: [
    offset(12),
    shift({ padding: 8, limiter: limitShift() }),
    flip({ padding: 8, fallbackAxisSideDirection: "start" }),
    arrow({ element: arrowElement, padding: 8 }),
    hide(({ elements }) => {
      const reference = elements.reference;
      if (!(reference instanceof Element)) {
        return {};
      }
      const topLayer = reference.closest(":modal, :popover-open");
      // Top-layer ancestors escape page clipping, but their inner scrollers do not.
      return topLayer
        ? {
            boundary: getOverflowAncestors(reference).filter(
              (ancestor): ancestor is Element =>
                ancestor instanceof Element && topLayer.contains(ancestor),
            ),
          }
        : {};
    }),
  ],
  whileElementsMounted(reference, floating, update) {
    // Keep the top layer inside a modal's non-inert subtree.
    floating.showPopover();
    return autoUpdate(reference, floating, update, { animationFrame: true });
  },
});
watchEffect(() => {
  if (bubble.value) Object.assign(bubble.value.style, floatingStyles.value);
  if (!arrowElement.value) return;
  const coordinates = middlewareData.value.arrow;
  arrowElement.value.style.left =
    coordinates?.x == null ? "" : `${coordinates.x}px`;
  arrowElement.value.style.top =
    coordinates?.y == null ? "" : `${coordinates.y}px`;
});
let hovered = false;
let focused = false;
let bubbleHovered = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const clearTimer = () => {
  clearTimeout(timer);
};

const dismiss = () => {
  clearTimer();
  open.value = false;
};

const show = (event: Event, delay = 0) => {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  anchor.value = event.currentTarget;
  teleportTarget.value = anchor.value.closest("dialog") ?? "body";
  clearTimer();
  timer = setTimeout(() => {
    if (props.text) open.value = true;
  }, delay);
};

const scheduleHide = () => {
  if (hovered || focused || bubbleHovered) return;
  clearTimer();
  timer = setTimeout(() => {
    if (!hovered && !focused && !bubbleHovered) dismiss();
  }, 120);
};

const onPointerEnter = (event: PointerEvent) => {
  if (event.pointerType === "touch") return;
  hovered = true;
  show(event, 300);
};

const onPointerLeave = () => {
  hovered = false;
  scheduleHide();
};

const onPointerDown = () => {
  focused = false;
  dismiss();
};

const onFocus = (event: FocusEvent) => {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement) || !target.matches(":focus-visible")) {
    return;
  }
  const dialog = target.closest("dialog:modal");
  // Native modal autofocus enters from outside; subsequent keyboard focus stays inside.
  if (
    dialog &&
    (!(event.relatedTarget instanceof Node) ||
      !dialog.contains(event.relatedTarget))
  ) {
    return;
  }
  focused = true;
  show(event);
};

const onBlur = () => {
  focused = false;
  scheduleHide();
};

const onBubbleEnter = () => {
  bubbleHovered = true;
  clearTimer();
};

const onBubbleLeave = () => {
  bubbleHovered = false;
  scheduleHide();
};

const trigger = computed(() => ({
  "aria-describedby": open.value ? id : undefined,
  onPointerenter: onPointerEnter,
  onPointerleave: onPointerLeave,
  onPointerdown: onPointerDown,
  onFocus,
  onBlur,
  onClick: dismiss,
}));

const onEscape = (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  dismiss();
};

watch(open, (visible, _, onCleanup) => {
  if (!visible) return;
  onCleanup(() => {
    document.removeEventListener("keydown", onEscape, true);
    bubbleHovered = false;
  });
  document.addEventListener("keydown", onEscape, true);
});

watch(
  () => middlewareData.value.hide?.referenceHidden,
  (hidden) => {
    if (hidden) dismiss();
  },
);

onBeforeUnmount(clearTimer);
</script>

<style lang="scss">
.tooltip {
  position: fixed;
  inset: auto;
  margin: 0;
  padding: var(--global-space-fixed-2) var(--global-space-fixed-3);
  inline-size: max-content;
  max-inline-size: min(22rem, calc(100vw - 16px));
  max-block-size: calc(100vh - 16px);
  overflow: visible;
  border: var(--global-border-width-2) solid
    var(--tooltip-border-color, var(--global-accent-color));
  border-radius: var(--global-border-radius);
  background: var(--tooltip-background, var(--global-background-color));
  color: var(--tooltip-color, var(--global-body-color));
  box-shadow: var(--global-shadow-2);
  font-family: var(--global-font-family-sans-serif);
  font-size: var(--global-font-size-1);
  font-weight: var(--global-font-weight-normal);
  line-height: var(--global-line-height-1);
  text-align: start;
  overflow-wrap: anywhere;

  &[data-positioned="false"] {
    visibility: hidden;
  }

  .tooltip__arrow {
    position: absolute;
    inline-size: 10px;
    block-size: 10px;
    border: inherit;
    border-top: 0;
    border-left: 0;
    background: inherit;
  }

  &[data-placement="top"] .tooltip__arrow {
    bottom: -7px;
    transform: rotate(45deg);
  }

  &[data-placement="bottom"] .tooltip__arrow {
    top: -7px;
    transform: rotate(225deg);
  }

  &[data-placement="left"] .tooltip__arrow {
    right: -7px;
    transform: rotate(-45deg);
  }

  &[data-placement="right"] .tooltip__arrow {
    left: -7px;
    transform: rotate(135deg);
  }
}

@media print {
  .tooltip {
    display: none;
  }
}
</style>
