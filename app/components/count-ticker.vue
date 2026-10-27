<template>
  <article
    class="count-ticker"
    :class="{ 'count-ticker--running': running }"
    :aria-label="label"
    :data-value="displayValue"
    :data-state="running ? 'running' : estimated ? 'paused' : 'snapshot'">
    <header class="count-ticker__header">
      <h3 class="count-ticker__label">{{ label }}</h3>
      <span class="count-ticker__status">
        <span class="count-ticker__light" aria-hidden="true" />
        {{ status }}
      </span>
    </header>
    <p class="count-ticker__value" aria-live="off">
      <span class="count-ticker__accessible">
        {{ exactValue }} verified {{ label.toLowerCase() }}.
        {{
          estimated ? "The visual counter is an estimate, not live data." : ""
        }}
      </span>
      <span class="count-ticker__digits" aria-hidden="true">
        <span
          v-for="(character, index) of formattedValue"
          :key="formattedValue.length - index"
          class="count-ticker__cell"
          :class="{ 'count-ticker__cell--separator': character === ',' }">
          <Transition name="ticker-digit">
            <span :key="character" class="count-ticker__digit">{{
              character
            }}</span>
          </Transition>
        </span>
      </span>
    </p>
    <div class="count-ticker__footer">
      <p class="count-ticker__rate" :title="measurementWindow">
        <span v-if="growth.perSecond !== null">
          {{ dailyRate }} / day
          <span class="count-ticker__muted">observed average</span>
        </span>
        <span v-else class="count-ticker__muted">
          Waiting for two measured snapshots
        </span>
      </p>
      <button
        v-if="available"
        class="count-ticker__toggle"
        type="button"
        :aria-label="`${running ? 'Pause' : 'Start'} ${label.toLowerCase()} estimate`"
        :aria-pressed="running"
        @click="toggle">
        <NuxtIcon :name="running ? 'feather:pause' : 'feather:play'" />
        {{ running ? "Pause" : "Animate" }}
      </button>
    </div>
    <p class="count-ticker__verified">
      <span
        >Verified <strong>{{ exactValue }}</strong></span
      >
      <span>
        {{ growth.observedAt === null ? "Build snapshot" : "Observed" }}
        <time :datetime="observationDate.toISOString()">{{
          observationLabel
        }}</time>
      </span>
    </p>
    <p class="count-ticker__disclaimer">
      Estimates, not a live feed. Random steps follow the measured trend.
    </p>
  </article>
</template>

<script setup lang="ts">
import {
  canProjectCounter,
  advanceCounter,
  projectCounter,
  type CounterGrowth,
} from "#shared/utils/ticker";

const props = defineProps<{
  label: string;
  value: number;
  growth: CounterGrowth;
  generatedAt: string;
}>();
const displayValue = ref(props.value);
const running = ref(false);
const estimated = ref(false);
const now = ref(0);
const exactValue = computed(() => props.value.toLocaleString("en-GB"));
const formattedValue = computed(() =>
  displayValue.value.toLocaleString("en-GB"),
);
const available = computed(() => canProjectCounter(props.growth, now.value));
const status = computed(() => {
  if (running.value) return "Estimated";
  if (estimated.value) return "Estimate paused";
  if (props.growth.perSecond === null) return "Collecting history";
  if (props.growth.perSecond === 0) return "No measured change";
  return available.value ? "Motion paused" : "Snapshot";
});
const dailyRate = computed(() =>
  new Intl.NumberFormat("en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format((props.growth.perSecond ?? 0) * 86400),
);
const observationDate = computed(
  () => new Date(props.growth.observedAt ?? props.generatedAt),
);
const observationLabel = computed(() => formatDate(observationDate.value));
const measurementWindow = computed(() =>
  props.growth.since === null
    ? "A growth rate needs two complete observations at least one hour apart."
    : `Measured from ${formatDate(new Date(props.growth.since))} to ${observationLabel.value}.`,
);

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

let timer: ReturnType<typeof setInterval> | undefined;
let remainder = 0;
let lastTick = 0;
let motion: MediaQueryList | undefined;

function clearTimer() {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
}

function tick() {
  now.value = Date.now();
  if (!available.value) {
    running.value = false;
    estimated.value = false;
    displayValue.value = props.value;
    clearTimer();
    return;
  }
  const seconds = Math.max(0, (now.value - lastTick) / 1000);
  lastTick = now.value;
  // Rebase after timer throttling instead of treating a long sleep as one random step.
  if (seconds > 5) {
    displayValue.value = projectCounter(props.value, props.growth, now.value);
    remainder = 0;
    return;
  }
  const next = advanceCounter(
    { value: displayValue.value, remainder },
    props.growth.perSecond!,
    seconds,
    Math.random(),
  );
  remainder = next.remainder;
  displayValue.value = next.value;
}

function start() {
  now.value = Date.now();
  if (!available.value) return;
  displayValue.value = projectCounter(props.value, props.growth, now.value);
  estimated.value = true;
  running.value = true;
  remainder = 0;
  lastTick = now.value;
  clearTimer();
  if (!document.hidden) timer = setInterval(tick, 1000);
}

function pause() {
  running.value = false;
  clearTimer();
}

function toggle() {
  if (running.value) pause();
  else start();
}

function visibilityChanged() {
  clearTimer();
  if (running.value && !document.hidden) start();
}

function motionChanged() {
  if (motion?.matches) pause();
}

watch([() => props.value, () => props.growth], () => {
  pause();
  displayValue.value = props.value;
  estimated.value = false;
  now.value = Date.now();
  if (motion && !motion.matches) start();
});

onMounted(() => {
  now.value = Date.now();
  motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  motion.addEventListener("change", motionChanged);
  document.addEventListener("visibilitychange", visibilityChanged);
  if (!motion.matches) start();
});

onBeforeUnmount(() => {
  clearTimer();
  motion?.removeEventListener("change", motionChanged);
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.count-ticker {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--global-space-fixed-4);
  min-inline-size: 0;
  padding: clamp(1rem, 3vw, 2rem);
  border: 1px solid var(--global-border-color);
  border-block-start: 3px solid var(--global-accent-color);
  border-radius: var(--global-border-radius);
  background: var(--global-content-background-color);
  box-shadow: var(--global-shadow-1);
  text-align: start;
}

.count-ticker__header,
.count-ticker__footer,
.count-ticker__verified {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--global-space-fixed-3);
}

.count-ticker__label,
.count-ticker__value,
.count-ticker__rate,
.count-ticker__verified,
.count-ticker__disclaimer {
  margin: 0;
  min-inline-size: 0;
  max-inline-size: 100%;
}

.count-ticker__label {
  font-family: var(--global-font-family-sans-serif);
  font-size: var(--global-font-size-3);
}

.count-ticker__status,
.count-ticker__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--global-space-fixed-2);
  font-size: var(--global-font-size-1);
}

.count-ticker__light {
  inline-size: 0.45rem;
  block-size: 0.45rem;
  border-radius: 50%;
  background: var(--global-body-color);
}

.count-ticker--running .count-ticker__light {
  background: var(--global-accent-color);
  box-shadow: 0 0 0 0.2rem
    color-mix(in srgb, var(--global-accent-color) 12%, transparent);
}

.count-ticker__value {
  padding-block: var(--global-space-fixed-3);
  color: var(--global-accent-color);
  font-family: var(--global-font-family-monospace);
  font-size: clamp(1.25rem, 3.8vw, 2.4rem);
  font-weight: var(--global-font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.count-ticker__accessible {
  @include visually-hidden.visually-hidden();
}

.count-ticker__digits {
  display: flex;
  gap: 0.06em;
}

.count-ticker__cell {
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

.count-ticker__cell--separator {
  inline-size: 0.3em;
  background: none;
  box-shadow: none;
}

.count-ticker__digit {
  display: block;
  position: absolute;
  inset: 0;
}

.ticker-digit-enter-active,
.ticker-digit-leave-active {
  transition:
    transform 450ms var(--ease-out-cubic),
    opacity 450ms var(--ease-out-cubic);
}

.ticker-digit-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.ticker-digit-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.count-ticker__rate {
  font-size: var(--global-font-size-1);
  font-variant-numeric: tabular-nums;
}

.count-ticker__muted,
.count-ticker__verified,
.count-ticker__disclaimer {
  color: var(--global-body-color);
  font-size: var(--global-font-size-1);
}

.count-ticker__toggle {
  padding: var(--global-space-fixed-2) var(--global-space-fixed-3);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-background-color);
  color: var(--global-title-color);
  cursor: pointer;
}

.count-ticker__toggle:hover,
.count-ticker__toggle:focus-visible {
  border-color: var(--global-accent-color);
  color: var(--global-accent-color);
}

@media (prefers-reduced-motion: reduce) {
  .ticker-digit-enter-active,
  .ticker-digit-leave-active {
    transition: none;
  }
}
</style>
