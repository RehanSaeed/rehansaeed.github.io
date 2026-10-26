<template>
  <u-card v-if="history || error" class="post-traffic">
    <div class="post-traffic__header">
      <h2>Article Traffic</h2>
      <u-button
        v-if="history && data"
        class="post-traffic__info"
        aria-label="About article traffic"
        :aria-expanded="sourceOpen"
        :aria-controls="`${id}-source`"
        @click="sourceOpen = !sourceOpen">
        <u-icon name="fa-regular:question-circle" />
      </u-button>
    </div>
    <p v-if="error" role="status">Traffic history is currently unavailable.</p>
    <template v-else-if="history && data">
      <p v-show="sourceOpen" :id="`${id}-source`" class="post-traffic__source">
        Source: Google Analytics 4. Reporting timezone: {{ data.timeZone }}.
        Updated <time :datetime="data.updated">{{ date(data.updated) }}</time
        >. Repeat views are included; these are not unique visitors. The first
        and last months cover only the dates shown. Recent days are excluded
        while analytics are processed. Tracking blockers and consent choices can
        reduce recorded traffic.
      </p>
      <div class="post-traffic__summary">
        <p class="post-traffic__total">
          <strong>{{ number.format(total) }}</strong>
          <span>page views</span>
        </p>
        <p class="post-traffic__range">
          <time :datetime="history.startDate">{{
            date(history.startDate)
          }}</time>
          <span> to </span>
          <time :datetime="history.endDate">{{ date(history.endDate) }}</time>
        </p>
      </div>
      <p
        v-if="history.startDate > published.slice(0, 10)"
        class="post-traffic__coverage">
        Traffic before {{ date(history.startDate) }} is unavailable.
      </p>
      <div class="post-traffic__chart">
        <div class="post-traffic__scale" aria-hidden="true">
          <span
            v-for="tick in ticks"
            :key="tick"
            :style="{ top: `${y(tick) / 2}%` }">
            {{ number.format(tick) }}
          </span>
        </div>
        <div
          ref="plot"
          class="post-traffic__plot"
          role="group"
          aria-label="Monthly page views. Use arrow keys to inspect months."
          @pointermove="inspect"
          @pointerleave="leave"
          @focusout="blur"
          @keydown="navigate">
          <svg
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            aria-hidden="true">
            <path class="post-traffic__axes" d="M 4 4 V 196 H 596" />
            <path
              v-for="tick in ticks.slice(0, -1)"
              :key="tick"
              class="post-traffic__gridline"
              :d="`M 4 ${y(tick)} H 596`" />
            <polyline class="post-traffic__line" :points="points" />
          </svg>
          <button
            v-for="(item, index) in history.months"
            :key="item.month"
            type="button"
            class="post-traffic__point"
            :class="{
              'post-traffic__point--selected': selectedIndex === index,
            }"
            :style="{ left: `${x(index) / 6}%`, top: `${y(item.views) / 2}%` }"
            :tabindex="index === (selectedIndex ?? 0) ? 0 : -1"
            :aria-label="pointText(index)"
            :aria-describedby="
              selectedIndex === index ? `${id}-tooltip` : undefined
            "
            @focus="selectedIndex = index"
            @click="selectPoint($event, index)" />
          <div
            v-if="selectedIndex !== null"
            :id="`${id}-tooltip`"
            class="post-traffic__tooltip"
            role="tooltip"
            :style="{
              left: `clamp(min(5rem, 50%), ${x(selectedIndex) / 6}%, max(50%, calc(100% - 5rem)))`,
              top: `${y(history.months[selectedIndex]!.views) / 2}%`,
            }">
            {{ pointText(selectedIndex) }}
          </div>
        </div>
        <div class="post-traffic__dates" aria-hidden="true">
          <span v-for="index in dateLabels" :key="index">
            {{ month(history.months[index]!.month) }}
          </span>
        </div>
      </div>
    </template>
  </u-card>
</template>

<script setup lang="ts">
import { parseTrafficSnapshot } from "#shared/utils/traffic";

const props = defineProps<{ permalink: string; published: string }>();
const id = useId();
const { data, error } = await useFetch("/post-traffic.json", {
  key: "post-traffic",
  server: false,
  transform: parseTrafficSnapshot,
});
watch(error, (value) => {
  if (value) console.warn("[traffic] Unable to load article traffic:", value);
});
const history = computed(() => data.value?.posts[props.permalink]);
const sourceOpen = ref(false);
const selectedIndex = ref<number | null>(null);
const plot = useTemplateRef<HTMLElement>("plot");
watch(history, () => {
  selectedIndex.value = null;
  sourceOpen.value = false;
});
const number = new Intl.NumberFormat("en-GB");
const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
const month = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
const total = computed(
  () => history.value?.months.reduce((sum, item) => sum + item.views, 0) ?? 0,
);
const step = computed(() => {
  const rough =
    Math.max(1, ...(history.value?.months.map((item) => item.views) ?? [])) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  return Math.max(1, Math.ceil(rough / magnitude) * magnitude);
});
const maximum = computed(() => step.value * 4);
const ticks = computed(() =>
  [4, 3, 2, 1, 0].map((value) => value * step.value),
);
const dateLabels = computed(() => {
  const last = (history.value?.months.length ?? 1) - 1;
  return [...new Set([0, Math.round(last / 2), last])];
});
const x = (index: number) =>
  history.value!.months.length === 1
    ? 300
    : 4 + (index / (history.value!.months.length - 1)) * 592;
const y = (views: number) => 196 - (views / maximum.value) * 192;
const points = computed(() =>
  history.value?.months
    .map((item, index) => `${x(index)},${y(item.views)}`)
    .join(" "),
);
function pointText(index: number) {
  const item = history.value!.months[index]!;
  return `${month(item.month)}: ${number.format(item.views)} page views`;
}
function inspect(event: MouseEvent) {
  if (!plot.value || !history.value) return;
  if (event.target instanceof Element && event.target.closest("[role=tooltip]"))
    return;
  const bounds = plot.value.getBoundingClientRect();
  const position = Math.max(
    0,
    Math.min(
      1,
      (((event.clientX - bounds.left) / bounds.width) * 600 - 4) / 592,
    ),
  );
  selectedIndex.value = Math.round(
    position * (history.value.months.length - 1),
  );
}
function selectPoint(event: MouseEvent, index: number) {
  if (event.detail === 0) selectedIndex.value = index;
  else inspect(event);
}
function leave() {
  if (!plot.value?.contains(document.activeElement)) selectedIndex.value = null;
}
function blur(event: FocusEvent) {
  if (
    !(event.relatedTarget instanceof Node) ||
    !plot.value?.contains(event.relatedTarget)
  ) {
    selectedIndex.value = null;
  }
}
function navigate(event: KeyboardEvent) {
  if (event.key === "Escape") {
    selectedIndex.value = null;
    return;
  }
  const last = (history.value?.months.length ?? 1) - 1;
  const current = selectedIndex.value ?? 0;
  const destinations: Partial<Record<string, number>> = {
    ArrowLeft: Math.max(0, current - 1),
    ArrowRight: Math.min(last, current + 1),
    Home: 0,
    End: last,
  };
  const next = destinations[event.key];
  if (next === undefined) return;
  event.preventDefault();
  selectedIndex.value = next;
  plot.value?.querySelectorAll("button")[next]?.focus();
}
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.post-traffic {
  min-inline-size: 0;
  padding-block-end: var(--global-space-fixed-5);
}

.post-traffic__header {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) 2rem;
  align-items: center;
  margin-block-end: var(--global-space-fixed-5);
}

.post-traffic__header h2 {
  grid-column: 2;
  margin: 0;
  text-align: center;
}

.post-traffic__info {
  grid-column: 3;
  justify-self: end;
  display: grid;
  place-items: center;
  min-inline-size: 2rem;
  min-block-size: 2rem;
}

.post-traffic__source {
  margin: 0 0 var(--global-space-fixed-4);
  font-size: var(--global-font-size-1);
}

.post-traffic__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--global-space-fixed-3) var(--global-space-fixed-5);
}

.post-traffic__total,
.post-traffic__range {
  margin: 0;
  min-inline-size: 0;
}

.post-traffic__total strong {
  display: block;
  font-family: var(--font-heading);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: var(--global-font-weight-normal);
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.post-traffic__range {
  margin-inline-start: auto;
}

@include breakpoints.respond-below(sm) {
  .post-traffic__range {
    flex-basis: 100%;
    margin-inline-start: 0;
  }
}

.post-traffic__coverage {
  margin-block: var(--global-space-fixed-3) 0;
  font-size: var(--global-font-size-1);
}

.post-traffic__chart {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--global-space-fixed-2);
  margin-block-start: var(--global-space-fixed-5);
  font-size: var(--global-font-size-1);
}

.post-traffic__scale {
  position: relative;
  min-inline-size: 2ch;
}

.post-traffic__scale span {
  position: absolute;
  inset-inline-end: 0;
  translate: 0 -50%;
}

.post-traffic__scale span:first-child {
  position: relative;
  display: block;
  inline-size: max-content;
}

.post-traffic__plot {
  position: relative;
  block-size: 12rem;
}

.post-traffic svg {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
}

.post-traffic__axes,
.post-traffic__gridline {
  fill: none;
  stroke: var(--global-border-color);
  vector-effect: non-scaling-stroke;
}

.post-traffic__gridline {
  stroke-dasharray: 3 5;
  opacity: 0.5;
}

.post-traffic__line {
  fill: none;
  stroke: var(--global-accent-color);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.post-traffic__point {
  position: absolute;
  translate: -50% -50%;
  display: grid;
  place-items: center;
  inline-size: 24px;
  block-size: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.post-traffic__point::after {
  content: "";
  inline-size: 5px;
  block-size: 5px;
  border-radius: 50%;
  background: var(--global-accent-color);
}

.post-traffic__point--selected::after {
  inline-size: 9px;
  block-size: 9px;
}

.post-traffic__point:focus-visible {
  outline: 2px solid var(--global-accent-color);
  outline-offset: 1px;
  z-index: 1;
}

.post-traffic__tooltip {
  position: absolute;
  z-index: 2;
  translate: -50% calc(-100% - 0.75rem);
  inline-size: max-content;
  max-inline-size: 100%;
  padding: var(--global-space-fixed-2) var(--global-space-fixed-3);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-content-background-color);
  box-shadow: var(--global-shadow-2);
  text-align: center;
}

.post-traffic__tooltip::after {
  content: "";
  position: absolute;
  inset-block-start: 100%;
  inset-inline: 0;
  block-size: 0.75rem;
}

.post-traffic__dates {
  grid-column: 2;
  display: flex;
  justify-content: space-between;
  gap: var(--global-space-fixed-2);
}
</style>
