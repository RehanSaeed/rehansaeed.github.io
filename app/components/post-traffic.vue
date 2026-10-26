<template>
  <u-card v-if="history || error" class="post-traffic">
    <div class="post-traffic__header">
      <h2>Article Traffic</h2>
      <div
        v-if="history && data"
        ref="help"
        class="post-traffic__help"
        @pointerenter="sourceOpen = true"
        @pointerleave="leaveSource"
        @focusin="sourceOpen = true"
        @focusout="blurSource">
        <u-button
          class="post-traffic__info"
          aria-label="About article traffic"
          :aria-describedby="`${id}-source`"
          @click="sourceOpen = true">
          <u-icon name="fa-regular:question-circle" />
        </u-button>
        <p
          v-show="sourceOpen"
          :id="`${id}-source`"
          class="post-traffic__source"
          role="tooltip">
          Source: Google Analytics 4 ({{ data.timeZone }}). Updated
          <time :datetime="data.updated">{{ date(data.updated) }}</time
          >. Repeat views are included; these are not unique visitors.
          Engagement is recorded foreground time per view, not reading
          completion. Switch metrics to see views or seconds per view. Presets
          end at the reporting cutoff; Last month shows the last 30 processed
          days. Monthly buckets may be partial. Blockers and consent choices can
          reduce recorded traffic.
        </p>
      </div>
    </div>
    <p v-if="error" role="status">Traffic history is currently unavailable.</p>
    <template v-else-if="history && data">
      <div class="post-traffic__summary">
        <div
          class="post-traffic__metrics"
          aria-live="polite"
          aria-atomic="true">
          <p class="post-traffic__total">
            <strong>{{ number.format(total) }}</strong>
            <span>page views</span>
          </p>
          <p class="post-traffic__engagement">
            <strong>{{ engagement }}</strong>
            <span> average engagement per view</span>
          </p>
        </div>
        <p class="post-traffic__range">
          <time :datetime="history.startDate">{{
            date(history.startDate)
          }}</time>
          <span> to </span>
          <time :datetime="history.endDate">{{ date(history.endDate) }}</time>
        </p>
      </div>
      <div class="post-traffic__controls">
        <div
          class="post-traffic__ranges"
          role="group"
          aria-label="Traffic date range">
          <u-button
            v-for="option in ranges"
            :key="option.value"
            :aria-pressed="range === option.value"
            :disabled="option.value === 30 && !availableHistory?.days"
            @click="range = option.value">
            {{ option.label }}
          </u-button>
        </div>
        <div class="post-traffic__mode" role="group" aria-label="Chart metric">
          <u-button
            :aria-pressed="metric === 'views'"
            @click="metric = 'views'">
            Traffic
          </u-button>
          <u-button
            :aria-pressed="metric === 'engagement'"
            @click="metric = 'engagement'">
            Engagement
          </u-button>
        </div>
      </div>
      <p v-if="!availableHistory?.days" class="post-traffic__coverage">
        Daily history is unavailable in this saved snapshot.
      </p>
      <p
        v-if="
          availableHistory &&
          availableHistory.startDate > published.slice(0, 10)
        "
        class="post-traffic__coverage">
        Traffic before {{ date(availableHistory.startDate) }} is unavailable.
      </p>
      <p
        v-if="metric === 'engagement' && !hasEngagement"
        class="post-traffic__coverage"
        role="status">
        Engagement is unavailable for this date range.
      </p>
      <u-post-traffic-chart
        v-else
        :key="metric"
        :series="history"
        :metric="metric"
        :annotations="annotations" />
      <ul v-if="annotations.length" class="post-traffic__events">
        <li v-for="event in annotations" :key="event.label">
          {{ event.label }}
          <time :datetime="event.date">{{ date(event.date) }}</time>
        </li>
      </ul>
    </template>
  </u-card>
</template>

<script setup lang="ts">
import {
  formatTrafficDuration,
  parseTrafficSnapshot,
  selectTrafficRange,
} from "#shared/utils/traffic";

const props = defineProps<{
  permalink: string;
  published: string;
  modified?: string | null;
}>();
const id = useId();
const { data, error } = await useFetch("/post-traffic.json", {
  key: "post-traffic",
  server: false,
  transform: parseTrafficSnapshot,
});
watch(error, (value) => {
  if (value) console.warn("[traffic] Unable to load article traffic:", value);
});
const ranges = [
  { value: 0, label: "All time" },
  { value: 12, label: "Last year" },
  { value: 30, label: "Last month" },
] as const;
const range = ref<0 | 12 | 30>(0);
const metric = ref<"views" | "engagement">("views");
const availableHistory = computed(() => data.value?.posts[props.permalink]);
watch(
  availableHistory,
  (value) => {
    if (range.value === 30 && !value?.days) range.value = 0;
  },
  { flush: "sync" },
);
const history = computed(() =>
  availableHistory.value
    ? selectTrafficRange(availableHistory.value, range.value)
    : undefined,
);
const sourceOpen = ref(false);
const help = useTemplateRef<HTMLElement>("help");
watch(history, () => {
  sourceOpen.value = false;
});
const number = new Intl.NumberFormat("en-GB");
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const date = (value: string) => dateFormat.format(new Date(value));
const total = computed(
  () => history.value?.points.reduce((sum, item) => sum + item.views, 0) ?? 0,
);
const hasEngagement = computed(
  () =>
    !!total.value &&
    !!history.value?.points.every(
      (item) => item.engagementSeconds !== undefined,
    ),
);
const engagement = computed(() =>
  hasEngagement.value
    ? formatTrafficDuration(
        history.value!.points.reduce(
          (sum, item) => sum + item.engagementSeconds!,
          0,
        ) / total.value,
      )
    : "Unavailable",
);
const annotations = computed(() => {
  const modified = props.modified?.slice(0, 10);
  return modified &&
    history.value &&
    modified > props.published.slice(0, 10) &&
    modified >= history.value.startDate &&
    modified <= history.value.endDate
    ? [{ label: "Latest update", date: modified }]
    : [];
});
function leaveSource() {
  if (!help.value?.contains(document.activeElement)) sourceOpen.value = false;
}
function blurSource(event: FocusEvent) {
  if (
    !(event.relatedTarget instanceof Node) ||
    !help.value?.contains(event.relatedTarget)
  )
    sourceOpen.value = false;
}
function dismissSource(event: Event) {
  if (event instanceof KeyboardEvent) {
    if (event.key !== "Escape") return;
  } else if (
    event.target instanceof Node &&
    help.value?.contains(event.target)
  ) {
    return;
  }
  sourceOpen.value = false;
}
onMounted(() => {
  document.addEventListener("pointerdown", dismissSource);
  document.addEventListener("keydown", dismissSource);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", dismissSource);
  document.removeEventListener("keydown", dismissSource);
});
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
.post-traffic__help {
  position: relative;
  grid-column: 3;
  justify-self: end;
}
.post-traffic__info {
  display: grid;
  place-items: center;
  min-inline-size: 2rem;
  min-block-size: 2rem;
}
.post-traffic__source {
  position: absolute;
  z-index: 4;
  inset-block-start: calc(100% + 0.5rem);
  inset-inline-end: 0;
  inline-size: min(26rem, calc(100vw - 4rem));
  min-inline-size: 0;
  margin: 0;
  padding: var(--global-space-fixed-3);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-content-background-color);
  box-shadow: var(--global-shadow-2);
  font-size: var(--global-font-size-1);
}
.post-traffic__source::before {
  content: "";
  position: absolute;
  inset-block-end: 100%;
  inset-inline: 0;
  block-size: 0.5rem;
}
.post-traffic__controls,
.post-traffic__ranges,
.post-traffic__mode {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--global-space-fixed-2);
}
.post-traffic__controls {
  justify-content: space-between;
  margin-block-start: var(--global-space-fixed-4);
}
.post-traffic__ranges button,
.post-traffic__mode button {
  padding: var(--global-space-fixed-2) var(--global-space-fixed-3);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  font-size: var(--global-font-size-1);
}
.post-traffic__mode {
  font-size: var(--global-font-size-1);
}
.post-traffic__ranges button[aria-pressed="true"],
.post-traffic__mode button[aria-pressed="true"] {
  border-color: var(--global-accent-color);
  background: var(--global-accent-color);
  color: var(--global-content-background-color);
}
.post-traffic__ranges button:focus-visible,
.post-traffic__mode button:focus-visible {
  outline: 2px solid var(--global-accent-color);
  outline-offset: 2px;
}
.post-traffic__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--global-space-fixed-3) var(--global-space-fixed-5);
}
.post-traffic__total,
.post-traffic__range,
.post-traffic__engagement {
  margin: 0;
  min-inline-size: 0;
}
.post-traffic__metrics {
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
.post-traffic__engagement {
  margin-block-start: var(--global-space-fixed-2);
  font-size: var(--global-font-size-1);
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
.post-traffic__events {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-2) var(--global-space-fixed-4);
  margin: var(--global-space-fixed-3) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--global-font-size-1);
}
.post-traffic__events li {
  border-inline-start: 2px dotted var(--global-accent-color);
  padding-inline-start: var(--global-space-fixed-2);
}
</style>
