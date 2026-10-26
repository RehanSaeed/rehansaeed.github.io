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
      @pointerenter="onBubbleEnter"
      @pointerleave="onBubbleLeave">
      {{ text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
type Placement = "top" | "right" | "bottom" | "left";

const props = withDefaults(
  defineProps<{ text: string; placement?: Placement }>(),
  { placement: "top" },
);
const id = useId();
const bubble = useTemplateRef("bubble");
const open = ref(false);
const side = ref<Placement>(props.placement);
const teleportTarget = shallowRef<HTMLElement | string>("body");
let anchor: HTMLElement | undefined;
let hovered = false;
let focused = false;
let bubbleHovered = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function clearTimer() {
  clearTimeout(timer);
}

function dismiss() {
  clearTimer();
  open.value = false;
}

function show(event: Event, delay = 0) {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  anchor = event.currentTarget;
  teleportTarget.value = anchor.closest("dialog") ?? "body";
  clearTimer();
  timer = setTimeout(() => {
    if (props.text) open.value = true;
  }, delay);
}

function scheduleHide() {
  clearTimer();
  timer = setTimeout(() => {
    if (!hovered && !focused && !bubbleHovered) dismiss();
  }, 120);
}

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  hovered = true;
  show(event, 300);
}

function onPointerLeave() {
  hovered = false;
  scheduleHide();
}

function onFocus(event: FocusEvent) {
  focused = true;
  show(event);
}

function onBlur() {
  focused = false;
  scheduleHide();
}

function onBubbleEnter() {
  bubbleHovered = true;
  clearTimer();
}

function onBubbleLeave() {
  bubbleHovered = false;
  scheduleHide();
}

const trigger = computed(() => ({
  "aria-describedby": open.value ? id : undefined,
  onPointerenter: onPointerEnter,
  onPointerleave: onPointerLeave,
  onFocus,
  onBlur,
  onClick: dismiss,
}));

function position() {
  if (!anchor || !bubble.value) return;
  const target = anchor.getBoundingClientRect();
  if (!anchor.isConnected || target.bottom < 0 || target.top > innerHeight) {
    dismiss();
    return;
  }
  const tooltip = bubble.value;
  const { width, height } = tooltip.getBoundingClientRect();
  const gap = 12;
  const padding = 8;
  const spaces = {
    top: target.top,
    right: innerWidth - target.right,
    bottom: innerHeight - target.bottom,
    left: target.left,
  };
  const opposite: Record<Placement, Placement> = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  };
  const preferred = props.placement;
  const alternate = opposite[preferred];
  const required =
    (preferred === "top" || preferred === "bottom" ? height : width) +
    gap +
    padding;
  side.value =
    spaces[preferred] < required && spaces[alternate] > spaces[preferred]
      ? alternate
      : preferred;
  const vertical = side.value === "top" || side.value === "bottom";
  let x = target.left + (target.width - width) / 2;
  let y = target.top + (target.height - height) / 2;
  if (side.value === "top") y = target.top - height - gap;
  if (side.value === "bottom") y = target.bottom + gap;
  if (side.value === "left") x = target.left - width - gap;
  if (side.value === "right") x = target.right + gap;
  x = Math.max(padding, Math.min(x, innerWidth - width - padding));
  y = Math.max(padding, Math.min(y, innerHeight - height - padding));
  const arrow = vertical
    ? target.left + target.width / 2 - x
    : target.top + target.height / 2 - y;
  const edge = vertical ? width : height;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.setProperty(
    "--tooltip-arrow-offset",
    `${Math.max(12, Math.min(arrow, edge - 12))}px`,
  );
}

function onEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  dismiss();
}

watch(open, async (visible, _, onCleanup) => {
  if (!visible) return;
  const observer = new ResizeObserver(position);
  onCleanup(() => {
    observer.disconnect();
    window.removeEventListener("resize", position);
    window.removeEventListener("scroll", position, true);
    document.removeEventListener("transitionend", position);
    document.removeEventListener("keydown", onEscape, true);
    bubbleHovered = false;
  });
  await nextTick();
  if (!open.value || !bubble.value || !anchor) return;
  // Use the top layer to escape clipping, but stay inside a modal's non-inert subtree.
  bubble.value.showPopover();
  position();
  observer.observe(anchor);
  observer.observe(bubble.value);
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, true);
  document.addEventListener("transitionend", position);
  document.addEventListener("keydown", onEscape, true);
});

onBeforeUnmount(clearTimer);
</script>

<style lang="scss">
.tooltip {
  position: fixed;
  inset: auto;
  margin: 0;
  padding: var(--global-space-fixed-2) var(--global-space-fixed-3);
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

  &::before {
    content: "";
    position: absolute;
    inline-size: 10px;
    block-size: 10px;
    border: inherit;
    border-top: 0;
    border-left: 0;
    background: inherit;
  }

  &[data-placement="top"]::before {
    left: var(--tooltip-arrow-offset);
    bottom: -7px;
    transform: translateX(-50%) rotate(45deg);
  }

  &[data-placement="bottom"]::before {
    left: var(--tooltip-arrow-offset);
    top: -7px;
    transform: translateX(-50%) rotate(225deg);
  }

  &[data-placement="left"]::before {
    top: var(--tooltip-arrow-offset);
    right: -7px;
    transform: translateY(-50%) rotate(-45deg);
  }

  &[data-placement="right"]::before {
    top: var(--tooltip-arrow-offset);
    left: -7px;
    transform: translateY(-50%) rotate(135deg);
  }
}

@media print {
  .tooltip {
    display: none;
  }
}
</style>
