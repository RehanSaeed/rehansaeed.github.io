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
        title="My Package Downloads"
        :number="statistics.downloads"
        :rate="downloadRate" />
      <u-number-ticker
        title="My GitHub Stars"
        :number="statistics.stars"
        :rate="starRate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import statistics from "#blog-portfolio-statistics";
import { canProjectCounter } from "#shared/utils/ticker";

defineProps<{ compact?: boolean }>();

const now = ref(0);
const downloadRate = computed(() =>
  canProjectCounter(statistics.growth.downloads, now.value)
    ? statistics.growth.downloads.perSecond!
    : 0,
);
const starRate = computed(() =>
  canProjectCounter(statistics.growth.stars, now.value)
    ? statistics.growth.stars.perSecond
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
  max-inline-size: var(--global-space-card-max-width);
  min-inline-size: 0;
  font-size: max(16px, 0.85em);
}
</style>
