<template>
  <article
    class="number-ticker"
    :aria-label="title"
    :data-value="displayValue"
    :data-rate="rate"
    :data-state="running ? 'running' : 'paused'">
    <h3 class="number-ticker__title">{{ title }}</h3>
    <p class="number-ticker__value" aria-live="off">
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
    </p>
  </article>
</template>

<script setup lang="ts">
import { advanceCounter } from "#shared/utils/ticker";

const props = withDefaults(
  defineProps<{
    title: string;
    number: number;
    rate: number;
    locale?: string;
    paused?: boolean;
  }>(),
  { locale: "en-GB", paused: false },
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

function clearTimer() {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
}

function tick() {
  const now = Date.now();
  const seconds = Math.max(0, (now - lastTick) / 1000);
  const next = advanceCounter(
    { value: displayValue.value, remainder },
    props.rate,
    seconds,
    seconds > 5 ? 0.5 : Math.random(),
  );
  displayValue.value = next.value;
  remainder = next.remainder;
  lastTick = now;
}

function syncAnimation() {
  clearTimer();
  running.value =
    !!motion && !motion.matches && !props.paused && props.rate !== 0;
  if (!running.value) return;
  lastTick = Date.now();
  if (!document.hidden) timer = setInterval(tick, 1000);
}

function visibilityChanged() {
  clearTimer();
  if (running.value && !document.hidden) {
    tick();
    timer = setInterval(tick, 1000);
  }
}

watch([() => props.number, () => props.rate], () => {
  displayValue.value = props.number;
  remainder = 0;
  syncAnimation();
});
watch(() => props.paused, syncAnimation);

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
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--global-space-fixed-3);
  min-inline-size: 0;
  padding: clamp(0.75rem, 2vw, 2rem);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-content-background-color);
  text-align: start;
  container-type: inline-size;
}

.number-ticker__title {
  margin: 0;
  min-block-size: 2.6em;
  font-family: var(--font-heading);
  font-size: clamp(0.65rem, 3.8cqi, 1.1rem);
  line-height: 1.3;
}

.number-ticker__value {
  margin: 0;
  min-inline-size: 0;
  max-inline-size: 100%;
  color: var(--global-accent-color);
  font-family: var(--global-font-family-monospace);
  font-size: clamp(0.75rem, 10cqi, 2.4rem);
  font-weight: var(--global-font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.number-ticker__accessible {
  @include visually-hidden.visually-hidden();
}

.number-ticker__digits {
  display: flex;
  gap: 0.06em;
}

.number-ticker__cell {
  display: inline-block;
  position: relative;
  overflow: hidden;
  inline-size: 0.75em;
  block-size: 1.4em;
  border-radius: calc(var(--global-border-radius) / 2);
  background: color-mix(
    in srgb,
    var(--global-accent-color) 5%,
    var(--global-content-background-color)
  );
  box-shadow: inset 0 -2px
    color-mix(in srgb, var(--global-accent-color) 20%, transparent);
  text-align: center;
}

.number-ticker__cell--separator {
  inline-size: 0.3em;
  background: none;
  box-shadow: none;
}

.number-ticker__digit {
  display: block;
  position: absolute;
  inset: 0;
}

.number-ticker-digit-enter-active,
.number-ticker-digit-leave-active {
  transition:
    transform 450ms var(--ease-out-cubic),
    opacity 450ms var(--ease-out-cubic);
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
