<template>
  <u-card v-if="history || error" class="post-traffic">
    <div class="post-traffic__header">
      <h2>Article Traffic</h2>
      <u-tooltip
        v-if="history && data"
        v-slot="{ trigger }"
        :text="sourceText"
        placement="bottom"
        toggle-on-click>
        <u-button
          v-bind="trigger"
          class="post-traffic__info"
          aria-label="About article traffic">
          <u-icon name="fa-regular:question-circle" />
        </u-button>
      </u-tooltip>
    </div>
    <p v-if="error" role="status">Traffic history is currently unavailable.</p>
    <template v-else-if="history && data">
      <div
        v-if="
          availableHistory &&
          availableHistory.startDate > published.slice(0, 10)
        "
        class="custom-block warning post-traffic__warning"
        role="note">
        <p class="custom-block-title">Partial traffic history</p>
        <p>
          This article predates the available Google Analytics history. Traffic
          before
          <time :datetime="availableHistory.startDate">{{
            date(availableHistory.startDate)
          }}</time
          >, including any initial spike at publication, is unavailable. All
          time covers recorded history, not the article's full lifetime.
        </p>
      </div>
      <div class="post-traffic__metrics" aria-live="polite" aria-atomic="true">
        <u-statistic
          class="post-traffic__total"
          :value="number.format(total)"
          label="Page views" />
        <u-statistic
          class="post-traffic__engagement"
          :value="engagement"
          label="Average engagement per view" />
      </div>
      <div class="post-traffic__controls">
        <div
          class="post-traffic__ranges"
          role="group"
          aria-label="Traffic date range">
          <u-button
            v-for="option in ranges"
            :key="option.value"
            bordered
            :primary="range === option.value"
            :aria-pressed="range === option.value"
            :disabled="option.value === 30 && !availableHistory?.days"
            @click="range = option.value">
            {{ option.label }}
          </u-button>
        </div>
        <div class="post-traffic__mode" role="group" aria-label="Chart metric">
          <u-button
            bordered
            :primary="metric === 'views'"
            :aria-pressed="metric === 'views'"
            @click="metric = 'views'">
            Traffic
          </u-button>
          <u-button
            bordered
            :primary="metric === 'engagement'"
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
const number = new Intl.NumberFormat("en-GB");
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const date = (value: string) => dateFormat.format(new Date(value));
const sourceText = computed(() =>
  data.value
    ? `Source: Google Analytics 4 (${data.value.timeZone}). Updated ${date(data.value.updated)}. Repeat views are included; these are not unique visitors. Engagement is recorded foreground time per view, not reading completion. Switch metrics to see views or seconds per view. Presets end at the snapshot's latest date; Last month shows the last 30 calendar days. Recent figures are provisional while Google Analytics processes incoming data. Monthly buckets may be partial. Blockers and consent choices can reduce recorded traffic.`
    : "",
);
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
.post-traffic__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, max-content));
  align-items: start;
  gap: var(--global-space-fixed-5) var(--global-space-fixed-6);
  min-inline-size: 0;
}
@include breakpoints.respond-below(sm) {
  .post-traffic__metrics {
    grid-template-columns: minmax(0, 1fr);
  }
}
.post-traffic__coverage {
  margin-block: var(--global-space-fixed-3) 0;
  font-size: var(--global-font-size-1);
}
.post-traffic__warning p {
  min-inline-size: 0;
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
