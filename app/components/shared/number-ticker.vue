<template>
  <u-intersect @change="intersectionChanged">
    <dl class="number-ticker">
      <dt
        class="number-ticker__header"
        :class="{ 'number-ticker__header--with-info': info }">
        <span class="number-ticker__label">{{ label }}</span>
        <u-tooltip
          v-if="info"
          v-slot="{ trigger }"
          :text="info"
          toggle-on-click>
          <u-button
            v-bind="trigger"
            class="number-ticker__info"
            :aria-label="label">
            <u-icon name="fa-solid:info-circle" />
          </u-button>
        </u-tooltip>
      </dt>
      <dd class="number-ticker__value" aria-live="off">
        <span class="number-ticker__accessible">{{ exactValue }}</span>
        <span class="number-ticker__digits" aria-hidden="true">
          <span
            v-for="(character, index) of formattedValue"
            :key="formattedValue.length - index"
            class="number-ticker__cell"
            :class="{
              'number-ticker__cell--separator': !/\p{N}/u.test(character),
            }">
            <Transition name="number-ticker-digit">
              <span :key="character" class="number-ticker__digit">{{
                character
              }}</span>
            </Transition>
          </span>
        </span>
      </dd>
    </dl>
  </u-intersect>
</template>

<script setup lang="ts">
import { advanceCounter } from "#shared/utils/ticker";

const props = withDefaults(
  defineProps<{
    label: string;
    number: number;
    rate: number;
    locale?: string;
    info?: string;
  }>(),
  { locale: "en-GB" },
);

const displayValue = ref(props.number);
const running = ref(false);
const exactValue = computed(() => props.number.toLocaleString(props.locale));
const formattedValue = computed(() =>
  displayValue.value.toLocaleString(props.locale),
);
let timer: ReturnType<typeof setInterval> | undefined;
let remainder = 0;
let lastTick = 0;
let motion: MediaQueryList | undefined;
let inViewport = false;

const clearTimer = () => {
  if (timer !== undefined) {
    clearInterval(timer);
  }
  timer = undefined;
};

const tick = (random = Math.random()) => {
  const now = Date.now();
  const seconds = Math.max(0, (now - lastTick) / 1000);
  const next = advanceCounter(
    { value: displayValue.value, remainder },
    props.rate,
    seconds,
    seconds > 5 ? 0.5 : random,
  );
  displayValue.value = next.value;
  remainder = next.remainder;
  lastTick = now;
};

const syncAnimation = () => {
  running.value = !!motion && !motion.matches && props.rate !== 0;
  lastTick = Date.now();
  visibilityChanged();
};

const visibilityChanged = () => {
  clearTimer();
  if (running.value && inViewport && !document.hidden) {
    tick(0.5);
    timer = setInterval(tick, 1000);
  }
};

const intersectionChanged = (entries: IntersectionObserverEntry[]) => {
  const visible = entries.some((entry) => entry.isIntersecting);
  if (visible === inViewport) {
    return;
  }
  inViewport = visible;
  visibilityChanged();
};

watch([() => props.number, () => props.rate], () => {
  displayValue.value = props.number;
  remainder = 0;
  syncAnimation();
});
onMounted(() => {
  motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  motion.addEventListener("change", syncAnimation);
  document.addEventListener("visibilitychange", visibilityChanged);
  syncAnimation();
});

onBeforeUnmount(() => {
  clearTimer();
  motion?.removeEventListener("change", syncAnimation);
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.number-ticker {
  --number-ticker-font-size-base: 1rem;
  --number-ticker-font-size-min: calc(
    var(--number-ticker-font-size-base) * 0.75
  );
  --number-ticker-label-line-height: 1.3;
  --number-ticker-line-height: 1.4;
  --number-ticker-digit-width: 0.65em;
  --number-ticker-separator-width: 0.32em;
  --number-ticker-digit-gap: 0.035em;
  --number-ticker-digit-duration: 450ms;

  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: center;
  justify-items: center;
  gap: var(--global-space-fixed-3);
  min-inline-size: 0;
  padding: clamp(
    var(--global-space-fixed-3),
    2vw,
    calc(var(--global-space-fixed-4) * 2)
  );
  padding-block-start: clamp(
    calc(var(--global-space-fixed-4) / 2),
    1vw,
    var(--global-space-fixed-4)
  );
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-content-background-color);
  text-align: center;
  container-type: inline-size;
}

.number-ticker__header {
  display: grid;
  grid-template-areas: "label";
  align-items: center;
  inline-size: 100%;
}

.number-ticker__header--with-info {
  grid-template-columns:
    var(--global-space-fixed-5) minmax(0, 1fr)
    var(--global-space-fixed-5);
  grid-template-areas: ". label info";
  gap: calc(var(--global-space-fixed-4) / 4);
}

.number-ticker__label {
  display: grid;
  grid-area: label;
  align-content: center;
  margin: 0;
  min-block-size: calc(var(--number-ticker-label-line-height) * 2em);
  font-family: var(--font-heading);
  font-size: clamp(
    var(--number-ticker-font-size-min),
    7cqi,
    calc(var(--number-ticker-font-size-base) * 2)
  );
  line-height: var(--number-ticker-label-line-height);
}

.number-ticker__info {
  display: grid;
  grid-area: info;
  place-items: center;
  inline-size: var(--global-space-fixed-5);
  block-size: var(--global-space-fixed-5);
  font-size: var(--number-ticker-font-size-base);
  touch-action: manipulation;

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-focus-outline-offset);
  }
}

.number-ticker__value {
  margin: 0;
  min-inline-size: 0;
  max-inline-size: 100%;
  color: var(--global-accent-color);
  font-family: var(--global-font-family-monospace);
  font-size: clamp(
    var(--number-ticker-font-size-min),
    14.5cqi,
    calc(var(--number-ticker-font-size-base) * 5)
  );
  font-weight: var(--global-font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: var(--number-ticker-line-height);
}

.number-ticker__accessible {
  @include visually-hidden.visually-hidden();
}

.number-ticker__digits {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: var(--number-ticker-digit-gap);
}

.number-ticker__cell {
  display: inline-block;
  position: relative;
  overflow: hidden;
  inline-size: var(--number-ticker-digit-width);
  block-size: calc(var(--number-ticker-line-height) * 1em);
  border-radius: calc(var(--global-border-radius) / 2);
  background: color-mix(
    in srgb,
    var(--global-accent-color) 5%,
    var(--global-content-background-color)
  );
  box-shadow: inset 0 calc(-1 * var(--global-border-width-2))
    color-mix(in srgb, var(--global-accent-color) 20%, transparent);
  text-align: center;
}

.number-ticker__cell--separator {
  inline-size: var(--number-ticker-separator-width);
  background: none;
  box-shadow: none;
}

.number-ticker__digit {
  display: grid;
  justify-content: center;
  position: absolute;
  inset: 0;
}

.number-ticker-digit-enter-active,
.number-ticker-digit-leave-active {
  transition:
    transform var(--number-ticker-digit-duration) var(--ease-out-cubic),
    opacity var(--number-ticker-digit-duration) var(--ease-out-cubic);
}

.number-ticker-digit-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.number-ticker-digit-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .number-ticker-digit-enter-active,
  .number-ticker-digit-leave-active {
    transition: none;
  }
}
</style>
