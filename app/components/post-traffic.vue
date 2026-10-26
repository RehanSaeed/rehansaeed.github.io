<template>
  <u-card v-if="history || error" class="post-traffic">
    <h2>Article traffic</h2>
    <p v-if="error" role="status">Traffic history is currently unavailable.</p>
    <template v-else-if="history && data">
      <p>
        <strong>{{ number.format(total) }} page views</strong> recorded from
        <time :datetime="history.startDate">{{ date(history.startDate) }}</time>
        to <time :datetime="history.endDate">{{ date(history.endDate) }}</time
        >. Repeat views are included; these are not unique visitors.
      </p>
      <p v-if="history.startDate > published.slice(0, 10)">
        Traffic before {{ date(history.startDate) }} is unavailable.
      </p>
      <figure>
        <figcaption>Monthly page views</figcaption>
        <div class="post-traffic__chart">
          <div class="post-traffic__scale" aria-hidden="true">
            <span>{{ number.format(maximum) }}</span>
            <span>0</span>
          </div>
          <svg
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            aria-hidden="true"
            @pointermove="inspect">
            <path class="post-traffic__baseline" d="M 0 196 H 600" />
            <polyline class="post-traffic__line" :points="points" />
            <circle
              class="post-traffic__point"
              :cx="x(selectedIndex)"
              :cy="y(selected.views)"
              r="4"
              vector-effect="non-scaling-stroke" />
          </svg>
          <div class="post-traffic__dates" aria-hidden="true">
            <span>{{ month(history.months[0]!.month) }}</span>
            <span>{{ month(history.months.at(-1)!.month) }}</span>
          </div>
        </div>
        <label v-if="history.months.length > 1" :for="`${id}-month`">
          Inspect a month
        </label>
        <input
          v-if="history.months.length > 1"
          :id="`${id}-month`"
          v-model.number="selectedIndex"
          type="range"
          min="0"
          :max="history.months.length - 1"
          step="1"
          :aria-valuetext="selectedText" />
        <p class="post-traffic__selection">{{ selectedText }}</p>
      </figure>
      <details>
        <summary>View monthly traffic data</summary>
        <div class="post-traffic__table">
          <table>
            <caption>
              Monthly page views for this article
            </caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Page views</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in history.months" :key="item.month">
                <th scope="row">{{ month(item.month) }}</th>
                <td>{{ number.format(item.views) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      <p class="post-traffic__note">
        Source: Google Analytics 4. Reporting timezone: {{ data.timeZone }}.
        Updated <time :datetime="data.updated">{{ date(data.updated) }}</time
        >. The first and last months cover only the dates shown. Recent days are
        excluded while analytics are processed. Tracking blockers and consent
        choices can reduce recorded traffic.
      </p>
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
const selectedIndex = ref(0);
watch(
  history,
  (value) => {
    selectedIndex.value = Math.max(0, (value?.months.length ?? 1) - 1);
  },
  { immediate: true },
);
const selected = computed(() => history.value!.months[selectedIndex.value]!);
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
const maximum = computed(() =>
  Math.max(1, ...(history.value?.months.map((item) => item.views) ?? [])),
);
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
const selectedText = computed(
  () =>
    `${month(selected.value.month)}: ${number.format(selected.value.views)} page views`,
);
function inspect(event: PointerEvent) {
  if (!(event.currentTarget instanceof SVGSVGElement) || !history.value) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const position = Math.max(
    0,
    Math.min(1, (event.clientX - bounds.left) / bounds.width),
  );
  selectedIndex.value = Math.round(
    position * (history.value.months.length - 1),
  );
}
</script>

<style lang="scss">
.post-traffic {
  min-inline-size: 0;
}

.post-traffic figure {
  margin: 0 0 var(--global-space-fixed-4);
}

.post-traffic figcaption {
  font-weight: var(--global-font-weight-bold);
}

.post-traffic__chart {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--global-space-fixed-2);
  margin-block: var(--global-space-fixed-3);
}

.post-traffic__scale {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: end;
}

.post-traffic svg {
  inline-size: 100%;
  block-size: 12rem;
  overflow: visible;
}

.post-traffic__baseline {
  stroke: var(--global-border-color);
  vector-effect: non-scaling-stroke;
}

.post-traffic__line {
  fill: none;
  stroke: var(--global-accent-color);
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
}

.post-traffic__point {
  fill: var(--global-accent-color);
}

.post-traffic__dates {
  grid-column: 2;
  display: flex;
  justify-content: space-between;
  gap: var(--global-space-fixed-2);
  flex-wrap: wrap;
}

.post-traffic input[type="range"] {
  display: block;
  inline-size: 100%;
  min-block-size: 2rem;
  accent-color: var(--global-accent-color);
}

.post-traffic__selection {
  font-weight: var(--global-font-weight-bold);
}

.post-traffic summary {
  cursor: pointer;
  padding-block: var(--global-space-fixed-2);
}

.post-traffic__table {
  max-block-size: 20rem;
  overflow: auto;
}

.post-traffic__note {
  margin-block-start: var(--global-space-fixed-3);
  font-size: var(--global-font-size-1);
}
</style>
