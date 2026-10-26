<template>
  <div
    class="post-traffic__chart"
    :class="{ 'post-traffic__chart--overlay': overlay }">
    <div class="post-traffic__axis-labels" aria-hidden="true">
      <span :class="{ 'post-traffic__views-label': metric === 'views' }">{{
        metric === "views" ? "Page views" : "Avg. engagement / view"
      }}</span>
      <span v-if="overlay">Avg. engagement / view</span>
    </div>
    <div class="post-traffic__scale" aria-hidden="true">
      <span
        v-for="tick in ticks"
        :key="tick"
        :style="{ top: `${y(tick) / 2}%` }">
        {{
          metric === "views" ? number.format(tick) : formatTrafficDuration(tick)
        }}
      </span>
    </div>
    <div
      ref="plot"
      class="post-traffic__plot"
      role="group"
      :aria-label="`${series.interval === 'day' ? 'Daily' : 'Monthly'} ${metric === 'views' ? 'page views' : 'average engagement per view'}. Use arrow keys to inspect ${series.interval === 'day' ? 'days' : 'months'}.`"
      @pointermove="inspect"
      @pointerleave="leave"
      @focusout="blur"
      @keydown="navigate">
      <svg viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
        <path class="post-traffic__axes" d="M 4 4 V 196 H 596" />
        <path v-if="overlay" class="post-traffic__axes" d="M 596 4 V 196" />
        <path
          v-for="tick in ticks.slice(0, -1)"
          :key="tick"
          class="post-traffic__gridline"
          :d="`M 4 ${y(tick)} H 596`" />
        <path
          v-for="event in events"
          :key="event.label"
          class="post-traffic__annotation"
          :d="`M ${x(event.index)} 4 V 196`" />
        <polyline
          v-if="metric === 'views'"
          class="post-traffic__line"
          :points="points" />
        <path
          v-if="overlay || metric === 'engagement'"
          class="post-traffic__engagement-line"
          :d="engagementPath" />
      </svg>
      <template v-if="overlay">
        <span
          v-for="point in engagementPoints"
          :key="point.index"
          class="post-traffic__engagement-dot"
          aria-hidden="true"
          :style="{
            left: `${x(point.index) / 6}%`,
            top: `${engagementY(point.value) / 2}%`,
          }" />
      </template>
      <button
        v-for="(item, index) in series.points"
        :key="item.date"
        type="button"
        class="post-traffic__point"
        :class="{
          'post-traffic__point--selected': selectedIndex === index,
          'post-traffic__point--missing':
            metric === 'engagement' && average(index) === null,
          'post-traffic__point--engagement': metric === 'engagement',
        }"
        :style="{ left: `${x(index) / 6}%`, top: `${pointY(index) / 2}%` }"
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
          top: `${pointY(selectedIndex) / 2}%`,
        }">
        {{ pointText(selectedIndex) }}
      </div>
    </div>
    <div
      v-if="overlay"
      class="post-traffic__scale post-traffic__scale--secondary"
      aria-hidden="true">
      <span
        v-for="tick in engagementTicks"
        :key="tick"
        :style="{ top: `${engagementY(tick) / 2}%` }">
        {{ formatTrafficDuration(tick) }}
      </span>
    </div>
    <div class="post-traffic__dates" aria-hidden="true">
      <span v-for="index in dateLabels" :key="index">{{
        axisDate(series.points[index]!.date)
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  formatTrafficDuration,
  type TrafficSeries,
} from "#shared/utils/traffic";

const props = defineProps<{
  series: TrafficSeries;
  metric: "views" | "engagement";
  overlay?: boolean;
  annotations: { date: string; label: string }[];
}>();
const id = useId();
const selectedIndex = ref<number | null>(null);
const plot = useTemplateRef<HTMLElement>("plot");
watch(
  () => props.series,
  () => {
    selectedIndex.value = null;
  },
);
const number = new Intl.NumberFormat("en-GB");
const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const shortDayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const axisDate = (date: string) =>
  (props.series.interval === "day" ? shortDayFormat : monthFormat).format(
    new Date(date),
  );
function average(index: number) {
  const item = props.series.points[index]!;
  return item.views && item.engagementSeconds !== undefined
    ? item.engagementSeconds / item.views
    : null;
}
const engagementPoints = computed(() =>
  props.series.points.flatMap((_item, index) => {
    const value = average(index);
    return value === null ? [] : [{ index, value }];
  }),
);
function ceiling(values: number[]) {
  const rough = Math.max(1, ...values) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  return Math.max(1, Math.ceil(rough / magnitude) * magnitude) * 4;
}
const engagementMaximum = computed(() =>
  ceiling(engagementPoints.value.map((point) => point.value)),
);
const maximum = computed(() =>
  props.metric === "engagement"
    ? engagementMaximum.value
    : ceiling(props.series.points.map((item) => item.views)),
);
const ticks = computed(() =>
  [4, 3, 2, 1, 0].map((value) => (value * maximum.value) / 4),
);
const engagementTicks = computed(() =>
  [4, 3, 2, 1, 0].map((value) => (value * engagementMaximum.value) / 4),
);
const y = (value: number) => 196 - (value / maximum.value) * 192;
const engagementY = (value: number) =>
  196 - (value / engagementMaximum.value) * 192;
const x = (index: number) =>
  props.series.points.length === 1
    ? 300
    : 4 + (index / (props.series.points.length - 1)) * 592;
const pointY = (index: number) =>
  props.metric === "views"
    ? y(props.series.points[index]!.views)
    : engagementY(average(index) ?? 0);
const points = computed(() =>
  props.series.points
    .map((item, index) => `${x(index)},${y(item.views)}`)
    .join(" "),
);
const engagementPath = computed(() => {
  let previous = -2;
  return engagementPoints.value
    .map((point) => {
      const command = point.index === previous + 1 ? "L" : "M";
      previous = point.index;
      return `${command} ${x(point.index)} ${engagementY(point.value)}`;
    })
    .join(" ");
});
const dateLabels = computed(() => {
  const last = props.series.points.length - 1;
  return [...new Set([0, Math.round(last / 2), last])];
});
const events = computed(() =>
  props.annotations
    .map((event) => ({
      ...event,
      index: props.series.points.findIndex(
        (item) =>
          item.date.slice(0, props.series.interval === "day" ? 10 : 7) ===
          event.date.slice(0, props.series.interval === "day" ? 10 : 7),
      ),
    }))
    .filter((event) => event.index >= 0),
);
function pointText(index: number) {
  const item = props.series.points[index]!;
  const value = average(index);
  const label = (
    props.series.interval === "day" ? dayFormat : monthFormat
  ).format(new Date(item.date));
  return [
    `${label}: ${number.format(item.views)} page views`,
    ...(item.engagementSeconds !== undefined
      ? [
          value === null
            ? "Average engagement unavailable (no recorded views)"
            : `${formatTrafficDuration(value)} average engagement per view`,
        ]
      : []),
    ...events.value
      .filter((event) => event.index === index)
      .map(
        (event) => `${event.label} ${dayFormat.format(new Date(event.date))}`,
      ),
  ].join(". ");
}
function inspect(event: MouseEvent) {
  if (
    !plot.value ||
    (event.target instanceof Element && event.target.closest("[role=tooltip]"))
  )
    return;
  const bounds = plot.value.getBoundingClientRect();
  const position = Math.max(
    0,
    Math.min(
      1,
      (((event.clientX - bounds.left) / bounds.width) * 600 - 4) / 592,
    ),
  );
  selectedIndex.value = Math.round(position * (props.series.points.length - 1));
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
  )
    selectedIndex.value = null;
}
function dismiss(event: KeyboardEvent) {
  if (event.key === "Escape") selectedIndex.value = null;
}
function navigate(event: KeyboardEvent) {
  if (event.key === "Escape") {
    selectedIndex.value = null;
    return;
  }
  const last = props.series.points.length - 1;
  const focusedIndex = Array.from(
    plot.value?.querySelectorAll("button") ?? [],
  ).findIndex((button) => button === document.activeElement);
  const current = selectedIndex.value ?? Math.max(0, focusedIndex);
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
onMounted(() => document.addEventListener("keydown", dismiss));
onBeforeUnmount(() => document.removeEventListener("keydown", dismiss));
</script>

<style lang="scss">
.post-traffic__chart {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--global-space-fixed-2);
  margin-block-start: var(--global-space-fixed-5);
  min-inline-size: 0;
  font-size: var(--global-font-size-1);
}
.post-traffic__chart--overlay {
  grid-template-columns: max-content minmax(0, 1fr) max-content;
}
.post-traffic__axis-labels {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: var(--global-space-fixed-3);
  margin-block-end: var(--global-space-fixed-2);
  font-size: var(--global-font-size-1);
}
.post-traffic__views-label {
  color: var(--global-accent-color);
}
.post-traffic__axis-labels span:last-child {
  text-align: end;
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
.post-traffic__scale--secondary span {
  inset-inline-end: auto;
  inset-inline-start: 0;
}
.post-traffic__plot {
  position: relative;
  min-inline-size: 0;
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
.post-traffic__engagement-line {
  fill: none;
  stroke: var(--global-title-color);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
  vector-effect: non-scaling-stroke;
}
.post-traffic__engagement-dot {
  position: absolute;
  translate: -50% -50%;
  inline-size: 5px;
  block-size: 5px;
  border-radius: 50%;
  background: var(--global-title-color);
  pointer-events: none;
}
.post-traffic__annotation {
  fill: none;
  stroke: var(--global-accent-color);
  stroke-dasharray: 2 4;
  stroke-width: 1;
  opacity: 0.65;
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
.post-traffic__point--engagement::after {
  background: var(--global-title-color);
}
.post-traffic__point--missing::after {
  display: none;
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
  z-index: 3;
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
.post-traffic__dates span {
  min-inline-size: 0;
}
</style>
