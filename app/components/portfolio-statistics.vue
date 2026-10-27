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
    <dl class="portfolio-statistics__totals">
      <div class="portfolio-statistics__metric">
        <dt>Lifetime NuGet downloads</dt>
        <dd :title="`${downloadsExact} lifetime NuGet package downloads`">
          <span :aria-label="`${downloadsExact} downloads`">{{
            downloadsCompact
          }}</span>
        </dd>
      </div>
      <div class="portfolio-statistics__metric">
        <dt>GitHub stars</dt>
        <dd>{{ starsExact }}</dd>
      </div>
    </dl>
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
const downloadsCompact = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
}).format(statistics.downloads);
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
  justify-items: center;
  gap: var(--global-space-fixed-4);
  text-align: center;
}

.portfolio-statistics__totals {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--global-space-fluid-5);
  margin: 0;
}

.portfolio-statistics__metric {
  display: flex;
  flex-direction: column-reverse;
}

.portfolio-statistics__metric dd {
  margin: 0;
  font-size: var(--global-font-size-8);
  font-weight: bold;
  color: var(--global-accent-color);
}

.portfolio-statistics__note {
  max-inline-size: var(--global-space-content-max-width);
  margin: 0;
  font-size: var(--global-font-size-1);
}
</style>
