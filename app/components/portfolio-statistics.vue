<template>
  <p
    v-if="compact"
    class="portfolio-statistics__summary"
    :data-downloads="statistics.downloads"
    :data-stars="statistics.stars">
    My open source projects have received
    <span :title="`${downloadsExact} lifetime NuGet package downloads`">{{
      downloadsLong
    }}</span>
    NuGet downloads and {{ starsExact }} GitHub stars across the projects in my
    <NuxtLink to="/portfolio/#portfolio-open-source">portfolio</NuxtLink>.
  </p>
  <div
    v-else
    class="portfolio-statistics"
    :data-downloads="statistics.downloads"
    :data-stars="statistics.stars">
    <div class="portfolio-statistics__totals">
      <u-count-ticker
        label="Lifetime NuGet downloads"
        :value="statistics.downloads"
        :growth="statistics.growth.downloads"
        :generated-at="statistics.generatedAt" />
      <u-count-ticker
        label="GitHub stars"
        :value="statistics.stars"
        :growth="statistics.growth.stars"
        :generated-at="statistics.generatedAt" />
    </div>
    <p class="portfolio-statistics__note">
      Across {{ statistics.repositories }} repositories and
      {{ statistics.packages }} NuGet packages listed below. Downloads are not
      unique users. Build snapshot:
      <time :datetime="statistics.generatedAt">{{ generatedDate }}</time
      >. Refreshed weekly; cached counts may be used if a source is unavailable.
    </p>
  </div>
</template>

<script setup lang="ts">
import statistics from "#blog-portfolio-statistics";

defineProps<{ compact?: boolean }>();

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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
  gap: var(--global-space-fluid-5);
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
</style>
