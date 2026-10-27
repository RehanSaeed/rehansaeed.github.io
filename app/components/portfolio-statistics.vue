<template>
  <p
    v-if="compact"
    class="portfolio-statistics__summary"
    :data-downloads="statistics.downloads"
    :data-stars="statistics.stars">
    My open source projects have received
    <span :title="`${downloadsExact} lifetime package downloads`">{{
      downloadsLong
    }}</span>
    package downloads and {{ starsExact }} GitHub stars across the projects in
    my <NuxtLink to="/portfolio/#portfolio-open-source">portfolio</NuxtLink>.
  </p>
  <div
    v-else
    class="portfolio-statistics"
    :data-downloads="statistics.downloads"
    :data-stars="statistics.stars">
    <div class="portfolio-statistics__totals">
      <u-number-ticker
        title="Package downloads"
        :number="statistics.downloads"
        :rate="downloadRate"
        :paused="paused" />
      <u-number-ticker
        title="GitHub stars"
        :number="statistics.stars"
        :rate="starRate"
        :paused="paused" />
    </div>
    <p class="portfolio-statistics__note">
      Animated estimates use lifetime averages, not a live feed. Verified:
      {{ downloadsExact }} downloads and {{ starsExact }} stars. Across
      {{ statistics.repositories }} repositories and
      {{ statistics.packages }} NuGet packages listed below. Downloads are not
      unique users. Build snapshot:
      <time :datetime="statistics.generatedAt">{{ generatedDate }}</time
      >. Refreshed weekly; cached counts may be used if a source is unavailable.
    </p>
    <button
      v-if="downloadRate !== 0 || starRate !== 0"
      class="portfolio-statistics__toggle"
      type="button"
      :aria-pressed="paused"
      @click="paused = !paused">
      {{ paused ? "Resume estimates" : "Pause estimates" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import statistics from "#blog-portfolio-statistics";
import { canProjectCounter } from "#shared/utils/ticker";

defineProps<{ compact?: boolean }>();

const paused = ref(false);
const now = ref(0);
const downloadRate = computed(() =>
  canProjectCounter(statistics.growth.downloads, now.value)
    ? statistics.growth.downloads.perSecond!
    : 0,
);
const starRate = computed(() =>
  canProjectCounter(statistics.growth.stars, now.value)
    ? statistics.growth.stars.perSecond!
    : 0,
);
onMounted(() => {
  now.value = Date.now();
});

const downloadsExact = statistics.downloads.toLocaleString("en-GB");
const starsExact = statistics.stars.toLocaleString("en-GB");
const downloadsLong = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  compactDisplay: "long",
  maximumFractionDigits: 1,
}).format(statistics.downloads);
const generatedDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(statistics.generatedAt));
</script>

<style lang="scss">
.portfolio-statistics {
  display: grid;
  min-inline-size: 0;
  inline-size: 100%;
  justify-items: center;
  gap: var(--global-space-fixed-4);
  text-align: center;
}

.portfolio-statistics__totals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.5rem, 2vw, 2rem);
  inline-size: 100%;
  max-inline-size: 72rem;
  min-inline-size: 0;
}

.portfolio-statistics__note {
  min-inline-size: 0;
  max-inline-size: var(--global-space-content-max-width);
  margin: 0;
  font-size: var(--global-font-size-1);
}

.portfolio-statistics__toggle {
  padding: var(--global-space-fixed-2) var(--global-space-fixed-3);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-background-color);
  color: var(--global-title-color);
  cursor: pointer;
}

.portfolio-statistics__toggle:hover,
.portfolio-statistics__toggle:focus-visible {
  border-color: var(--global-accent-color);
  color: var(--global-accent-color);
}
</style>
