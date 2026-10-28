<template>
  <u-tooltip
    :open="selectedIndex !== null"
    :reference="selectedPoint"
    @update:open="
      (visible) => {
        if (!visible) selectedIndex = null;
      }
    ">
    <template #default="{ trigger }">
      <div class="post-traffic__chart">
        <div class="post-traffic__scale" aria-hidden="true">
          <span
            v-for="tick in ticks"
            :key="tick"
            :style="{ top: `${y(tick) / 2}%` }">
            {{
              metric === "views"
                ? number.format(tick)
                : formatTrafficDuration(tick)
            }}
          </span>
        </div>
        <div
          ref="plot"
          class="post-traffic__plot"
          role="group"
          :aria-label="`${series.interval === 'day' ? 'Daily' : 'Monthly'} ${metric === 'views' ? 'page views' : 'average engagement per view'}. Use arrow keys to inspect ${series.interval === 'day' ? 'days' : 'months'}.`"
          @pointermove="inspect"
          @pointerenter="trigger.onPointerenter"
          @pointerleave="trigger.onPointerleave"
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
              v-else
              class="post-traffic__line post-traffic__engagement-line"
              :d="engagementPath" />
          </svg>
          <button
            v-for="(item, index) in series.points"
            :key="item.date"
            type="button"
            class="post-traffic__point"
            :class="{
              'post-traffic__point--selected': selectedIndex === index,
              'post-traffic__point--missing':
                metric === 'engagement' && average(index) === null,
            }"
            :style="{ left: `${x(index) / 6}%`, top: `${pointY(index) / 2}%` }"
            :tabindex="index === (selectedIndex ?? 0) ? 0 : -1"
            :aria-label="pointText(index)"
            :aria-describedby="
              selectedIndex === index ? trigger['aria-describedby'] : undefined
            "
            @focus="
              selectedIndex = index;
              trigger.onFocus($event);
            "
            @blur="trigger.onBlur"
            @click="selectPoint($event, index)" />
        </div>
        <div class="post-traffic__dates" aria-hidden="true">
          <span v-for="index in dateLabels" :key="index">{{
            axisDate(series.points[index]!.date)
          }}</span>
        </div>
      </div>
    </template>
    <template #content>
      <div v-if="selectedIndex !== null" class="post-traffic__tooltip">
        <time
          class="post-traffic__tooltip-date"
          :datetime="series.points[selectedIndex]!.date">
          {{ pointDate(selectedIndex) }}
        </time>
        <dl class="post-traffic__tooltip-metrics">
          <div>
            <dt>Page views</dt>
            <dd>{{ number.format(series.points[selectedIndex]!.views) }}</dd>
          </div>
          <div
            v-if="
              series.points[selectedIndex]!.engagementSeconds !== undefined
            ">
            <dt>Engagement / view</dt>
            <dd>{{ pointEngagement(selectedIndex) }}</dd>
          </div>
        </dl>
        <ul
          v-if="pointEvents(selectedIndex).length"
          class="post-traffic__tooltip-events">
          <li v-for="event in pointEvents(selectedIndex)" :key="event.label">
            {{ event.label }}
            <time :datetime="event.date">{{
              dayFormat.format(new Date(event.date))
            }}</time>
          </li>
        </ul>
      </div>
    </template>
  </u-tooltip>
</template>

<script setup lang="ts">
import {
  formatTrafficDuration,
  type TrafficSeries,
} from "#shared/utils/traffic";

const props = defineProps<{
  series: TrafficSeries;
  metric: "views" | "engagement";
  annotations: { date: string; label: string }[];
}>();
const selectedIndex = ref<number | null>(null);
const plot = useTemplateRef<HTMLElement>("plot");
const selectedPoint = computed(() =>
  selectedIndex.value === null
    ? null
    : (plot.value?.querySelectorAll<HTMLButtonElement>(".post-traffic__point")[
        selectedIndex.value
      ] ?? null),
);
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
const y = (value: number) => 196 - (value / maximum.value) * 192;
const x = (index: number) =>
  props.series.points.length === 1
    ? 300
    : 4 + (index / (props.series.points.length - 1)) * 592;
const pointY = (index: number) =>
  props.metric === "views"
    ? y(props.series.points[index]!.views)
    : y(average(index) ?? 0);
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
      return `${command} ${x(point.index)} ${y(point.value)}`;
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
const pointDate = (index: number) =>
  (props.series.interval === "day" ? dayFormat : monthFormat).format(
    new Date(props.series.points[index]!.date),
  );
const pointEvents = (index: number) =>
  events.value.filter((event) => event.index === index);
function pointEngagement(index: number) {
  const value = average(index);
  return value === null ? "Unavailable" : formatTrafficDuration(value);
}
function pointText(index: number) {
  const item = props.series.points[index]!;
  const value = average(index);
  const label = pointDate(index);
  return [
    `${label}: ${number.format(item.views)} page views`,
    ...(item.engagementSeconds !== undefined
      ? [
          value === null
            ? "Average engagement unavailable (no recorded views)"
            : `${formatTrafficDuration(value)} average engagement per view`,
        ]
      : []),
    ...pointEvents(index).map(
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
  margin-inline-start: auto;
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
  inline-size: min(18rem, calc(100vw - 4rem));
}
.post-traffic__tooltip-date {
  display: block;
  margin-block-end: var(--global-space-fixed-2);
  font-weight: var(--global-font-weight-semi-bold);
}
.post-traffic__tooltip-metrics {
  display: grid;
  gap: var(--global-space-fixed-1);
  margin: 0;
}
.post-traffic__tooltip-metrics > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  align-items: baseline;
  gap: var(--global-space-fixed-3);
  text-align: start;
}
.post-traffic__tooltip-metrics dt,
.post-traffic__tooltip-metrics dd {
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.post-traffic__tooltip-metrics dd {
  margin: 0;
  font-weight: var(--global-font-weight-semi-bold);
  text-align: end;
}
.post-traffic__tooltip-events {
  margin: var(--global-space-fixed-2) 0 0;
  padding: 0;
  list-style: none;
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
